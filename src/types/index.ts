// Export all types from a central location
export * from './chat.types';

// Re-export commonly used types for convenience
export type {
  // Chat types
  BaseChat,
  PrivateChat,
  GroupChat,
  Chat,
  AllChatsResponse,
  ChatListResponse,
  
  // Message types
  CreateMessageData,
  MessageHistoryParams,
  GroupMessageHistoryParams,
  
  // Socket types
  SocketUser,
  PrivateMessageData,
  GroupMessageData,
  
  // API types
  ApiResponse,
  PaginatedResponse,
  PaginationParams
} from './chat.types';
