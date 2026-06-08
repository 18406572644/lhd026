<template>
  <el-dialog
    v-model="visible"
    title="🎉 恭喜完成挑战！"
    width="500px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div v-if="challenge" class="complete-content">
      <div class="challenge-info">
        <h3 class="challenge-title">{{ challenge.title }}</h3>
        <DifficultyBadge :difficulty="challenge.difficulty" />
      </div>
      <div class="points-badge">
        <span class="points-icon">🏆</span>
        <span class="points-value">+{{ challenge.points }}</span>
        <span class="points-label">积分</span>
      </div>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        label-position="right"
      >
        <el-form-item label="用时(分钟)" prop="durationMinutes">
          <el-input-number
            v-model="form.durationMinutes"
            :min="1"
            :max="9999"
            placeholder="请输入用时"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="心得" prop="note">
          <el-input
            v-model="form.note"
            type="textarea"
            :rows="3"
            placeholder="分享一下你的挑战心得..."
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确认完成</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { Challenge } from '~/stores/challenge'

const props = defineProps<{
  modelValue: boolean
  challenge?: Challenge | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'submit': [data: { note: string; durationMinutes: number; challenge: Challenge }]
}>()

const formRef = ref<FormInstance>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const defaultForm = () => ({
  note: '',
  durationMinutes: 30
})

const form = ref(defaultForm())

const rules: FormRules = {
  durationMinutes: [{ required: true, message: '请输入用时', trigger: 'blur' }],
  note: [{ required: true, message: '请分享你的心得', trigger: 'blur' }]
}

watch(() => props.modelValue, (val) => {
  if (!val) {
    form.value = defaultForm()
    formRef.value?.resetFields()
  }
})

const handleSubmit = async () => {
  if (!formRef.value || !props.challenge) return
  try {
    await formRef.value.validate()
    emit('submit', {
      note: form.value.note,
      durationMinutes: form.value.durationMinutes,
      challenge: props.challenge
    })
    visible.value = false
  } catch (e) {
    console.error('表单验证失败:', e)
  }
}

const handleClosed = () => {
  form.value = defaultForm()
  formRef.value?.resetFields()
}
</script>

<style lang="scss" scoped>
.complete-content {
  text-align: center;
}

.challenge-info {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.challenge-title {
  font-size: 24px;
  font-weight: 700;
  background: $primary-gradient;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.points-badge {
  background: $warning-gradient;
  border-radius: $border-radius-lg;
  padding: 20px 40px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  box-shadow: $shadow-md;

  .points-icon {
    font-size: 48px;
  }

  .points-value {
    font-size: 48px;
    font-weight: 800;
    color: white;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  }

  .points-label {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
  }
}

:deep(.el-form) {
  text-align: left;
}
</style>
