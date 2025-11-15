import Message from "../models/message.model";
import Group from "../models/group.model";
import { 
  CreateMessageData, 
  AllChatsResponse, 
  PaginatedResponse, 
  MessageHistoryParams, 
  GroupMessageHistoryParams 
} from "../types/chat.types";

export class MessageService {
  async createPrivateMessage(messageData: CreateMessageData): Promise<any> {
    try {
      const message = await Message.create({
        ...messageData,
        chatType: "private",
      });
      return message;
    } catch (error) {
      console.error(error);
      throw new Error("Error creating private message");
    }
  }

  async createGroupMessage(messageData: CreateMessageData): Promise<any> {
    try {
      const message = await Message.create({
        ...messageData,
        chatType: "group",
      });
      return message;
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
}
