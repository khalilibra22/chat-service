import { Server } from "socket.io";
import { SOCKET_VERSIONS, registerNamespaceHandlers } from "./namespaces";
import { AuthMiddleware } from "../utils/auth.middleware";
import logger from "../utils/logger";

/**
 * Initialize versioned Socket.IO namespaces
 * Each namespace represents a different API version
 */
export const chatSocket = (io: Server) => {
  // Register each versioned namespace
  SOCKET_VERSIONS.forEach(({ version, path, description }) => {
    logger.info(`Registering Socket.IO namespace: ${path} - ${description}`);

    const namespace = io.of(path);

    // Apply authentication middleware to this namespace
    namespace.use(AuthMiddleware.verifySocketToken);

    // Register connection handlers for this version
    registerNamespaceHandlers(namespace, version);
  });

  logger.info(`Socket.IO namespaces initialized: ${SOCKET_VERSIONS.map(v => v.path).join(", ")}`);
};
