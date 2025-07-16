import { Server, Socket } from "socket.io";
import { MessageService } from "../services/message.service";
import { ValidationMiddleware } from "../utils/validation.middleware";
import {
  privateApiMessageValidation,
  privateSocketMessageValidation,
} from "../validations/message.validation";

const messageService = new MessageService();

export const privateChatHandler = (io: Server, socket: Socket) => {
  // Join personal room
  socket.on("join", (userId: string) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined user room ${userId}`);
  });

  // Handle private message
  socket.on("private-message", async (data, callback) => {
    const validate = ValidationMiddleware.validateSocket(
      privateSocketMessageValidation
    );

    validate(data, async (error) => {
      if (error) {
        if (callback) callback({ error });
        return;
      }

      try {
        const { to, from, content } = data;
        const messageData = {
          senderId: from,
          receiverId: to,
          content,
        };

        const message = await messageService.createPrivateMessage(messageData);

        io.to(to).emit("receive-private-message", message);
        io.to(from).emit("receive-private-message", message);

        if (callback) callback({ success: true, message });
      } catch (error) {
        console.error("Private message error:", error);
        if (callback) callback({ error: "Failed to send message" });
      }
    });
  });
};
