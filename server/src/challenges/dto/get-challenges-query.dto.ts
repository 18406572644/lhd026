import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Difficulty } from '../../common/types';

export class GetChallengesQueryDto {
  @IsEnum(Difficulty)
  @IsOptional()
  difficulty?: Difficulty;

  @IsString()
  @IsOptional()
  category?: string;
}
