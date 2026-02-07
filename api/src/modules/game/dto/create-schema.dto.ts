import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateSchemaDTO {
  @ApiProperty({ description: 'User id', example: 'user-test-01' })
  @IsString()
  userId: string;
  @ApiProperty({ description: 'Mission id', example: '1' })
  @IsNumber()
  missionId: number;
  @ApiProperty({
    description: 'Query to be executed',
    example: 'SELECT * FROM agents',
  })
  @IsString()
  query: string;
}
