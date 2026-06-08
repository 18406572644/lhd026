<template>
  <div
    class="subtask-card"
    :class="{
      'is-completed': subTask.status === 'completed',
      'is-delayed': subTask.status === 'delayed',
      'is-dragging': isDragging,
    }"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @dragover.prevent
    @drop="onDrop"
  >
    <div class="subtask-header">
      <div class="drag-handle">
        <el-icon><Sort /></el-icon>
      </div>
      <div class="subtask-status">
        <el-tag
          :type="statusType"
          size="small"
          effect="light"
        >
          {{ subTaskStore.getStatusLabel(subTask.status) }}
        </el-tag>
      </div>
      <div class="subtask-order">#{{ subTask.order }}</div>
      <div class="subtask-actions">
        <el-button
          type="primary"
          link
          size="small"
          @click="$emit('edit', subTask)"
        >
          <el-icon><Edit /></el-icon>
        </el-button>
        <el-button
          type="danger"
          link
          size="small"
          @click="$emit('delete', subTask)"
        >
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </div>

    <div class="subtask-title">{{ subTask.title }}</div>
    <div v-if="subTask.description" class="subtask-description">
      {{ subTask.description }}
    </div>

    <div class="subtask-progress">
      <el-progress
        :percentage="subTask.progress"
        :color="subTaskStore.getStatusColor(subTask.status)"
        :stroke-width="6"
      />
    </div>

    <div class="subtask-meta">
      <div v-if="subTask.startDate" class="meta-item">
        <el-icon><Calendar /></el-icon>
        <span>{{ formatDate(subTask.startDate) }}</span>
        <span v-if="subTask.endDate"> ~ {{ formatDate(subTask.endDate) }}</span>
      </div>
      <div v-if="subTask.completedAt" class="meta-item completed">
        <el-icon><CircleCheck /></el-icon>
        <span>完成于 {{ formatDate(subTask.completedAt) }}</span>
      </div>
    </div>

    <div v-if="subTask.dependencies && subTask.dependencies.length > 0" class="subtask-deps">
      <span class="deps-label">依赖：</span>
      <el-tag
        v-for="dep in subTask.dependencies"
        :key="dep.id"
        size="small"
        effect="plain"
      >
        {{ dep.title }}
      </el-tag>
    </div>

    <div v-if="subTask.notes" class="subtask-notes">
      <el-icon><Document /></el-icon>
      <span>{{ subTask.notes }}</span>
    </div>

    <div class="subtask-footer">
      <el-slider
        v-if="subTask.status !== 'completed'"
        v-model="localProgress"
        :min="0"
        :max="100"
        :step="5"
        @change="onProgressChange"
        class="progress-slider"
      />
      <el-button
        v-if="subTask.status !== 'completed' && canStart"
        type="success"
        size="small"
        @click="onComplete"
      >
        标记完成
      </el-button>
      <el-tooltip
        v-else-if="subTask.status !== 'completed' && !canStart"
        content="请先完成依赖任务"
        placement="top"
      >
        <el-button type="success" size="small" disabled>
          标记完成
        </el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Edit, Delete, Calendar, CircleCheck, Document, Sort } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { SubTask } from '../stores/subtask'
import { useSubTaskStore } from '../stores/subtask'

const props = defineProps<{
  subTask: SubTask
}>()

const emit = defineEmits<{
  (e: 'edit', subTask: SubTask): void
  (e: 'delete', subTask: SubTask): void
  (e: 'progress-change', id: string, progress: number): void
  (e: 'complete', id: string, notes?: string): void
  (e: 'reorder', fromId: string, toId: string): void
}>()

const subTaskStore = useSubTaskStore()
const localProgress = ref(props.subTask.progress)
const isDragging = ref(false)

const statusType = computed(() => {
  const types: Record<string, string> = {
    pending: 'info',
    in_progress: 'primary',
    completed: 'success',
    delayed: 'danger',
  }
  return types[props.subTask.status] || 'info'
})

const canStart = computed(() => subTaskStore.canStart(props.subTask))

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const onProgressChange = (val: number) => {
  emit('progress-change', props.subTask.id, val)
}

const onComplete = () => {
  emit('complete', props.subTask.id)
}

const onDragStart = (e: DragEvent) => {
  isDragging.value = true
  e.dataTransfer?.setData('text/plain', props.subTask.id)
}

const onDragEnd = () => {
  isDragging.value = false
}

const onDrop = (e: DragEvent) => {
  e.preventDefault()
  const draggedId = e.dataTransfer?.getData('text/plain')
  if (draggedId && draggedId !== props.subTask.id) {
    emit('reorder', draggedId, props.subTask.id)
  }
}
</script>

<style scoped lang="scss">
.subtask-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
  cursor: grab;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #409eff;
  }

  &.is-completed {
    background: #f0f9eb;
    border-color: #e1f3d8;
    opacity: 0.8;
  }

  &.is-delayed {
    background: #fef0f0;
    border-color: #fde2e2;
  }

  &.is-dragging {
    opacity: 0.5;
    transform: scale(1.02);
  }
}

.subtask-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.drag-handle {
  color: #c0c4cc;
  cursor: grab;
  display: flex;
  align-items: center;
}

.subtask-status {
  flex: 0 0 auto;
}

.subtask-order {
  color: #909399;
  font-size: 12px;
  font-weight: 600;
}

.subtask-actions {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

.subtask-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.subtask-description {
  color: #606266;
  font-size: 14px;
  margin-bottom: 12px;
  line-height: 1.5;
}

.subtask-progress {
  margin-bottom: 12px;
}

.subtask-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 13px;

  &.completed {
    color: #67c23a;
  }
}

.subtask-deps {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;

  .deps-label {
    color: #909399;
    font-size: 13px;
  }
}

.subtask-notes {
  background: #f5f7fa;
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #606266;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.subtask-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.progress-slider {
  flex: 1;
}
</style>
