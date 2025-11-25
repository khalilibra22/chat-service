import { Server, Namespace } from "socket.io";
import { privateChatHandler } from "./private-chat.socket";
import { groupChatHandler } from "./group-chat.socket";

export interface SocketVersion {
  version: string;
  path: string;
  description: string;
}

export const SOCKET_VERSIONS: SocketVersion[] = [
  {
    version: "v1",
    path: "/ws/v1",
    description: "Initial Socket.IO API version with private and group chat support",
  },
  // Future versions can be added here:
  // {
  //   version: "v2",
  //   path: "/ws/v2",
  //   description: "Enhanced API with additional features",
  // },
];

/**
 * Register handlers for a specific namespace version
 */
export const registerNamespaceHandlers = (namespace: Namespace, version: string) => {
  namespace.on("connection", (socket) => {
    const user = socket.data.userId;
    console.log(`[${version}] Socket connected: ${user} (${socket.id})`);

    // Register chat handlers
    privateChatHandler(namespace, socket);
    groupChatHandler(namespace, socket);

    socket.on("disconnect", () => {
      console.log(`[${version}] Socket ${socket.id} disconnected`);
    });
  });
};

