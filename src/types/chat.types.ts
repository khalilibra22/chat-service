import { MessageDto } from "../dtos/message.dto";

// Base chat interface
export interface BaseChat {
  _id?: string;
  lastMessage?: MessageDto;
}

// Private chat interface
export interface PrivateChat extends BaseChat {
  chatType?: "private";
}

// Group chat interface  
export interface GroupChat extends BaseChat {
  chatType?: "group";
}

// Union type for all chat types
export type Chat = PrivateChat | GroupChat;

// Service response types
export interface AllChatsResponse {
  privateChats: PrivateChat[];
  groupChats: GroupChat[];
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// Message service types
export interface CreateMessageData {
  senderId: string;
  receiverId?: string;
  groupId?: string;
  content: string;
  chatType?: "private" | "group";
}

export interface MessageHistoryParams {
  userId1: string;
  userId2: string;
  page: number;
  limit: number;
}

export interface GroupMessageHistoryParams {
  groupId: string;
  page: number;
  limit: number;
}

// Socket event types
export interface SocketUser {
  userId: string;
}

export interface PrivateMessageData {
  to: string;
  content: string;
}

export interface GroupMessageData {
  groupId: string;
  content: string;
}

// Typing indicator types
export interface TypingData {
  userId: string;
  userName?: string;
  isTyping: boolean;
}

export interface PrivateTypingData extends TypingData {
  to: string; // recipient user ID
}

export interface GroupTypingData extends TypingData {
  groupId: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ChatListResponse {
  privateChats: PrivateChat[];
  groupChats: GroupChat[];
  totalChats: number;
}
