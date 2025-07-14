import { Schema, model } from "mongoose";

const messageSchema = new Schema({
  senderId: { type: String, required: true }, // userId from token
  receiverId: { type: String }, // For private messages
  groupId: { type: Schema.Types.ObjectId, ref: "Group" },
  content: String,
  chatType: { type: String, enum: ["private", "group"], default: "private" },
  timestamp: { type: Date, default: Date.now },
});

export default model("Message", messageSchema);
