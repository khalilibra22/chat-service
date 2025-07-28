import Message from "../models/message.model";

export class MessageService {
  async createPrivateMessage(messageData: any): Promise<any> {
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

  async createGroupMessage(messageData: any): Promise<any> {
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
      const messages = Message.find({
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

  async getGroupMessageHistory(groupId: string): Promise<any> {
    try {
      const messages = await Message.find({
        chatType: "group",
        groupId: groupId,
      }).sort({ timestamp: 1 });
      return messages;
    } catch (error) {
      console.error(error);
      throw new Error("Error fetching group message history");
    }
  }
  async getAllChats(userId: string): Promise<any> {
    try {
      const privateChats = await Message.aggregate([
        {
          $match: {
            chatType: "private",
            $or: [{ senderId: userId }, { receiverId: userId }],
          },
        },
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
        {
          $group: {
            _id: "$receiverId",
            lastMessage: { $last: "$$ROOT" },
          },
        },
      ]);

      return { privateChats, groupChats };
    } catch (error) {
      console.error(error);
      throw new Error("Error fetching chats");
    }
  }
}
