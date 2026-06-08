<template>
  <div v-if="showReminder" class="deadline-reminder">
    <el-button
      class="reminder-trigger"
      type="danger"
      circle
      @click="toggleDropdown"
    >
      <el-badge
        v-if="totalCount > 0"
        :value="totalCount"
        type="danger"
        class="reminder-badge"
      >
        <el-icon><AlarmClock /></el-icon>
      </el-badge>
      <el-icon v-else><AlarmClock /></el-icon>
    </el-button>

    <el-dropdown
      v-model:visible="dropdownVisible"
      trigger="click"
      @visible-change="onDropdownVisibleChange"
    >
      <template #dropdown>
        <el-dropdown-menu class="reminder-dropdown">
          <div class="reminder-header">
            <span>任务提醒</span>
            <el-button
              type="primary"
              link
              size="small"
              @click.stop="refresh"
            >
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>

          <el-dropdown-item divided class="reminder-section">
            <div class="section-title">
              <el-icon><Warning /></el-icon>
              已延期 ({{ delayed.length }})
            </div>
            <div
              v-if="delayed.length === 0"
              class="empty-section"
            >
              暂无延期任务
            </div>
            <div
              v-for="task in delayed.slice(0, 3)"
              :key="task.id"
              class="reminder-item delayed"
              @click.stop="goToTask(task)"
            >
              <div class="item-title">{{ task.title }}</div>
              <div class="item-meta">
                <span class="meta-text">
                  原计划 {{ formatDate(task.endDate) }}
                </span>
              </div>
            </div>
            <div v-if="delayed.length > 3" class="more-item">
              还有 {{ delayed.length - 3 }} 个延期任务
            </div>
          </el-dropdown-item>

          <el-dropdown-item class="reminder-section">
            <div class="section-title">
              <el-icon><Clock /></el-icon>
              即将到期 ({{ upcoming.length }})
            </div>
            <div
              v-if="upcoming.length === 0"
              class="empty-section"
            >
              暂无即将到期任务
            </div>
            <div
              v-for="task in upcoming.slice(0, 5)"
              :key="task.id"
              class="reminder-item upcoming"
              @click.stop="goToTask(task)"
            >
              <div class="item-title">{{ task.title }}</div>
              <div class="item-meta">
                <el-tag size="small" :type="getUrgencyType(task.endDate)">
                  {{ getDaysRemaining(task.endDate) }}天后到期
                </el-tag>
              </div>
            </div>
            <div v-if="upcoming.length > 5" class="more-item">
              还有 {{ upcoming.length - 5 }} 个即将到期任务
            </div>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { AlarmClock, Refresh, Warning, Clock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useSubTaskStore, type SubTask } from '../stores/subtask'

const subTaskStore = useSubTaskStore()

const dropdownVisible = ref(false)
const showReminder = ref(true)
const notificationShown = ref<Set<string>>(new Set())

const delayed = computed(() => subTaskStore.delayedTasks)
const upcoming = computed(() => subTaskStore.upcomingDeadlines)

const totalCount = computed(() => delayed.value.length + upcoming.value.length)

let checkInterval: number | null = null

const fetchData = async () => {
  await Promise.all([
    subTaskStore.fetchDelayedTasks(),
    subTaskStore.fetchUpcomingDeadlines(3),
  ])
  checkNotifications()
}

const refresh = async () => {
  await fetchData()
  ElMessage.success('提醒已刷新')
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const getDaysRemaining = (dateStr: string | null) => {
  if (!dateStr) return 0
  const end = new Date(dateStr)
  const now = new Date()
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

const getUrgencyType = (dateStr: string | null) => {
  const days = getDaysRemaining(dateStr)
  if (days <= 1) return 'danger'
  if (days <= 3) return 'warning'
  return 'info'
}

const checkNotifications = () => {
  const now = new Date()
  const today = now.toDateString()

  upcoming.value.forEach((task) => {
    const days = getDaysRemaining(task.endDate)
    if (days <= 1 && !notificationShown.value.has(`${task.id}-${today}`)) {
      ElMessage.warning(`任务「${task.title}」将于 ${days} 天后到期！`)
      notificationShown.value.add(`${task.id}-${today}`)
    }
  })

  delayed.value.forEach((task) => {
    if (!notificationShown.value.has(`${task.id}-delayed-${today}`)) {
      ElMessage.error(`任务「${task.title}」已延期！`)
      notificationShown.value.add(`${task.id}-delayed-${today}`)
    }
  })
}

const toggleDropdown = () => {
  dropdownVisible.value = !dropdownVisible.value
}

const onDropdownVisibleChange = (visible: boolean) => {
  dropdownVisible.value = visible
}

const goToTask = (task: SubTask) => {
  navigateTo(`/challenges/${task.challengeId}`)
  dropdownVisible.value = false
}

onMounted(() => {
  fetchData()
  checkInterval = window.setInterval(fetchData, 5 * 60 * 1000)
})

onUnmounted(() => {
  if (checkInterval) {
    clearInterval(checkInterval)
  }
})
</script>

<style scoped lang="scss">
.deadline-reminder {
  position: relative;
}

.reminder-trigger {
  position: relative;
}

.reminder-badge {
  position: absolute;
  top: -5px;
  right: -5px;
}

.reminder-dropdown {
  width: 320px;
  padding: 0;
}

.reminder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  font-weight: 600;
  color: #303133;
}

.reminder-section {
  padding: 0 !important;
  margin: 0 !important;

  &:hover {
    background: none !important;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  background: #f5f7fa;
}

.empty-section {
  padding: 16px;
  text-align: center;
  color: #c0c4cc;
  font-size: 13px;
}

.reminder-item {
  padding: 10px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f2f5;
  transition: background 0.2s;

  &:hover {
    background: #f5f7fa;
  }

  &:last-child {
    border-bottom: none;
  }

  &.delayed {
    border-left: 3px solid #f56c6c;
  }

  &.upcoming {
    border-left: 3px solid #e6a23c;
  }
}

.item-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  display: flex;
  align-items: center;
}

.meta-text {
  font-size: 12px;
  color: #909399;
}

.more-item {
  padding: 8px 16px;
  text-align: center;
  font-size: 12px;
  color: #909399;
  background: #fafafa;
}
</style>
