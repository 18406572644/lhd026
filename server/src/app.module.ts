import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengesModule } from './challenges/challenges.module';
import { RecordsModule } from './records/records.module';
import { SubTasksModule } from './subtasks/subtasks.module';
import { Challenge } from './challenges/entities/challenge.entity';
import { ChallengeRecord } from './records/entities/challenge-record.entity';
import { SubTask } from './subtasks/entities/subtask.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_NAME', 'challenge_tracker'),
        entities: [Challenge, ChallengeRecord, SubTask],
        synchronize: true,
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    ChallengesModule,
    RecordsModule,
    SubTasksModule,
  ],
})
export class AppModule {}
