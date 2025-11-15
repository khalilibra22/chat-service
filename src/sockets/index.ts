import { Server } from "socket.io";
import { SOCKET_VERSIONS, registerNamespaceHandlers } from "./namespaces";
import { AuthMiddleware } from "../utils/auth.middleware";

/**
 * Initialize versioned Socket.IO namespaces
 * Each namespace represents a different API version
 */
export const chatSocket = (io: Server) => {
  // Register each versioned namespace
  SOCKET_VERSIONS.forEach(({ version, path, description }) => {
    console.log(`Registering Socket.IO namespace: ${path} - ${description}`);
    
    const namespace = io.of(path);
    
    // Apply authentication middleware to this namespace
    namespace.use(AuthMiddleware.verifySocketToken);
    
    // Register connection handlers for this version
    registerNamespaceHandlers(namespace, version);
  });

  console.log(`Socket.IO namespaces initialized: ${SOCKET_VERSIONS.map(v => v.path).join(", ")}`);
};
