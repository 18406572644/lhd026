<template>
  <div class="page-container">
    <h1 class="page-title">📋 完成记录</h1>

    <div class="records-summary card">
      <div class="summary-item">
        <div class="summary-icon">🏆</div>
        <div class="summary-info">
          <div class="summary-value">{{ recordStore.getStats.total }}</div>
          <div class="summary-label">已完成挑战</div>
        </div>
      </div>
      <div class="summary-item">
        <div class="summary-icon">⭐</div>
        <div class="summary-info">
          <div class="summary-value">{{ recordStore.getStats.totalPoints }}</div>
          <div class="summary-label">累计积分</div>
        </div>
      </div>
      <div class="summary-item">
        <div class="summary-icon">⏱️</div>
        <div class="summary-info">
          <div class="summary-value">{{ totalDuration }}</div>
          <div class="summary-label">总用时(分钟)</div>
        </div>
      </div>
      <div class="summary-item">
        <div class="summary-icon">🔥</div>
        <div class="summary-info">
          <div class="summary-value">{{ recordStore.getStats.currentStreak }}</div>
          <div class="summary-label">连续天数</div>
        </div>
      </div>
    </div>

    <div v-if="recordStore.loading" class="loading-state card">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <p>加载中...</p>
    </div>

    <div v-else-if="recordStore.records.length === 0" class="empty-state card">
      <div class="empty-icon">📝</div>
      <p class="empty-text">暂无完成记录，快去完成第一个挑战吧！</p>
      <el-button type="primary" size="large" @click="goToHome">
        去抽取挑战
      </el-button>
    </div>

    <div v-else class="records-list">
      <div
        v-for="record in recordStore.records"
        :key="record.id"
        class="record-item card"
      >
        <div class="record-header">
          <div class="record-title-section">
            <h3 class="record-title">{{ record.challenge?.title || '未知挑战' }}</h3>
            <DifficultyBadge v-if="record.challenge" :difficulty="record.challenge.difficulty" />
          </div>
          <div class="record-points">
            <span class="points-icon">+</span>
            <span class="points-value">{{ record.challenge?.points || 0 }}</span>
            <span class="points-label">积分</span>
          </div>
        </div>
        <div class="record-content">
          <div class="record-note" v-if="record.note">
            <span class="note-label">💬 心得：</span>
            <span class="note-text">{{ record.note }}</span>
          </div>
          <div class="record-duration" v-if="record.durationMinutes">
            <span class="duration-label">⏱️ 用时：</span>
            <span class="duration-text">{{ record.durationMinutes }} 分钟</span>
          </div>
        </div>
        <div class="record-footer">
          <div class="record-date">
            <el-icon><Calendar /></el-icon>
            {{ formatDate(record.completedAt) }}
          </div>
          <el-button
            type="danger"
            size="small"
            text
            @click="handleDelete(record)"
          >
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Calendar, Delete, Loading } from '@element-plus/icons-vue'
import type { ChallengeRecord } from '~/stores/record'

const recordStore = useRecordStore()
const router = useRouter()

onMounted(async () => {
  await recordStore.fetchRecords()
})

const totalDuration = computed(() => {
  return recordStore.records.reduce((sum, r) => sum + (r.durationMinutes || 0), 0)
})

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleDelete = async (record: ChallengeRecord) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除这条记录吗？`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await recordStore.deleteRecord(record.id)
    ElMessage.success('🗑️ 记录删除成功')
  } catch {
  }
}

const goToHome = () => {
  router.push('/')
}
</script>

<style lang="scss" scoped>
.records-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.summary-icon {
  font-size: 48px;
}

.summary-value {
  font-size: 28px;
  font-weight: 700;
  background: $primary-gradient;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.summary-label {
  font-size: 13px;
  color: #909399;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.record-item {
  transition: all 0.3s ease;

  &:hover {
    transform: translateX(4px);
    box-shadow: $shadow-md;
  }
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 16px;
}

.record-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.record-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.record-points {
  background: $warning-gradient;
  border-radius: $border-radius-md;
  padding: 8px 16px;
  display: flex;
  align-items: baseline;
  gap: 4px;
  color: white;
  box-shadow: $shadow-sm;
  flex-shrink: 0;
}

.points-icon {
  font-size: 14px;
  font-weight: 700;
}

.points-value {
  font-size: 24px;
  font-weight: 800;
}

.points-label {
  font-size: 12px;
  opacity: 0.9;
}

.record-content {
  margin-bottom: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: $border-radius-sm;
}

.record-note,
.record-duration {
  margin-bottom: 12px;
  display: flex;
  gap: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

.note-label,
.duration-label {
  font-weight: 600;
  color: #606266;
  flex-shrink: 0;
}

.note-text,
.duration-text {
  color: #606266;
  line-height: 1.6;
}

.record-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.record-date {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #909399;
  font-size: 13px;

  :deep(.el-icon) {
    font-size: 14px;
  }
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
  margin-bottom: 24px;
}

@media (max-width: 768px) {
  .records-summary {
    grid-template-columns: repeat(2, 1fr);
  }

  .record-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
