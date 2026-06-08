import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChallengeRecord } from './entities/challenge-record.entity';
import { CompleteChallengeDto } from './dto/complete-challenge.dto';

@Injectable()
export class RecordsService {
  constructor(
    @InjectRepository(ChallengeRecord)
    private recordsRepository: Repository<ChallengeRecord>,
  ) {}

  create(completeChallengeDto: CompleteChallengeDto): Promise<ChallengeRecord> {
    const record = this.recordsRepository.create(completeChallengeDto);
    return this.recordsRepository.save(record);
  }

  findAll(): Promise<ChallengeRecord[]> {
    return this.recordsRepository.find({
      relations: ['challenge'],
      order: { completedAt: 'DESC' },
    });
  }

  findByChallengeId(challengeId: string): Promise<ChallengeRecord[]> {
    return this.recordsRepository.find({
      where: { challengeId },
      relations: ['challenge'],
      order: { completedAt: 'DESC' },
    });
  }

  async remove(id: string): Promise<void> {
    const result = await this.recordsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Record with ID ${id} not found`);
    }
  }
}
