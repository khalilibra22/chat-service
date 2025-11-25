import { Server, Socket, Namespace } from "socket.io";
import { MessageService } from "../services/message.service";
import { UserService } from "../services/user.service";
import { ValidationMiddleware } from "../utils/validation.middleware";
import { privateSocketMessageValidation } from "../validations/message.validation";
import { plainToInstance } from "class-transformer";
import { MessageDto } from "../dtos/message.dto";
import { PrivateMessageData, SocketUser, PrivateTypingData } from "../types/chat.types";

const messageService = new MessageService();
const userService = new UserService();

export const privateChatHandler = (io: Server | Namespace, socket: Socket & { data: SocketUser }) => {
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

        // Ensure sender profile is present
        if (!message.senderProfile) {
          const senderProfile = await userService.getCachedUserProfile(socket.data.userId);
          if (senderProfile) {
            message.senderProfile = senderProfile;
          }
        }

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

  // Handle message view updates
  socket.on("message-viewed", async (data: { messageId: string }, callback?: (response: any) => void) => {
    try {
      const { messageId } = data;
      const userId = socket.data.userId;

      const updatedMessage = await messageService.markMessageViewed(messageId, userId);

      const messageDto = plainToInstance(MessageDto, updatedMessage, {
        excludeExtraneousValues: true,
      });

      // Broadcast view update to sender and receiver
      if (updatedMessage.senderId) {
        io.to(updatedMessage.senderId).emit("message-view-updated", {
          messageId,
          userId,
          viewedAt: new Date(),
        });
      }
      if (updatedMessage.receiverId) {
        io.to(updatedMessage.receiverId).emit("message-view-updated", {
          messageId,
          userId,
          viewedAt: new Date(),
        });
      }

      if (callback) callback({ success: true, message: messageDto });
    } catch (error) {
      console.error("Message view error:", error);
      if (callback) callback({ error: "Failed to mark message as viewed" });
    }
  });
};
