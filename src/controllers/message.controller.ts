import { Request, Response } from "express";
import { MessageService } from "../services/message.service";

export class MessageController {
  private messageService: MessageService;
  constructor() {
    this.messageService = new MessageService();
  }

  async createPrivateMessage(req: Request, res: Response): Promise<void> {
    try {
      const message = await this.messageService.createPrivateMessage(req.body);
      res.status(201).json(message);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getPrivateMessageHistory(req: Request, res: Response): Promise<void> {
    try {
      const currentUserId = "user2"; // Replace with actual user ID from authentication middleware
      const { otherUserId } = req.params;

      const messages = await this.messageService.getPrivateMessageHistory(
        currentUserId,
        otherUserId
      );

      res.status(200).json(messages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getGroupMessageHistory(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;

      const messages = await this.messageService.getGroupMessageHistory(
        groupId
      );

      res.status(200).json(messages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async createGroupMessage(req: Request, res: Response): Promise<void> {
    try {
      const message = await this.messageService.createGroupMessage(req.body);
      res.status(201).json(message);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getAllChats(req: Request, res: Response): Promise<void> {
    try {
      const userId = "user1"; // Replace with actual user ID from authentication middleware
      const chats = await this.messageService.getAllChats(userId);
      res.status(200).json(chats);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
