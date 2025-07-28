import { Server, Socket } from "socket.io";
import { MessageService } from "../services/message.service";
import { ValidationMiddleware } from "../utils/validation.middleware";
import { privateSocketMessageValidation } from "../validations/message.validation";
import { plainToInstance } from "class-transformer";
import { MessageDto } from "../dtos/message.dto";

const messageService = new MessageService();

export const privateChatHandler = (io: Server, socket: Socket) => {
  // Join personal room
  socket.on("join", () => {
    socket.join(socket.data.userId);
    console.log(`Socket ${socket.id} joined user room ${socket.data.userId}`);
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
        const { to, content } = data;
        const messageData = {
          senderId: socket.data.userId,
          receiverId: to,
          content,
        };

        const message = await messageService.createPrivateMessage(messageData);

        const messageDto = plainToInstance(MessageDto, message, {
          excludeExtraneousValues: true,
        });

        io.to(to).emit("receive-private-message", messageDto);
        io.to(socket.data.userId).emit("receive-private-message", messageDto);

        //if (callback) callback({ success: true, message });
      } catch (error) {
        console.error("Private message error:", error);
        if (callback) callback({ error: "Failed to send message" });
      }
    });
  });
};
