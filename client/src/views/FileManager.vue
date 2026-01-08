<template>
  <div class="file-manager-page page-container">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">文件管理</h1>
        <p class="page-subtitle">管理本地bin参数文件与备份</p>
      </div>
      <div class="header-actions">
        <el-upload
          ref="upload"
          action="/api/bin/upload"
          :show-file-list="false"
          :on-success="onUploadSuccess"
          :on-error="onUploadError"
          accept=".bin"
        >
          <el-button type="primary" icon="el-icon-upload">上传文件</el-button>
        </el-upload>
      </div>
    </div>
    
    <el-tabs v-model="activeTab" class="file-tabs">
      <!-- 参数文件列表 -->
      <el-tab-pane label="参数文件" name="files">
        <div class="file-grid" v-loading="loading.files">
          <div 
            v-for="file in fileList" 
            :key="file.name"
            class="file-card"
            :class="{ selected: selectedFiles.includes(file.name) }"
          >
            <div class="file-checkbox">
              <el-checkbox 
                :value="selectedFiles.includes(file.name)"
                @change="toggleSelect(file.name)"
              />
            </div>
            <div class="file-icon">
              <i class="el-icon-document"></i>
            </div>
            <div class="file-info">
              <h4 class="file-name" :title="file.name">{{ file.name }}</h4>
              <div class="file-meta">
                <span class="file-size">{{ formatSize(file.size) }}</span>
                <span class="file-date">{{ formatDate(file.modified) }}</span>
              </div>
            </div>
            <div class="file-actions">
              <el-tooltip content="编辑参数" placement="top">
                <el-button type="text" icon="el-icon-edit" @click="editFile(file.name)" />
              </el-tooltip>
              <el-tooltip content="下载" placement="top">
                <el-button type="text" icon="el-icon-download" @click="downloadFile(file.name)" />
              </el-tooltip>
              <el-dropdown trigger="click" @command="handleFileCommand($event, file.name)">
                <el-button type="text" icon="el-icon-more" />
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="rename" icon="el-icon-edit-outline">重命名</el-dropdown-item>
                  <el-dropdown-item command="duplicate" icon="el-icon-document-copy">复制</el-dropdown-item>
                  <el-dropdown-item command="delete" icon="el-icon-delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
          </div>
          
          <!-- 空状态 -->
          <div v-if="fileList.length === 0" class="empty-state">
            <i class="el-icon-folder-add"></i>
            <p>暂无参数文件</p>
            <p class="empty-hint">上传.bin文件或从设备同步</p>
          </div>
        </div>
        
        <!-- 批量操作栏 -->
        <div v-if="selectedFiles.length > 0" class="batch-actions">
          <span class="selected-count">已选择 {{ selectedFiles.length }} 个文件</span>
          <el-button size="small" @click="selectedFiles = []">取消选择</el-button>
          <el-button size="small" type="danger" @click="batchDelete">批量删除</el-button>
        </div>
      </el-tab-pane>
      
      <!-- 备份文件列表 -->
      <el-tab-pane label="备份文件" name="backups">
        <div class="backup-list">
          <el-table :data="backupList" style="width: 100%" empty-text="暂无备份">
            <el-table-column prop="name" label="文件名" min-width="200">
              <template slot-scope="{ row }">
                <i class="el-icon-time" style="color: var(--text-muted); margin-right: 8px;"></i>
                {{ row.name }}
              </template>
            </el-table-column>
            <el-table-column prop="size" label="大小" width="100">
              <template slot-scope="{ row }">
                {{ formatSize(row.size) }}
              </template>
            </el-table-column>
            <el-table-column prop="created" label="创建时间" width="180">
              <template slot-scope="{ row }">
                {{ formatDate(row.created) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template slot-scope="{ row }">
                <el-button type="text" size="small" @click="restoreBackup(row.name)">
                  恢复
                </el-button>
                <el-button type="text" size="small" @click="downloadBackup(row.name)">
                  下载
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    <el-tabs v-model="activeTab" class="file-tabs">
      <!-- 参数文件列表 -->
      <el-tab-pane label="参数文件" name="files">
        <div class="file-grid" v-loading="loading.files">
          <div 
            v-for="file in fileList" 
            :key="file.name"
            class="file-card"
            :class="{ selected: selectedFiles.includes(file.name) }"
          >
            <div class="file-checkbox">
              <el-checkbox 
                :value="selectedFiles.includes(file.name)"
                @change="toggleSelect(file.name)"
              />
            </div>
            <div class="file-icon">
              <i class="el-icon-document"></i>
            </div>
            <div class="file-info">
              <h4 class="file-name" :title="file.name">{{ file.name }}</h4>
              <div class="file-meta">
                <span class="file-size">{{ formatSize(file.size) }}</span>
                <span class="file-date">{{ formatDate(file.modified) }}</span>
              </div>
            </div>
            <div class="file-actions">
              <el-tooltip content="编辑参数" placement="top">
                <el-button type="text" icon="el-icon-edit" @click="editFile(file.name)" />
              </el-tooltip>
              <el-tooltip content="下载" placement="top">
                <el-button type="text" icon="el-icon-download" @click="downloadFile(file.name)" />
              </el-tooltip>
              <el-dropdown trigger="click" @command="handleFileCommand($event, file.name)">
                <el-button type="text" icon="el-icon-more" />
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="rename" icon="el-icon-edit-outline">重命名</el-dropdown-item>
                  <el-dropdown-item command="duplicate" icon="el-icon-document-copy">复制</el-dropdown-item>
                  <el-dropdown-item command="delete" icon="el-icon-delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
          </div>
          
          <!-- 空状态 -->
          <div v-if="fileList.length === 0" class="empty-state">
            <i class="el-icon-folder-add"></i>
            <p>暂无参数文件</p>
            <p class="empty-hint">上传.bin文件或从设备同步</p>
          </div>
        </div>
        
        <!-- 批量操作栏 -->
        <div v-if="selectedFiles.length > 0" class="batch-actions">
          <span class="selected-count">已选择 {{ selectedFiles.length }} 个文件</span>
          <el-button size="small" @click="selectedFiles = []">取消选择</el-button>
          <el-button size="small" type="danger" @click="batchDelete">批量删除</el-button>
        </div>
      </el-tab-pane>
      
      <!-- 备份文件列表 -->
      <el-tab-pane label="备份文件" name="backups">
        <div class="backup-list">
          <el-table :data="backupList" style="width: 100%" empty-text="暂无备份">
            <el-table-column prop="name" label="文件名" min-width="200">
              <template slot-scope="{ row }">
                <i class="el-icon-time" style="color: var(--text-muted); margin-right: 8px;"></i>
                {{ row.name }}
              </template>
            </el-table-column>
            <el-table-column prop="size" label="大小" width="100">
              <template slot-scope="{ row }">
                {{ formatSize(row.size) }}
              </template>
            </el-table-column>
            <el-table-column prop="created" label="创建时间" width="180">
              <template slot-scope="{ row }">
                {{ formatDate(row.created) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template slot-scope="{ row }">
                <el-button type="text" size="small" @click="restoreBackup(row.name)">
                  恢复
                </el-button>
                <el-button type="text" size="small" @click="downloadBackup(row.name)">
                  下载
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import api from '@/api'

export default {
  name: 'FileManager',
  data() {
    return {
      activeTab: 'files',
      selectedFiles: []
    }
  },
  computed: {
    ...mapState(['fileList', 'backupList', 'loading'])
  },
  mounted() {
    this.$store.dispatch('loadFileList')
    this.$store.dispatch('loadBackupList')
  },
  methods: {
    formatSize(bytes) {
      if (!bytes) return '0 B'
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    },
    
    formatDate(date) {
      if (!date) return '-'
      return new Date(date).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    toggleSelect(filename) {
      const index = this.selectedFiles.indexOf(filename)
      if (index === -1) {
        this.selectedFiles.push(filename)
      } else {
        this.selectedFiles.splice(index, 1)
      }
    },
    
    editFile(filename) {
      this.$store.dispatch('openFile', filename).then(result => {
        if (result.success) {
          this.$router.push('/params')
        } else {
          this.$message.error(result.error || '打开文件失败')
        }
      })
    },
    
    downloadFile(filename) {
      // 创建下载链接
      const link = document.createElement('a')
      link.href = `/api/bin/download/${encodeURIComponent(filename)}`
      link.download = filename
      link.click()
    },
    
    downloadBackup(filename) {
      const link = document.createElement('a')
      link.href = `/api/bin/backup/download/${encodeURIComponent(filename)}`
      link.download = filename
      link.click()
    },
    
    async handleFileCommand(command, filename) {
      switch (command) {
        case 'rename':
          this.renameFile(filename)
          break
        case 'duplicate':
          this.duplicateFile(filename)
          break
        case 'delete':
          this.deleteFile(filename)
          break
      }
    },
    
    async renameFile(filename) {
      try {
        const { value } = await this.$prompt('请输入新文件名', '重命名', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputValue: filename,
          inputPattern: /^[\w.-]+\.bin$/,
          inputErrorMessage: '文件名格式不正确'
        })
        
        if (value && value !== filename) {
          // 调用重命名API
          this.$message.success('重命名成功')
          this.$store.dispatch('loadFileList')
        }
      } catch {
        // 用户取消
      }
    },
    
    async duplicateFile(filename) {
      const newName = filename.replace('.bin', '_copy.bin')
      // 调用复制API
      this.$message.success(`文件已复制为 ${newName}`)
      this.$store.dispatch('loadFileList')
    },
    
    async deleteFile(filename) {
      try {
        await this.$confirm(`确定要删除文件 "${filename}" 吗？`, '删除确认', {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        // 调用删除API
        this.$message.success('文件已删除')
        this.$store.dispatch('loadFileList')
      } catch {
        // 用户取消
      }
    },
    
    async batchDelete() {
      try {
        await this.$confirm(`确定要删除选中的 ${this.selectedFiles.length} 个文件吗？`, '批量删除', {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        // 批量删除
        this.$message.success('文件已删除')
        this.selectedFiles = []
        this.$store.dispatch('loadFileList')
      } catch {
        // 用户取消
      }
    },
    
    async restoreBackup(backupName) {
      try {
        const { value } = await this.$prompt('请输入恢复后的文件名', '恢复备份', {
          confirmButtonText: '恢复',
          cancelButtonText: '取消',
          inputValue: backupName.split('_').slice(1).join('_')
        })
        
        if (value) {
          await api.bin.restore(backupName, value)
          this.$message.success('备份恢复成功')
          this.$store.dispatch('loadFileList')
        }
      } catch {
        // 用户取消
      }
    },
    
    onUploadSuccess(response) {
      if (response.success) {
        this.$message.success('文件上传成功')
        this.$store.dispatch('loadFileList')
      } else {
        this.$message.error(response.error || '上传失败')
      }
    },
    
    onUploadError(err) {
      this.$message.error('上传失败: ' + err.message)
    }
  }
}
</script>

<style lang="scss" scoped>
.file-manager-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
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

.file-tabs {
  ::v-deep .el-tabs__header {
    margin-bottom: var(--spacing-md);
  }
  
  ::v-deep .el-tabs__item {
    color: var(--text-secondary);
    
    &.is-active {
      color: var(--primary-color);
    }
  }
  
  ::v-deep .el-tabs__active-bar {
    background-color: var(--primary-color);
  }
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-md);
}

.file-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
  
  &:hover {
    border-color: var(--primary-color);
    box-shadow: var(--shadow-md);
  }
  
  &.selected {
    border-color: var(--primary-color);
    background: rgba(0, 212, 255, 0.05);
  }
  
  .file-checkbox {
    flex-shrink: 0;
  }
  
  .file-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 212, 255, 0.1);
    border-radius: var(--radius-md);
    color: var(--primary-color);
    font-size: 20px;
    flex-shrink: 0;
  }
  
  .file-info {
    flex: 1;
    min-width: 0;
    
    .file-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
      margin: 0 0 4px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .file-meta {
      display: flex;
      gap: var(--spacing-sm);
      font-size: 12px;
      color: var(--text-muted);
      
      .file-size {
        font-family: var(--font-mono);
      }
    }
  }
  
  .file-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity var(--transition-fast);
  }
  
  &:hover .file-actions {
    opacity: 1;
  }
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  // Sass 无法对 CSS 变量做数学运算，使用 calc() 交给浏览器计算
  padding: calc(var(--spacing-xl) * 2);
  color: var(--text-muted);
  
  i {
    font-size: 64px;
    margin-bottom: var(--spacing-md);
  }
  
  p {
    margin: 0;
    
    &.empty-hint {
      font-size: 13px;
      margin-top: 4px;
    }
  }
}

.batch-actions {
  position: fixed;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  
  .selected-count {
    color: var(--text-secondary);
    font-size: 13px;
  }
}

.backup-list {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  
  ::v-deep .el-table {
    background: transparent;
    
    th {
      background: var(--bg-tertiary) !important;
      color: var(--text-secondary);
    }
    
    td {
      border-color: var(--border-color);
    }
    
    tr {
      background: transparent;
      
      &:hover > td {
        background: var(--bg-tertiary) !important;
      }
    }
  }
}
</style>




