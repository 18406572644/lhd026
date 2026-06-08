import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { Challenge } from './challenges/entities/challenge.entity';
import { Difficulty } from './common/types';

config();

const configService = new ConfigService();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'postgres'),
  password: configService.get('DB_PASSWORD', 'postgres'),
  database: configService.get('DB_NAME', 'challenge_tracker'),
  entities: [Challenge],
  synchronize: true,
});

const seedChallenges = [
  {
    title: '学习 TypeScript 基础',
    description: '完成 TypeScript 官方文档的基础部分学习，掌握类型系统基本概念。',
    difficulty: Difficulty.EASY,
    category: '学习',
    points: 10,
  },
  {
    title: '完成一个 React 组件',
    description: '创建一个可复用的 React 组件，包含完整的单元测试。',
    difficulty: Difficulty.MEDIUM,
    category: '编程',
    points: 25,
  },
  {
    title: '算法题：两数之和',
    description: '在 LeetCode 上完成两数之和问题，尝试多种解法。',
    difficulty: Difficulty.EASY,
    category: '算法',
    points: 15,
  },
  {
    title: '重构遗留代码',
    description: '对项目中的遗留代码进行重构，提高代码质量和可维护性。',
    difficulty: Difficulty.HARD,
    category: '编程',
    points: 50,
  },
  {
    title: '学习 Docker 容器化',
    description: '学习 Docker 基本概念，完成一个应用的容器化部署。',
    difficulty: Difficulty.MEDIUM,
    category: 'DevOps',
    points: 30,
  },
  {
    title: '系统设计：电商平台',
    description: '设计一个高并发电商平台的后端架构，考虑扩展性和可靠性。',
    difficulty: Difficulty.EXPERT,
    category: '系统设计',
    points: 100,
  },
  {
    title: '每日晨跑 5 公里',
    description: '坚持每天早上跑步 5 公里，保持健康的生活习惯。',
    difficulty: Difficulty.MEDIUM,
    category: '健康',
    points: 20,
  },
  {
    title: '阅读技术书籍一章',
    description: '每天阅读技术书籍的一章内容，并做读书笔记。',
    difficulty: Difficulty.EASY,
    category: '学习',
    points: 10,
  },
  {
    title: '完成一个完整的项目',
    description: '从零开始完成一个完整的全栈项目，包含前后端和部署。',
    difficulty: Difficulty.EXPERT,
    category: '编程',
    points: 150,
  },
  {
    title: '学习 GraphQL',
    description: '学习 GraphQL 基本概念，实现一个简单的 GraphQL API。',
    difficulty: Difficulty.MEDIUM,
    category: '学习',
    points: 35,
  },
  {
    title: '性能优化实践',
    description: '对现有应用进行性能优化，提升页面加载速度 50%。',
    difficulty: Difficulty.HARD,
    category: '性能',
    points: 60,
  },
  {
    title: '学习 Kubernetes',
    description: '学习 Kubernetes 基本概念，完成一个应用的集群部署。',
    difficulty: Difficulty.HARD,
    category: 'DevOps',
    points: 70,
  },
];

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    const challengeRepository = AppDataSource.getRepository(Challenge);

    const existingCount = await challengeRepository.count();
    if (existingCount > 0) {
      console.log(`Database already has ${existingCount} challenges. Skipping seed.`);
      await AppDataSource.destroy();
      return;
    }

    for (const challengeData of seedChallenges) {
      const challenge = challengeRepository.create(challengeData);
      await challengeRepository.save(challenge);
      console.log(`Created: ${challenge.title}`);
    }

    console.log(`Successfully seeded ${seedChallenges.length} challenges!`);
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
