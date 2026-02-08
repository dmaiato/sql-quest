import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Mission } from '../entity/mission.entity';

@Injectable()
export class MissionRepository extends Repository<Mission> {
  constructor(private dataSource: DataSource) {
    super(Mission, dataSource.createEntityManager());
  }

  async findById(id: number): Promise<Mission | null> {
    return this.findOne({ where: { id } });
  }
}
