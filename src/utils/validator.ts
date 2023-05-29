import {UserEntity} from "./DB/entities/DBUsers";
import {MemberTypeEntity} from "./DB/entities/DBMemberTypes";
import {ProfileEntity} from "./DB/entities/DBProfiles";


export function checkIsValidIdentifier(identifier: string): boolean  {
  return !isNaN(Number(identifier));
}

export function areValuesMissing(
  value1: UserEntity | null,
  value2: MemberTypeEntity | null,
  value3: ProfileEntity | null
): boolean {
  return !value1 || !value2 || value3 !== null;
}
