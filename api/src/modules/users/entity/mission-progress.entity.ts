import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('mission_progress')
@Unique(['user', 'missionId']) // Um usuário só completa a missão uma vez
export class MissionProgress {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index() // Index para buscar rápido por missão
  missionId: number;

  @ManyToOne(() => User, (user) => user.progress, { onDelete: 'CASCADE' })
  user: User;

  @Column({ default: 'COMPLETED' })
  status: string;

  @Column()
  earnedXp: number;

  @CreateDateColumn()
  completedAt: Date;
}
