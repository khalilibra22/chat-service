import Group from "../models/group.model";
import { Types } from "mongoose";

export class GroupService {
  async createGroup(groupData: any): Promise<any> {
    try {
      const group = await Group.create(groupData);
      return group;
    } catch (error) {
      console.error(error);
      throw new Error("Error creating group");
    }
  }
  async getUserGroups(userId: string): Promise<any> {
    try {
      const groups = await Group.find({ members: userId });
      return groups;
    } catch (error) {
      console.error(error);
      throw new Error("Error fetching user groups");
    }
  }

  async isUserInGroup(userId: string, groupId: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(groupId)) {
        return false;
      }
      const exists = await Group.exists({ _id: groupId, members: userId });
      return !!exists;
    } catch (error) {
      console.error(error);
      throw new Error("Error checking group membership");
    }
  }
}
