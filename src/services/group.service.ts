import Group from "../models/group.model";

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
}
