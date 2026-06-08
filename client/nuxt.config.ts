export default defineNuxtConfig({
  compatibilityDate: '2024-06-08',
  devtools: { enabled: true },
  modules: [
    '@element-plus/nuxt',
    '@pinia/nuxt'
  ],
  elementPlus: {
    importStyle: 'scss'
  },
  css: [
    '~/assets/css/main.scss',
    'element-plus/dist/index.css'
  ],
  runtimeConfig: {
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:6026',
    public: {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:6026'
    }
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/assets/css/variables.scss" as *;'
        }
      }
    },
    server: {
      proxy: {
        '/api': {
          target: process.env.API_BASE_URL || 'http://localhost:6026',
          changeOrigin: true
        }
      }
    }
  },
  nitro: {
    routeRules: {
      '/api/**': {
        proxy: `${process.env.API_BASE_URL || 'http://localhost:6026'}/api/**`
      }
    },
    devProxy: {
      '/api': {
        target: process.env.API_BASE_URL || 'http://localhost:6026',
        changeOrigin: true
      }
    }
  },
  app: {
    head: {
      title: '挑战随机抽',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  }
})
