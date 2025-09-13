import { Expose } from "class-transformer";

export class GroupDto {
  @Expose()
  id?: string;

  @Expose()
  name?: string;

  @Expose()
  members?: string[];
}




