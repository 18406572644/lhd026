import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Difficulty } from '../../common/types';

export class CreateChallengeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(Difficulty)
  @IsNotEmpty()
  difficulty: Difficulty;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsNumber()
  @IsOptional()
  points?: number;
}
