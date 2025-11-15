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

export class MessageService {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }
  async createPrivateMessage(messageData: CreateMessageData): Promise<any> {
    try {
      // Ensure user profiles are cached
      const userIds = [messageData.senderId];
      if (messageData.receiverId) {
        userIds.push(messageData.receiverId);
      }
      await this.userService.ensureUserProfiles(userIds);

      const message = await Message.create({
        ...messageData,
        chatType: "private",
      });

      // Enrich message with user profiles
      return await this.enrichMessageWithProfiles(message);
    } catch (error) {
      console.error(error);
      throw new Error("Error creating private message");
    }
  }

  async createGroupMessage(messageData: CreateMessageData): Promise<any> {
    try {
      // Ensure sender profile is cached
      await this.userService.ensureUserProfile(messageData.senderId);

      const message = await Message.create({
        ...messageData,
        chatType: "group",
      });

      // Enrich message with user profiles
      return await this.enrichMessageWithProfiles(message);
    } catch (error) {
      console.error(error);
      throw new Error("Error creating group message");
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
      console.error(error);
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
      console.error(error);
      throw new Error("Error fetching private message history");
    }
  }

  async getGroupMessageHistoryPaginated(
    groupId: string,
    page: number,
    limit: number
  ): Promise<PaginatedResponse<any>> {
    try {
      const filter = { chatType: "group" as const, groupId };
      const total = await Message.countDocuments(filter);
      const items = await Message.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ timestamp: -1 });
      return { items, total, page, limit };
    } catch (error) {
      console.error(error);
      throw new Error("Error fetching group message history");
    }
  }

  async getAllChats(userId: string): Promise<AllChatsResponse> {
    try {
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

      const groupChats = await Message.aggregate([
        {
          $match: {
            chatType: "group",
            senderId: userId,
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

      // Fetch group metadata for all group chats
      const groupIds = groupChats.map(chat => chat._id);
      const groups = await Group.find({ _id: { $in: groupIds } }).select('_id name');
      
      // Create a map of group ID to group name
      const groupMap = new Map(groups.map(g => [g._id.toString(), g.name]));
      
      // Attach group name to each group chat
      const enrichedGroupChats = groupChats.map(chat => ({
        ...chat,
        groupName: groupMap.get(chat._id.toString())
      }));

      return { privateChats, groupChats: enrichedGroupChats };
    } catch (error) {
      console.error(error);
      throw new Error("Error fetching chats");
    }
  }

  /**
   * Enrich a message with user profile information
   */
  private async enrichMessageWithProfiles(message: any): Promise<any> {
    const messageObj = message.toObject ? message.toObject() : message;
    
    // Fetch sender profile
    if (messageObj.senderId) {
      const senderProfile = await this.userService.getUserProfile(messageObj.senderId);
      if (senderProfile) {
        messageObj.senderProfile = senderProfile;
      }
    }

    // Fetch receiver profile for private messages
    if (messageObj.receiverId) {
      const receiverProfile = await this.userService.getUserProfile(messageObj.receiverId);
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
    const profiles = await this.userService.ensureUserProfiles(Array.from(userIds));

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
      console.error(error);
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
      console.error(error);
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
      console.error(error);
      return false;
    }
  }
}
