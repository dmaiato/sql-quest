import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { GameService } from './game.service';
import { ApiTags } from '@nestjs/swagger';
import { queryDTO } from './dto/queryDTO';

@ApiTags('Game Engine')
@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  // Rota para carregar a página da missão
  @Get('missions/:id/context')
  async getContext(@Param('id') id: number) {
    return this.gameService.getMissionContext(id);
  }

  @Post('users/:userId/missions/:missionId/preview')
  async test(
    @Param('userId') userId: string,
    @Param('missionId') missionId: number,
    @Body() data: queryDTO,
  ) {
    // Mock de user ID
    return this.gameService.testQuery(userId, missionId, data.query);
  }

  @Post('users/:userId/missions/:missionId/submit')
  async submit(
    @Param('userId') userId: string,
    @Param('missionId') missionId: number,
    @Body() data: queryDTO,
  ) {
    // userId viria do token JWT na vida real
    return this.gameService.submitAttempt(userId, missionId, data.query);
  }
}
