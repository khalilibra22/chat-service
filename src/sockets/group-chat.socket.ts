import { Server, Socket, Namespace } from "socket.io";
import { MessageService } from "../services/message.service";
import { ValidationMiddleware } from "../utils/validation.middleware";
import { groupSocketMessageValidation } from "../validations/message.validation";
import { GroupService } from "../services/group.service";
import { UserService } from "../services/user.service";
import { plainToInstance } from "class-transformer";
import { MessageDto } from "../dtos/message.dto";
import { GroupMessageData, SocketUser, GroupTypingData, SocketUserGroup } from "../types/chat.types";

const messageService = new MessageService();
const groupService = new GroupService();
const userService = new UserService();

export const groupChatHandler = (io: Server | Namespace, socket: Socket & { data: SocketUser & { groupId?: string } }) => {
  // Join group room
  socket.on("join-group", async (data: { groupId: string }) => {
    const groupId = data?.groupId;
    const userId = socket.data.userId;
    if (!groupId) {
      console.error(`No groupId provided for join-group event by user ${userId}`);
      return;
    }
    console.log(`Socket ${socket.id} joining group ${groupId}`);
    //console.log(`User ID: ${userId}`);
    const isGroupMember = await groupService.isUserInGroup(
      userId,
      groupId
    );
    //console.log(`Is user ${userId} a group member: ${isGroupMember} for group ${groupId}`);
    if (!isGroupMember) {
      console.error(
        `User ${userId} is not a member of group ${groupId}`
      );
      return;
    }
    socket.join(groupId);
    console.log(`Socket ${socket.id} joined group ${groupId}`);
  });

  // Handle group message
  socket.on("group-message", async (data: GroupMessageData, callback?: (response: any) => void) => {
    const validate = ValidationMiddleware.validateSocket(
      groupSocketMessageValidation
    );

    validate(data, async (error) => {
      if (error) {
        if (callback) callback({ error });
        return;
      }

      try {
        const { groupId, content } = data;
        const messageData = {
          senderId: socket.data.userId,
          groupId,
          content,
          chatType: "group" as const,
        };
        const message = await messageService.createGroupMessage(messageData);

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

        // Emit to all group members, including the sender
        io.to(groupId).emit("receive-group-message", messageDto);

        //if (callback) callback({ success: true, message: messageDto });
      } catch (error) {
        console.error("Group message error:", error);
        if (callback) callback({ error: "Failed to send message" });
      }
    });
  });

  // Handle typing indicators for group chat
  socket.on("group-typing-start", (data: GroupTypingData) => {
    const typingData = {
      userId: socket.data.userId,
      userName: data.userName || "User", // You can get this from user service
      isTyping: true,
      groupId: data.groupId
    };

    // Emit to all other members in the group (excluding sender)
    socket.to(data.groupId).emit("receive-group-typing", typingData);
    //console.log(`User ${socket.data.userId} started typing in group ${data.groupId}`);
  });

  socket.on("group-typing-stop", (data: GroupTypingData) => {
    const typingData = {
      userId: socket.data.userId,
      userName: data.userName || "User",
      isTyping: false,
      groupId: data.groupId
    };

    // Emit to all other members in the group (excluding sender)
    socket.to(data.groupId).emit("receive-group-typing", typingData);
    //console.log(`User ${socket.data.userId} stopped typing in group ${data.groupId}`);
  });

  // Handle group message view updates
  socket.on("group-message-viewed", async (data: { messageId: string; groupId: string }, callback?: (response: any) => void) => {
    try {
      const { messageId, groupId } = data;
      const userId = socket.data.userId;

      // Verify user is a group member
      const isGroupMember = await groupService.isUserInGroup(userId, groupId);
      if (!isGroupMember) {
        if (callback) callback({ error: "User is not a member of the group" });
        return;
      }

      const updatedMessage = await messageService.markMessageViewed(messageId, userId);

      const messageDto = plainToInstance(MessageDto, updatedMessage, {
        excludeExtraneousValues: true,
      });

      // Broadcast view update to all group members
      io.to(groupId).emit("message-view-updated", {
        messageId,
        userId,
        viewedAt: new Date(),
        groupId,
      });

      if (callback) callback({ success: true, message: messageDto });
    } catch (error) {
      console.error("Group message view error:", error);
      if (callback) callback({ error: "Failed to mark message as viewed" });
    }
  });
};
