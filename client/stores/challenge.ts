import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'

export interface Challenge {
  id: string
  title: string
  description: string
  difficulty: Difficulty
  points: number
  category: string
  startDate: string | null
  endDate: string | null
  overallProgress: number
  createdAt: string
  updatedAt: string
}

export const useChallengeStore = defineStore('challenge', () => {
  const challenges = ref<Challenge[]>([])
  const loading = ref(false)
  const stats = ref<any>(null)

  const { get, post, put, patch, del } = useApi()

  const fetchChallenges = async (difficulty?: Difficulty) => {
    loading.value = true
    try {
      const params = difficulty ? { difficulty } : {}
      const result = await get<Challenge[]>('/api/challenges', params)
      if (result.success && result.data) {
        challenges.value = result.data
      }
    } catch (error) {
      console.error('Failed to fetch challenges:', error)
    } finally {
      loading.value = false
    }
  }

  const fetchStats = async () => {
    try {
      const result = await get<any>('/api/challenges/stats')
      if (result.success && result.data) {
        stats.value = result.data
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const getRandomChallenge = async (difficulty?: Difficulty): Promise<Challenge | null> => {
    try {
      const params = difficulty ? { difficulty } : {}
      const result = await get<Challenge>('/api/challenges/random', params)
      if (result.success && result.data) {
        return result.data
      }
    } catch (error) {
      console.error('Failed to get random challenge:', error)
    }
    return null
  }

  const addChallenge = async (challenge: Omit<Challenge, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const result = await post<Challenge>('/api/challenges', challenge)
      if (result.success && result.data) {
        challenges.value.unshift(result.data)
        return result.data
      }
    } catch (error) {
      console.error('Failed to add challenge:', error)
    }
    return null
  }

  const updateChallenge = async (id: string, updates: Partial<Challenge>) => {
    try {
      const result = await patch<Challenge>(`/api/challenges/${id}`, updates)
      if (result.success && result.data) {
        const index = challenges.value.findIndex(c => c.id === id)
        if (index !== -1) {
          challenges.value[index] = result.data
        }
        return result.data
      }
    } catch (error) {
      console.error('Failed to update challenge:', error)
    }
    return null
  }

  const deleteChallenge = async (id: string) => {
    try {
      const result = await del(`/api/challenges/${id}`)
      if (result.success) {
        const index = challenges.value.findIndex(c => c.id === id)
        if (index !== -1) {
          challenges.value.splice(index, 1)
        }
        return true
      }
    } catch (error) {
      console.error('Failed to delete challenge:', error)
    }
    return false
  }

  const getChallengeById = (id: string) => {
    return challenges.value.find(c => c.id === id) || null
  }

  const shareChallenge = async (id: string) => {
    try {
      const result = await get<any>(`/api/challenges/${id}/share`)
      if (result.success && result.data) {
        return result.data
      }
    } catch (error) {
      console.error('Failed to get share data:', error)
    }
    return null
  }

  const getDifficultyColor = (difficulty: Difficulty): string => {
    const colors: Record<Difficulty, string> = {
      easy: '#67c23a',
      medium: '#e6a23c',
      hard: '#f56c6c',
      expert: '#9b59b6'
    }
    return colors[difficulty]
  }

  const getDifficultyLabel = (difficulty: Difficulty): string => {
    const labels: Record<Difficulty, string> = {
      easy: '简单',
      medium: '中等',
      hard: '困难',
      expert: '专家'
    }
    return labels[difficulty]
  }

  const getDifficultyIcon = (difficulty: Difficulty): string => {
    const icons: Record<Difficulty, string> = {
      easy: '⭐',
      medium: '⭐⭐',
      hard: '⭐⭐⭐',
      expert: '⭐⭐⭐⭐'
    }
    return icons[difficulty]
  }

  const filteredChallenges = computed(() => {
    return (difficulty?: Difficulty) => {
      if (!difficulty) return challenges.value
      return challenges.value.filter(c => c.difficulty === difficulty)
    }
  })

  const randomChallenge = computed(() => {
    return (difficulty?: Difficulty) => {
      const list = difficulty
        ? challenges.value.filter(c => c.difficulty === difficulty)
        : challenges.value
      if (list.length === 0) return null
      const index = Math.floor(Math.random() * list.length)
      return list[index]
    }
  })

  const getStats = computed(() => {
    const total = challenges.value.length
    const byDifficulty = {
      easy: challenges.value.filter(c => c.difficulty === 'easy').length,
      medium: challenges.value.filter(c => c.difficulty === 'medium').length,
      hard: challenges.value.filter(c => c.difficulty === 'hard').length,
      expert: challenges.value.filter(c => c.difficulty === 'expert').length
    }
    const categories = [...new Set(challenges.value.map(c => c.category))]
    const totalPoints = challenges.value.reduce((sum, c) => sum + c.points, 0)
    return { 
      total, 
      byDifficulty, 
      categories, 
      totalPoints,
      serverStats: stats.value
    }
  })

  return {
    challenges,
    loading,
    stats,
    fetchChallenges,
    fetchStats,
    getRandomChallenge,
    addChallenge,
    updateChallenge,
    deleteChallenge,
    getChallengeById,
    shareChallenge,
    getDifficultyColor,
    getDifficultyLabel,
    getDifficultyIcon,
    filteredChallenges,
    randomChallenge,
    getStats
  }
})
