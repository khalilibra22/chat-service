import { Group } from "../models/group.model";

export const createGroup = async (groupName: string) => {
  const group = new Group({ name: groupName });
  await group.save();
  return group;
};

export const getAllGroups = async () => {
  return await Group.find();
};

export const addUserToGroup = async (groupId: string, userId: string) => {
  const group = await Group.findById(groupId);
  if (group) {
    group.participants.push(userId);
    await group.save();
  }
};
