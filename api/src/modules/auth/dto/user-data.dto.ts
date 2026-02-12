import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class UserDataDTO {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({ example: 'maxverstappen@gmail.com' })
  @IsEmail()
  email: string;
}
