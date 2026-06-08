<template>
  <el-dialog
    v-model="visible"
    title="AI 智能拆解建议"
    width="700px"
    @close="onClose"
  >
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading" size="32">
        <Loading />
      </el-icon>
      <p>AI 正在分析挑战描述并生成子任务建议...</p>
    </div>

    <div v-else>
      <div class="description-input">
        <el-input
          v-model="challengeDescription"
          type="textarea"
          :rows="3"
          placeholder="请输入挑战描述，AI 将根据描述智能生成子任务拆分方案"
        />
        <el-button type="primary" @click="generateSuggestions" :disabled="!challengeDescription.trim()">
          <el-icon><MagicStick /></el-icon>
          生成建议
        </el-button>
      </div>

      <div v-if="suggestions.length > 0" class="suggestions-list">
        <h4>
          <el-icon><List /></el-icon>
          建议的子任务（共 {{ suggestions.length }} 个）
        </h4>
        <div
          v-for="(task, index) in suggestions"
          :key="index"
          class="suggestion-item"
          :class="{ 'is-selected': selectedIndices.includes(index) }"
          @click="toggleSelection(index)"
        >
          <div class="suggestion-header">
            <el-checkbox :model-value="selectedIndices.includes(index)" />
            <span class="task-order">#{{ task.order }}</span>
            <span class="task-title">{{ task.title }}</span>
            <el-tag size="small" type="info">
              预计 {{ task.estimatedDays }} 天
            </el-tag>
          </div>
          <div class="suggestion-description">{{ task.description }}</div>
          <div v-if="task.dependencies.length > 0" class="suggestion-deps">
            <span>依赖：</span>
            <span v-for="depIdx in task.dependencies" :key="depIdx" class="dep-tag">
              #{{ depIdx + 1 }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="suggestions.length > 0" class="suggestion-actions">
        <el-button @click="selectAll">
          {{ selectedIndices.length === suggestions.length ? '取消全选' : '全选' }}
        </el-button>
        <span class="selected-count">已选择 {{ selectedIndices.length }} 个任务</span>
      </div>
    </div>

    <template #footer>
      <el-button @click="onClose">取消</el-button>
      <el-button
        type="primary"
        :disabled="selectedIndices.length === 0"
        @click="onConfirm"
      >
        添加选中的任务
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Loading, MagicStick, List } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useSubTaskStore, type AiSuggestedTask } from '../stores/subtask'

const props = defineProps<{
  modelValue: boolean
  initialDescription?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', tasks: AiSuggestedTask[]): void
}>()

const subTaskStore = useSubTaskStore()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const challengeDescription = ref(props.initialDescription || '')
const suggestions = ref<AiSuggestedTask[]>([])
const selectedIndices = ref<number[]>([])
const loading = ref(false)

const generateSuggestions = async () => {
  if (!challengeDescription.value.trim()) return

  loading.value = true
  try {
    suggestions.value = await subTaskStore.getAiSuggestions(challengeDescription.value)
    selectedIndices.value = suggestions.value.map((_, i) => i)
    if (suggestions.value.length === 0) {
      ElMessage.info('未能生成建议，请尝试更详细的挑战描述')
    }
  } catch (error) {
    ElMessage.error('生成建议失败')
  } finally {
    loading.value = false
  }
}

const toggleSelection = (index: number) => {
  const idx = selectedIndices.value.indexOf(index)
  if (idx > -1) {
    selectedIndices.value.splice(idx, 1)
  } else {
    selectedIndices.value.push(index)
  }
}

const selectAll = () => {
  if (selectedIndices.value.length === suggestions.value.length) {
    selectedIndices.value = []
  } else {
    selectedIndices.value = suggestions.value.map((_, i) => i)
  }
}

const onClose = () => {
  emit('update:modelValue', false)
}

const onConfirm = () => {
  const selectedTasks = selectedIndices.value
    .sort((a, b) => a - b)
    .map(i => suggestions.value[i])
  emit('confirm', selectedTasks)
  onClose()
}
</script>

<style scoped lang="scss">
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #909399;

  .is-loading {
    margin-bottom: 12px;
    color: #409eff;
  }
}

.description-input {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;

  .el-input {
    flex: 1;
  }
}

.suggestions-list {
  h4 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    color: #303133;
  }
}

.suggestion-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #409eff;
    background: #ecf5ff;
  }

  &.is-selected {
    border-color: #409eff;
    background: #ecf5ff;
  }
}

.suggestion-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.task-order {
  color: #909399;
  font-weight: 600;
  font-size: 12px;
}

.task-title {
  flex: 1;
  font-weight: 500;
  color: #303133;
}

.suggestion-description {
  color: #606266;
  font-size: 13px;
  margin-bottom: 8px;
  padding-left: 28px;
}

.suggestion-deps {
  padding-left: 28px;
  font-size: 12px;
  color: #909399;

  .dep-tag {
    display: inline-block;
    background: #f5f7fa;
    padding: 2px 6px;
    border-radius: 4px;
    margin-right: 4px;
  }
}

.suggestion-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;

  .selected-count {
    color: #909399;
    font-size: 13px;
  }
}
</style>
