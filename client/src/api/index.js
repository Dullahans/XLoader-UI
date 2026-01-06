/**
 * API 接口模块
 * 统一管理所有后端接口调用
 */

import axios from 'axios'

// 创建axios实例
const http = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
http.interceptors.request.use(
  config => {
    // 可以在这里添加token等
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
http.interceptors.response.use(
  response => response,
  error => {
    console.error('API请求错误:', error)
    return Promise.reject(error)
  }
)

// Bin文件相关接口
const bin = {
  // 获取文件列表
  list() {
    return http.get('/bin/list')
  },
  
  // 读取文件
  read(filename) {
    return http.get(`/bin/read/${encodeURIComponent(filename)}`)
  },
  
  // 保存文件
  save(filename, data) {
    return http.post(`/bin/save/${encodeURIComponent(filename)}`, data)
  },
  
  // 上传文件
  upload(file) {
    const formData = new FormData()
    formData.append('binfile', file)
    return http.post('/bin/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  // 获取参数Schema
  getSchema() {
    return http.get('/bin/schema')
  },
  
  // 获取备份列表
  getBackups() {
    return http.get('/bin/backups')
  },
  
  // 从备份恢复
  restore(backupName, targetName) {
    return http.post(`/bin/restore/${encodeURIComponent(backupName)}`, { targetName })
  }
}

// 设备相关接口
const device = {
  // 获取设备状态
  status() {
    return http.get('/device/status')
  },
  
  // 连接设备
  connect(ip, port) {
    return http.post('/device/connect', { ip, port })
  },
  
  // 断开设备
  disconnect() {
    return http.post('/device/disconnect')
  },
  
  // 同步文件到设备
  sync(filename, data) {
    return http.post('/device/sync', { filename, data })
  },
  
  // 从设备读取
  readBin() {
    return http.get('/device/read-bin')
  },
  
  // 发送命令
  command(command, params) {
    return http.post('/device/command', { command, params })
  },
  
  // 设备发现
  discover(subnet) {
    return http.get('/device/discover', { params: { subnet } })
  }
}

// 配置相关接口
const config = {
  // 获取配置
  get() {
    return http.get('/config')
  },
  
  // 更新配置
  update(data) {
    return http.put('/config', data)
  },
  
  // 重置配置
  reset() {
    return http.post('/config/reset')
  },
  
  // 导出配置
  export() {
    return http.get('/config/export')
  },
  
  // 导入配置
  import(data) {
    return http.post('/config/import', data)
  }
}

export default {
  bin,
  device,
  config
}




