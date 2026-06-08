<template>
  <div class="challenge-detail">
    <div class="page-header">
      <el-button link @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回列表
      </el-button>
      <h2 v-if="challenge" class="challenge-title">
        <DifficultyBadge :difficulty="challenge.difficulty" />
        {{ challenge.title }}
      </h2>
    </div>

    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading" size="32"><Loading /></el-icon>
      <p>加载中...</p>
    </div>

    <div v-else-if="!challenge" class="empty-state">
      <el-empty description="挑战不存在或已被删除" />
    </div>

    <div v-else class="detail-content">
      <el-row :gutter="20">
        <el-col :span="16">
          <el-card class="info-card">
            <template #header>
              <div class="card-header">
                <span>挑战信息</span>
                <el-button size="small" @click="showEditModal = true">
                  <el-icon><Edit /></el-icon>
                  编辑挑战
                </el-button>
              </div>
            </template>

            <div class="challenge-info">
              <div class="info-item">
                <label>描述</label>
                <p>{{ challenge.description }}</p>
              </div>
              <div class="info-row">
                <div class="info-item">
                  <label>分类</label>
                  <el-tag>{{ challenge.category }}</el-tag>
                </div>
                <div class="info-item">
                  <label>积分</label>
                  <span class="points">{{ challenge.points }} 分</span>
                </div>
                <div class="info-item">
                  <label>创建时间</label>
                  <span>{{ formatDate(challenge.createdAt) }}</span>
                </div>
              </div>
              <div class="progress-section">
                <div class="progress-header">
                  <label>总体进度</label>
                  <span class="progress-value">{{ challenge.overallProgress }}%</span>
                </div>
                <el-progress
                  :percentage="challenge.overallProgress"
                  :stroke-width="12"
                  color="#409eff"
                />
              </div>
              <div class="date-row">
                <div class="info-item">
                  <label>开始日期</label>
                  <el-date-picker
                  v-model="startDate"
                  type="date"
                  placeholder="选择开始日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  @change="updateChallengeDates"
                />
                </div>
                <div class="info-item">
                  <label>截止日期</label>
                  <el-date-picker
                  v-model="endDate"
                  type="date"
                  placeholder="选择截止日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  @change="updateChallengeDates"
                />
                </div>
              </div>
            </div>
          </el-card>

          <el-card class="subtasks-card">
            <template #header>
              <div class="card-header">
                <span>子任务拆解 ({{ subTaskStore.subTasks.length }})</span>
                <div class="header-actions">
                  <el-button size="small" @click="showAiModal = true">
                    <el-icon><MagicStick /></el-icon>
                    AI 智能拆解
                  </el-button>
                  <el-button type="primary" size="small" @click="showAddModal = true">
                    <el-icon><Plus /></el-icon>
                    添加子任务
                  </el-button>
                </div>
              </div>
            </template>

            <div v-if="subTaskStore.loading" class="subtasks-loading">
              <el-icon class="is-loading"><Loading /></el-icon>
            </div>

            <div v-else-if="subTaskStore.subTasks.length === 0" class="empty-subtasks">
              <el-empty description="暂无子任务，点击上方按钮添加或使用AI智能拆解">
                <template #image>
                  <el-button type="primary" @click="showAiModal = true">
                    <el-icon><MagicStick /></el-icon>
                    AI 智能拆解
                  </el-button>
                </template>
              </el-empty>
            </div>

            <div v-else class="subtasks-list">
              <SubTaskCard
                v-for="subTask in subTaskStore.subTasks"
                :key="subTask.id"
                :subTask="subTask"
                @edit="onEditSubTask"
                @delete="onDeleteSubTask"
                @progress-change="onProgressChange"
                @complete="onCompleteSubTask"
                @reorder="onReorder"
              />
            </div>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card class="gantt-card">
            <template #header>
              <div class="card-header">
                <span>进度甘特图</span>
                <el-button
                  size="small"
                  :icon="Refresh"
                  @click="subTaskStore.fetchGanttData(route.params.id as string)"
                >
                  刷新
                </el-button>
              </div>
            </template>

            <GanttChart
              v-if="ganttTasks.length > 0"
              :tasks="ganttTasks"
              @task-click="onGanttTaskClick"
            />
            <el-empty
              v-else
              description="设置子任务的开始和结束日期后可查看甘特图"
            />
          </el-card>

          <el-card class="stats-card">
            <template #header>
              <div class="card-header">
                <span>即将到期</span>
                <el-badge
                  v-if="subTaskStore.upcomingDeadlines.length > 0"
                  :value="subTaskStore.upcomingDeadlines.length"
                  class="notification-badge"
                />
              </div>
            </template>

            <div v-if="subTaskStore.upcomingDeadlines.length === 0" class="empty-deadlines">
              <el-empty description="暂无即将到期的任务" :image-size="60" />
            </div>

            <div v-else class="deadlines-list">
              <div
                v-for="task in subTaskStore.upcomingDeadlines"
                :key="task.id"
                class="deadline-item"
              >
                <div class="deadline-title">{{ task.title }}</div>
                <div class="deadline-date">
                  <el-icon><Clock /></el-icon>
                  {{ formatDate(task.endDate) }}
                </div>
                <el-tag size="small" type="warning">
                  {{ getDaysRemaining(task.endDate) }}天后到期
                </el-tag>
              </div>
            </div>
          </el-card>

          <el-card class="delayed-card">
            <template #header>
              <div class="card-header">
                <span>已延期任务</span>
                <el-badge
                  v-if="subTaskStore.delayedTasks.length > 0"
                  :value="subTaskStore.delayedTasks.length"
                  type="danger"
                  class="notification-badge"
                />
              </div>
            </template>

            <div v-if="subTaskStore.delayedTasks.length === 0" class="empty-delayed">
              <el-empty description="暂无延期任务，继续保持！" :image-size="60" />
            </div>

            <div v-else class="delayed-list">
              <div
                v-for="task in subTaskStore.delayedTasks"
                :key="task.id"
                class="delayed-item"
              >
                <div class="delayed-title">{{ task.title }}</div>
                <div class="delayed-date">
                  <el-icon><Warning /></el-icon>
                  原计划 {{ formatDate(task.endDate) }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <SubTaskEditModal
      v-model="showAddModal"
      :challenge-id="route.params.id as string"
      :existing-sub-tasks="subTaskStore.subTasks"
      @submit="onAddSubTask"
    />

    <SubTaskEditModal
      v-model="showEditModal"
      :sub-task="editingSubTask"
      :challenge-id="route.params.id as string"
      :existing-sub-tasks="subTaskStore.subTasks"
      @submit="onUpdateSubTask"
    />

    <AiSuggestModal
      v-model="showAiModal"
      :initial-description="challenge?.description"
      @confirm="onAiSuggestConfirm"
    />

    <el-dialog
      v-model="showCompleteModal"
      title="完成子任务"
      width="500px"
    >
      <el-form label-width="80px">
        <el-form-item label="心得笔记">
          <el-input
            v-model="completeNotes"
            type="textarea"
          :rows="4"
          placeholder="记录完成这个任务的心得和收获（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCompleteModal = false">取消</el-button>
        <el-button type="primary" @click="confirmComplete">确定完成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Loading,
  Edit,
  MagicStick,
  Plus,
  Refresh,
  Clock,
  Warning,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useChallengeStore, type Challenge } from '@/stores/challenge'
import {
  useSubTaskStore,
  type SubTask,
  type AiSuggestedTask,
} from '@/stores/subtask'
import DifficultyBadge from '@/components/DifficultyBadge.vue'
import SubTaskCard from '@/components/SubTaskCard.vue'
import SubTaskEditModal from '@/components/SubTaskEditModal.vue'
import AiSuggestModal from '@/components/AiSuggestModal.vue'
import GanttChart from '@/components/GanttChart.vue'

const route = useRoute()
const router = useRouter()
const challengeStore = useChallengeStore()
const subTaskStore = useSubTaskStore()

const loading = ref(true)
const challenge = ref<Challenge | null>(null)
const startDate = ref('')
const endDate = ref('')

const showAddModal = ref(false)
const showEditModal = ref(false)
const showAiModal = ref(false)
const showCompleteModal = ref(false)
const editingSubTask = ref<SubTask | null>(null)
const completingSubTaskId = ref('')
const completeNotes = ref('')

const ganttTasks = computed(() => {
  return subTaskStore.subTasks.map(st => ({
    id: st.id,
    title: st.title,
    status: st.status,
    progress: st.progress,
    startDate: st.startDate,
    endDate: st.endDate,
    dependencyIds: st.dependencyIds || [],
  }))
})

const fetchData = async () => {
  loading.value = true
  try {
    const id = route.params.id as string
    const result = await challengeStore.getChallengeById(id)
    if (result) {
      challenge.value = result
      startDate.value = result.startDate || ''
      endDate.value = result.endDate || ''
    } else {
      const challenges = await challengeStore.fetchChallenges()
      challenge.value = challenges?.find(c => c.id === id) || null
    }

    if (challenge.value) {
      await Promise.all([
        subTaskStore.fetchSubTasks(id),
        subTaskStore.fetchGanttData(id),
        subTaskStore.fetchUpcomingDeadlines(7),
        subTaskStore.fetchDelayedTasks(),
      ])
    }
  } catch (error) {
    console.error('Failed to fetch data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

watch(
  () => route.params.id,
  () => {
    fetchData()
  }
)

const goBack = () => {
  router.push('/challenges')
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

const updateChallengeDates = async () => {
  if (!challenge.value) return
  await challengeStore.updateChallenge(challenge.value.id, {
    startDate: startDate.value || null,
    endDate: endDate.value || null,
  })
  ElMessage.success('日期已更新')
}

const onAddSubTask = async (data: Partial<SubTask>) => {
  await subTaskStore.addSubTask(data as any)
  ElMessage.success('子任务添加成功')
  await subTaskStore.fetchGanttData(route.params.id as string)
}

const onEditSubTask = (subTask: SubTask) => {
  editingSubTask.value = subTask
  showEditModal.value = true
}

const onUpdateSubTask = async (data: Partial<SubTask>) => {
  if (!editingSubTask.value) return
  await subTaskStore.updateSubTask(editingSubTask.value.id, data)
  ElMessage.success('子任务更新成功')
  await subTaskStore.fetchGanttData(route.params.id as string)
  editingSubTask.value = null
}

const onDeleteSubTask = async (subTask: SubTask) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除子任务"${subTask.title}"吗？`,
      '删除确认',
      {
        type: 'warning',
      }
    )
    await subTaskStore.deleteSubTask(subTask.id)
    ElMessage.success('子任务已删除')
    await subTaskStore.fetchGanttData(route.params.id as string)
  } catch {
    // User cancelled
  }
}

const onProgressChange = async (id: string, progress: number) => {
  await subTaskStore.updateSubTask(id, { progress })
  await subTaskStore.fetchGanttData(route.params.id as string)
}

const onCompleteSubTask = async (id: string) => {
  completingSubTaskId.value = id
  completeNotes.value = ''
  showCompleteModal.value = true
}

const confirmComplete = async () => {
  try {
    await subTaskStore.completeSubTask(completingSubTaskId.value, completeNotes.value)
    ElMessage.success('任务已完成！')
    showCompleteModal.value = false
    await Promise.all([
      subTaskStore.fetchSubTasks(route.params.id as string),
      subTaskStore.fetchGanttData(route.params.id as string),
    ])
  } catch (error: any) {
    ElMessage.error(error.message || '完成任务失败')
  }
}

const onReorder = async (fromId: string, toId: string) => {
  const ids = subTaskStore.subTasks.map(st => st.id)
  const fromIndex = ids.indexOf(fromId)
  const toIndex = ids.indexOf(toId)

  if (fromIndex === -1 || toIndex === -1) return

  ids.splice(fromIndex, 1)
  ids.splice(toIndex, 0, fromId)

  await subTaskStore.reorderSubTasks(route.params.id as string, ids)
  ElMessage.success('排序已更新')
}

const onAiSuggestConfirm = async (tasks: AiSuggestedTask[]) => {
  const today = new Date()
  let currentDate = new Date(today)

  const createdIds: string[] = []

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i]
    const startDate = new Date(currentDate)
    const endDate = new Date(currentDate)
    endDate.setDate(endDate.getDate() + task.estimatedDays - 1)

    const dependencyIds = task.dependencies.map(idx => createdIds[idx])

    const created = await subTaskStore.addSubTask({
      title: task.title,
      description: task.description,
      status: 'pending',
      progress: 0,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      notes: null,
      challengeId: route.params.id as string,
      dependencyIds,
    })

    if (created) {
      createdIds.push(created.id)
    }

    currentDate.setDate(currentDate.getDate() + task.estimatedDays)
  }

  ElMessage.success(`成功添加 ${tasks.length} 个子任务`)
  await Promise.all([
    subTaskStore.fetchSubTasks(route.params.id as string),
    subTaskStore.fetchGanttData(route.params.id as string),
  ])
}

const onGanttTaskClick = (task: any) => {
  const subTask = subTaskStore.getSubTaskById(task.id)
  if (subTask) {
    editingSubTask.value = subTask
    showEditModal.value = true
  }
}
</script>

<style scoped lang="scss">
.challenge-detail {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;

  .challenge-title {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0;
    font-size: 24px;
    color: #303133;
  }
}

.loading-container,
.subtasks-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #909399;
  gap: 12px;

  .is-loading {
    color: #409eff;
  }
}

.empty-state {
  padding: 60px 20px;
}

.empty-subtasks {
  padding: 40px 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.info-card,
.subtasks-card,
.gantt-card,
.stats-card,
.delayed-card {
  margin-bottom: 20px;
}

.challenge-info {
  .info-item {
    margin-bottom: 16px;

    label {
      display: block;
      color: #909399;
      font-size: 13px;
      margin-bottom: 6px;
    }

    p {
      margin: 0;
      color: #303133;
      line-height: 1.6;
    }

    .points {
      color: #e6a23c;
      font-weight: 600;
      font-size: 16px;
    }
  }

  .info-row {
    display: flex;
    gap: 32px;
  }

  .progress-section {
    margin-bottom: 20px;

    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;

      label {
        color: #909399;
        font-size: 13px;
        margin: 0;
      }

      .progress-value {
        color: #409eff;
        font-weight: 600;
      }
    }
  }

  .date-row {
    display: flex;
    gap: 20px;

    .info-item {
      flex: 1;
    }
  }
}

.subtasks-list {
  max-height: 600px;
  overflow-y: auto;
}

.notification-badge {
  margin-left: 8px;
}

.empty-deadlines,
.empty-delayed {
  padding: 20px;
}

.deadlines-list,
.delayed-list {
  max-height: 300px;
  overflow-y: auto;
}

.deadline-item,
.delayed-item {
  padding: 12px;
  border-bottom: 1px solid #f0f2f5;

  &:last-child {
    border-bottom: none;
  }
}

.deadline-title,
.delayed-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.deadline-date,
.delayed-date {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 13px;
  margin-bottom: 8px;
}

.delayed-title {
  color: #f56c6c;
}
</style>
