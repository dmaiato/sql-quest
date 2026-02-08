import { Module } from '@nestjs/common';
import { MissionRepository } from './repository/mission.repository';
import { MissionController } from './mission.controller';

@Module({
  providers: [MissionRepository],
  exports: [MissionRepository],
  controllers: [MissionController],
})
export class MissionModule {}
