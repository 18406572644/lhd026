import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ChallengeRecord } from '../../records/entities/challenge-record.entity';
import { SubTask } from '../../subtasks/entities/subtask.entity';
import { Difficulty } from '../../common/types';

@Entity('challenges')
export class Challenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: Difficulty,
    default: Difficulty.MEDIUM,
  })
  difficulty: Difficulty;

  @Column()
  category: string;

  @Column({ default: 0 })
  points: number;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ default: 0 })
  overallProgress: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ChallengeRecord, (record) => record.challenge)
  records: ChallengeRecord[];

  @OneToMany(() => SubTask, (subTask) => subTask.challenge)
  subTasks: SubTask[];
}
