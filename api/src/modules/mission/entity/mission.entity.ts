import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('missions')
export class Mission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  title: string;

  @Column('text')
  briefing: string;

  @Column({ length: 20 })
  difficulty: string;

  @Column({ name: 'sql_setup', type: 'text' })
  sqlSetup: string;

  @Column({ name: 'sql_validation', type: 'text' })
  sqlValidation: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
