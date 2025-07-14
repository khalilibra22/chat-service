import { Server, Socket } from "socket.io";
import Message from "../models/message.model";

export const groupChatHandler = (io: Server, socket: Socket) => {
  // Join group room
  socket.on("join-group", (groupId: string) => {
    socket.join(groupId);
    console.log(`Socket ${socket.id} joined group ${groupId}`);
  });

  // Handle group message
  socket.on("group-message", async ({ groupId, from, content }) => {
    try {
      const message = await Message.create({
        senderId: from,
        groupId,
        content,
        chatType: "group",
      });

      socket.to(groupId).emit("receive-group-message", message);
      io.to(from).emit("receive-group-message", message);
    } catch (error) {
      console.error("Group message error:", error);
    }
  });
};
