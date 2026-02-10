import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class queryDTO {
  @ApiProperty({
    description: 'Query to be executed',
    example: 'SELECT * FROM <table_name>',
  })
  @IsString()
  query: string;
}
