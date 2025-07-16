import { Server, Socket } from "socket.io";
import { MessageService } from "../services/message.service";

const messageService = new MessageService();

export const groupChatHandler = (io: Server, socket: Socket) => {
  // Join group room
  socket.on("join-group", (groupId: string) => {
    socket.join(groupId);
    console.log(`Socket ${socket.id} joined group ${groupId}`);
  });

  // Handle group message
  socket.on("group-message", async ({ groupId, from, content }) => {
    try {
      const messageData = {
        senderId: from,
        groupId,
        content,
      };
      const message = await messageService.createGroupMessage(messageData);

      socket.to(groupId).emit("receive-group-message", message);
      io.to(from).emit("receive-group-message", message);
    } catch (error) {
      console.error("Group message error:", error);
    }
  });
};
