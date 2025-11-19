import { Expose, Type } from "class-transformer";

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
  profileImageUrl?: string;

  @Expose()
  email?: string;
}

export class MessageDto {
  @Expose()
  _id?: string;

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
