import { IsString, IsOptional } from 'class-validator';

export class CompleteSubTaskDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
