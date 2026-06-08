import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CompleteChallengeDto {
  @IsUUID()
  @IsNotEmpty()
  challengeId: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsNumber()
  @IsOptional()
  durationMinutes?: number;
}
