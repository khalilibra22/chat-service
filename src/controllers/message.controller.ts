import { Request, Response } from "express";
import { MessageService } from "../services/message.service";
import { MessageDto } from "../dtos/message.dto";
import { plainToInstance } from "class-transformer";

export class MessageController {
  private messageService: MessageService;
  constructor() {
    this.messageService = new MessageService();
  }

  async createPrivateMessage(req: Request, res: Response): Promise<void> {
    try {
      const { otherUserId, userId } = req.params;
      const messageData = {
        ...req.body,
        senderId: userId,
        receiverId: otherUserId,
      };

      const message = await this.messageService.createPrivateMessage(
        messageData
      );
      const messageDto = plainToInstance(MessageDto, message, {
        excludeExtraneousValues: true,
      });
      res.status(201).json(messageDto);
    } catch (error) {
      console.error("Error creating private message:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getPrivateMessageHistory(req: Request, res: Response): Promise<void> {
    try {
      const currentUserId = req.params.userId; // Replace with actual user ID from authentication middleware
      const { otherUserId } = req.params;

      const messages = await this.messageService.getPrivateMessageHistory(
        currentUserId,
        otherUserId
      );
      const messageDtos = plainToInstance(MessageDto, messages, {
        excludeExtraneousValues: true,
      });

      res.status(200).json(messageDtos);
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
      const messageDtos = plainToInstance(MessageDto, messages, {
        excludeExtraneousValues: true,
      });

      res.status(200).json(messageDtos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async createGroupMessage(req: Request, res: Response): Promise<void> {
    try {
      const { groupId, userId } = req.params;
      const messageData = {
        ...req.body,
        senderId: userId,
        groupId,
      };
      const message = await this.messageService.createGroupMessage(messageData);
      const messageDto = plainToInstance(MessageDto, message, {
        excludeExtraneousValues: true,
      });
      res.status(201).json(messageDto);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getAllChats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId; // Replace with actual user ID from authentication middleware
      const chats = await this.messageService.getAllChats(userId);
      res.status(200).json(chats);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
