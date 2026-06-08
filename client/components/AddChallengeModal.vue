<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑挑战' : '添加挑战'"
    width="500px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
      label-position="right"
    >
      <el-form-item label="标题" prop="title">
        <el-input
          v-model="form.title"
          placeholder="请输入挑战标题"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入挑战描述"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="难度" prop="difficulty">
        <el-select v-model="form.difficulty" placeholder="请选择难度" style="width: 100%">
          <el-option label="简单 ⭐" value="easy" />
          <el-option label="中等 ⭐⭐" value="medium" />
          <el-option label="困难 ⭐⭐⭐" value="hard" />
          <el-option label="专家 ⭐⭐⭐⭐" value="expert" />
        </el-select>
      </el-form-item>
      <el-form-item label="积分" prop="points">
        <el-input-number
          v-model="form.points"
          :min="1"
          :max="500"
          placeholder="请输入积分"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="分类" prop="category">
        <el-select
          v-model="form.category"
          placeholder="请选择或输入分类"
          filterable
          allow-create
          style="width: 100%"
        >
          <el-option
            v-for="cat in categories"
            :key="cat"
            :label="cat"
            :value="cat"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">
        {{ isEdit ? '保存' : '添加' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { Challenge, Difficulty } from '~/stores/challenge'

const props = defineProps<{
  modelValue: boolean
  challenge?: Challenge | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'submit': [data: Omit<Challenge, 'id' | 'createdAt' | 'updatedAt'>]
}>()

const challengeStore = useChallengeStore()
const formRef = ref<FormInstance>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEdit = computed(() => !!props.challenge)

const categories = computed(() => challengeStore.getStats.categories)

const defaultForm = () => ({
  title: '',
  description: '',
  difficulty: 'easy' as Difficulty,
  points: 50,
  category: ''
})

const form = ref(defaultForm())

const rules: FormRules = {
  title: [{ required: true, message: '请输入挑战标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入挑战描述', trigger: 'blur' }],
  difficulty: [{ required: true, message: '请选择难度', trigger: 'change' }],
  points: [{ required: true, message: '请输入积分', trigger: 'blur' }],
  category: [{ required: true, message: '请选择或输入分类', trigger: 'change' }]
}

watch(() => props.challenge, (val) => {
  if (val) {
    form.value = {
      title: val.title,
      description: val.description,
      difficulty: val.difficulty,
      points: val.points,
      category: val.category
    }
  } else {
    form.value = defaultForm()
  }
}, { immediate: true })

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    emit('submit', { ...form.value })
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
