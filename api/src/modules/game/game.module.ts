import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { DatabaseModule } from '../database/database.module';
import { FingerprintValidator } from './strategies/fingerprint-validator';
import { SandboxService } from './services/sandbox/sandbox.service';
import { ExecutionService } from './services/execution/execution.service';
import { MissionModule } from '../mission/mission.module';
import { SqlSecurityService } from './services/sql-security/sql-security.service';

@Module({
  imports: [DatabaseModule, MissionModule],
  providers: [
    GameService,
    FingerprintValidator,
    SandboxService,
    ExecutionService,
    SqlSecurityService,
  ],
  controllers: [GameController],
})
export class GameModule {}
