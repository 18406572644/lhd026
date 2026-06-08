import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RecordsService } from './records.service';
import { CompleteChallengeDto } from './dto/complete-challenge.dto';

@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post()
  create(@Body() completeChallengeDto: CompleteChallengeDto) {
    return this.recordsService.create(completeChallengeDto);
  }

  @Get()
  findAll() {
    return this.recordsService.findAll();
  }

  @Get('challenge/:challengeId')
  findByChallengeId(@Param('challengeId') challengeId: string) {
    return this.recordsService.findByChallengeId(challengeId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.recordsService.remove(id);
  }
}
