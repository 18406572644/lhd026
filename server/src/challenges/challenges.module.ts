import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengesService } from './challenges.service';
import { ChallengesController } from './challenges.controller';
import { Challenge } from './entities/challenge.entity';
import { ChallengeRecord } from '../records/entities/challenge-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Challenge, ChallengeRecord])],
  controllers: [ChallengesController],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {}
