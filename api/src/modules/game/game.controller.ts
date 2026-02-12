import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { GameService } from './game.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QueryDTO } from './dto/queryDTO';
import { SmartThrottlerGuard } from 'src/common/guards/smart-throttler/smart-throttler.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from 'src/common/decorators/current-user/current-user.decorator';

@ApiTags('Game Engine')
@ApiBearerAuth('access-token')
@Controller('games')
@UseGuards(SmartThrottlerGuard)
export class GameController {
  constructor(private readonly gameService: GameService) {}

  // Rota para carregar a página da missão
  @Get('missions/:id/context')
  async getContext(@Param('id') id: number) {
    return this.gameService.getMissionContext(id);
  }

  @Post('missions/:id/previews')
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Limite mais restrito para preview
  async test(
    @Param('id') missionId: number,
    @Body() data: QueryDTO,
    @Headers('x-guest-id') guestId?: string,
    @CurrentUser() user?: { id: string },
  ) {
    const identifier = user?.id || guestId || 'anonymous';
    return this.gameService.testQuery(
      identifier,
      Number(missionId),
      data.query,
    );
  }

  @ApiBearerAuth('access-token')
  @Post('missions/:id/submissions')
  @UseGuards(OptionalJwtAuthGuard) // 2. Tenta identificar usuário, mas não bloqueia
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // Configuração base (Auth) sobrescrita pelo Guard
  async submit(
    @Param('id') missionId: number,
    @Body() data: QueryDTO,
    @Headers('x-guest-id') guestId?: string,
    @CurrentUser() user?: { id: string },
  ) {
    // Lógica de Identificação
    const isAuthenticated = !!user;
    const identifier = isAuthenticated ? user?.id : guestId;

    if (!identifier) {
      throw new UnauthorizedException(
        'Identificação obrigatória: Faça login ou envie x-guest-id.',
      );
    }

    return this.gameService.submitAttempt(
      identifier,
      Number(missionId),
      data.query,
      !isAuthenticated,
    );
  }
}
