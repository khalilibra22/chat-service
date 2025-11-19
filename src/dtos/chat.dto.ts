import { Expose, Type } from "class-transformer";
import { MessageDto, UserProfileDto } from "./message.dto";

export class ChatDto {

  @Expose()
  _id?: string;

  @Expose()
  chatType?: "private" | "group";

  @Expose()
  groupName?: string;

  @Expose()
  @Type(() => MessageDto)
  lastMessage?: MessageDto;

  @Expose()
  unreadCount?: number;

  @Expose()
  @Type(() => UserProfileDto)
  otherUserProfile?: UserProfileDto;

  @Expose()
  groupType?: string;

  @Expose()
  formattedTimestamp?: string;

  @Expose()
  lastMessagePreview?: string;

  @Expose()
  displayName?: string;

  @Expose()
  displayImage?: string;
}
