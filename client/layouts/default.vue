<template>
  <div class="layout">
    <header class="navbar">
      <div class="navbar-content">
        <div class="logo">
          <span class="logo-icon">🎯</span>
          <span class="logo-text">挑战随机抽</span>
        </div>
        <nav class="nav-menu">
          <NuxtLink to="/" class="nav-item" :class="{ active: route.path === '/' }">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </NuxtLink>
          <NuxtLink to="/challenges" class="nav-item" :class="{ active: route.path.startsWith('/challenges') }">
            <el-icon><Collection /></el-icon>
            <span>挑战库</span>
          </NuxtLink>
          <NuxtLink to="/records" class="nav-item" :class="{ active: route.path === '/records' }">
            <el-icon><List /></el-icon>
            <span>记录</span>
          </NuxtLink>
          <NuxtLink to="/stats" class="nav-item" :class="{ active: route.path === '/stats' }">
            <el-icon><DataLine /></el-icon>
            <span>统计</span>
          </NuxtLink>
        </nav>
        <div class="nav-right">
          <DeadlineReminder />
        </div>
      </div>
    </header>
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { House, Collection, List, DataLine } from '@element-plus/icons-vue'
import DeadlineReminder from '../components/DeadlineReminder.vue'

const route = useRoute()
</script>

<style lang="scss" scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: $primary-gradient;
  box-shadow: $shadow-md;
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-size: 20px;
  font-weight: 700;
}

.logo-icon {
  font-size: 28px;
}

.nav-menu {
  display: flex;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  border-radius: $border-radius-sm;
  transition: all 0.3s ease;

  &:hover {
    color: white;
    background: rgba(255, 255, 255, 0.15);
  }

  &.active {
    color: white;
    background: rgba(255, 255, 255, 0.25);
    font-weight: 600;
  }

  :deep(.el-icon) {
    font-size: 18px;
  }
}

.main-content {
  flex: 1;
}
</style>
