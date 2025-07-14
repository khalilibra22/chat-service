import { Server, Socket } from "socket.io";
import Message from "../models/message.model";

export const privateChatHandler = (io: Server, socket: Socket) => {
  // Join personal room
  socket.on("join", (userId: string) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined user room ${userId}`);
  });

  // Handle private message
  socket.on("private-message", async ({ to, from, content }) => {
    try {
      const message = await Message.create({
        senderId: from,
        receiverId: to,
        content,
        chatType: "private",
      });

      io.to(to).emit("receive-private-message", message);
      io.to(from).emit("receive-private-message", message);
    } catch (error) {
      console.error("Private message error:", error);
    }
  });
};
