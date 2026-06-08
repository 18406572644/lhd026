import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordsService } from './records.service';
import { RecordsController } from './records.controller';
import { ChallengeRecord } from './entities/challenge-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChallengeRecord])],
  controllers: [RecordsController],
  providers: [RecordsService],
  exports: [RecordsService],
})
export class RecordsModule {}
