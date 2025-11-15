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
      const { name, members = [], groupType } = req.body;
      const creatorId = (req as any).user.id;
      
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
      const groupDtos= plainToClass(GroupDto, groups, { excludeExtraneousValues: true })
      
      res.status(200).json(groupDtos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
}
