import { Module } from '@nestjs/common';
import { DatabaseSetupService } from './database-setup.service';
import { PlayerConnection } from './player-connection';

@Module({
  providers: [DatabaseSetupService, PlayerConnection],
  exports: [PlayerConnection],
})
export class DatabaseModule {}
