<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">📚 挑战库管理</h1>
      <el-button type="primary" size="large" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加挑战
      </el-button>
    </div>

    <div class="filter-section card">
      <div class="filter-row">
        <label>难度筛选：</label>
        <el-radio-group v-model="filterDifficulty">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="easy">简单</el-radio-button>
          <el-radio-button value="medium">中等</el-radio-button>
          <el-radio-button value="hard">困难</el-radio-button>
          <el-radio-button value="expert">专家</el-radio-button>
        </el-radio-group>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索挑战标题..."
          style="width: 240px; margin-left: auto"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <div class="challenges-stats">
      <div
        v-for="(item, index) in difficultyStats"
        :key="index"
        class="difficulty-stat"
        :class="{ active: filterDifficulty === item.value }"
        @click="filterDifficulty = item.value"
      >
        <div class="stat-label">{{ item.label }}</div>
        <div class="stat-count">{{ item.count }}</div>
      </div>
    </div>

    <div v-if="loading" class="loading-state card">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <p>加载中...</p>
    </div>

    <div v-else-if="filteredChallenges.length === 0" class="empty-state card">
      <div class="empty-icon">📭</div>
      <p class="empty-text">
        {{ searchKeyword ? '没有找到匹配的挑战' : '暂无挑战，点击上方按钮添加吧！' }}
      </p>
    </div>

    <div v-else class="challenges-grid">
      <ChallengeCard
        v-for="challenge in filteredChallenges"
        :key="challenge.id"
        :challenge="challenge"
        :show-actions="true"
        @complete="handleComplete"
        @view="handleView"
        @edit="handleEdit"
        @delete="handleDelete"
        @share="handleShare"
      />
    </div>

    <AddChallengeModal
      v-model="showAddModal"
      :challenge="editingChallenge"
      @submit="handleSubmit"
    />

    <CompleteModal
      v-model="showCompleteModal"
      :challenge="completingChallenge"
      @submit="handleCompleteSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Loading } from '@element-plus/icons-vue'
import type { Difficulty, Challenge } from '~/stores/challenge'

const challengeStore = useChallengeStore()
const recordStore = useRecordStore()
const { challenges, loading } = storeToRefs(challengeStore)

const filterDifficulty = ref<Difficulty | ''>('')
const searchKeyword = ref('')
const showAddModal = ref(false)
const editingChallenge = ref<Challenge | null>(null)
const showCompleteModal = ref(false)
const completingChallenge = ref<Challenge | null>(null)

onMounted(async () => {
  await challengeStore.fetchChallenges()
  await recordStore.fetchRecords()
})

const filteredChallenges = computed(() => {
  let list = challenges.value

  if (filterDifficulty.value) {
    list = list.filter(c => c.difficulty === filterDifficulty.value)
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(c =>
      c.title.toLowerCase().includes(keyword) ||
      c.description.toLowerCase().includes(keyword) ||
      c.category.toLowerCase().includes(keyword)
    )
  }

  return list
})

const difficultyStats = computed(() => {
  const stats = challengeStore.getStats.byDifficulty
  return [
    { label: '简单', value: 'easy' as Difficulty, count: stats.easy },
    { label: '中等', value: 'medium' as Difficulty, count: stats.medium },
    { label: '困难', value: 'hard' as Difficulty, count: stats.hard },
    { label: '专家', value: 'expert' as Difficulty, count: stats.expert }
  ]
})

const handleAdd = () => {
  editingChallenge.value = null
  showAddModal.value = true
}

const handleView = (challenge: Challenge) => {
  navigateTo(`/challenges/${challenge.id}`)
}

const handleEdit = (challenge: Challenge) => {
  editingChallenge.value = challenge
  showAddModal.value = true
}

const handleSubmit = async (data: Omit<Challenge, 'id' | 'createdAt' | 'updatedAt'>) => {
  if (editingChallenge.value) {
    await challengeStore.updateChallenge(editingChallenge.value.id, data)
    ElMessage.success('✅ 挑战更新成功！')
  } else {
    await challengeStore.addChallenge(data)
    ElMessage.success('✅ 挑战添加成功！')
  }
  editingChallenge.value = null
  showAddModal.value = false
  await challengeStore.fetchChallenges()
}

const handleDelete = async (challenge: Challenge) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除挑战「${challenge.title}」吗？`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await challengeStore.deleteChallenge(challenge.id)
    ElMessage.success('🗑️ 挑战删除成功！')
  } catch {
  }
}

const handleComplete = (challenge: Challenge) => {
  completingChallenge.value = challenge
  showCompleteModal.value = true
}

const handleCompleteSubmit = async (data: { note: string; durationMinutes: number; challenge: Challenge }) => {
  await recordStore.addRecord({
    challengeId: data.challenge.id,
    note: data.note,
    durationMinutes: data.durationMinutes
  })
  ElMessage.success('🎉 恭喜完成挑战！积分已记录')
  completingChallenge.value = null
}

const handleShare = async (challenge: Challenge) => {
  const shareData = await challengeStore.shareChallenge(challenge.id)
  if (shareData) {
    if (navigator.share) {
      navigator.share(shareData.shareData).catch(() => {
        copyToClipboard(shareData.shareText)
      })
    } else {
      copyToClipboard(shareData.shareText)
    }
  }
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('📋 分享内容已复制到剪贴板')
  }).catch(() => {
    ElMessage.info(text)
  })
}
</script>

<style lang="scss" scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  margin: 0;
}

.filter-section {
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 16px;

  label {
    font-weight: 600;
    color: #303133;
    min-width: 80px;
  }
}

.challenges-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.difficulty-stat {
  background: $card-bg;
  border-radius: $border-radius-md;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: $shadow-sm;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-4px);
    box-shadow: $shadow-md;
  }

  &.active {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.stat-count {
  font-size: 32px;
  font-weight: 700;
  background: $primary-gradient;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.challenges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

.empty-state,
.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon,
.loading-icon {
  font-size: 80px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-text {
  color: #909399;
  font-size: 16px;
}

@media (max-width: 768px) {
  .filter-row {
    flex-wrap: wrap;
  }

  .challenges-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .challenges-grid {
    grid-template-columns: 1fr;
  }
}
</style>
