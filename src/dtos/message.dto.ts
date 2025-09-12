import { Expose } from "class-transformer";

export class MessageDto {
  @Expose()
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
}
