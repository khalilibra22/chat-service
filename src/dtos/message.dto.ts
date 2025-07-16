import { Expose } from "class-transformer";

export class MessageDto {
  @Expose()
  content?: string;

  @Expose()
  timestamp?: Date;

  @Expose()
  senderId?: string;
}
