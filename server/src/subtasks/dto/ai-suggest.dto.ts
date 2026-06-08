import { IsString } from 'class-validator';

export class AiSuggestDto {
  @IsString()
  challengeDescription: string;
}
