<template>
  <div class="param-editor-page page-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">参数编辑</h1>
        <p class="page-subtitle">编辑仿真模型的接口参数配置</p>
      </div>
      <div class="header-actions">
        <el-button 
          type="primary" 
          icon="el-icon-check"
          :loading="loading.params"
          :disabled="!currentFile || !hasUnsavedChanges"
          @click="handleSave"
        >
          保存参数
        </el-button>
        <el-button 
          icon="el-icon-upload2"
          :disabled="!currentFile || !deviceConnected"
          :loading="loading.sync"
          @click="handleSync"
        >
          同步到设备
        </el-button>
      </div>
    </div>
    
    <!-- 主内容区 -->
    <div class="editor-layout">
      <!-- 左侧：文件选择 -->
      <aside class="file-sidebar">
        <div class="sidebar-header">
          <span class="sidebar-title">参数文件</span>
          <el-button type="text" icon="el-icon-refresh" @click="loadFiles" />
        </div>
        <div class="file-list" v-loading="loading.files">
          <div 
            v-for="file in fileList" 
            :key="file.name"
            class="file-item"
            :class="{ active: currentFile === file.name }"
            @click="openFile(file.name)"
          >
            <i class="el-icon-document"></i>
            <span class="file-name">{{ file.name }}</span>
            <span class="file-size">{{ formatSize(file.size) }}</span>
          </div>
          <div v-if="fileList.length === 0" class="empty-tip">
            暂无参数文件
          </div>
        </div>
      </aside>
      
      <!-- 右侧：参数编辑区 -->
      <main class="editor-main">
        <!-- 未选择文件提示 -->
        <div v-if="!currentFile" class="no-file-selected">
          <i class="el-icon-folder-opened"></i>
          <p>请从左侧选择一个参数文件进行编辑</p>
          <el-button type="primary" plain @click="$router.push('/files')">
            前往文件管理
          </el-button>
        </div>
        
        <!-- 参数编辑表单 -->
        <div v-else class="param-form" v-loading="loading.params">
          <!-- 文件信息栏 -->
          <div class="file-info-bar">
            <div class="file-info">
              <i class="el-icon-document"></i>
              <span class="current-filename">{{ currentFile }}</span>
              <span v-if="hasUnsavedChanges" class="modified-badge">已修改</span>
            </div>
            <div class="file-actions">
              <el-button type="text" size="mini" @click="handleReset">
                <i class="el-icon-refresh-left"></i> 重置
              </el-button>
            </div>
          </div>
          
          <!-- 参数分组 -->
          <div class="param-groups">
            <div 
              v-for="group in paramGroups" 
              :key="group.id" 
              class="param-group card"
            >
              <div class="card-header">
                <div class="group-info">
                  <h3 class="card-title">{{ group.name }}</h3>
                  <p class="group-desc">{{ group.description }}</p>
                </div>
                <el-switch 
                  v-if="group.toggleable"
                  v-model="groupEnabled[group.id]"
                  active-text="启用"
                  inactive-text="禁用"
                />
              </div>
              
              <div class="param-list">
                <div 
                  v-for="param in group.params" 
                  :key="param.key"
                  class="param-row"
                >
                  <label class="param-label">
                    {{ param.name }}
                    <el-tooltip 
                      v-if="param.description" 
                      :content="param.description"
                      placement="top"
                    >
                      <i class="el-icon-question param-help"></i>
                    </el-tooltip>
                  </label>
                  
                  <!-- 数字输入 -->
                  <el-input-number
                    v-if="param.type === 'number'"
                    v-model="editParams[param.key]"
                    :min="param.min"
                    :max="param.max"
                    :step="param.step || 1"
                    :precision="getPrecision(param.step)"
                    controls-position="right"
                    @change="onParamChange(param.key, $event)"
                  />
                  
                  <!-- 下拉选择 -->
                  <el-select
                    v-else-if="param.type === 'select'"
                    v-model="editParams[param.key]"
                    @change="onParamChange(param.key, $event)"
                  >
                    <el-option 
                      v-for="opt in param.options" 
                      :key="opt" 
                      :label="opt" 
                      :value="opt" 
                    />
                  </el-select>
                  
                  <!-- 开关 -->
                  <el-switch
                    v-else-if="param.type === 'boolean'"
                    v-model="editParams[param.key]"
                    @change="onParamChange(param.key, $event)"
                  />
                  
                  <!-- 文本输入 -->
                  <el-input
                    v-else
                    v-model="editParams[param.key]"
                    @input="onParamChange(param.key, $event)"
                  />
                  
                  <span class="param-unit">{{ param.unit || '' }}</span>
                </div>
              </div>
            </div>
            
            <!-- 无Schema时显示原始数据 -->
            <div v-if="paramGroups.length === 0 && currentFile" class="raw-params card">
              <div class="card-header">
                <h3 class="card-title">原始参数数据</h3>
              </div>
              <pre class="raw-json">{{ JSON.stringify(params, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'ParamEditor',
  data() {
    return {
      editParams: {},
      groupEnabled: {}
    }
  },
  computed: {
    ...mapState(['currentFile', 'params', 'fileList', 'hasUnsavedChanges', 'loading']),
    ...mapGetters(['deviceConnected', 'paramGroups'])
  },
  watch: {
    params: {
      immediate: true,
      deep: true,
      handler(newParams) {
        this.initEditParams(newParams)
      }
    }
  },
  mounted() {
    this.loadFiles()
    this.$store.dispatch('loadParamSchema')
  },
  methods: {
    loadFiles() {
      this.$store.dispatch('loadFileList')
    },
    
    async openFile(filename) {
      if (this.hasUnsavedChanges) {
        try {
          await this.$confirm('当前有未保存的更改，是否继续？', '提示', {
            confirmButtonText: '继续',
            cancelButtonText: '取消',
            type: 'warning'
          })
        } catch {
          return
        }
      }
      
      const result = await this.$store.dispatch('openFile', filename)
      if (!result.success) {
        this.$message.error(result.error || '打开文件失败')
      }
    },
    
    initEditParams(params) {
      // 从嵌套的params结构中提取可编辑参数
      this.editParams = {}
      
      // 根据schema初始化参数
      this.paramGroups.forEach(group => {
        group.params.forEach(param => {
          this.editParams[param.key] = params[param.key] ?? param.default
        })
      })
    },
    
    onParamChange(key, value) {
      this.$store.commit('UPDATE_PARAM', { key, value })
    },
    
    async handleSave() {
      const result = await this.$store.dispatch('saveParams')
      if (result.success) {
        this.$message.success('保存成功')
      } else {
        this.$message.error(result.error || '保存失败')
      }
    },
    
    async handleSync() {
      const result = await this.$store.dispatch('syncToDevice')
      if (result.success) {
        this.$message.success('同步成功')
      } else {
        this.$message.error(result.error || '同步失败')
      }
    },
    
    async handleReset() {
      try {
        await this.$confirm('确定要重置所有参数吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        // 重新加载文件
        await this.$store.dispatch('openFile', this.currentFile)
        this.$message.success('参数已重置')
      } catch {
        // 用户取消
      }
    },
    
    formatSize(bytes) {
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    },
    
    getPrecision(step) {
      if (!step) return 0
      const str = step.toString()
      const decimal = str.indexOf('.')
      return decimal === -1 ? 0 : str.length - decimal - 1
    }
  }
}
</script>

<style lang="scss" scoped>
.param-editor-page {
  height: calc(100vh - 56px - 28px - var(--spacing-lg) * 2);
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-lg);
  flex-shrink: 0;
  
  .header-left {
    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
    }
    
    .page-subtitle {
      color: var(--text-secondary);
      font-size: 14px;
    }
  }
  
  .header-actions {
    display: flex;
    gap: var(--spacing-sm);
  }
}

.editor-layout {
  display: flex;
  gap: var(--spacing-md);
  flex: 1;
  min-height: 0;
}

// 文件侧边栏
.file-sidebar {
  width: 260px;
  flex-shrink: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  
  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--border-color);
    
    .sidebar-title {
      font-weight: 600;
      color: var(--text-primary);
    }
  }
  
  .file-list {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-sm);
  }
  
  .file-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
    
    &:hover {
      background: var(--bg-tertiary);
    }
    
    &.active {
      background: rgba(0, 212, 255, 0.1);
      color: var(--primary-color);
      
      .file-name {
        color: var(--primary-color);
      }
    }
    
    i {
      color: var(--text-muted);
    }
    
    .file-name {
      flex: 1;
      font-size: 13px;
      color: var(--text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .file-size {
      font-size: 11px;
      color: var(--text-muted);
      font-family: var(--font-mono);
    }
  }
  
  .empty-tip {
    text-align: center;
    color: var(--text-muted);
    padding: var(--spacing-lg);
    font-size: 13px;
  }
}

// 主编辑区
.editor-main {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}

.no-file-selected {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-card);
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-lg);
  
  i {
    font-size: 64px;
    color: var(--text-muted);
    margin-bottom: var(--spacing-md);
  }
  
  p {
    color: var(--text-secondary);
    margin-bottom: var(--spacing-md);
  }
}

.param-form {
  .file-info-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md);
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-md);
    
    .file-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      
      i {
        color: var(--primary-color);
      }
      
      .current-filename {
        font-family: var(--font-mono);
        color: var(--text-primary);
      }
      
      .modified-badge {
        padding: 2px 8px;
        background: rgba(255, 171, 0, 0.15);
        color: var(--warning-color);
        border-radius: 10px;
        font-size: 11px;
      }
    }
  }
}

.param-groups {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.param-group {
  .group-info {
    .group-desc {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 4px;
    }
  }
  
  .param-list {
    display: flex;
    flex-direction: column;
  }
  
  .param-row {
    display: grid;
    grid-template-columns: 160px 1fr 60px;
    gap: var(--spacing-md);
    align-items: center;
    padding: var(--spacing-sm) var(--spacing-md);
    margin: 0 calc(var(--spacing-md) * -1);
    border-radius: var(--radius-sm);
    
    &:hover {
      background: var(--bg-tertiary);
    }
    
    .param-label {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: var(--text-secondary);
      
      .param-help {
        color: var(--text-muted);
        cursor: help;
        
        &:hover {
          color: var(--primary-color);
        }
      }
    }
    
    .param-unit {
      font-size: 12px;
      color: var(--text-muted);
      font-family: var(--font-mono);
    }
  }
}

.raw-params {
  .raw-json {
    padding: var(--spacing-md);
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-secondary);
    overflow-x: auto;
    max-height: 400px;
  }
}
</style>




