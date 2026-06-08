<template>
  <div class="stats-chart">
    <div v-if="type === 'bar'" class="bar-chart">
      <div class="chart-title">{{ title }}</div>
      <div class="chart-body">
        <div
          v-for="(item, index) in data"
          :key="index"
          class="bar-item"
        >
          <div class="bar-label">{{ item.label }}</div>
          <div class="bar-wrapper">
            <div
              class="bar-fill"
              :style="{
                width: getBarWidth(item.value) + '%',
                background: getGradient(index)
              }"
            >
              <span class="bar-value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="type === 'pie'" class="pie-chart">
      <div class="chart-title">{{ title }}</div>
      <div class="chart-body">
        <div class="pie-container">
          <svg viewBox="0 0 200 200" class="pie-svg">
            <circle
              v-for="(slice, index) in pieSlices"
              :key="index"
              cx="100"
              cy="100"
              r="80"
              fill="transparent"
              :stroke="slice.color"
              stroke-width="40"
              :stroke-dasharray="`${slice.percentage} ${100 - slice.percentage}`"
              :stroke-dashoffset="slice.offset"
              class="pie-slice"
            />
          </svg>
          <div class="pie-center">
            <div class="pie-total">{{ total }}</div>
            <div class="pie-label">总计</div>
          </div>
        </div>
        <div class="pie-legend">
          <div
            v-for="(item, index) in data"
            :key="index"
            class="legend-item"
          >
            <span
              class="legend-color"
              :style="{ background: getColor(index) }"
            ></span>
            <span class="legend-label">{{ item.label }}</span>
            <span class="legend-value">{{ item.value }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="type === 'line'" class="line-chart">
      <div class="chart-title">{{ title }}</div>
      <div class="chart-body">
        <svg :viewBox="`0 0 ${svgWidth} ${svgHeight}`" class="line-svg">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#667eea;stop-opacity:0.3" />
              <stop offset="100%" style="stop-color:#667eea;stop-opacity:0" />
            </linearGradient>
          </defs>
          <g class="grid">
            <line
              v-for="i in 5"
              :key="'h' + i"
              :x1="paddingLeft"
              :y1="paddingTop + (chartHeight / 5) * i"
              :x2="svgWidth - paddingRight"
              :y2="paddingTop + (chartHeight / 5) * i"
              stroke="#e4e7ed"
              stroke-dasharray="4"
            />
          </g>
          <path
            :d="areaPath"
            fill="url(#lineGradient)"
          />
          <path
            :d="linePath"
            fill="none"
            stroke="#667eea"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <g class="points">
            <circle
              v-for="(point, index) in points"
              :key="index"
              :cx="point.x"
              :cy="point.y"
              r="5"
              fill="#fff"
              stroke="#667eea"
              stroke-width="3"
            />
          </g>
          <g class="x-labels">
            <text
              v-for="(item, index) in data"
              :key="index"
              :x="paddingLeft + (chartWidth / (data.length - 1)) * index"
              :y="svgHeight - 15"
              text-anchor="middle"
              fill="#909399"
              font-size="11"
            >
              {{ item.label }}
            </text>
          </g>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface ChartData {
  label: string
  value: number
}

const props = withDefaults(defineProps<{
  type: 'bar' | 'pie' | 'line'
  title: string
  data: ChartData[]
}>(), {
  type: 'bar'
})

const colors = [
  '#667eea',
  '#f093fb',
  '#4facfe',
  '#fa709a',
  '#43e97b',
  '#fa709a',
  '#fee140',
  '#30cfd0'
]

const getColor = (index: number) => colors[index % colors.length]

const getGradient = (index: number) => {
  const color = getColor(index)
  return `linear-gradient(90deg, ${color}99 0%, ${color} 100%)`
}

const maxValue = computed(() => {
  if (props.data.length === 0) return 1
  return Math.max(...props.data.map(d => d.value), 1)
})

const getBarWidth = (value: number) => {
  return (value / maxValue.value) * 100
}

const total = computed(() => props.data.reduce((sum, d) => sum + d.value, 0))

const pieSlices = computed(() => {
  let offset = 25
  return props.data.map((item, index) => {
    const percentage = total.value > 0 ? (item.value / total.value) * 100 : 0
    const slice = {
      percentage,
      offset: -offset,
      color: getColor(index)
    }
    offset += percentage
    return slice
  })
})

const svgWidth = 600
const svgHeight = 300
const paddingTop = 40
const paddingRight = 40
const paddingBottom = 50
const paddingLeft = 60
const chartWidth = svgWidth - paddingLeft - paddingRight
const chartHeight = svgHeight - paddingTop - paddingBottom

const points = computed(() => {
  if (props.data.length === 0) return []
  return props.data.map((item, index) => ({
    x: paddingLeft + (chartWidth / (props.data.length - 1)) * index,
    y: paddingTop + chartHeight - (item.value / maxValue.value) * chartHeight
  }))
})

const linePath = computed(() => {
  if (points.value.length === 0) return ''
  return points.value
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')
})

const areaPath = computed(() => {
  if (points.value.length === 0) return ''
  const first = points.value[0]
  const last = points.value[points.value.length - 1]
  return `${linePath.value} L ${last.x} ${paddingTop + chartHeight} L ${first.x} ${paddingTop + chartHeight} Z`
})
</script>

<style lang="scss" scoped>
.stats-chart {
  background: $card-bg;
  border-radius: $border-radius-md;
  padding: 24px;
  box-shadow: $shadow-sm;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

.bar-chart {
  .bar-item {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    gap: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .bar-label {
    width: 80px;
    font-size: 13px;
    color: #606266;
    flex-shrink: 0;
  }

  .bar-wrapper {
    flex: 1;
    height: 32px;
    background: #f5f7fa;
    border-radius: 16px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 12px;
    transition: width 1s ease-out;
    min-width: 40px;
  }

  .bar-value {
    color: white;
    font-size: 12px;
    font-weight: 600;
  }
}

.pie-chart {
  .chart-body {
    display: flex;
    align-items: center;
    gap: 40px;
  }

  .pie-container {
    position: relative;
    width: 200px;
    height: 200px;
  }

  .pie-svg {
    transform: rotate(-90deg);
  }

  .pie-slice {
    transition: stroke-dasharray 0.8s ease-out, stroke-dashoffset 0.8s ease-out;
    cursor: pointer;

    &:hover {
      filter: brightness(1.1);
    }
  }

  .pie-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
  }

  .pie-total {
    font-size: 32px;
    font-weight: 700;
    background: $primary-gradient;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .pie-label {
    font-size: 12px;
    color: #909399;
  }

  .pie-legend {
    flex: 1;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .legend-color {
    width: 16px;
    height: 16px;
    border-radius: 4px;
  }

  .legend-label {
    flex: 1;
    font-size: 13px;
    color: #606266;
  }

  .legend-value {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }
}

.line-chart {
  .chart-body {
    overflow-x: auto;
  }

  .line-svg {
    width: 100%;
    max-width: 600px;
    height: auto;
  }

  .points circle {
    cursor: pointer;
    transition: r 0.2s ease;

    &:hover {
      r: 7;
    }
  }
}
</style>
