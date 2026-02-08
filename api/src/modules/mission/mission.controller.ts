import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MissionRepository } from './repository/mission.repository';

@ApiTags('Missions Controller')
@Controller('missions')
export class MissionController {
  constructor(private repo: MissionRepository) {}

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.repo.findById(id);
  }
}
