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
      const { name, members } = req.body;
      const group = await this.groupService.createGroup({ name, members });
      
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
