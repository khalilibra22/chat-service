import { Server, Namespace } from "socket.io";
import { privateChatHandler } from "./private-chat.socket";
import { groupChatHandler } from "./group-chat.socket";
import { UserService } from "../services/user.service";
import logger from "../utils/logger";

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
  const userService = new UserService();

  namespace.on("connection", async (socket) => {
    const user = socket.data.userId;
    logger.info(`[${version}] Socket connected: ${user} (${socket.id})`);

    // Set user as online
    try {
      await userService.setUserOnline(user);

      // Broadcast status change to all connected clients
      namespace.emit("user-status-changed", {
        userId: user,
        isOnline: true,
      });
    } catch (error) {
      logger.error({ err: error }, `Error setting user ${user} online`);
    }

    // Register chat handlers
    privateChatHandler(namespace, socket);
    groupChatHandler(namespace, socket);

    socket.on("disconnect", async () => {
      logger.info(`[${version}] Socket ${socket.id} disconnected`);

      // Set user as offline
      try {
        await userService.setUserOffline(user);
        const status = await userService.getUserStatus(user);

        // Broadcast status change to all connected clients
        namespace.emit("user-status-changed", {
          userId: user,
          isOnline: false,
          lastSeenAt: status.lastSeenAt,
        });
      } catch (error) {
        logger.error({ err: error }, `Error setting user ${user} offline`);
      }
    });
  });
};

