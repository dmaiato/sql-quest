import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { DatabaseModule } from '../database/database.module';
import { MissionValidator } from './mission-validator/mission-validator';

@Module({
  imports: [DatabaseModule],
  providers: [GameService, MissionValidator],
  controllers: [GameController],
})
export class GameModule {}
