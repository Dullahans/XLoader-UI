<template>
  <div id="app" :class="{ 'dark-theme': isDarkTheme }">
    <div class="app-layout">
      <!-- 顶部导航栏 -->
      <header class="app-header">
        <div class="header-left">
          <div class="logo">
            <svg class="logo-icon" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="logo-text">电子负载参数管理</span>
          </div>
        </div>
        
        <div class="header-center">
          <nav class="main-nav">
            <router-link to="/" class="nav-item" exact>
              <i class="el-icon-s-home"></i>
              <span>首页</span>
            </router-link>
            <router-link to="/params" class="nav-item">
              <i class="el-icon-setting"></i>
              <span>参数编辑</span>
            </router-link>
            <router-link to="/files" class="nav-item">
              <i class="el-icon-folder"></i>
              <span>文件管理</span>
            </router-link>
            <router-link to="/device" class="nav-item">
              <i class="el-icon-monitor"></i>
              <span>设备连接</span>
            </router-link>
          </nav>
        </div>
        
        <div class="header-right">
          <!-- 设备状态指示 -->
          <div class="device-status" :class="{ connected: deviceConnected }">
            <span class="status-dot"></span>
            <span class="status-text">{{ deviceConnected ? '设备已连接' : '设备未连接' }}</span>
          </div>
          
          <!-- 主题切换 -->
          <el-tooltip content="切换主题" placement="bottom">
            <button class="theme-toggle" @click="toggleTheme">
              <i :class="isDarkTheme ? 'el-icon-sunny' : 'el-icon-moon'"></i>
            </button>
          </el-tooltip>
        </div>
      </header>
      
      <!-- 主内容区域 -->
      <main class="app-main">
        <transition name="fade-slide" mode="out-in">
          <router-view />
        </transition>
      </main>
      
      <!-- 状态栏 -->
      <footer class="app-footer">
        <div class="footer-left">
          <span class="ws-status" :class="{ connected: wsConnected }">
            <span class="status-indicator"></span>
            {{ wsConnected ? '实时连接' : '连接断开' }}
          </span>
        </div>
        <div class="footer-center">
          <span v-if="currentFile" class="current-file">
            <i class="el-icon-document"></i>
            {{ currentFile }}
            <span v-if="hasUnsavedChanges" class="unsaved-badge">●</span>
          </span>
        </div>
        <div class="footer-right">
          <span class="version">v1.0.0</span>
        </div>
      </footer>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'App',
  computed: {
    ...mapState(['wsConnected', 'currentFile', 'hasUnsavedChanges']),
    ...mapGetters(['deviceConnected']),
    isDarkTheme() {
      return this.$store.state.config.theme === 'dark'
    }
  },
  methods: {
    toggleTheme() {
      const newTheme = this.isDarkTheme ? 'light' : 'dark'
      this.$store.commit('SET_CONFIG', { theme: newTheme })
    }
  },
  mounted() {
    // 加载配置
    this.$store.dispatch('loadConfig')
  }
}
</script>

<style lang="scss">
// 重置样式和CSS变量定义在 main.scss 中
</style>




