import { Server, Socket } from "socket.io";
import { MessageService } from "../services/message.service";
import { ValidationMiddleware } from "../utils/validation.middleware";
import { privateSocketMessageValidation } from "../validations/message.validation";
import { plainToInstance } from "class-transformer";
import { MessageDto } from "../dtos/message.dto";
import { PrivateMessageData, SocketUser, PrivateTypingData } from "../types/chat.types";

const messageService = new MessageService();

export const privateChatHandler = (io: Server, socket: Socket & { data: SocketUser }) => {
  // Join personal room
  socket.on("join", () => {
    socket.join(socket.data.userId);
    console.log(`Socket ${socket.id} joined user room ${socket.data.userId}`);
  });

  // Handle private message
  socket.on("private-message", async (data: PrivateMessageData, callback?: (response: any) => void) => {
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
          chatType: "private" as const,
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

  // Handle typing indicators for private chat
  socket.on("private-typing-start", (data: PrivateTypingData) => {
    const typingData = {
      userId: socket.data.userId,
      userName: data.userName || "User", // You can get this from user service
      isTyping: true,
      to: data.to
    };
    //console.log("typingData", typingData);
    
    // Emit to the recipient
    io.to(data.to).emit("receive-private-typing", typingData);
    //console.log(`User ${socket.data.userId} started typing to ${data.to}`);
  });

  socket.on("private-typing-stop", (data: PrivateTypingData) => {
    const typingData = {
      userId: socket.data.userId,
      userName: data.userName || "User",
      isTyping: false,
      to: data.to
    };
    
    // Emit to the recipient
    io.to(data.to).emit("receive-private-typing", typingData);
    //console.log(`User ${socket.data.userId} stopped typing to ${data.to}`);
  });
};
