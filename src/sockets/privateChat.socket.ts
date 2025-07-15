import { Server, Socket } from "socket.io";
import { MessageService } from "../services/message.service";

const messageService = new MessageService();

export const privateChatHandler = (io: Server, socket: Socket) => {
  // Join personal room
  socket.on("join", (userId: string) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined user room ${userId}`);
  });

  // Handle private message
  socket.on("private-message", async ({ to, from, content }) => {
    try {
      const messageData = {
        senderId: from,
        receiverId: to,
        content,
      };

      const message = await messageService.createPrivateMessage(messageData);

      io.to(to).emit("receive-private-message", message);
      io.to(from).emit("receive-private-message", message);
    } catch (error) {
      console.error("Private message error:", error);
    }
  });
};
