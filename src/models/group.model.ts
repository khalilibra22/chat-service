import mongoose, { Schema, Document } from "mongoose";

export interface IGroup extends Document {
  name: string;
  participants: string[];
}

const GroupSchema = new Schema<IGroup>({
  name: { type: String, required: true, unique: true },
  participants: [{ type: String, required: true }],
});

export const Group = mongoose.model<IGroup>("Group", GroupSchema);
