import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Challenge, Difficulty } from './challenge'

export interface ChallengeRecord {
  id: string
  challengeId: string
  completedAt: string
  note: string | null
  durationMinutes: number | null
  challenge: Challenge
}

export const useRecordStore = defineStore('record', () => {
  const records = ref<ChallengeRecord[]>([])
  const loading = ref(false)

  const { get, post, del } = useApi()

  const fetchRecords = async () => {
    loading.value = true
    try {
      const result = await get<ChallengeRecord[]>('/api/records')
      if (result.success && result.data) {
        records.value = result.data
      }
    } catch (error) {
      console.error('Failed to fetch records:', error)
    } finally {
      loading.value = false
    }
  }

  const addRecord = async (data: { 
    challengeId: string
    note?: string
    durationMinutes?: number
  }) => {
    try {
      const result = await post<ChallengeRecord>('/api/records', data)
      if (result.success && result.data) {
        records.value.unshift(result.data)
        return result.data
      }
    } catch (error) {
      console.error('Failed to add record:', error)
    }
    return null
  }

  const deleteRecord = async (id: string) => {
    try {
      const result = await del(`/api/records/${id}`)
      if (result.success) {
        const index = records.value.findIndex(r => r.id === id)
        if (index !== -1) {
          records.value.splice(index, 1)
        }
        return true
      }
    } catch (error) {
      console.error('Failed to delete record:', error)
    }
    return false
  }

  const getRecordsByChallengeId = async (challengeId: string) => {
    try {
      const result = await get<ChallengeRecord[]>(`/api/records/challenge/${challengeId}`)
      if (result.success && result.data) {
        return result.data
      }
    } catch (error) {
      console.error('Failed to fetch records by challenge:', error)
    }
    return []
  }

  const getStats = computed(() => {
    const total = records.value.length
    const totalPoints = records.value.reduce((sum, r) => sum + (r.challenge?.points || 0), 0)
    
    const byDifficulty = {
      easy: records.value.filter(r => r.challenge?.difficulty === 'easy').length,
      medium: records.value.filter(r => r.challenge?.difficulty === 'medium').length,
      hard: records.value.filter(r => r.challenge?.difficulty === 'hard').length,
      expert: records.value.filter(r => r.challenge?.difficulty === 'expert').length
    }

    const byMonth: Record<string, number> = {}
    records.value.forEach(r => {
      const date = new Date(r.completedAt)
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      byMonth[month] = (byMonth[month] || 0) + 1
    })

    const sortedMonths = Object.keys(byMonth).sort()
    const monthlyData = sortedMonths.map(month => ({
      month,
      count: byMonth[month]
    }))

    const last7Days: { date: string; count: number }[] = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const count = records.value.filter(r => {
        const recordDate = new Date(r.completedAt).toISOString().split('T')[0]
        return recordDate === dateStr
      }).length
      last7Days.push({ date: dateStr, count })
    }

    let currentStreak = 0
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    
    const uniqueDates = [...new Set(records.value.map(r => {
      const d = new Date(r.completedAt)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    }))].sort((a, b) => b - a)

    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = new Date(todayDate)
      expectedDate.setDate(todayDate.getDate() - i)
      expectedDate.setHours(0, 0, 0, 0)
      
      if (uniqueDates.includes(expectedDate.getTime())) {
        currentStreak++
      } else if (i === 0) {
        const yesterday = new Date(todayDate)
        yesterday.setDate(todayDate.getDate() - 1)
        yesterday.setHours(0, 0, 0, 0)
        if (uniqueDates.includes(yesterday.getTime())) {
          currentStreak++
        } else {
          break
        }
      } else {
        break
      }
    }

    return {
      total,
      totalPoints,
      byDifficulty,
      monthlyData,
      last7Days,
      currentStreak
    }
  })

  return {
    records,
    loading,
    fetchRecords,
    addRecord,
    deleteRecord,
    getRecordsByChallengeId,
    getStats
  }
})
