import { Expose, Transform, Type } from "class-transformer";
import { MessageDto, UserProfileDto } from "./message.dto";
import { getImageUrl } from "../utils";

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

  @Expose()
  @Transform(({ value }) => (value ? getImageUrl(value) : undefined))
  profilePicture?: string;
}
