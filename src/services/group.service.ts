import Group from "../models/group.model";
import { Types } from "mongoose";
import logger from "../utils/logger";

export class GroupService {
  async createGroup(groupData: any): Promise<any> {
    try {
      const group = await Group.create(groupData);
      return group;
    } catch (error) {
      logger.error({ err: error }, "Error creating group");
      throw new Error("Error creating group");
    }
  }
  async getUserGroups(userId: string): Promise<any> {
    try {
      const groups = await Group.find({ members: userId });
      return groups;
    } catch (error) {
      logger.error({ err: error }, "Error fetching user groups");
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
      logger.error({ err: error }, "Error checking group membership");
      throw new Error("Error checking group membership");
    }
  }

  async joinGroup(userId: string, groupId: string): Promise<any> {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }

      if (!Types.ObjectId.isValid(groupId)) {
        throw new Error("Invalid group ID");
      }

      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error("Group not found");
      }

      if (group.members.includes(userId)) {
        throw new Error("User already in group");
      }

      group.members.push(userId);
      await group.save();

      return group;
    } catch (error) {
      logger.error({ err: error }, "Error joining group");
      throw error;
    }
  }
}
