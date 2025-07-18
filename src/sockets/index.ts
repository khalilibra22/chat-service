import { Server, Socket } from "socket.io";
import { privateChatHandler } from "./privateChat.socket";
import { groupChatHandler } from "./groupChat.socket";

export const chatSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    const user = socket.data.userId;
    console.log(`Socket connected: ${user}`);

    privateChatHandler(io, socket);
    groupChatHandler(io, socket);

    socket.on("disconnect", () => {
      console.log(`Socket ${socket.id} disconnected`);
    });
  });
};
