import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubTasksService } from './subtasks.service';
import { SubTasksController } from './subtasks.controller';
import { SubTask } from './entities/subtask.entity';
import { Challenge } from '../challenges/entities/challenge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SubTask, Challenge])],
  controllers: [SubTasksController],
  providers: [SubTasksService],
  exports: [SubTasksService],
})
export class SubTasksModule {}
