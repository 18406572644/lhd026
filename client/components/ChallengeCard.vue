<template>
  <div
    class="challenge-card"
    :class="{
      'shake': shaking,
      'bounce-in': animated,
      'clickable': clickable
    }"
    :style="{ borderLeftColor: cardColor }"
    @click="handleClick"
  >
    <div class="card-header">
      <h3 class="card-title">{{ challenge.title }}</h3>
      <DifficultyBadge :difficulty="challenge.difficulty" />
    </div>
    <p class="card-description">{{ challenge.description }}</p>
    
    <div v-if="challenge.overallProgress !== undefined" class="card-progress">
      <div class="progress-label">
        <span>进度</span>
        <span class="progress-value">{{ challenge.overallProgress }}%</span>
      </div>
      <el-progress
        :percentage="challenge.overallProgress"
        :stroke-width="6"
        color="#409eff"
      />
    </div>

    <div class="card-footer">
      <div class="card-meta">
        <span class="category">
          <el-icon><Collection /></el-icon>
          {{ challenge.category }}
        </span>
        <span class="points">
          <el-icon><Star /></el-icon>
          {{ challenge.points }} 积分
        </span>
      </div>
      <div class="card-actions" v-if="showActions">
        <el-button type="success" size="small" @click.stop="$emit('complete', challenge)">
          <el-icon><Check /></el-icon>
          完成
        </el-button>
        <el-button type="primary" size="small" @click.stop="$emit('view', challenge)">
          <el-icon><View /></el-icon>
          详情
        </el-button>
        <el-button type="primary" size="small" @click.stop="$emit('share', challenge)">
          <el-icon><Share /></el-icon>
          分享
        </el-button>
        <el-button type="warning" size="small" @click.stop="$emit('edit', challenge)">
          <el-icon><Edit /></el-icon>
          编辑
        </el-button>
        <el-button type="danger" size="small" @click.stop="$emit('delete', challenge)">
          <el-icon><Delete /></el-icon>
          删除
        </el-button>
      </div>
    </div>
    <div class="created-at">
      创建于 {{ formatDate(challenge.createdAt) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Collection, Star, Check, Edit, Delete, Share, View } from '@element-plus/icons-vue'
import type { Challenge } from '~/stores/challenge'

const props = withDefaults(defineProps<{
  challenge: Challenge
  animated?: boolean
  clickable?: boolean
  showActions?: boolean
}>(), {
  animated: false,
  clickable: false,
  showActions: false
})

const emit = defineEmits<{
  click: [challenge: Challenge]
  complete: [challenge: Challenge]
  view: [challenge: Challenge]
  edit: [challenge: Challenge]
  delete: [challenge: Challenge]
  share: [challenge: Challenge]
}>()

const challengeStore = useChallengeStore()
const shaking = ref(false)

const cardColor = computed(() => challengeStore.getDifficultyColor(props.challenge.difficulty))

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

const handleClick = () => {
  if (props.clickable) {
    shaking.value = true
    setTimeout(() => {
      shaking.value = false
      emit('click', props.challenge)
    }, 500)
  }
}
</script>

<style lang="scss" scoped>
.challenge-card {
  background: $card-bg;
  border-radius: $border-radius-md;
  padding: 20px;
  box-shadow: $shadow-sm;
  border-left: 4px solid;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &.clickable {
    cursor: pointer;
  }

  &:hover {
    box-shadow: $shadow-md;
    transform: translateY(-4px);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  flex: 1;
}

.card-description {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;
  min-height: 44px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.card-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;

  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  :deep(.el-icon) {
    font-size: 14px;
  }
}

.points {
  color: #e6a23c;
  font-weight: 600;
}

.card-progress {
  margin-bottom: 16px;

  .progress-label {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 12px;
    color: #909399;

    .progress-value {
      color: #409eff;
      font-weight: 600;
    }
  }
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.created-at {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
  font-size: 12px;
  color: #c0c4cc;
}

.shake {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

.bounce-in {
  animation: bounceIn 0.6s ease-out;
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
