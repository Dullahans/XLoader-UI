import Vue from 'vue'
import Vuex from 'vuex'
import api from '@/api'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    // WebSocket连接状态
    wsConnected: false,
    
    // 设备状态
    device: {
      connected: false,
      ip: '',
      port: 0,
      info: null,
      lastHeartbeat: null
    },
    
    // 当前打开的文件
    currentFile: null,
    
    // 参数数据
    params: {},
    
    // 参数Schema
    paramSchema: null,
    
    // 是否有未保存的更改
    hasUnsavedChanges: false,
    
    // 文件列表
    fileList: [],
    
    // 备份列表
    backupList: [],
    
    // 应用配置
    config: {
      theme: 'dark',
      autoSave: true,
      autoSaveInterval: 30000,
      showAdvancedParams: false
    },
    
    // 加载状态
    loading: {
      files: false,
      params: false,
      device: false,
      sync: false
    },
    
    // 消息通知
    notifications: []
  },
  
  getters: {
    deviceConnected: state => state.device.connected,
    
    currentParams: state => state.params,
    
    paramGroups: state => {
      if (!state.paramSchema) return []
      return state.paramSchema.groups || []
    },
    
    isLoading: state => Object.values(state.loading).some(v => v)
  },
  
  mutations: {
    SET_WS_CONNECTED(state, connected) {
      state.wsConnected = connected
    },
    
    SET_DEVICE_STATUS(state, status) {
      state.device = { ...state.device, ...status }
    },
    
    SET_CURRENT_FILE(state, filename) {
      state.currentFile = filename
    },
    
    SET_PARAMS(state, params) {
      state.params = params
      state.hasUnsavedChanges = false
    },
    
    UPDATE_PARAM(state, { key, value }) {
      // 支持嵌套路径，如 'model.groups[0].value'
      const keys = key.split('.')
      let obj = state.params
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i]
        const match = k.match(/(\w+)\[(\d+)\]/)
        if (match) {
          obj = obj[match[1]][parseInt(match[2])]
        } else {
          obj = obj[k]
        }
      }
      const lastKey = keys[keys.length - 1]
      Vue.set(obj, lastKey, value)
      state.hasUnsavedChanges = true
    },
    
    SET_PARAM_SCHEMA(state, schema) {
      state.paramSchema = schema
    },
    
    SET_FILE_LIST(state, files) {
      state.fileList = files
    },
    
    SET_BACKUP_LIST(state, backups) {
      state.backupList = backups
    },
    
    SET_CONFIG(state, config) {
      state.config = { ...state.config, ...config }
    },
    
    SET_LOADING(state, { key, value }) {
      state.loading[key] = value
    },
    
    SET_UNSAVED_CHANGES(state, value) {
      state.hasUnsavedChanges = value
    },
    
    ADD_NOTIFICATION(state, notification) {
      state.notifications.push({
        id: Date.now(),
        ...notification
      })
    },
    
    REMOVE_NOTIFICATION(state, id) {
      state.notifications = state.notifications.filter(n => n.id !== id)
    }
  },
  
  actions: {
    // 处理WebSocket消息
    handleWsMessage({ commit, dispatch }, data) {
      switch (data.type) {
        case 'device_status':
          commit('SET_DEVICE_STATUS', data.status)
          break
        case 'param_updated':
          dispatch('loadParams', data.filename)
          break
        case 'notification':
          commit('ADD_NOTIFICATION', data.notification)
          break
      }
    },
    
    // 加载配置
    async loadConfig({ commit }) {
      try {
        const { data } = await api.config.get()
        if (data.success) {
          commit('SET_CONFIG', data.config.app || {})
        }
      } catch (err) {
        console.error('加载配置失败', err)
      }
    },
    
    // 保存配置
    async saveConfig({ state }) {
      try {
        await api.config.update({ app: state.config })
      } catch (err) {
        console.error('保存配置失败', err)
      }
    },
    
    // 加载参数Schema
    async loadParamSchema({ commit }) {
      try {
        const { data } = await api.bin.getSchema()
        if (data.success) {
          commit('SET_PARAM_SCHEMA', data.schema)
        }
      } catch (err) {
        console.error('加载参数Schema失败', err)
      }
    },
    
    // 加载文件列表
    async loadFileList({ commit }) {
      commit('SET_LOADING', { key: 'files', value: true })
      try {
        const { data } = await api.bin.list()
        if (data.success) {
          commit('SET_FILE_LIST', data.files)
        }
      } catch (err) {
        console.error('加载文件列表失败', err)
      } finally {
        commit('SET_LOADING', { key: 'files', value: false })
      }
    },
    
    // 加载备份列表
    async loadBackupList({ commit }) {
      try {
        const { data } = await api.bin.getBackups()
        if (data.success) {
          commit('SET_BACKUP_LIST', data.backups)
        }
      } catch (err) {
        console.error('加载备份列表失败', err)
      }
    },
    
    // 打开文件
    async openFile({ commit }, filename) {
      commit('SET_LOADING', { key: 'params', value: true })
      try {
        const { data } = await api.bin.read(filename)
        if (data.success) {
          commit('SET_CURRENT_FILE', filename)
          commit('SET_PARAMS', data.params)
          return { success: true }
        }
        return { success: false, error: data.error }
      } catch (err) {
        console.error('打开文件失败', err)
        return { success: false, error: err.message }
      } finally {
        commit('SET_LOADING', { key: 'params', value: false })
      }
    },
    
    // 保存参数
    async saveParams({ state, commit }) {
      if (!state.currentFile) {
        return { success: false, error: '未选择文件' }
      }
      
      commit('SET_LOADING', { key: 'params', value: true })
      try {
        const { data } = await api.bin.save(state.currentFile, {
          params: state.params,
          createBackup: true
        })
        
        if (data.success) {
          commit('SET_UNSAVED_CHANGES', false)
          commit('ADD_NOTIFICATION', {
            type: 'success',
            message: '参数保存成功'
          })
        }
        return data
      } catch (err) {
        console.error('保存参数失败', err)
        return { success: false, error: err.message }
      } finally {
        commit('SET_LOADING', { key: 'params', value: false })
      }
    },
    
    // 连接设备
    async connectDevice({ commit }, { ip, port }) {
      commit('SET_LOADING', { key: 'device', value: true })
      try {
        const { data } = await api.device.connect(ip, port)
        if (data.success) {
          commit('SET_DEVICE_STATUS', {
            connected: true,
            ip,
            port,
            info: data.deviceInfo,
            lastHeartbeat: new Date()
          })
        }
        return data
      } catch (err) {
        console.error('连接设备失败', err)
        return { success: false, error: err.message }
      } finally {
        commit('SET_LOADING', { key: 'device', value: false })
      }
    },
    
    // 断开设备
    async disconnectDevice({ commit }) {
      try {
        await api.device.disconnect()
        commit('SET_DEVICE_STATUS', {
          connected: false,
          ip: '',
          port: 0,
          info: null,
          lastHeartbeat: null
        })
        return { success: true }
      } catch (err) {
        console.error('断开设备失败', err)
        return { success: false, error: err.message }
      }
    },
    
    // 同步到设备
    async syncToDevice({ state, commit }) {
      if (!state.device.connected) {
        return { success: false, error: '设备未连接' }
      }
      
      commit('SET_LOADING', { key: 'sync', value: true })
      try {
        const { data } = await api.device.sync(state.currentFile, state.params)
        if (data.success) {
          commit('ADD_NOTIFICATION', {
            type: 'success',
            message: '参数已同步到设备'
          })
        }
        return data
      } catch (err) {
        console.error('同步到设备失败', err)
        return { success: false, error: err.message }
      } finally {
        commit('SET_LOADING', { key: 'sync', value: false })
      }
    }
  }
})




