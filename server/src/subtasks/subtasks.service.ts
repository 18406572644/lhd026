import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubTask, SubTaskStatus } from './entities/subtask.entity';
import { Challenge } from '../challenges/entities/challenge.entity';
import { CreateSubTaskDto } from './dto/create-subtask.dto';
import { UpdateSubTaskDto } from './dto/update-subtask.dto';
import { CompleteSubTaskDto } from './dto/complete-subtask.dto';
import { AiSuggestDto } from './dto/ai-suggest.dto';

@Injectable()
export class SubTasksService {
  constructor(
    @InjectRepository(SubTask)
    private subTasksRepository: Repository<SubTask>,
    @InjectRepository(Challenge)
    private challengesRepository: Repository<Challenge>,
  ) {}

  async create(createSubTaskDto: CreateSubTaskDto): Promise<SubTask> {
    const challenge = await this.challengesRepository.findOne({
      where: { id: createSubTaskDto.challengeId },
    });
    if (!challenge) {
      throw new NotFoundException(`Challenge with ID ${createSubTaskDto.challengeId} not found`);
    }

    if (createSubTaskDto.dependencyIds && createSubTaskDto.dependencyIds.length > 0) {
      await this.validateDependencies(createSubTaskDto.challengeId, createSubTaskDto.dependencyIds);
    }

    if (createSubTaskDto.order === undefined) {
      const maxOrder = await this.subTasksRepository
        .createQueryBuilder('subtask')
        .select('MAX(subtask.order)', 'max')
        .where('subtask.challengeId = :challengeId', { challengeId: createSubTaskDto.challengeId })
        .getRawOne();
      createSubTaskDto.order = (maxOrder?.max || 0) + 1;
    }

    const subTask = this.subTasksRepository.create({
      ...createSubTaskDto,
      dependencies: createSubTaskDto.dependencyIds?.length
        ? await this.subTasksRepository.findByIds(createSubTaskDto.dependencyIds)
        : [],
    });

    const saved = await this.subTasksRepository.save(subTask);
    await this.updateChallengeProgress(createSubTaskDto.challengeId);
    return saved;
  }

  async findByChallenge(challengeId: string): Promise<SubTask[]> {
    const challenge = await this.challengesRepository.findOne({
      where: { id: challengeId },
    });
    if (!challenge) {
      throw new NotFoundException(`Challenge with ID ${challengeId} not found`);
    }

    return this.subTasksRepository.find({
      where: { challengeId },
      relations: ['dependencies'],
      order: { order: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<SubTask> {
    const subTask = await this.subTasksRepository.findOne({
      where: { id },
      relations: ['dependencies'],
    });
    if (!subTask) {
      throw new NotFoundException(`SubTask with ID ${id} not found`);
    }
    return subTask;
  }

  async update(id: string, updateSubTaskDto: UpdateSubTaskDto): Promise<SubTask> {
    const subTask = await this.findOne(id);

    if (updateSubTaskDto.dependencyIds && updateSubTaskDto.dependencyIds.length > 0) {
      if (updateSubTaskDto.dependencyIds.includes(id)) {
        throw new BadRequestException('A subtask cannot depend on itself');
      }
      await this.validateDependencies(subTask.challengeId, updateSubTaskDto.dependencyIds, id);
    }

    if (updateSubTaskDto.dependencyIds !== undefined) {
      subTask.dependencies = updateSubTaskDto.dependencyIds.length
        ? await this.subTasksRepository.findByIds(updateSubTaskDto.dependencyIds)
        : [];
    }

    Object.assign(subTask, updateSubTaskDto);
    const updated = await this.subTasksRepository.save(subTask);
    await this.updateChallengeProgress(subTask.challengeId);
    return updated;
  }

  async complete(id: string, completeDto: CompleteSubTaskDto): Promise<SubTask> {
    const subTask = await this.findOne(id);

    if (subTask.dependencies && subTask.dependencies.length > 0) {
      const incompleteDeps = subTask.dependencies.filter(
        (dep) => dep.status !== SubTaskStatus.COMPLETED
      );
      if (incompleteDeps.length > 0) {
        throw new BadRequestException(
          `Cannot complete this task. Dependencies not completed: ${incompleteDeps.map(d => d.title).join(', ')}`
        );
      }
    }

    subTask.status = SubTaskStatus.COMPLETED;
    subTask.progress = 100;
    subTask.completedAt = new Date();
    if (completeDto.notes) {
      subTask.notes = completeDto.notes;
    }

    const updated = await this.subTasksRepository.save(subTask);
    await this.updateChallengeProgress(subTask.challengeId);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const subTask = await this.findOne(id);
    const challengeId = subTask.challengeId;

    const dependents = await this.subTasksRepository
      .createQueryBuilder('subtask')
      .leftJoinAndSelect('subtask.dependencies', 'dep')
      .where('dep.id = :id', { id })
      .getMany();

    for (const dependent of dependents) {
      dependent.dependencies = dependent.dependencies.filter(d => d.id !== id);
      dependent.dependencyIds = dependent.dependencyIds?.filter(depId => depId !== id) || [];
      await this.subTasksRepository.save(dependent);
    }

    await this.subTasksRepository.delete(id);
    await this.updateChallengeProgress(challengeId);
  }

  async getProgress(challengeId: string): Promise<number> {
    const subTasks = await this.subTasksRepository.find({
      where: { challengeId },
    });

    if (subTasks.length === 0) return 0;

    const totalProgress = subTasks.reduce((sum, st) => sum + st.progress, 0);
    return Math.round(totalProgress / subTasks.length);
  }

  private async updateChallengeProgress(challengeId: string): Promise<void> {
    const progress = await this.getProgress(challengeId);
    await this.challengesRepository.update(challengeId, { overallProgress: progress });
  }

  private async validateDependencies(
    challengeId: string,
    dependencyIds: string[],
    currentSubTaskId?: string
  ): Promise<void> {
    const dependencies = await this.subTasksRepository.findByIds(dependencyIds);

    if (dependencies.length !== dependencyIds.length) {
      throw new NotFoundException('One or more dependencies not found');
    }

    for (const dep of dependencies) {
      if (dep.challengeId !== challengeId) {
        throw new BadRequestException('Dependencies must belong to the same challenge');
      }
    }

    if (currentSubTaskId) {
      for (const dep of dependencies) {
        if (await this.dependsOn(dep.id, currentSubTaskId)) {
          throw new BadRequestException('Circular dependency detected');
        }
      }
    }
  }

  private async dependsOn(subTaskId: string, targetId: string, visited: Set<string> = new Set()): Promise<boolean> {
    if (subTaskId === targetId) return true;
    if (visited.has(subTaskId)) return false;
    visited.add(subTaskId);

    const subTask = await this.subTasksRepository.findOne({
      where: { id: subTaskId },
      relations: ['dependencies'],
    });

    if (!subTask || !subTask.dependencies) return false;

    for (const dep of subTask.dependencies) {
      if (await this.dependsOn(dep.id, targetId, visited)) {
        return true;
      }
    }

    return false;
  }

  async getGanttData(challengeId: string): Promise<any> {
    const subTasks = await this.findByChallenge(challengeId);
    const challenge = await this.challengesRepository.findOne({
      where: { id: challengeId },
    });

    return {
      challenge,
      subTasks: subTasks.map(st => ({
        id: st.id,
        title: st.title,
        description: st.description,
        status: st.status,
        progress: st.progress,
        order: st.order,
        startDate: st.startDate,
        endDate: st.endDate,
        completedAt: st.completedAt,
        dependencyIds: st.dependencyIds || [],
        dependencies: st.dependencies?.map(d => ({ id: d.id, title: d.title })) || [],
      })),
    };
  }

  async aiSuggest(aiSuggestDto: AiSuggestDto): Promise<any> {
    const description = aiSuggestDto.challengeDescription.toLowerCase();
    const suggestions = this.generateSubTasks(description);
    return { suggestions };
  }

  private generateSubTasks(description: string): Array<{
    title: string;
    description: string;
    order: number;
    estimatedDays: number;
    dependencies: number[];
  }> {
    const tasks: Array<{
      title: string;
      description: string;
      order: number;
      estimatedDays: number;
      dependencies: number[];
    }> = [];

    const keywordTasks: Record<string, Array<{ title: string; description: string; estimatedDays: number }>> = {
      '学习': [
        { title: '制定学习计划', description: '根据目标制定详细的学习路线图和时间表', estimatedDays: 1 },
        { title: '收集学习资料', description: '收集相关的书籍、视频、文档等学习资源', estimatedDays: 2 },
        { title: '基础知识学习', description: '系统学习基础知识，建立概念框架', estimatedDays: 7 },
        { title: '实践练习', description: '通过实际操作巩固所学知识', estimatedDays: 10 },
        { title: '项目实战', description: '完成一个综合性项目，检验学习成果', estimatedDays: 14 },
        { title: '总结复盘', description: '总结学习过程，整理笔记，形成知识体系', estimatedDays: 3 },
      ],
      '开发': [
        { title: '需求分析与设计', description: '明确需求，设计系统架构和数据模型', estimatedDays: 3 },
        { title: '环境搭建', description: '搭建开发环境，配置必要的工具和依赖', estimatedDays: 1 },
        { title: '核心功能开发', description: '实现系统的核心功能模块', estimatedDays: 14 },
        { title: '接口对接', description: '完成前后端接口联调和第三方服务集成', estimatedDays: 5 },
        { title: '测试与修复', description: '进行功能测试、性能测试，修复发现的问题', estimatedDays: 5 },
        { title: '部署上线', description: '部署到生产环境，进行上线验证', estimatedDays: 2 },
      ],
      '健身': [
        { title: '体能评估', description: '进行全面的体能测试，了解当前状态', estimatedDays: 1 },
        { title: '制定训练计划', description: '根据目标和评估结果制定训练方案', estimatedDays: 1 },
        { title: '建立运动习惯', description: '从基础开始，逐步建立规律的运动习惯', estimatedDays: 14 },
        { title: '强度提升训练', description: '逐步增加训练强度和难度', estimatedDays: 21 },
        { title: '饮食调整', description: '配合训练调整饮食结构，保证营养摄入', estimatedDays: 7 },
        { title: '效果评估与调整', description: '评估训练效果，调整训练计划', estimatedDays: 2 },
      ],
      '写作': [
        { title: '确定主题与大纲', description: '明确写作主题，搭建文章结构框架', estimatedDays: 2 },
        { title: '资料收集与研究', description: '收集相关资料，进行必要的研究', estimatedDays: 3 },
        { title: '初稿撰写', description: '完成初稿，重点关注内容完整性', estimatedDays: 7 },
        { title: '修改润色', description: '反复修改，优化表达和逻辑', estimatedDays: 5 },
        { title: '审阅反馈', description: '获取他人反馈，进一步完善', estimatedDays: 3 },
        { title: '最终定稿', description: '完成最终版本，准备发布', estimatedDays: 1 },
      ],
      '旅行': [
        { title: '确定目的地与时间', description: '选择旅行目的地，确定出行时间', estimatedDays: 1 },
        { title: '行程规划', description: '设计详细的旅行路线和每日安排', estimatedDays: 3 },
        { title: '预订交通住宿', description: '预订机票、酒店、当地交通', estimatedDays: 2 },
        { title: '准备物品', description: '整理行李，准备旅行必备物品', estimatedDays: 1 },
        { title: '执行旅行计划', description: '按照计划享受旅行', estimatedDays: 7 },
        { title: '旅行回顾', description: '整理照片，记录旅行心得', estimatedDays: 2 },
      ],
    };

    let matchedTasks: Array<{ title: string; description: string; estimatedDays: number }> = [];

    for (const [keyword, taskList] of Object.entries(keywordTasks)) {
      if (description.includes(keyword)) {
        matchedTasks = taskList;
        break;
      }
    }

    if (matchedTasks.length === 0) {
      matchedTasks = [
        { title: '明确目标与范围', description: '清晰定义挑战目标、验收标准和时间范围', estimatedDays: 1 },
        { title: '制定详细计划', description: '分解任务，制定详细的执行计划和时间表', estimatedDays: 2 },
        { title: '准备阶段', description: '收集必要的资源、工具和信息', estimatedDays: 2 },
        { title: '核心执行', description: '按照计划推进核心任务的执行', estimatedDays: 14 },
        { title: '检查与调整', description: '定期检查进度，根据实际情况调整计划', estimatedDays: 3 },
        { title: '总结与交付', description: '完成最终交付，总结经验教训', estimatedDays: 2 },
      ];
    }

    const today = new Date();
    let currentDate = new Date(today);

    matchedTasks.forEach((task, index) => {
      const startDate = new Date(currentDate);
      const endDate = new Date(currentDate);
      endDate.setDate(endDate.getDate() + task.estimatedDays - 1);

      tasks.push({
        title: task.title,
        description: task.description,
        order: index + 1,
        estimatedDays: task.estimatedDays,
        dependencies: index > 0 ? [index] : [],
      });

      currentDate.setDate(currentDate.getDate() + task.estimatedDays);
    });

    return tasks;
  }

  async getDelayedTasks(): Promise<SubTask[]> {
    const now = new Date();
    return this.subTasksRepository
      .createQueryBuilder('subtask')
      .leftJoinAndSelect('subtask.challenge', 'challenge')
      .where('subtask.status != :status', { status: SubTaskStatus.COMPLETED })
      .andWhere('subtask.endDate IS NOT NULL')
      .andWhere('subtask.endDate < :now', { now })
      .getMany();
  }

  async getUpcomingDeadlines(days: number = 3): Promise<SubTask[]> {
    const now = new Date();
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + days);

    return this.subTasksRepository
      .createQueryBuilder('subtask')
      .leftJoinAndSelect('subtask.challenge', 'challenge')
      .where('subtask.status != :status', { status: SubTaskStatus.COMPLETED })
      .andWhere('subtask.endDate IS NOT NULL')
      .andWhere('subtask.endDate BETWEEN :now AND :deadline', { now, deadline })
      .getMany();
  }

  async reorder(challengeId: string, reorderedIds: string[]): Promise<SubTask[]> {
    const subTasks = await this.findByChallenge(challengeId);
    
    if (subTasks.length !== reorderedIds.length) {
      throw new BadRequestException('Reorder list must contain all subtasks');
    }

    const existingIds = subTasks.map(st => st.id);
    for (const id of reorderedIds) {
      if (!existingIds.includes(id)) {
        throw new BadRequestException(`SubTask ${id} does not belong to this challenge`);
      }
    }

    const updated: SubTask[] = [];
    for (let i = 0; i < reorderedIds.length; i++) {
      const subTask = subTasks.find(st => st.id === reorderedIds[i])!;
      subTask.order = i + 1;
      updated.push(await this.subTasksRepository.save(subTask));
    }

    return updated;
  }
}
