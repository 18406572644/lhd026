<template>
  <el-tag
    :type="tagType"
    effect="light"
    round
    class="difficulty-badge"
    :style="{ borderColor: badgeColor, color: badgeColor }"
  >
    <span class="icon">{{ difficultyIcon }}</span>
    <span>{{ difficultyLabel }}</span>
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Difficulty } from '~/stores/challenge'

const props = defineProps<{
  difficulty: Difficulty
}>()

const challengeStore = useChallengeStore()

const badgeColor = computed(() => challengeStore.getDifficultyColor(props.difficulty))
const difficultyLabel = computed(() => challengeStore.getDifficultyLabel(props.difficulty))
const difficultyIcon = computed(() => challengeStore.getDifficultyIcon(props.difficulty))

const tagType = computed(() => {
  const types: Record<Difficulty, 'success' | 'warning' | 'danger' | 'info'> = {
    easy: 'success',
    medium: 'warning',
    hard: 'danger',
    expert: 'info'
  }
  return types[props.difficulty]
})
</script>

<style lang="scss" scoped>
.difficulty-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  padding: 4px 12px;

  .icon {
    font-size: 12px;
  }
}
</style>
