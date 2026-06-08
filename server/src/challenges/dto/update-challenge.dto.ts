import { IsEnum, IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';
import { Difficulty } from '../../common/types';

export class UpdateChallengeDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Difficulty)
  @IsOptional()
  difficulty?: Difficulty;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @IsOptional()
  points?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  overallProgress?: number;
}
