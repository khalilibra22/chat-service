import { Expose, Transform } from "class-transformer";
import { getImageUrl } from "../utils";

export class GroupDto {
  @Expose()
  id?: string;

  @Expose()
  name?: string;

  @Expose()
  members?: string[];

  @Expose()
  groupType?: string;

  @Expose()
  @Transform(({ value }) => (value ? getImageUrl(value) : undefined))
  profilePicture?: string;
}




