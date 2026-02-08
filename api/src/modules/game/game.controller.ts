import { Controller, Post, Body } from '@nestjs/common';
import { GameService } from './game.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateSchemaDTO } from './dto/create-schema.dto';

@ApiTags('Game Engine')
@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('run')
  async run(@Body() body: CreateSchemaDTO) {
    // Simulando um UUID se não vier no body (para testes rápidos)
    const uid = body.userId || '123e4567-e89b-12d3-a456-426614174000';
    return this.gameService.submitAttempt(uid, body.missionId, body.query);
  }
}
