<template>
  <div class="device-page page-container">
    <div class="page-header">
      <h1 class="page-title">设备连接</h1>
      <p class="page-subtitle">管理与电子负载设备的连接</p>
    </div>
    
    <div class="device-layout">
      <!-- 连接配置卡片 -->
      <div class="card connection-card">
        <div class="card-header">
          <h3 class="card-title">连接配置</h3>
          <div class="connection-status" :class="deviceConnected ? 'connected' : 'disconnected'">
            <span class="status-dot"></span>
            <span>{{ deviceConnected ? '已连接' : '未连接' }}</span>
          </div>
        </div>
        
        <div class="connection-form">
          <div class="form-row">
            <label>设备 IP 地址</label>
            <el-input 
              v-model="connectForm.ip" 
              placeholder="例如: 192.168.1.100"
              :disabled="deviceConnected"
            >
              <template slot="prepend">
                <i class="el-icon-location"></i>
              </template>
            </el-input>
          </div>
          
          <div class="form-row">
            <label>UDP 端口</label>
            <el-input-number 
              v-model="connectForm.port" 
              :min="1" 
              :max="65535"
              :disabled="deviceConnected"
              controls-position="right"
            />
          </div>
          
          <div class="form-actions">
            <el-button 
              v-if="!deviceConnected"
              type="primary" 
              icon="el-icon-connection"
              :loading="loading.device"
              @click="handleConnect"
            >
              连接设备
            </el-button>
            <el-button 
              v-else
              type="danger" 
              icon="el-icon-switch-button"
              @click="handleDisconnect"
            >
              断开连接
            </el-button>
            
            <el-button 
              icon="el-icon-search"
              @click="handleDiscover"
              :loading="discovering"
            >
              扫描设备
            </el-button>
          </div>
        </div>
      </div>
      
      <!-- 设备信息卡片 -->
      <div class="card device-info-card" v-if="deviceConnected">
        <div class="card-header">
          <h3 class="card-title">设备信息</h3>
        </div>
        
        <div class="device-info">
          <div class="info-row">
            <span class="info-label">设备型号</span>
            <span class="info-value">{{ device.info?.model || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">固件版本</span>
            <span class="info-value">{{ device.info?.firmware || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">序列号</span>
            <span class="info-value mono">{{ device.info?.serial || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">IP 地址</span>
            <span class="info-value mono">{{ device.ip }}:{{ device.port }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">最后心跳</span>
            <span class="info-value">{{ formatDate(device.lastHeartbeat) }}</span>
          </div>
        </div>
      </div>
      
      <!-- 设备发现列表 -->
      <div class="card discover-card" v-if="discoveredDevices.length > 0">
        <div class="card-header">
          <h3 class="card-title">发现的设备</h3>
          <el-button type="text" icon="el-icon-close" @click="discoveredDevices = []" />
        </div>
        
        <div class="device-list">
          <div 
            v-for="dev in discoveredDevices" 
            :key="dev.ip"
            class="device-item"
            @click="selectDevice(dev)"
          >
            <div class="device-icon">
              <i class="el-icon-cpu"></i>
            </div>
            <div class="device-details">
              <span class="device-model">{{ dev.model }}</span>
              <span class="device-ip">{{ dev.ip }}:{{ dev.port }}</span>
            </div>
            <el-button type="text" icon="el-icon-right" />
          </div>
        </div>
      </div>
      
      <!-- 操作面板 -->
      <div class="card actions-card" v-if="deviceConnected">
        <div class="card-header">
          <h3 class="card-title">设备操作</h3>
        </div>
        
        <div class="action-buttons">
          <el-button @click="readFromDevice" :loading="readingBin">
            <i class="el-icon-download"></i>
            读取设备参数
          </el-button>
          <el-button @click="syncToDevice" :disabled="!currentFile" :loading="loading.sync">
            <i class="el-icon-upload2"></i>
            同步参数到设备
          </el-button>
          <el-button @click="sendCommand('restart')">
            <i class="el-icon-refresh"></i>
            重启设备
          </el-button>
          <el-button @click="sendCommand('get_status')">
            <i class="el-icon-info"></i>
            获取状态
          </el-button>
        </div>
      </div>
      
      <!-- 通信日志 -->
      <div class="card log-card">
        <div class="card-header">
          <h3 class="card-title">通信日志</h3>
          <el-button type="text" icon="el-icon-delete" @click="logs = []">清空</el-button>
        </div>
        
        <div class="log-content" ref="logContainer">
          <div 
            v-for="(log, index) in logs" 
            :key="index"
            class="log-item"
            :class="log.type"
          >
            <span class="log-time">{{ log.time }}</span>
            <span class="log-type">{{ log.type.toUpperCase() }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
          <div v-if="logs.length === 0" class="log-empty">
            暂无日志
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import api from '@/api'

export default {
  name: 'DeviceConnect',
  data() {
    return {
      connectForm: {
        ip: '192.168.1.100',
        port: 8080
      },
      discovering: false,
      discoveredDevices: [],
      readingBin: false,
      logs: []
    }
  },
  computed: {
    ...mapState(['device', 'currentFile', 'loading']),
    ...mapGetters(['deviceConnected'])
  },
  mounted() {
    // 从配置中读取默认IP和端口
    this.loadDefaultSettings()
  },
  methods: {
    async loadDefaultSettings() {
      try {
        const { data } = await api.config.get()
        if (data.success && data.config.device) {
          this.connectForm.ip = data.config.device.defaultIp || this.connectForm.ip
          this.connectForm.port = data.config.device.defaultPort || this.connectForm.port
        }
      } catch (e) {
        // 忽略错误，使用默认值
      }
    },
    
    addLog(type, message) {
      const now = new Date()
      const time = now.toLocaleTimeString('zh-CN', { hour12: false })
      this.logs.unshift({ type, message, time })
      
      // 最多保留100条日志
      if (this.logs.length > 100) {
        this.logs.pop()
      }
    },
    
    async handleConnect() {
      if (!this.connectForm.ip) {
        this.$message.warning('请输入设备IP地址')
        return
      }
      
      this.addLog('info', `正在连接 ${this.connectForm.ip}:${this.connectForm.port}...`)
      
      const result = await this.$store.dispatch('connectDevice', {
        ip: this.connectForm.ip,
        port: this.connectForm.port
      })
      
      if (result.success) {
        this.addLog('success', '设备连接成功')
        this.$message.success('设备连接成功')
      } else {
        this.addLog('error', `连接失败: ${result.error}`)
        this.$message.error(result.error || '连接失败')
      }
    },
    
    async handleDisconnect() {
      this.addLog('info', '正在断开连接...')
      
      const result = await this.$store.dispatch('disconnectDevice')
      
      if (result.success) {
        this.addLog('info', '已断开连接')
        this.$message.info('已断开设备连接')
      } else {
        this.addLog('error', `断开失败: ${result.error}`)
      }
    },
    
    async handleDiscover() {
      this.discovering = true
      this.addLog('info', '正在扫描局域网设备...')
      
      try {
        const subnet = this.connectForm.ip.split('.').slice(0, 3).join('.')
        const { data } = await api.device.discover(subnet)
        
        if (data.success && data.devices) {
          this.discoveredDevices = data.devices
          this.addLog('success', `发现 ${data.devices.length} 台设备`)
        } else {
          this.addLog('warning', '未发现设备')
        }
      } catch (e) {
        this.addLog('error', `扫描失败: ${e.message}`)
      } finally {
        this.discovering = false
      }
    },
    
    selectDevice(dev) {
      this.connectForm.ip = dev.ip
      this.connectForm.port = dev.port
      this.addLog('info', `已选择设备 ${dev.ip}:${dev.port}`)
    },
    
    async readFromDevice() {
      this.readingBin = true
      this.addLog('info', '正在从设备读取参数...')
      
      try {
        const { data } = await api.device.readBin()
        
        if (data.success) {
          this.addLog('success', '参数读取成功')
          this.$message.success('参数读取成功')
          // TODO: 更新store中的参数
        } else {
          this.addLog('error', `读取失败: ${data.error}`)
        }
      } catch (e) {
        this.addLog('error', `读取失败: ${e.message}`)
      } finally {
        this.readingBin = false
      }
    },
    
    async syncToDevice() {
      this.addLog('info', '正在同步参数到设备...')
      
      const result = await this.$store.dispatch('syncToDevice')
      
      if (result.success) {
        this.addLog('success', '参数同步成功')
      } else {
        this.addLog('error', `同步失败: ${result.error}`)
      }
    },
    
    async sendCommand(command) {
      this.addLog('info', `发送命令: ${command}`)
      
      try {
        const { data } = await api.device.command(command, {})
        
        if (data.success) {
          this.addLog('success', `命令响应: ${data.response || 'OK'}`)
        } else {
          this.addLog('error', `命令失败: ${data.error}`)
        }
      } catch (e) {
        this.addLog('error', `命令失败: ${e.message}`)
      }
    },
    
    formatDate(date) {
      if (!date) return '-'
      return new Date(date).toLocaleString('zh-CN')
    }
  }
}
</script>

<style lang="scss" scoped>
.device-page {
  .page-header {
    margin-bottom: var(--spacing-lg);
    
    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
    }
    
    .page-subtitle {
      color: var(--text-secondary);
    }
  }
}

.device-layout {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
  
  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
  }
}

// 连接状态指示
.connection-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  
  &.connected {
    background: rgba(0, 230, 118, 0.15);
    color: var(--success-color);
    
    .status-dot {
      background: var(--success-color);
      box-shadow: 0 0 8px var(--success-color);
    }
  }
  
  &.disconnected {
    background: rgba(255, 82, 82, 0.15);
    color: var(--error-color);
    
    .status-dot {
      background: var(--error-color);
    }
  }
}

// 连接表单
.connection-form {
  .form-row {
    margin-bottom: var(--spacing-md);
    
    label {
      display: block;
      margin-bottom: 6px;
      font-size: 13px;
      color: var(--text-secondary);
    }
  }
  
  .form-actions {
    display: flex;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-lg);
  }
}

// 设备信息
.device-info {
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: var(--spacing-sm) 0;
    border-bottom: 1px solid var(--border-color);
    
    &:last-child {
      border-bottom: none;
    }
    
    .info-label {
      color: var(--text-muted);
      font-size: 13px;
    }
    
    .info-value {
      color: var(--text-primary);
      font-size: 13px;
      
      &.mono {
        font-family: var(--font-mono);
      }
    }
  }
}

// 设备发现列表
.device-list {
  .device-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
    
    &:hover {
      background: var(--bg-tertiary);
    }
    
    .device-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 212, 255, 0.1);
      border-radius: var(--radius-md);
      color: var(--primary-color);
      font-size: 20px;
    }
    
    .device-details {
      flex: 1;
      
      .device-model {
        display: block;
        font-weight: 500;
        color: var(--text-primary);
      }
      
      .device-ip {
        font-size: 12px;
        color: var(--text-muted);
        font-family: var(--font-mono);
      }
    }
  }
}

// 操作按钮
.action-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
  
  .el-button {
    justify-content: flex-start;
    
    i {
      margin-right: 8px;
    }
  }
}

// 日志卡片
.log-card {
  grid-column: 1 / -1;
}

.log-content {
  max-height: 300px;
  overflow-y: auto;
  font-family: var(--font-mono);
  font-size: 12px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
}

.log-item {
  display: flex;
  gap: var(--spacing-sm);
  padding: 4px 8px;
  border-radius: 4px;
  
  &:hover {
    background: var(--bg-elevated);
  }
  
  .log-time {
    color: var(--text-muted);
    flex-shrink: 0;
  }
  
  .log-type {
    flex-shrink: 0;
    width: 60px;
    font-weight: 500;
  }
  
  .log-message {
    flex: 1;
    color: var(--text-secondary);
  }
  
  &.info .log-type {
    color: var(--primary-color);
  }
  
  &.success .log-type {
    color: var(--success-color);
  }
  
  &.warning .log-type {
    color: var(--warning-color);
  }
  
  &.error .log-type {
    color: var(--error-color);
  }
}

.log-empty {
  text-align: center;
  color: var(--text-muted);
  padding: var(--spacing-lg);
}
</style>




