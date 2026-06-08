<template>
  <div class="page-container">
    <h1 class="page-title">📊 数据统计</h1>

    <div v-if="loading" class="loading-state card">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <p>加载中...</p>
    </div>

    <template v-else>
      <div class="overview-cards">
        <div class="overview-card">
          <div class="card-icon">📚</div>
          <div class="card-content">
            <div class="card-value">{{ challengeStore.getStats.total }}</div>
            <div class="card-label">挑战总数</div>
          </div>
        </div>
        <div class="overview-card">
          <div class="card-icon">✅</div>
          <div class="card-content">
            <div class="card-value">{{ recordStore.getStats.total }}</div>
            <div class="card-label">已完成</div>
          </div>
        </div>
        <div class="overview-card">
          <div class="card-icon">⭐</div>
          <div class="card-content">
            <div class="card-value">{{ recordStore.getStats.totalPoints }}</div>
            <div class="card-label">累计积分</div>
          </div>
        </div>
        <div class="overview-card">
          <div class="card-icon">📈</div>
          <div class="card-content">
            <div class="card-value">{{ completionRate }}%</div>
            <div class="card-label">完成率</div>
          </div>
        </div>
      </div>

      <div v-if="challengeStore.stats" class="server-stats card">
        <h3 class="stats-subtitle">🎯 后端统计数据</h3>
        <div class="server-stats-grid">
          <div class="server-stat-item">
            <span class="stat-label">已获积分</span>
            <span class="stat-value">{{ challengeStore.stats.earnedPoints }}</span>
          </div>
          <div class="server-stat-item">
            <span class="stat-label">完成率</span>
            <span class="stat-value">{{ challengeStore.stats.completionRate }}%</span>
          </div>
          <div class="server-stat-item">
            <span class="stat-label">连续天数</span>
            <span class="stat-value">{{ challengeStore.stats.currentStreak }} 天</span>
          </div>
        </div>
      </div>

      <div class="charts-grid">
        <StatsChart
          type="pie"
          title="挑战难度分布"
          :data="challengeDifficultyData"
        />
        <StatsChart
          type="pie"
          title="完成难度分布"
          :data="recordDifficultyData"
        />
      </div>

      <div class="charts-grid">
        <StatsChart
          type="bar"
          title="各难度挑战数量"
          :data="challengeDifficultyData"
        />
        <StatsChart
          type="bar"
          title="各难度完成数量"
          :data="recordDifficultyData"
        />
      </div>

      <div class="charts-grid">
        <StatsChart
          type="line"
          title="近7天完成趋势"
          :data="last7DaysData"
        />
      </div>

      <div v-if="monthlyData.length > 0" class="charts-grid">
        <StatsChart
          type="line"
          title="月度完成统计"
          :data="monthlyData"
        />
      </div>

      <div class="category-section">
        <h2 class="section-title">📂 分类统计</h2>
        <div class="category-grid">
          <div
            v-for="(item, index) in categoryData"
            :key="index"
            class="category-card"
          >
            <div class="category-header">
              <span class="category-name">{{ item.label }}</span>
              <span class="category-count">{{ item.value }} 个挑战</span>
            </div>
            <div class="category-bar">
              <div
                class="category-fill"
                :style="{
                  width: getCategoryWidth(item.value) + '%',
                  background: getCategoryGradient(index)
                }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'

const challengeStore = useChallengeStore()
const recordStore = useRecordStore()

const loading = ref(true)

onMounted(async () => {
  await Promise.all([
    challengeStore.fetchChallenges(),
    challengeStore.fetchStats(),
    recordStore.fetchRecords()
  ])
  loading.value = false
})

const completionRate = computed(() => {
  if (challengeStore.getStats.total === 0) return 0
  return Math.round((recordStore.getStats.total / challengeStore.getStats.total) * 100)
})

const challengeDifficultyData = computed(() => {
  const stats = challengeStore.getStats.byDifficulty
  return [
    { label: '简单', value: stats.easy, color: '#67c23a' },
    { label: '中等', value: stats.medium, color: '#e6a23c' },
    { label: '困难', value: stats.hard, color: '#f56c6c' },
    { label: '专家', value: stats.expert, color: '#9b59b6' }
  ]
})

const recordDifficultyData = computed(() => {
  const stats = recordStore.getStats.byDifficulty
  return [
    { label: '简单', value: stats.easy, color: '#67c23a' },
    { label: '中等', value: stats.medium, color: '#e6a23c' },
    { label: '困难', value: stats.hard, color: '#f56c6c' },
    { label: '专家', value: stats.expert, color: '#9b59b6' }
  ]
})

const last7DaysData = computed(() => {
  return recordStore.getStats.last7Days.map(item => ({
    label: item.date.substring(5),
    value: item.count
  }))
})

const monthlyData = computed(() => {
  return recordStore.getStats.monthlyData.map(item => ({
    label: item.month,
    value: item.count
  }))
})

const categoryData = computed(() => {
  const categories = challengeStore.getStats.categories
  return categories.map(cat => ({
    label: cat,
    value: challengeStore.challenges.filter(c => c.category === cat).length
  })).sort((a, b) => b.value - a.value)
})

const maxCategoryValue = computed(() => {
  if (categoryData.value.length === 0) return 1
  return Math.max(...categoryData.value.map(d => d.value), 1)
})

const getCategoryWidth = (value: number) => {
  return (value / maxCategoryValue.value) * 100
}

const categoryColors = [
  '#667eea',
  '#f093fb',
  '#4facfe',
  '#fa709a',
  '#43e97b',
  '#fee140',
  '#30cfd0',
  '#9b59b6'
]

const getCategoryGradient = (index: number) => {
  const color = categoryColors[index % categoryColors.length]
  return `linear-gradient(90deg, ${color}99 0%, ${color} 100%)`
}
</script>

<style lang="scss" scoped>
.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.overview-card {
  background: $card-bg;
  border-radius: $border-radius-md;
  padding: 24px;
  box-shadow: $shadow-sm;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
  border-left: 4px solid #667eea;

  &:hover {
    transform: translateY(-4px);
    box-shadow: $shadow-md;
  }
}

.card-icon {
  font-size: 48px;
}

.card-value {
  font-size: 32px;
  font-weight: 700;
  background: $primary-gradient;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card-label {
  font-size: 14px;
  color: #909399;
}

.server-stats {
  margin-bottom: 24px;
  padding: 20px;
}

.stats-subtitle {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
}

.server-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.server-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-radius: $border-radius-sm;

  .stat-label {
    font-size: 13px;
    color: #909399;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: #667eea;
  }
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 32px 0 20px;
}

.category-section {
  margin-top: 8px;
}

.category-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-card {
  background: $card-bg;
  border-radius: $border-radius-md;
  padding: 20px;
  box-shadow: $shadow-sm;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: $shadow-md;
  }
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.category-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.category-count {
  font-size: 14px;
  color: #667eea;
  font-weight: 500;
}

.category-bar {
  height: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  overflow: hidden;
}

.category-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 1s ease-out;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.loading-icon {
  font-size: 80px;
  margin-bottom: 16px;
  opacity: 0.5;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .server-stats-grid {
    grid-template-columns: 1fr;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
