import { IsString, Matches, MinLength } from "class-validator";

export class LoginRequestDto {
  @IsString()
  @MinLength(1)
  username!: string;

  @IsString()
  password!: string;

  @IsString()
  @Matches(/^\d{6}$/u)
  mfaCode!: string;
}

export class ReauthenticationRequestDto {
  @IsString()
  password!: string;

  @IsString()
  @Matches(/^\d{6}$/u)
  mfaCode!: string;
}
