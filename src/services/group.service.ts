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
      // Check if groupId is a valid ObjectId, if not use it as a custom field
      const query = Types.ObjectId.isValid(groupId)
        ? { _id: groupId }
        : { groupId: groupId }; // Assuming you have a custom groupId field

      const group = await Group.findOne(query);
      if (!group) return false;
      return group.members.some(
        (memberId) => memberId.toString() === userId.toString()
      );
    } catch (error) {
      console.error(error);
      throw new Error("Error checking group membership");
    }
  }
}
