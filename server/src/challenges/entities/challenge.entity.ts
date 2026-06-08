import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ChallengeRecord } from '../../records/entities/challenge-record.entity';
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ChallengeRecord, (record) => record.challenge)
  records: ChallengeRecord[];
}
