import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Challenge } from '../../challenges/entities/challenge.entity';

export enum SubTaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DELAYED = 'delayed',
}

@Entity('subtasks')
export class SubTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: SubTaskStatus,
    default: SubTaskStatus.PENDING,
  })
  status: SubTaskStatus;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column('text', { nullable: true })
  notes: string;

  @Column({ default: 0 })
  progress: number;

  @ManyToOne(() => Challenge, (challenge) => challenge.subTasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  challenge: Challenge;

  @Column()
  challengeId: string;

  @ManyToMany(() => SubTask, { nullable: true })
  @JoinTable({
    name: 'subtask_dependencies',
    joinColumn: { name: 'subtaskId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'dependencyId', referencedColumnName: 'id' },
  })
  dependencies: SubTask[];

  @Column('simple-array', { nullable: true })
  dependencyIds: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
