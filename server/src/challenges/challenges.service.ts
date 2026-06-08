import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge } from './entities/challenge.entity';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { GetChallengesQueryDto } from './dto/get-challenges-query.dto';
import { Difficulty } from '../common/types';
import { ChallengeRecord } from '../records/entities/challenge-record.entity';

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(Challenge)
    private challengesRepository: Repository<Challenge>,
    @InjectRepository(ChallengeRecord)
    private recordsRepository: Repository<ChallengeRecord>,
  ) {}

  create(createChallengeDto: CreateChallengeDto): Promise<Challenge> {
    const challenge = this.challengesRepository.create(createChallengeDto);
    return this.challengesRepository.save(challenge);
  }

  findAll(query: GetChallengesQueryDto): Promise<Challenge[]> {
    const where: any = {};
    if (query.difficulty) {
      where.difficulty = query.difficulty;
    }
    if (query.category) {
      where.category = query.category;
    }
    return this.challengesRepository.find({ where });
  }

  async findOne(id: string): Promise<Challenge> {
    const challenge = await this.challengesRepository.findOne({ where: { id } });
    if (!challenge) {
      throw new NotFoundException(`Challenge with ID ${id} not found`);
    }
    return challenge;
  }

  async update(
    id: string,
    updateChallengeDto: UpdateChallengeDto,
  ): Promise<Challenge> {
    const challenge = await this.findOne(id);
    Object.assign(challenge, updateChallengeDto);
    return this.challengesRepository.save(challenge);
  }

  async remove(id: string): Promise<void> {
    const result = await this.challengesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Challenge with ID ${id} not found`);
    }
  }

  async getRandom(query: GetChallengesQueryDto): Promise<Challenge> {
    const where: any = {};
    if (query.difficulty) {
      where.difficulty = query.difficulty;
    }
    if (query.category) {
      where.category = query.category;
    }

    const challenges = await this.challengesRepository.find({ where });
    if (challenges.length === 0) {
      throw new NotFoundException('No challenges found matching criteria');
    }

    const randomIndex = Math.floor(Math.random() * challenges.length);
    return challenges[randomIndex];
  }

  async getStats(): Promise<any> {
    const totalChallenges = await this.challengesRepository.count();
    const totalRecords = await this.recordsRepository.count();
    const totalPoints = await this.challengesRepository.sum('points');
    const earnedPoints = await this.recordsRepository
      .createQueryBuilder('record')
      .leftJoin('record.challenge', 'challenge')
      .select('SUM(challenge.points)', 'total')
      .getRawOne();

    const difficultyStats = await this.challengesRepository
      .createQueryBuilder('challenge')
      .select('challenge.difficulty', 'difficulty')
      .addSelect('COUNT(*)', 'count')
      .groupBy('challenge.difficulty')
      .getRawMany();

    const categoryStats = await this.challengesRepository
      .createQueryBuilder('challenge')
      .select('challenge.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('challenge.category')
      .getRawMany();

    const completionByDifficulty = await this.recordsRepository
      .createQueryBuilder('record')
      .leftJoin('record.challenge', 'challenge')
      .select('challenge.difficulty', 'difficulty')
      .addSelect('COUNT(*)', 'completed')
      .groupBy('challenge.difficulty')
      .getRawMany();

    const last7Days = await this.recordsRepository
      .createQueryBuilder('record')
      .select("DATE_TRUNC('day', record.completedAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where("record.completedAt >= NOW() - INTERVAL '7 days'")
      .groupBy("DATE_TRUNC('day', record.completedAt)")
      .orderBy('date', 'ASC')
      .getRawMany();

    const streakResult = await this.recordsRepository
      .createQueryBuilder('record')
      .select('DATE(DISTINCT record.completedAt)', 'date')
      .orderBy('date', 'DESC')
      .getRawMany();

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < streakResult.length; i++) {
      const recordDate = new Date(streakResult[i].date);
      recordDate.setHours(0, 0, 0, 0);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);

      if (recordDate.getTime() === expectedDate.getTime()) {
        currentStreak++;
      } else if (i === 0 && recordDate.getTime() < expectedDate.getTime()) {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        if (recordDate.getTime() === yesterday.getTime()) {
          currentStreak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return {
      totalChallenges,
      totalCompleted: totalRecords,
      totalPoints: totalPoints || 0,
      earnedPoints: earnedPoints?.total || 0,
      completionRate: totalChallenges > 0 ? Math.round((totalRecords / totalChallenges) * 100) : 0,
      currentStreak,
      difficultyBreakdown: difficultyStats,
      categoryBreakdown: categoryStats,
      completionByDifficulty,
      last7DaysTrend: last7Days,
    };
  }

  async share(id: string): Promise<any> {
    const challenge = await this.findOne(id);
    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/challenge/${id}`;
    const shareText = `🎯 挑战: ${challenge.title}\n📝 ${challenge.description}\n⚡ 难度: ${challenge.difficulty} | 🏆 ${challenge.points}积分\n\n来挑战一下吧！${shareUrl}`;

    return {
      challenge,
      shareUrl,
      shareText,
      shareData: {
        title: `挑战: ${challenge.title}`,
        text: shareText,
        url: shareUrl,
      },
    };
  }
}
