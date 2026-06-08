<template>
  <div class="page-container">
    <h1 class="page-title">🎯 随机挑战抽取</h1>

    <div class="draw-section">
      <div class="draw-controls card">
        <div class="control-row">
          <label>选择难度：</label>
          <el-radio-group v-model="selectedDifficulty">
            <el-radio-button value="">全部</el-radio-button>
            <el-radio-button value="easy">简单</el-radio-button>
            <el-radio-button value="medium">中等</el-radio-button>
            <el-radio-button value="hard">困难</el-radio-button>
            <el-radio-button value="expert">专家</el-radio-button>
          </el-radio-group>
        </div>
        <div class="draw-btn-wrapper">
          <button
            class="draw-btn"
            :class="{ drawing: isDrawing }"
            @click="handleDraw"
            :disabled="isDrawing || availableCount === 0"
          >
            <span v-if="isDrawing" class="drawing-text">🎲 抽取中...</span>
            <span v-else class="normal-text">🎰 点击抽取挑战</span>
          </button>
        </div>
        <div class="available-count">
          可用挑战数量：<b>{{ availableCount }}</b> 个
        </div>
      </div>

      <div class="result-section">
        <div v-if="!currentChallenge" class="empty-state card">
          <div class="empty-icon">🎴</div>
          <p class="empty-text">点击上方按钮，随机抽取一个挑战吧！</p>
        </div>

        <Transition name="card-fade" mode="out-in">
          <ChallengeCard
            v-if="currentChallenge"
            :key="currentChallenge.id"
            :challenge="currentChallenge"
            :animated="showResult"
            class="result-card"
            @share="handleShare"
          />
        </Transition>

        <div v-if="currentChallenge && showResult" class="result-actions">
          <el-button type="success" size="large" @click="handleComplete">
            <el-icon><Check /></el-icon>
            我完成了！
          </el-button>
          <el-button type="warning" size="large" @click="handleDraw">
            <el-icon><Refresh /></el-icon>
            再抽一次
          </el-button>
          <el-button type="info" size="large" @click="handleShareClick">
            <el-icon><Share /></el-icon>
            分享
          </el-button>
          <el-button type="info" size="large" plain @click="handleSkip">
            <el-icon><Close /></el-icon>
            跳过
          </el-button>
        </div>
      </div>
    </div>

    <div class="quick-stats">
      <div class="stat-card">
        <div class="stat-icon">📚</div>
        <div class="stat-info">
          <div class="stat-value">{{ challengeStore.getStats.total }}</div>
          <div class="stat-label">挑战总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <div class="stat-value">{{ recordStore.getStats.total }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⭐</div>
        <div class="stat-info">
          <div class="stat-value">{{ recordStore.getStats.totalPoints }}</div>
          <div class="stat-label">累计积分</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔥</div>
        <div class="stat-info">
          <div class="stat-value">{{ recordStore.getStats.currentStreak }}</div>
          <div class="stat-label">连续天数</div>
        </div>
      </div>
    </div>

    <CompleteModal
      v-model="showCompleteModal"
      :challenge="currentChallenge"
      @submit="handleCompleteSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { Check, Refresh, Close, Share } from '@element-plus/icons-vue'
import type { Difficulty, Challenge } from '~/stores/challenge'

const challengeStore = useChallengeStore()
const recordStore = useRecordStore()
const { challenges } = storeToRefs(challengeStore)

const selectedDifficulty = ref<Difficulty | ''>('')
const isDrawing = ref(false)
const showResult = ref(false)
const currentChallenge = ref<Challenge | null>(null)
const showCompleteModal = ref(false)
const displayChallenge = ref<Challenge | null>(null)

onMounted(async () => {
  await challengeStore.fetchChallenges()
  await recordStore.fetchRecords()
})

const availableCount = computed(() => {
  const list = selectedDifficulty.value
    ? challenges.value.filter(c => c.difficulty === selectedDifficulty.value)
    : challenges.value
  return list.length
})

let drawInterval: ReturnType<typeof setInterval> | null = null
let drawCount = 0

const handleDraw = async () => {
  if (isDrawing.value || availableCount.value === 0) return

  isDrawing.value = true
  showResult.value = false
  drawCount = 0

  if (drawInterval) {
    clearInterval(drawInterval)
  }

  drawInterval = setInterval(() => {
    const random = challengeStore.randomChallenge(selectedDifficulty.value || undefined)
    displayChallenge.value = random
    drawCount++

    if (drawCount >= 20) {
      if (drawInterval) {
        clearInterval(drawInterval)
        drawInterval = null
      }

      challengeStore.getRandomChallenge(selectedDifficulty.value || undefined).then((finalChallenge) => {
        currentChallenge.value = finalChallenge
        displayChallenge.value = finalChallenge
        isDrawing.value = false
        showResult.value = true

        if (finalChallenge) {
          ElMessage.success('🎉 抽取成功！')
        } else {
          ElMessage.error('没有找到符合条件的挑战')
        }
      })
    }
  }, 80)
}

const handleComplete = () => {
  if (currentChallenge.value) {
    showCompleteModal.value = true
  }
}

const handleCompleteSubmit = async (data: { note: string; durationMinutes: number; challenge: Challenge }) => {
  await recordStore.addRecord({
    challengeId: data.challenge.id,
    note: data.note,
    durationMinutes: data.durationMinutes
  })
  ElMessage.success('🎉 恭喜完成挑战！积分已记录')
  currentChallenge.value = null
  displayChallenge.value = null
  showResult.value = false
}

const handleSkip = () => {
  currentChallenge.value = null
  displayChallenge.value = null
  showResult.value = false
  ElMessage.info('已跳过本次挑战')
}

const handleShareClick = () => {
  if (currentChallenge.value) {
    handleShare(currentChallenge.value)
  }
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
.draw-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
}

.draw-controls {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 16px;

  label {
    font-weight: 600;
    color: #303133;
    min-width: 80px;
  }
}

.draw-btn-wrapper {
  display: flex;
  justify-content: center;
}

.draw-btn {
  background: $primary-gradient;
  border: none;
  border-radius: $border-radius-lg;
  color: white;
  font-size: 20px;
  font-weight: 700;
  padding: 24px 48px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: $shadow-md;
  min-width: 280px;

  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: $shadow-lg;
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.drawing {
    animation: pulse 0.5s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.drawing-text {
  display: inline-block;
  animation: bounce 0.3s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.available-count {
  text-align: center;
  color: #606266;
  font-size: 14px;

  b {
    color: #667eea;
    font-size: 18px;
  }
}

.result-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 400px;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  color: #909399;
  font-size: 16px;
}

.result-card {
  margin-bottom: 8px;
}

.result-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-card {
  background: $card-bg;
  border-radius: $border-radius-md;
  padding: 24px;
  box-shadow: $shadow-sm;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: $shadow-md;
  }
}

.stat-icon {
  font-size: 48px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  background: $primary-gradient;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.card-fade-enter-active,
.card-fade-leave-active {
  transition: all 0.3s ease;
}

.card-fade-enter-from {
  opacity: 0;
  transform: scale(0.8) rotateY(90deg);
}

.card-fade-leave-to {
  opacity: 0;
  transform: scale(0.8) rotateY(-90deg);
}

@media (max-width: 768px) {
  .draw-section {
    grid-template-columns: 1fr;
  }

  .quick-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
