import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { MissionProgress } from './entity/mission-progress.entity';
import { UsersRepository } from './repository/user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User, MissionProgress])],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
