<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑子任务' : '添加子任务'"
    width="600px"
    @close="onClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入子任务标题" />
      </el-form-item>

      <el-form-item label="描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入子任务描述（可选）"
        />
      </el-form-item>

      <el-form-item label="状态">
        <el-select v-model="form.status" placeholder="请选择状态">
          <el-option label="待开始" value="pending" />
          <el-option label="进行中" value="in_progress" />
          <el-option label="已完成" value="completed" />
        </el-select>
      </el-form-item>

      <el-form-item label="进度">
        <el-slider
          v-model="form.progress"
          :min="0"
          :max="100"
          :step="5"
          show-input
        />
      </el-form-item>

      <el-form-item label="开始日期">
        <el-date-picker
          v-model="form.startDate"
          type="date"
          placeholder="选择开始日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="截止日期">
        <el-date-picker
          v-model="form.endDate"
          type="date"
          placeholder="选择截止日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="依赖任务">
        <el-select
          v-model="form.dependencyIds"
          multiple
          placeholder="选择依赖的前置任务"
          style="width: 100%"
        >
          <el-option
            v-for="task in availableDependencies"
            :key="task.id"
            :label="`#${task.order} ${task.title}`"
            :value="task.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="心得笔记">
        <el-input
          v-model="form.notes"
          type="textarea"
          :rows="3"
          placeholder="记录完成心得（可选）"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="onClose">取消</el-button>
      <el-button type="primary" @click="onSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { SubTask, SubTaskStatus } from '../stores/subtask'

const props = defineProps<{
  modelValue: boolean
  subTask?: SubTask | null
  challengeId: string
  existingSubTasks: SubTask[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', data: Partial<SubTask>): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const isEdit = computed(() => !!props.subTask)

const formRef = ref<FormInstance>()

const defaultForm = {
  title: '',
  description: '',
  status: 'pending' as SubTaskStatus,
  progress: 0,
  startDate: '',
  endDate: '',
  dependencyIds: [] as string[],
  notes: '',
}

const form = ref({ ...defaultForm })

const rules: FormRules = {
  title: [
    { required: true, message: '请输入子任务标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' },
  ],
}

const availableDependencies = computed(() => {
  return props.existingSubTasks.filter(t => t.id !== props.subTask?.id)
})

watch(
  () => props.modelValue,
  (val) => {
    if (val && props.subTask) {
      form.value = {
        title: props.subTask.title,
        description: props.subTask.description || '',
        status: props.subTask.status,
        progress: props.subTask.progress,
        startDate: props.subTask.startDate?.split('T')[0] || '',
        endDate: props.subTask.endDate?.split('T')[0] || '',
        dependencyIds: props.subTask.dependencyIds || [],
        notes: props.subTask.notes || '',
      }
    } else if (val) {
      form.value = { ...defaultForm }
    }
  }
)

const onClose = () => {
  formRef.value?.resetFields()
  emit('update:modelValue', false)
}

const onSubmit = async () => {
  await formRef.value?.validate()
  
  const data: Partial<SubTask> = {
    title: form.value.title,
    description: form.value.description || null,
    status: form.value.status,
    progress: form.value.progress,
    startDate: form.value.startDate || null,
    endDate: form.value.endDate || null,
    dependencyIds: form.value.dependencyIds,
    notes: form.value.notes || null,
    challengeId: props.challengeId,
  }

  emit('submit', data)
  onClose()
}
</script>
