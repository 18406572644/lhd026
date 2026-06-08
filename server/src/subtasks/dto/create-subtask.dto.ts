import { IsString, IsOptional, IsInt, IsEnum, IsDateString, IsArray, ArrayUnique } from 'class-validator';
import { SubTaskStatus } from '../entities/subtask.entity';

export class CreateSubTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(SubTaskStatus)
  status?: SubTaskStatus;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  challengeId: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  dependencyIds?: string[];
}
