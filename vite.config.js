/**
 * Vite 配置文件
 * 用于构建新的 Vue 3 组件
 *
 * 使用方法:
 *   1. npm install vue vite
 *   2. npx vite build
 */

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    // 输出目录
    outDir: 'dist',
    // 是否压缩
    minify: 'terser',
    // 构建目标
    target: 'es2015',
    // CDN URL 前缀（用于生产环境）
    base: '/static/',
    rollupOptions: {
      output: {
        // 手动分包
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia']
        }
      }
    }
  },
  // 开发服务器配置
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      }
    }
  }
})
