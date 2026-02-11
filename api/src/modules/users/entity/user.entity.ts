import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { MissionProgress } from './mission-progress.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false }) // Senha nunca retorna nas consultas
  password: string;

  @Column()
  nickname: string;

  @Column({ default: 0 })
  totalXp: number;

  @OneToMany(() => MissionProgress, (progress) => progress.user)
  progress: MissionProgress[];

  @CreateDateColumn()
  createdAt: Date;
}
