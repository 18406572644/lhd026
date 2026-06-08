import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Challenge } from '../../challenges/entities/challenge.entity';

@Entity('challenge_records')
export class ChallengeRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  challengeId: string;

  @ManyToOne(() => Challenge, (challenge) => challenge.records, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'challengeId' })
  challenge: Challenge;

  @CreateDateColumn()
  completedAt: Date;

  @Column('text', { nullable: true })
  note: string;

  @Column({ nullable: true })
  durationMinutes: number;
}
