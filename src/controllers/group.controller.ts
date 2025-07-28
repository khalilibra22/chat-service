import { Request, Response } from "express";
import { GroupService } from "../services/group.service";

export class GroupController {
  private groupService: GroupService;
  constructor() {
    this.groupService = new GroupService();
  }

  async createChatGroup(req: Request, res: Response): Promise<void> {
    try {
      const { name, members } = req.body;
      const group = await this.groupService.createGroup({ name, members });
      res.status(201).json(group);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getUserGroups(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const groups = await this.groupService.getUserGroups(userId);
      res.status(200).json(groups);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
