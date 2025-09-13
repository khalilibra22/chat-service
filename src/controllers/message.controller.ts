import { Request, Response } from "express";
import { MessageService } from "../services/message.service";
import { MessageDto } from "../dtos/message.dto";
import { plainToInstance } from "class-transformer";
import { GroupService } from "../services/group.service";
import { ChatDto } from "../dtos/chat.dto";
import { AllChatsResponse, ChatListResponse } from "../types/chat.types";

export class MessageController {
  private messageService: MessageService;
  private groupService: GroupService;
  constructor() {
    this.messageService = new MessageService();
    this.groupService = new GroupService();
  }

  createPrivateMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { otherUserId } = req.params;
      const messageData = {
        ...req.body,
        senderId: (req as any).user.id,
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
  };

  getPrivateMessageHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUserId = (req as any).user.id;
      const { otherUserId } = req.params;
      const page = Math.max(parseInt((req.query.page as string) || "1", 10), 1);
      const limit = Math.min(
        Math.max(parseInt((req.query.limit as string) || "20", 10), 1),
        100
      );

      const { items, total } = await this.messageService.getPrivateMessageHistoryPaginated(
        currentUserId,
        otherUserId,
        page,
        limit
      );
      const messageDtos = plainToInstance(MessageDto, items, {
        excludeExtraneousValues: true,
      });

      res.setHeader("X-Total-Count", total.toString());
      res.setHeader("X-Page", page.toString());
      res.setHeader("X-Limit", limit.toString());
      res.status(200).json(messageDtos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getGroupMessageHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { groupId } = req.params;
      const page = Math.max(parseInt((req.query.page as string) || "1", 10), 1);
      const limit = Math.min(
        Math.max(parseInt((req.query.limit as string) || "20", 10), 1),
        100
      );

      const { items, total } = await this.messageService.getGroupMessageHistoryPaginated(
        groupId,
        page,
        limit
      );
      const messageDtos = plainToInstance(MessageDto, items, {
        excludeExtraneousValues: true,
      });

      res.setHeader("X-Total-Count", total.toString());
      res.setHeader("X-Page", page.toString());
      res.setHeader("X-Limit", limit.toString());
      res.status(200).json(messageDtos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  createGroupMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { groupId } = req.params;
      const messageData = {
        ...req.body,
        senderId: (req as any).user.id,
        groupId,
      };
      const isGroupMember = await this.groupService.isUserInGroup(
        (req as any).user.id,
        groupId
      );
      if (!isGroupMember) {
        res.status(403).json({ error: "User is not a member of the group" });
        return;
      }
      const message = await this.messageService.createGroupMessage(messageData);
      const messageDto = plainToInstance(MessageDto, message, {
        excludeExtraneousValues: true,
      });
      res.status(201).json(messageDto);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getAllChats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId: string = (req as any).user.id; 
      const chats: AllChatsResponse = await this.messageService.getAllChats(userId);
      
      const privateChatDtos = chats.privateChats.map((chat: any) => 
        plainToInstance(ChatDto, chat, { excludeExtraneousValues: true })
      );
      
      const groupChatDtos = chats.groupChats.map((chat: any) => 
        plainToInstance(ChatDto, chat, { excludeExtraneousValues: true })
      );
      
      const chatDtos: ChatListResponse = {
        privateChats: privateChatDtos as any,
        groupChats: groupChatDtos as any,
        totalChats: privateChatDtos.length + groupChatDtos.length
      };
      
      res.status(200).json(chatDtos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
}
