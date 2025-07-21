import { Server, Socket } from "socket.io";
import { MessageService } from "../services/message.service";
import { ValidationMiddleware } from "../utils/validation.middleware";
import { groupSocketMessageValidation } from "../validations/message.validation";
import { GroupService } from "../services/group.service";

const messageService = new MessageService();
const groupService = new GroupService();

export const groupChatHandler = (io: Server, socket: Socket) => {
  // Join group room
  socket.on("join-group", async (groupId: string) => {
    console.log(`Socket ${socket.id} joining group ${groupId}`);
    console.log(`User ID: ${socket.data.userId}`);
    // const isGroupMember = await groupService.isUserInGroup(
    //   groupId,
    //   socket.data.userId
    // );
    // console.log(`Is user in group: ${isGroupMember}`);
    // if (!isGroupMember) {
    //   console.error(
    //     `User ${socket.data.userId} is not a member of group ${groupId}`
    //   );
    //   return;
    // }
    socket.join(groupId);
    console.log(`Socket ${socket.id} joined group ${groupId}`);
  });

  // Handle group message
  socket.on("group-message", async (data, callback) => {
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
        };
        const message = await messageService.createGroupMessage(messageData);

        socket.to(groupId).emit("receive-group-message", message);
        io.to(socket.data.userId).emit("receive-group-message", message);

        if (callback) callback({ success: true, message });
      } catch (error) {
        console.error("Group message error:", error);
        if (callback) callback({ error: "Failed to send message" });
      }
    });
  });
};
