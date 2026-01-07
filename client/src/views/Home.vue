<template>
  <div class="home-page page-container">
    <!-- 欢迎区域 -->
    <section class="welcome-section">
      <div class="welcome-content">
        <h1 class="welcome-title">
          <span class="title-icon">⚡</span>
          电子负载参数管理系统
        </h1>
        <p class="welcome-desc">
          管理仿真模型参数配置，实时编辑、保存并同步到设备
        </p>
      </div>
      <div class="welcome-visual">
        <div class="circuit-animation">
          <svg viewBox="0 0 200 120" class="circuit-svg">
            <defs>
              <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#00d4ff;stop-opacity:0" />
                <stop offset="50%" style="stop-color:#00d4ff;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#00d4ff;stop-opacity:0" />
              </linearGradient>
            </defs>
            <!-- 电路线条 -->
            <path d="M10,60 L50,60 L50,30 L90,30" class="circuit-line" />
            <path d="M50,60 L50,90 L90,90" class="circuit-line" />
            <path d="M90,30 L90,90" class="circuit-line" />
            <path d="M90,60 L130,60" class="circuit-line" />
            <path d="M130,40 L130,80" class="circuit-line resistor" />
            <path d="M130,60 L170,60 L190,60" class="circuit-line" />
            <!-- 脉冲动画 -->
            <circle r="4" class="pulse-dot">
              <animateMotion dur="3s" repeatCount="indefinite" path="M10,60 L50,60 L50,30 L90,30 L90,60 L130,60 L170,60 L190,60" />
            </circle>
          </svg>
        </div>
      </div>
    </section>
    
    <!-- 快速操作卡片 -->
    <section class="quick-actions">
      <h2 class="section-title">快速开始</h2>
      <div class="action-cards">
        <router-link to="/params" class="action-card">
          <div class="card-icon params-icon">
            <i class="el-icon-setting"></i>
          </div>
          <div class="card-content">
            <h3>参数编辑</h3>
            <p>编辑仿真模型参数配置</p>
          </div>
          <i class="el-icon-arrow-right card-arrow"></i>
        </router-link>
        
        <router-link to="/files" class="action-card">
          <div class="card-icon files-icon">
            <i class="el-icon-folder-opened"></i>
          </div>
          <div class="card-content">
            <h3>文件管理</h3>
            <p>管理本地bin参数文件</p>
          </div>
          <i class="el-icon-arrow-right card-arrow"></i>
        </router-link>
        
        <router-link to="/device" class="action-card">
          <div class="card-icon device-icon">
            <i class="el-icon-connection"></i>
          </div>
          <div class="card-content">
            <h3>设备连接</h3>
            <p>连接电子负载设备</p>
          </div>
          <i class="el-icon-arrow-right card-arrow"></i>
        </router-link>
      </div>
    </section>
    
    <!-- 状态概览 -->
    <section class="status-overview">
      <h2 class="section-title">状态概览</h2>
      <div class="status-grid">
        <!-- 设备状态 -->
        <div class="status-card">
          <div class="status-header">
            <span class="status-label">设备连接</span>
            <span class="status-badge" :class="deviceConnected ? 'success' : 'offline'">
              {{ deviceConnected ? '已连接' : '未连接' }}
            </span>
          </div>
          <div class="status-body" v-if="deviceConnected">
            <div class="status-item">
              <span class="item-label">设备IP</span>
              <span class="item-value">{{ device.ip }}</span>
            </div>
            <div class="status-item">
              <span class="item-label">设备型号</span>
              <span class="item-value">{{ device.info?.model || '-' }}</span>
            </div>
          </div>
          <div class="status-body empty" v-else>
            <p>点击"设备连接"配置设备</p>
          </div>
        </div>
        
        <!-- 当前文件 -->
        <div class="status-card">
          <div class="status-header">
            <span class="status-label">当前文件</span>
            <span class="status-badge" :class="currentFile ? 'active' : 'inactive'">
              {{ currentFile ? '已打开' : '未选择' }}
            </span>
          </div>
          <div class="status-body" v-if="currentFile">
            <div class="file-info">
              <i class="el-icon-document"></i>
              <span class="file-name">{{ currentFile }}</span>
            </div>
            <div class="status-item" v-if="hasUnsavedChanges">
              <span class="unsaved-warning">
                <i class="el-icon-warning"></i>
                有未保存的更改
              </span>
            </div>
          </div>
          <div class="status-body empty" v-else>
            <p>点击"文件管理"选择文件</p>
          </div>
        </div>
        
        <!-- 文件统计 -->
        <div class="status-card">
          <div class="status-header">
            <span class="status-label">文件统计</span>
          </div>
          <div class="status-body">
            <div class="stats-row">
              <div class="stat-item">
                <span class="stat-value">{{ fileList.length }}</span>
                <span class="stat-label">参数文件</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ backupList.length }}</span>
                <span class="stat-label">备份文件</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'HomeView',
  computed: {
    ...mapState(['device', 'currentFile', 'hasUnsavedChanges', 'fileList', 'backupList']),
    ...mapGetters(['deviceConnected'])
  },
  mounted() {
    // 加载文件列表和备份列表
    this.$store.dispatch('loadFileList')
    this.$store.dispatch('loadBackupList')
  }
}
</script>

<style lang="scss" scoped>
.home-page {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

// 欢迎区域
.welcome-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xl) var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-tertiary) 100%);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--primary-color), var(--accent-color), var(--primary-color));
    background-size: 200% 100%;
    animation: gradientMove 3s linear infinite;
  }
}

@keyframes gradientMove {
  0% { background-position: 0% 0%; }
  100% { background-position: 200% 0%; }
}

.welcome-content {
  .welcome-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: var(--spacing-sm);
    
    .title-icon {
      font-size: 32px;
    }
  }
  
  .welcome-desc {
    color: var(--text-secondary);
    font-size: 15px;
  }
}

.welcome-visual {
  .circuit-animation {
    width: 200px;
    height: 120px;
  }
  
  .circuit-svg {
    width: 100%;
    height: 100%;
  }
  
  .circuit-line {
    fill: none;
    stroke: var(--border-light);
    stroke-width: 2;
    
    &.resistor {
      stroke-dasharray: 8 4;
    }
  }
  
  .pulse-dot {
    fill: var(--primary-color);
    filter: drop-shadow(0 0 6px var(--primary-color));
  }
}

// 章节标题
.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
  padding-left: var(--spacing-sm);
  border-left: 3px solid var(--primary-color);
}

// 快速操作卡片
.quick-actions {
  margin-bottom: var(--spacing-xl);
}

.action-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.action-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: all var(--transition-normal);
  
  &:hover {
    border-color: var(--primary-color);
    box-shadow: var(--shadow-glow);
    transform: translateY(-2px);
    
    .card-arrow {
      transform: translateX(4px);
      color: var(--primary-color);
    }
  }
  
  .card-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    font-size: 24px;
    
    &.params-icon {
      background: rgba(0, 212, 255, 0.1);
      color: var(--primary-color);
    }
    
    &.files-icon {
      background: rgba(255, 107, 53, 0.1);
      color: var(--accent-color);
    }
    
    &.device-icon {
      background: rgba(0, 230, 118, 0.1);
      color: var(--success-color);
    }
  }
  
  .card-content {
    flex: 1;
    
    h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
    }
    
    p {
      font-size: 13px;
      color: var(--text-secondary);
    }
  }
  
  .card-arrow {
    color: var(--text-muted);
    font-size: 18px;
    transition: all var(--transition-fast);
  }
}

// 状态概览
.status-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.status-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  
  .status-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md);
    background: var(--bg-tertiary);
    border-bottom: 1px solid var(--border-color);
    
    .status-label {
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .status-badge {
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 12px;
      
      &.success {
        background: rgba(0, 230, 118, 0.15);
        color: var(--success-color);
      }
      
      &.offline {
        background: rgba(255, 82, 82, 0.15);
        color: var(--error-color);
      }
      
      &.active {
        background: rgba(0, 212, 255, 0.15);
        color: var(--primary-color);
      }
      
      &.inactive {
        background: var(--bg-tertiary);
        color: var(--text-muted);
      }
    }
  }
  
  .status-body {
    padding: var(--spacing-md);
    
    &.empty {
      text-align: center;
      color: var(--text-muted);
      font-size: 13px;
      padding: var(--spacing-lg);
    }
  }
  
  .status-item {
    display: flex;
    justify-content: space-between;
    padding: var(--spacing-xs) 0;
    
    .item-label {
      color: var(--text-muted);
      font-size: 13px;
    }
    
    .item-value {
      color: var(--text-primary);
      font-family: var(--font-mono);
      font-size: 13px;
    }
  }
  
  .file-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--primary-color);
    margin-bottom: var(--spacing-sm);
    
    .file-name {
      font-family: var(--font-mono);
    }
  }
  
  .unsaved-warning {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--warning-color);
    font-size: 12px;
  }
  
  .stats-row {
    display: flex;
    justify-content: space-around;
    
    .stat-item {
      text-align: center;
      
      .stat-value {
        display: block;
        font-size: 28px;
        font-weight: 700;
        color: var(--primary-color);
        font-family: var(--font-mono);
      }
      
      .stat-label {
        font-size: 12px;
        color: var(--text-muted);
      }
    }
  }
}
</style>




