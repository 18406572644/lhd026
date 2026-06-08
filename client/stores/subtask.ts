import { defineStore } from 'pinia'
import { ref } from 'vue'

export type SubTaskStatus = 'pending' | 'in_progress' | 'completed' | 'delayed'

export interface SubTask {
  id: string
  title: string
  description: string | null
  status: SubTaskStatus
  order: number
  progress: number
  startDate: string | null
  endDate: string | null
  completedAt: string | null
  notes: string | null
  challengeId: string
  dependencyIds: string[] | null
  dependencies: Array<{ id: string; title: string }> | null
  createdAt: string
  updatedAt: string
}

export interface AiSuggestedTask {
  title: string
  description: string
  order: number
  estimatedDays: number
  dependencies: number[]
}

export interface GanttData {
  challenge: {
    id: string
    title: string
    startDate: string | null
    endDate: string | null
    overallProgress: number
  }
  subTasks: Array<{
    id: string
    title: string
    description: string | null
    status: SubTaskStatus
    progress: number
    order: number
    startDate: string | null
    endDate: string | null
    completedAt: string | null
    dependencyIds: string[]
    dependencies: Array<{ id: string; title: string }>
  }>
}

export const useSubTaskStore = defineStore('subtask', () => {
  const subTasks = ref<SubTask[]>([])
  const loading = ref(false)
  const ganttData = ref<GanttData | null>(null)
  const delayedTasks = ref<SubTask[]>([])
  const upcomingDeadlines = ref<SubTask[]>([])

  const { get, post, patch, del } = useApi()

  const fetchSubTasks = async (challengeId: string) => {
    loading.value = true
    try {
      const result = await get<SubTask[]>(`/api/subtasks/challenge/${challengeId}`)
      if (result.success && result.data) {
        subTasks.value = result.data
      }
    } catch (error) {
      console.error('Failed to fetch subtasks:', error)
    } finally {
      loading.value = false
    }
  }

  const fetchGanttData = async (challengeId: string) => {
    try {
      const result = await get<GanttData>(`/api/subtasks/challenge/${challengeId}/gantt`)
      if (result.success && result.data) {
        ganttData.value = result.data
      }
    } catch (error) {
      console.error('Failed to fetch gantt data:', error)
    }
  }

  const fetchProgress = async (challengeId: string): Promise<number> => {
    try {
      const result = await get<number>(`/api/subtasks/challenge/${challengeId}/progress`)
      if (result.success && result.data !== undefined) {
        return result.data
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error)
    }
    return 0
  }

  const addSubTask = async (subTask: Omit<SubTask, 'id' | 'createdAt' | 'updatedAt' | 'dependencies'>) => {
    try {
      const result = await post<SubTask>('/api/subtasks', subTask)
      if (result.success && result.data) {
        subTasks.value.push(result.data)
        return result.data
      }
    } catch (error) {
      console.error('Failed to add subtask:', error)
    }
    return null
  }

  const updateSubTask = async (id: string, updates: Partial<SubTask>) => {
    try {
      const result = await patch<SubTask>(`/api/subtasks/${id}`, updates)
      if (result.success && result.data) {
        const index = subTasks.value.findIndex(s => s.id === id)
        if (index !== -1) {
          subTasks.value[index] = result.data
        }
        return result.data
      }
    } catch (error) {
      console.error('Failed to update subtask:', error)
    }
    return null
  }

  const completeSubTask = async (id: string, notes?: string) => {
    try {
      const result = await post<SubTask>(`/api/subtasks/${id}/complete`, { notes })
      if (result.success && result.data) {
        const index = subTasks.value.findIndex(s => s.id === id)
        if (index !== -1) {
          subTasks.value[index] = result.data
        }
        return result.data
      }
    } catch (error) {
      console.error('Failed to complete subtask:', error)
    }
    return null
  }

  const deleteSubTask = async (id: string) => {
    try {
      const result = await del(`/api/subtasks/${id}`)
      if (result.success) {
        const index = subTasks.value.findIndex(s => s.id === id)
        if (index !== -1) {
          subTasks.value.splice(index, 1)
        }
        return true
      }
    } catch (error) {
      console.error('Failed to delete subtask:', error)
    }
    return false
  }

  const reorderSubTasks = async (challengeId: string, reorderedIds: string[]) => {
    try {
      const result = await post<SubTask[]>(`/api/subtasks/challenge/${challengeId}/reorder`, {
        reorderedIds,
      })
      if (result.success && result.data) {
        subTasks.value = result.data
        return result.data
      }
    } catch (error) {
      console.error('Failed to reorder subtasks:', error)
    }
    return null
  }

  const getAiSuggestions = async (challengeDescription: string): Promise<AiSuggestedTask[]> => {
    try {
      const result = await post<{ suggestions: AiSuggestedTask[] }>('/api/subtasks/ai-suggest', {
        challengeDescription,
      })
      if (result.success && result.data) {
        return result.data.suggestions
      }
    } catch (error) {
      console.error('Failed to get AI suggestions:', error)
    }
    return []
  }

  const fetchDelayedTasks = async () => {
    try {
      const result = await get<SubTask[]>('/api/subtasks/delayed')
      if (result.success && result.data) {
        delayedTasks.value = result.data
      }
    } catch (error) {
      console.error('Failed to fetch delayed tasks:', error)
    }
  }

  const fetchUpcomingDeadlines = async (days: number = 3) => {
    try {
      const result = await get<SubTask[]>('/api/subtasks/upcoming', { days })
      if (result.success && result.data) {
        upcomingDeadlines.value = result.data
      }
    } catch (error) {
      console.error('Failed to fetch upcoming deadlines:', error)
    }
  }

  const getSubTaskById = (id: string) => {
    return subTasks.value.find(s => s.id === id) || null
  }

  const getStatusColor = (status: SubTaskStatus): string => {
    const colors: Record<SubTaskStatus, string> = {
      pending: '#909399',
      in_progress: '#409eff',
      completed: '#67c23a',
      delayed: '#f56c6c',
    }
    return colors[status]
  }

  const getStatusLabel = (status: SubTaskStatus): string => {
    const labels: Record<SubTaskStatus, string> = {
      pending: '待开始',
      in_progress: '进行中',
      completed: '已完成',
      delayed: '已延期',
    }
    return labels[status]
  }

  const canStart = (subTask: SubTask): boolean => {
    if (!subTask.dependencyIds || subTask.dependencyIds.length === 0) {
      return true
    }
    return subTask.dependencyIds.every(depId => {
      const dep = subTasks.value.find(s => s.id === depId)
      return dep && dep.status === 'completed'
    })
  }

  return {
    subTasks,
    loading,
    ganttData,
    delayedTasks,
    upcomingDeadlines,
    fetchSubTasks,
    fetchGanttData,
    fetchProgress,
    addSubTask,
    updateSubTask,
    completeSubTask,
    deleteSubTask,
    reorderSubTasks,
    getAiSuggestions,
    fetchDelayedTasks,
    fetchUpcomingDeadlines,
    getSubTaskById,
    getStatusColor,
    getStatusLabel,
    canStart,
  }
})
