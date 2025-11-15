import { Expose, Type } from "class-transformer";
import { MessageDto } from "./message.dto";

export class ChatDto {

  @Expose()
  _id?: string;

  @Expose()
  groupName?: string;

  @Expose()
  @Type(() => MessageDto)
  lastMessage?: MessageDto;
}
