import { PartialType } from '@nestjs/mapped-types';
import { CreateSubTaskDto } from './create-subtask.dto';
import { IsOptional, IsInt, Min, Max } from 'class-validator';

export class UpdateSubTaskDto extends PartialType(CreateSubTaskDto) {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;
}
