import { ApiProperty } from '@nestjs/swagger';
import {
  Equals,
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/[A-Za-z]/, { message: 'Senha deve conter letra' })
  @Matches(/[0-9]/, { message: 'Senha deve conter número' })
  password!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ type: Boolean })
  @Equals(true)
  acceptTerms!: true;

  @ApiProperty({ type: Boolean })
  @Equals(true)
  acceptPrivacy!: true;
}
