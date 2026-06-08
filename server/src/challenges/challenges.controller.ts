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
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { GetChallengesQueryDto } from './dto/get-challenges-query.dto';

@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Post()
  create(@Body() createChallengeDto: CreateChallengeDto) {
    return this.challengesService.create(createChallengeDto);
  }

  @Get()
  findAll(@Query() query: GetChallengesQueryDto) {
    return this.challengesService.findAll(query);
  }

  @Get('stats')
  getStats() {
    return this.challengesService.getStats();
  }

  @Get('random')
  getRandom(@Query() query: GetChallengesQueryDto) {
    return this.challengesService.getRandom(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.challengesService.findOne(id);
  }

  @Get(':id/share')
  share(@Param('id') id: string) {
    return this.challengesService.share(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateChallengeDto: UpdateChallengeDto,
  ) {
    return this.challengesService.update(id, updateChallengeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.challengesService.remove(id);
  }
}
