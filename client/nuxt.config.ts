export default defineNuxtConfig({
  compatibilityDate: '2026-06-08',
  devtools: { enabled: true },
  modules: [
    '@element-plus/nuxt',
    '@pinia/nuxt'
  ],
  elementPlus: {
    icon: 'ElIcon',
    importStyle: 'scss'
  },
  css: [
    '~/assets/css/main.scss',
    'element-plus/dist/index.css'
  ],
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
          target: 'http://localhost:3001',
          changeOrigin: true
        }
      }
    }
  },
  nitro: {
    devProxy: {
      '/api': {
        target: 'http://localhost:3001',
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
