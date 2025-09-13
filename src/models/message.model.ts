import { Schema, model } from "mongoose";

const messageSchema = new Schema(
  {
    senderId: { type: String, required: true },
    receiverId: { type: String }, // For private messages
    groupId: { type: Schema.Types.ObjectId, ref: "Group" },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
    chatType: { type: String, enum: ["private", "group"], required: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// Indexes for common queries
// Private chat lookups (sender-receiver pairs by time)
messageSchema.index({ chatType: 1, senderId: 1, receiverId: 1, timestamp: 1 });
messageSchema.index({ chatType: 1, receiverId: 1, senderId: 1, timestamp: 1 });

// Group chat lookups by group and time
messageSchema.index({ chatType: 1, groupId: 1, timestamp: 1 });

// User's chats (either as sender or receiver)
messageSchema.index({ senderId: 1, timestamp: 1 });
messageSchema.index({ receiverId: 1, timestamp: 1 });

export default model("Message", messageSchema);
