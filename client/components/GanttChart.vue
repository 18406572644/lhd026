<template>
  <div class="gantt-chart">
    <div class="gantt-header">
      <div class="gantt-controls">
        <el-button-group>
          <el-button
            v-for="view in viewOptions"
            :key="view.value"
            :type="currentView === view.value ? 'primary' : 'default'"
            @click="currentView = view.value"
          >
            {{ view.label }}
          </el-button>
        </el-button-group>
        <el-button @click="goPrev">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <el-button @click="goNext">
          <el-icon><ArrowRight /></el-icon>
        </el-button>
        <el-button @click="goToday">今天</el-button>
      </div>
      <div class="gantt-title">{{ title }}</div>
    </div>

    <div class="gantt-body">
      <div class="gantt-sidebar">
        <div class="sidebar-header">任务名称</div>
        <div
          v-for="task in tasks"
          :key="task.id"
          class="sidebar-item"
          :class="{ 'is-completed': task.status === 'completed' }"
        >
          <div class="task-name">{{ task.title }}</div>
          <div class="task-progress">
            <el-progress
              :percentage="task.progress"
              :color="getStatusColor(task.status)"
              :stroke-width="4"
            />
          </div>
        </div>
      </div>

      <div class="gantt-timeline" ref="timelineRef" @scroll="onScroll">
        <div class="timeline-header">
          <div
            v-for="(day, index) in days"
            :key="index"
            class="timeline-day"
            :class="{
              'is-weekend': isWeekend(day),
              'is-today': isToday(day),
            }"
          >
            <div class="day-label">{{ formatDay(day) }}</div>
            <div class="date-label">{{ formatDate(day) }}</div>
          </div>
        </div>

        <div class="timeline-body">
          <div
            v-for="task in tasks"
            :key="task.id"
            class="timeline-row"
          >
            <div
              v-for="(day, dayIndex) in days"
              :key="dayIndex"
              class="timeline-cell"
              :class="{
                'is-weekend': isWeekend(day),
                'is-today': isToday(day),
              }"
            >
              <div
                v-if="isTaskOnDay(task, day)"
                class="task-bar"
                :class="{
                  'is-start': isTaskStart(task, day),
                  'is-end': isTaskEnd(task, day),
                  'is-completed': task.status === 'completed',
                  'is-delayed': task.status === 'delayed',
                }"
                :style="getTaskBarStyle(task, day)"
                @click="$emit('task-click', task)"
              >
                <span v-if="isTaskStart(task, day)" class="bar-label">
                  {{ task.progress }}%
                </span>
              </div>

              <div
                v-if="task.dependencyIds && task.dependencyIds.length > 0"
                class="dependency-line"
                v-for="depId in task.dependencyIds"
                :key="depId"
              >
                <svg v-if="shouldShowDependency(task, depId, day)">
                  <line
                    :x1="getDependencyX1(task, depId, day)"
                    :y1="0"
                    :x2="getDependencyX2(task, depId, day)"
                    :y2="rowHeight"
                    stroke="#c0c4cc"
                    stroke-width="1"
                    stroke-dasharray="3,3"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div class="today-line" v-if="isTodayInRange" :style="getTodayLineStyle"></div>
      </div>
    </div>

    <div class="gantt-legend">
      <div class="legend-item">
        <span class="legend-color pending"></span>
        <span>待开始</span>
      </div>
      <div class="legend-item">
        <span class="legend-color in_progress"></span>
        <span>进行中</span>
      </div>
      <div class="legend-item">
        <span class="legend-color completed"></span>
        <span>已完成</span>
      </div>
      <div class="legend-item">
        <span class="legend-color delayed"></span>
        <span>已延期</span>
      </div>
      <div class="legend-item">
        <span class="legend-line"></span>
        <span>今日</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import type { SubTaskStatus } from '../stores/subtask'

interface GanttTask {
  id: string
  title: string
  status: SubTaskStatus
  progress: number
  startDate: string | null
  endDate: string | null
  dependencyIds: string[]
}

const props = defineProps<{
  title?: string
  tasks: GanttTask[]
}>()

const emit = defineEmits<{
  (e: 'task-click', task: GanttTask): void
}>()

const currentView = ref<'week' | 'month'>('week')
const currentDate = ref(new Date())
const timelineRef = ref<HTMLElement>()

const viewOptions = [
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
]

const dayWidth = 60
const rowHeight = 60

const days = computed(() => {
  const result: Date[] = []
  const start = new Date(currentDate.value)
  
  if (currentView.value === 'week') {
    const day = start.getDay()
    start.setDate(start.getDate() - day)
  } else {
    start.setDate(1)
  }

  const daysToShow = currentView.value === 'week' ? 7 : 31
  for (let i = 0; i < daysToShow; i++) {
    result.push(new Date(start))
    start.setDate(start.getDate() + 1)
  }
  
  return result
})

const isTodayInRange = computed(() => {
  const today = new Date()
  return days.value.some(d => isToday(d))
})

const getTodayLineStyle = computed(() => {
  const today = new Date()
  const index = days.value.findIndex(d => isToday(d))
  if (index === -1) return {}
  
  return {
    left: `${index * dayWidth + dayWidth / 2}px`,
  }
})

const formatDay = (date: Date) => {
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  return weekDays[date.getDay()]
}

const formatDate = (date: Date) => {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const isWeekend = (date: Date) => {
  const day = date.getDay()
  return day === 0 || day === 6
}

const isToday = (date: Date) => {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

const getStatusColor = (status: SubTaskStatus) => {
  const colors: Record<SubTaskStatus, string> = {
    pending: '#909399',
    in_progress: '#409eff',
    completed: '#67c23a',
    delayed: '#f56c6c',
  }
  return colors[status]
}

const parseDate = (dateStr: string | null) => {
  if (!dateStr) return null
  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)
  return date
}

const isTaskOnDay = (task: GanttTask, day: Date) => {
  if (!task.startDate || !task.endDate) return false
  
  const start = parseDate(task.startDate)
  const end = parseDate(task.endDate)
  if (!start || !end) return false
  
  const checkDay = new Date(day)
  checkDay.setHours(0, 0, 0, 0)
  
  return checkDay >= start && checkDay <= end
}

const isTaskStart = (task: GanttTask, day: Date) => {
  if (!task.startDate) return false
  const start = parseDate(task.startDate)
  const checkDay = new Date(day)
  checkDay.setHours(0, 0, 0, 0)
  return start && start.getTime() === checkDay.getTime()
}

const isTaskEnd = (task: GanttTask, day: Date) => {
  if (!task.endDate) return false
  const end = parseDate(task.endDate)
  const checkDay = new Date(day)
  checkDay.setHours(0, 0, 0, 0)
  return end && end.getTime() === checkDay.getTime()
}

const getTaskBarStyle = (task: GanttTask, day: Date) => {
  const start = parseDate(task.startDate)
  const end = parseDate(task.endDate)
  if (!start || !end) return {}

  const checkDay = new Date(day)
  checkDay.setHours(0, 0, 0, 0)

  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

  const isStart = isTaskStart(task, day)
  const isEnd = isTaskEnd(task, day)

  let width = dayWidth
  let marginLeft = 0

  if (isStart) {
    const daysFromStart = Math.ceil((checkDay.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    marginLeft = (daysFromStart % 1) * dayWidth
  }

  if (isEnd) {
    const daysFromStart = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    width = ((end.getTime() - checkDay.getTime()) / (1000 * 60 * 60 * 24)) * dayWidth + dayWidth / 2
  }

  const progressWidth = task.progress

  return {
    width: `${width}px`,
    marginLeft: `${marginLeft}px`,
    '--progress-width': `${progressWidth}%`,
    backgroundColor: getStatusColor(task.status),
  }
}

const shouldShowDependency = (task: GanttTask, depId: string, day: Date) => {
  const depTask = props.tasks.find(t => t.id === depId)
  if (!depTask || !depTask.endDate || !task.startDate) return false
  
  const depEnd = parseDate(depTask.endDate)
  const taskStart = parseDate(task.startDate)
  if (!depEnd || !taskStart) return false

  const checkDay = new Date(day)
  checkDay.setHours(0, 0, 0, 0)

  return checkDay.getTime() === depEnd.getTime()
}

const getDependencyX1 = (task: GanttTask, depId: string, day: Date) => {
  const depTask = props.tasks.find(t => t.id === depId)
  if (!depTask) return 0

  const taskIndex = props.tasks.indexOf(task)
  const depIndex = props.tasks.indexOf(depTask)
  const rowDiff = taskIndex - depIndex

  return dayWidth / 2
}

const getDependencyX2 = (task: GanttTask, depId: string, day: Date) => {
  return dayWidth / 2
}

const goPrev = () => {
  const date = new Date(currentDate.value)
  if (currentView.value === 'week') {
    date.setDate(date.getDate() - 7)
  } else {
    date.setMonth(date.getMonth() - 1)
  }
  currentDate.value = date
}

const goNext = () => {
  const date = new Date(currentDate.value)
  if (currentView.value === 'week') {
    date.setDate(date.getDate() + 7)
  } else {
    date.setMonth(date.getMonth() + 1)
  }
  currentDate.value = date
}

const goToday = () => {
  currentDate.value = new Date()
}

const onScroll = (e: Event) => {
  const target = e.target as HTMLElement
  const sidebar = document.querySelector('.gantt-sidebar .sidebar-header')
  if (sidebar) {
    sidebar.scrollLeft = target.scrollLeft
  }
}
</script>

<style scoped lang="scss">
.gantt-chart {
  background: white;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  overflow: hidden;
}

.gantt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
}

.gantt-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.gantt-title {
  font-weight: 600;
  color: #303133;
}

.gantt-body {
  display: flex;
  height: 400px;
}

.gantt-sidebar {
  flex: 0 0 200px;
  border-right: 1px solid #ebeef5;
  overflow: hidden;
}

.sidebar-header {
  height: 50px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #606266;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
}

.sidebar-item {
  height: 60px;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f2f5;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;

  &.is-completed {
    background: #f0f9eb;
  }
}

.task-name {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-progress {
  width: 100%;
}

.gantt-timeline {
  flex: 1;
  overflow: auto;
  position: relative;
}

.timeline-header {
  display: flex;
  height: 50px;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
  position: sticky;
  top: 0;
  z-index: 10;
}

.timeline-day {
  flex: 0 0 60px;
  border-right: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #606266;

  &.is-weekend {
    background: #f5f7fa;
  }

  &.is-today {
    background: #ecf5ff;
    color: #409eff;
  }
}

.day-label {
  font-weight: 600;
}

.date-label {
  font-size: 11px;
  color: #909399;
}

.timeline-body {
  position: relative;
}

.timeline-row {
  display: flex;
  height: 60px;
  border-bottom: 1px solid #f0f2f5;
}

.timeline-cell {
  flex: 0 0 60px;
  border-right: 1px solid #f0f2f5;
  position: relative;

  &.is-weekend {
    background: #fafafa;
  }

  &.is-today {
    background: #f4f9ff;
  }
}

.task-bar {
  position: absolute;
  top: 15px;
  height: 30px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.85;
  overflow: hidden;

  &:hover {
    opacity: 1;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  &.is-start {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }

  &.is-end {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
  }

  &.is-completed {
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: var(--progress-width, 100%);
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

.bar-label {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  color: white;
  font-weight: 600;
  white-space: nowrap;
}

.today-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #f56c6c;
  z-index: 5;
  pointer-events: none;

  &::before {
    content: '';
    position: absolute;
    top: -4px;
    left: -3px;
    width: 8px;
    height: 8px;
    background: #f56c6c;
    border-radius: 50%;
  }
}

.dependency-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: visible;
}

.gantt-legend {
  display: flex;
  gap: 20px;
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  background: #fafafa;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #606266;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 3px;

  &.pending {
    background: #909399;
  }

  &.in_progress {
    background: #409eff;
  }

  &.completed {
    background: #67c23a;
  }

  &.delayed {
    background: #f56c6c;
  }
}

.legend-line {
  width: 16px;
  height: 2px;
  background: #f56c6c;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: -3px;
    left: 4px;
    width: 8px;
    height: 8px;
    background: #f56c6c;
    border-radius: 50%;
  }
}
</style>
