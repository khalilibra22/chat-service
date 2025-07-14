import { Schema, model } from "mongoose";

const groupSchema = new Schema({
  name: String,
  members: [String], // Array of userIds
});

export default model("Group", groupSchema);
