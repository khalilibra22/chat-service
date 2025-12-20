import { Expose, Type, Transform } from "class-transformer";
import { getImageUrl } from "../utils";

export class MessageViewDto {
  @Expose()
  userId?: string;

  @Expose()
  viewedAt?: Date;
}

export class UserProfileDto {
  @Expose()
  userId?: string;

  @Expose()
  name?: string;

  @Expose()
  @Transform(({ value }) => (value ? getImageUrl(value) : undefined))
  profileImageUrl?: string;

  @Expose()
  email?: string;

  @Expose()
  isOnline?: boolean;
}

export class MessageDto {
  @Expose()
  @Transform(({ obj }) => {
    // Convert MongoDB ObjectId to string
    if (obj._id) {
      return obj._id.toString ? obj._id.toString() : String(obj._id);
    }
    return obj._id;
  })
  id?: string;

  @Expose()
  content?: string;

  @Expose()
  timestamp?: Date;

  @Expose()
  senderId?: string;

  @Expose()
  receiverId?: string;

  @Expose()
  groupId?: string;

  @Expose()
  @Type(() => MessageViewDto)
  views?: MessageViewDto[];

  @Expose()
  @Type(() => UserProfileDto)
  senderProfile?: UserProfileDto;

  @Expose()
  @Type(() => UserProfileDto)
  receiverProfile?: UserProfileDto;
}
