import { Request, Response } from "express";
import { GroupService } from "../services/group.service";
import { GroupDto } from "../dtos/group.dto";
import { plainToClass } from "class-transformer";

export class GroupController {
  private groupService: GroupService;
  constructor() {
    this.groupService = new GroupService();
  }

  createChatGroup = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, members = [], groupType, userId } = req.body;
      if (!userId) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }
      const creatorId = userId;
      
      // Ensure creator is in members array if not already present
      const membersList = Array.isArray(members) ? members : [];
      if (!membersList.includes(creatorId)) {
        membersList.push(creatorId);
      }
      
      const groupData: any = { name, members: membersList };
      if (groupType) {
        groupData.groupType = groupType;
      }
      
      const group = await this.groupService.createGroup(groupData);
      
      // Transform the response using GroupDto
      const groupDto = plainToClass(GroupDto, group, { excludeExtraneousValues: true });
      res.status(201).json(groupDto);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getUserGroups = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const groups = await this.groupService.getUserGroups(userId);
      
      // Transform the response using GroupDto
      const groupDtos = plainToClass(GroupDto, groups, {
        excludeExtraneousValues: true,
      });

      res.status(200).json(groupDtos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  joinGroup = async (req: Request, res: Response): Promise<void> => {
    try {
      const { groupId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const group = await this.groupService.joinGroup(userId, groupId);
      
      const groupDto = plainToClass(GroupDto, group, { excludeExtraneousValues: true });
      res.status(200).json(groupDto);
    } catch (error: any) {
      console.error(error);
      const message = error?.message || "Internal Server Error";

      const statusMap: Record<string, number> = {
        "User ID is required": 400,
        "Invalid group ID": 400,
        "Group not found": 404,
        "User already in group": 409,
      };

      const status = statusMap[message] || 500;

      res.status(status).json({ error: message });
    }
  };
}
