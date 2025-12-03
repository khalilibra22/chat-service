import mongoose from "mongoose";
import Message from "../models/message.model";
import Group from "../models/group.model";
import {
  CreateMessageData,
  AllChatsResponse,
  PaginatedResponse,
  MessageHistoryParams,
  GroupMessageHistoryParams,
  UserProfile
} from "../types/chat.types";
import { UserService } from "./user.service";
import logger from "../utils/logger";

export class MessageService {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }
  async createPrivateMessage(messageData: CreateMessageData): Promise<any> {
    try {
      const message = await Message.create({
        ...messageData,
        chatType: "private",
      });

      return await this.enrichMessageWithProfiles(message);
    } catch (error) {
      logger.error({ err: error }, "Error creating private message");
      throw error;
    }
  }

  async createGroupMessage(messageData: CreateMessageData): Promise<any> {
    try {
      const senderProfile = await this.userService.getCachedUserProfile(
        messageData.senderId
      );

      if (!senderProfile) {
        throw new Error("Sender not found");
      }

      const message = await Message.create({
        ...messageData,
        chatType: "group",
      });

      return await this.enrichMessageWithProfiles(message, senderProfile);
    } catch (error) {
      logger.error({ err: error }, "Error creating group message");
      throw error;
    }
  }

  async getPrivateMessageHistory(
    userId1: string,
    userId2: string
  ): Promise<any> {
    try {
      const messages = await Message.find({
        chatType: "private",
        $or: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      }).sort({ timestamp: 1 });
      return messages;
    } catch (error) {
      logger.error({ err: error }, "Error fetching private message history");
      throw new Error("Error fetching private message history");
    }
  }

  async getPrivateMessageHistoryPaginated(
    userId1: string,
    userId2: string,
    page: number,
    limit: number
  ): Promise<PaginatedResponse<any>> {
    try {
      const filter = {
        chatType: "private" as const,
        $or: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      };
      const total = await Message.countDocuments(filter);
      const items = await Message.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ timestamp: -1 });
      return { items, total, page, limit };
    } catch (error) {
      logger.error({ err: error }, "Error fetching private message history paginated");
      throw new Error("Error fetching private message history");
    }
  }

  async getGroupMessageHistoryPaginated(
    groupId: string,
    page: number,
    limit: number
  ): Promise<PaginatedResponse<any>> {
    try {
      const skip = (page - 1) * limit;
      const groupObjectId = new mongoose.Types.ObjectId(groupId);

      const [result] = await Message.aggregate([
        {
          $match: {
            chatType: "group",
            groupId: groupObjectId
          }
        },
        {
          $facet: {
            items: [
              { $sort: { timestamp: -1 } },
              { $skip: skip },
              { $limit: limit },
              {
                $lookup: {
                  from: "users",
                  localField: "senderId",
                  foreignField: "userId",
                  as: "senderProfile",
                },
              },
              {
                $unwind: {
                  path: "$senderProfile",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $project: {
                  _id: 1,
                  content: 1,
                  senderId: 1,
                  groupId: 1,
                  chatType: 1,
                  timestamp: 1,
                  views: 1,
                  "senderProfile.userId": 1,
                  "senderProfile.name": 1,
                  "senderProfile.profileImageUrl": 1,
                  "senderProfile.email": 1,
                },
              },
            ],
            total: [
              { $count: "count" }
            ],
          },
        },
      ]);

      const items = result.items || [];
      const total = result.total[0]?.count || 0;

      return { items, total, page, limit };
    } catch (error) {
      logger.error({ err: error }, "Error fetching group message history");
      throw new Error("Error fetching group message history");
    }
  }

  async getAllChats(userId: string, page: number = 1, limit: number = 20): Promise<AllChatsResponse & { totalUnread: number; total: number; page: number; limit: number }> {
    try {
      // Get private chats
      const privateChats = await Message.aggregate([
        {
          $match: {
            chatType: "private",
            $or: [{ senderId: userId }, { receiverId: userId }],
          },
        },
        { $sort: { timestamp: -1 } },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ["$senderId", userId] },
                "$receiverId",
                "$senderId",
              ],
            },
            lastMessage: { $last: "$$ROOT" },
          },
        },
      ]);

      // Get all groups user is a member of
      const userGroups = await Group.find({ members: userId }).select('_id name groupType');
      const groupIds = userGroups.map(g => g._id);

      // Get group chats - last message for each group
      const groupChats = await Message.aggregate([
        {
          $match: {
            chatType: "group",
            groupId: { $in: groupIds },
          },
        },
        { $sort: { timestamp: -1 } },
        {
          $group: {
            _id: "$groupId",
            lastMessage: { $last: "$$ROOT" },
          },
        },
      ]);

      // Create maps for group metadata
      const groupMap = new Map(userGroups.map(g => [g._id.toString(), { name: g.name, groupType: g.groupType }]));

      // Calculate unread counts for private chats
      const enrichedPrivateChats = await Promise.all(
        privateChats.map(async (chat) => {
          const otherUserId = chat._id;

          // Count unread messages: messages where receiverId = userId and user not in views
          const unreadCount = await Message.countDocuments({
            chatType: "private",
            receiverId: userId,
            senderId: otherUserId,
            $nor: [
              { "views.userId": userId }
            ],
          });

          // Get other user's profile
          const otherUserProfile = await this.userService.getUserProfile(otherUserId);

          // Format timestamp and create preview
          const lastMsg = chat.lastMessage;
          const formattedTimestamp = this.formatTimestamp(lastMsg?.timestamp);
          const lastMessagePreview = lastMsg?.content
            ? (lastMsg.content.length > 50 ? lastMsg.content.substring(0, 50) + "..." : lastMsg.content)
            : "";

          return {
            ...chat,
            chatType: "private",
            unreadCount,
            otherUserProfile,
            formattedTimestamp,
            lastMessagePreview,
            displayName: otherUserProfile?.name,
            displayImage: otherUserProfile?.profileImageUrl,
          };
        })
      );

      // Calculate unread counts for group chats
      const enrichedGroupChats = await Promise.all(
        groupChats.map(async (chat) => {
          const groupId = chat._id;
          const groupInfo = groupMap.get(groupId.toString());

          // Count unread messages: messages in this group where user not in views
          const unreadCount = await Message.countDocuments({
            chatType: "group",
            groupId: groupId,
            $nor: [
              { "views.userId": userId }
            ],
          });

          // Format timestamp and create preview with sender name
          const lastMsg = chat.lastMessage;
          const formattedTimestamp = this.formatTimestamp(lastMsg?.timestamp);

          let lastMessagePreview = "";
          if (lastMsg?.content) {
            const senderProfile = lastMsg.senderId
              ? await this.userService.getUserProfile(lastMsg.senderId)
              : null;
            const senderName = senderProfile?.name || "Someone";
            const content = lastMsg.content.length > 40
              ? lastMsg.content.substring(0, 40) + "..."
              : lastMsg.content;
            lastMessagePreview = `${senderName}: ${content}`;
          }

          return {
            ...chat,
            _id: groupId.toString(), // Explicitly set _id to groupId to ensure it's the group ID
            chatType: "group",
            groupName: groupInfo?.name,
            groupType: groupInfo?.groupType,
            unreadCount,
            formattedTimestamp,
            lastMessagePreview,
            displayName: groupInfo?.name,
            // Groups might have icons/images in the future, for now use null
            displayImage: null,
          };
        })
      );

      // Calculate total unread (before pagination)
      const totalUnread = enrichedPrivateChats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0) +
        enrichedGroupChats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);

      // Combine all chats and sort by last message timestamp
      const allChats = [
        ...enrichedPrivateChats.map(chat => ({
          ...chat,
          sortTimestamp: chat.lastMessage?.timestamp || new Date(0)
        })),
        ...enrichedGroupChats.map(chat => ({
          ...chat,
          sortTimestamp: chat.lastMessage?.timestamp || new Date(0)
        }))
      ].sort((a, b) => {
        const timeA = new Date(a.sortTimestamp).getTime();
        const timeB = new Date(b.sortTimestamp).getTime();
        return timeB - timeA; // Most recent first
      });

      // Calculate pagination
      const total = allChats.length;
      const skip = (page - 1) * limit;
      const paginatedChats = allChats.slice(skip, skip + limit);

      // Separate back into private and group chats
      const paginatedPrivateChats = paginatedChats
        .filter(chat => chat.chatType === "private")
        .map(({ sortTimestamp, ...chat }) => chat);

      const paginatedGroupChats = paginatedChats
        .filter(chat => chat.chatType === "group")
        .map(({ sortTimestamp, ...chat }) => chat);

      return {
        privateChats: paginatedPrivateChats,
        groupChats: paginatedGroupChats,
        totalUnread,
        total,
        page,
        limit
      };
    } catch (error) {
      logger.error({ err: error }, "Error fetching chats");
      throw new Error("Error fetching chats");
    }
  }

  /**
   * Format timestamp for display
   * Today: "HH:mm" format (e.g., "13:30")
   * Yesterday: "Yesterday"
   * This week: Day name (e.g., "Tuesday")
   * Older: Date format (e.g., "Jan 15")
   */
  private formatTimestamp(timestamp?: Date): string {
    if (!timestamp) return "";

    const now = new Date();
    const msgDate = new Date(timestamp);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDay = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());

    const diffTime = today.getTime() - msgDay.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Today - return time in HH:mm format
      const hours = msgDate.getHours().toString().padStart(2, '0');
      const minutes = msgDate.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } else if (diffDays === 1) {
      // Yesterday
      return "Yesterday";
    } else if (diffDays < 7) {
      // This week - return day name
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return days[msgDate.getDay()];
    } else {
      // Older - return date format "Jan 15"
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[msgDate.getMonth()]} ${msgDate.getDate()}`;
    }
  }

  /**
   * Enrich a message with user profile information
   */
  private async enrichMessageWithProfiles(message: any, knownSenderProfile?: UserProfile | null): Promise<any> {
    const messageObj = message.toObject ? message.toObject() : message;

    // Fetch sender profile
    if (messageObj.senderId) {
      let senderProfile = knownSenderProfile;
      if (!senderProfile) {
        senderProfile = await this.userService.getCachedUserProfile(messageObj.senderId);
      }

      if (senderProfile) {
        messageObj.senderProfile = senderProfile;
      }
    }

    // Fetch receiver profile for private messages
    if (messageObj.receiverId) {
      const receiverProfile = await this.userService.getCachedUserProfile(messageObj.receiverId);
      if (receiverProfile) {
        messageObj.receiverProfile = receiverProfile;
      }
    }

    return messageObj;
  }

  /**
   * Enrich multiple messages with user profiles
   */
  private async enrichMessagesWithProfiles(messages: any[]): Promise<any[]> {
    // Collect all unique user IDs
    const userIds = new Set<string>();
    messages.forEach(msg => {
      if (msg.senderId) userIds.add(msg.senderId);
      if (msg.receiverId) userIds.add(msg.receiverId);
    });

    // Batch fetch all profiles
    const profiles = await this.userService.getCachedUserProfiles(Array.from(userIds));

    // Enrich each message
    return messages.map(msg => {
      const messageObj = msg.toObject ? msg.toObject() : msg;

      if (messageObj.senderId) {
        const senderProfile = profiles.get(messageObj.senderId);
        if (senderProfile) {
          messageObj.senderProfile = senderProfile;
        }
      }

      if (messageObj.receiverId) {
        const receiverProfile = profiles.get(messageObj.receiverId);
        if (receiverProfile) {
          messageObj.receiverProfile = receiverProfile;
        }
      }

      return messageObj;
    });
  }

  /**
   * Mark a message as viewed by a user
   */
  async markMessageViewed(messageId: string, userId: string): Promise<any> {
    try {
      // Check if user has already viewed this message
      const message = await Message.findById(messageId);
      if (!message) {
        throw new Error("Message not found");
      }

      const alreadyViewed = message.views?.some((view: any) => view.userId === userId);

      if (alreadyViewed) {
        return message; // Already viewed, no need to update
      }

      // Add view record
      const updatedMessage = await Message.findByIdAndUpdate(
        messageId,
        {
          $push: {
            views: {
              userId,
              viewedAt: new Date(),
            },
          },
        },
        { new: true }
      );

      return updatedMessage;
    } catch (error) {
      logger.error({ err: error }, "Error marking message as viewed");
      throw new Error("Error marking message as viewed");
    }
  }

  /**
   * Get view status for a message
   */
  async getMessageViews(messageId: string): Promise<any[]> {
    try {
      const message = await Message.findById(messageId).select("views");
      return message?.views || [];
    } catch (error) {
      logger.error({ err: error }, "Error fetching message views");
      throw new Error("Error fetching message views");
    }
  }

  /**
   * Check if a user has viewed a message
   */
  async hasUserViewedMessage(messageId: string, userId: string): Promise<boolean> {
    try {
      const message = await Message.findById(messageId).select("views");
      return message?.views?.some((view: any) => view.userId === userId) || false;
    } catch (error) {
      logger.error({ err: error }, "Error checking if user viewed message");
      return false;
    }
  }
}
