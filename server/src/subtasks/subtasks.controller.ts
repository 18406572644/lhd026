import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SubTasksService } from './subtasks.service';
import { CreateSubTaskDto } from './dto/create-subtask.dto';
import { UpdateSubTaskDto } from './dto/update-subtask.dto';
import { CompleteSubTaskDto } from './dto/complete-subtask.dto';
import { AiSuggestDto } from './dto/ai-suggest.dto';

@Controller('subtasks')
export class SubTasksController {
  constructor(private readonly subTasksService: SubTasksService) {}

  @Post()
  create(@Body() createSubTaskDto: CreateSubTaskDto) {
    return this.subTasksService.create(createSubTaskDto);
  }

  @Get('challenge/:challengeId')
  findByChallenge(@Param('challengeId') challengeId: string) {
    return this.subTasksService.findByChallenge(challengeId);
  }

  @Get('challenge/:challengeId/gantt')
  getGanttData(@Param('challengeId') challengeId: string) {
    return this.subTasksService.getGanttData(challengeId);
  }

  @Get('challenge/:challengeId/progress')
  getProgress(@Param('challengeId') challengeId: string) {
    return this.subTasksService.getProgress(challengeId);
  }

  @Post('ai-suggest')
  aiSuggest(@Body() aiSuggestDto: AiSuggestDto) {
    return this.subTasksService.aiSuggest(aiSuggestDto);
  }

  @Get('delayed')
  getDelayedTasks() {
    return this.subTasksService.getDelayedTasks();
  }

  @Get('upcoming')
  getUpcomingDeadlines(@Query('days') days: number = 3) {
    return this.subTasksService.getUpcomingDeadlines(days);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subTasksService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSubTaskDto: UpdateSubTaskDto) {
    return this.subTasksService.update(id, updateSubTaskDto);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @Body() completeDto: CompleteSubTaskDto) {
    return this.subTasksService.complete(id, completeDto);
  }

  @Post('challenge/:challengeId/reorder')
  reorder(
    @Param('challengeId') challengeId: string,
    @Body() body: { reorderedIds: string[] },
  ) {
    return this.subTasksService.reorder(challengeId, body.reorderedIds);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.subTasksService.remove(id);
  }
}
