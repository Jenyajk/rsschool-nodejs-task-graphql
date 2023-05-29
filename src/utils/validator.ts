import {UserEntity} from "./DB/entities/DBUsers";
import {MemberTypeEntity} from "./DB/entities/DBMemberTypes";
import {ProfileEntity} from "./DB/entities/DBProfiles";


export function checkIsValidIdentifier(identifier: string): boolean  {
  const regexExp =
    /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
  return regexExp.test(identifier);
}

export function areValuesMissing(
  value1: UserEntity | null,
  value2: MemberTypeEntity | null,
  value3: ProfileEntity | null
): boolean {
  return !value1 || !value2 || value3 !== null;
}
