/**
 * WebSocket 通信类封装
 * 用于与 Python 后端进行双向实时通信
 */
class WSClient {
  constructor(url = null) {
    if (!url) {
      if (window.WS_URL) {
        url = window.WS_URL;
      } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        // 默认 Python WS 固定端口 28657
        url = `${protocol}//${host}:28657/ws`;
      }
    }
    this.url = url;
    this.ws = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.topic = 'LOADER';
    this.messageId = 0;
    this.pendingRequests = new Map();
    this.listeners = new Map();
    this.requestTimeout = 10000;
  }

  /**
   * 连接 WebSocket 服务器
   */
  connect() {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      console.log(`[WS] Connecting: ${this.url}`);
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[WS] Connected');
        this.connected = true;
        this.reconnectAttempts = 0;
        try {
          // 建链握手
          this.ws.send('Hello, I am loader');
        } catch (e) {
          console.warn('[WS] hello handshake failed:', e);
        }
        this.emit('connected');
        resolve();
      };

      this.ws.onclose = (event) => {
        console.log('[WS] Connection closed', event.code, event.reason);
        this.connected = false;
        this.emit('disconnected');
        this.tryReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[WS] Connection error', error);
        this.emit('error', error);
        reject(error);
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };
    });
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  /**
   * 尝试重连
   */
  tryReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WS] Max reconnect attempts reached');
      this.emit('reconnectFailed');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[WS] Retrying (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.connect().catch(() => {});
    }, this.reconnectInterval);
  }

  /**
   * 处理收到的消息
   */
  handleMessage(data) {
    try {
      if (typeof data !== 'string') return;
      const message = JSON.parse(data);

      // 处理匿名数组响应
      if (Array.isArray(message)) {
        if (this.pendingRequests.size > 0) {
          let latestKey = null;
          for (const k of this.pendingRequests.keys()) {
            if (latestKey === null || Number(k) > Number(latestKey)) latestKey = k;
          }
          const pending = latestKey !== null ? this.pendingRequests.get(latestKey) : null;
          if (pending) {
            const { resolve, timer } = pending;
            clearTimeout(timer);
            this.pendingRequests.delete(latestKey);
            resolve({ topic: this.topic, cmd_id: latestKey, name: 'anonymous.array', data: message });
            return;
          }
        }
        this.emit('anonymous.array', message);
        return;
      }
      
      const rawCmdId = message.cmd_id !== undefined ? message.cmd_id : message.id;
      const cmdId = (rawCmdId !== undefined && rawCmdId !== null) ? String(rawCmdId) : null;

      if (cmdId && this.pendingRequests.has(cmdId)) {
        const { resolve, reject, timer } = this.pendingRequests.get(cmdId);
        clearTimeout(timer);
        this.pendingRequests.delete(cmdId);
        
        let responseData = message;
        if (message.data !== undefined) {
          if (typeof message.data === 'string') {
            try { 
              responseData = JSON.parse(message.data);
            } catch (e) { 
              responseData = message.data; 
            }
          } else {
            responseData = message.data;
          }
        }
        
        const ok = (responseData.success !== false) && (responseData.ok !== false) && (responseData.code === undefined || responseData.code === 0);
        if (!ok && responseData.success === false) {
          reject(new Error(responseData.error || responseData.msg || responseData.desc || 'Request failed'));
        } else {
          resolve(responseData);
        }
        return;
      }

      // 处理推送消息
      if (message && message.name) {
        let processedData = message.data;
        if (typeof message.data === 'string' && (message.data.startsWith('{') || message.data.startsWith('['))) {
          try { processedData = JSON.parse(message.data); } catch (e) { /* ignore parse error */ }
        }
        if (message.name === 'refresh_signals') {
          this.emit('refresh_signals', processedData);
        } else {
          this.emit(message.name, processedData);
        }
      }
    } catch (err) {
      console.error('[WS] Message parse failed:', err, 'Raw data:', data);
    }
  }

  /**
   * 发送请求并等待响应
   */
  request(action, params = {}) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('WebSocket Not Connected'));
        return;
      }

      const cmd_id = Date.now() * 1000 + ((++this.messageId) % 1000);
      const cmdIdStr = String(cmd_id);
      
      const dataField = (typeof params === 'string') ? params : JSON.stringify(params || {});
      const message = { topic: this.topic, cmd_id, name: action, data: dataField };

      const timer = setTimeout(() => {
        this.pendingRequests.delete(cmdIdStr);
        reject(new Error('Request Timeout'));
      }, this.requestTimeout);

      this.pendingRequests.set(cmdIdStr, { resolve, reject, timer });

      console.log('[WS] Request:', action, params, 'cmd_id=', cmd_id);
      this.ws.send(JSON.stringify(message));
    });
  }

  /**
   * 发送消息（不等待响应）
   */
  send(action, params = {}) {
    if (!this.connected) {
      console.warn('[WS] Not connected, cannot send');
      return false;
    }
    const cmd_id = Date.now() * 1000 + ((++this.messageId) % 1000);
    const dataField = (typeof params === 'string') ? params : JSON.stringify(params || {});
    this.ws.send(JSON.stringify({ topic: this.topic, cmd_id, name: action, data: dataField }));
    return true;
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const list = this.listeners.get(event);
      const idx = list.indexOf(callback);
      if (idx !== -1) list.splice(idx, 1);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => cb(data));
    }
  }

  // --- 业务接口封装 ---
  startGetConnectStatus() { return this.request('start_get_connect_status', {}); }
  stopAllTimers() { return this.request('stop_all_timers', {}); }
  queryLocationInfo() { return this.request('query_location_info', {}); }
  getModels(device_id, loader_num, sim_type = 'component_emulation') {
    return this.request('get_models', { device_id, loader_num, sim_type });
  }
  startLoader(device_id, loader_num, model, sim_type = 'component_emulation') {
    return this.request('start_loader', { device_id, loader_num, model, sim_type });
  }
  stopLoader(device_id, loader_num, model, sim_type = 'component_emulation') {
    return this.request('stop_loader', { device_id, loader_num, model, sim_type });
  }
  getSignals(device_id, loader_num, regs) {
    const regsArray = Array.isArray(regs) ? regs : (regs ? [regs] : []);
    return this.request('get_signals', { device_id, loader_num, regs: regsArray });
  }
  scheduleRefreshSignals(device_id, loader_num, regs, period) {
    const regsArray = Array.isArray(regs) ? regs : (regs ? [regs] : []);
    return this.request('schedule_refresh_signals', { device_id, loader_num, regs: regsArray, period });
  }
  stopRefreshRegs() { return this.request('stop_refresh_regs', {}); }
  setRegValue(device_id, loader_num, reg_name, reg_value) {
    return this.request('set_reg_value', { device_id, loader_num, reg_name, reg_value: String(reg_value) });
  }
  waitRegValue(device_id, loader_num, reg_name) {
    return this.request('wait_reg_value', { device_id, loader_num, reg_name });
  }
  saveLocationInfo(location) { return this.request('save_location_info', { location }); }
  getLocalFileList() { return this.request('get_local_file_list', {}); }
  readLocalFile(path) { return this.request('read_local_file', { path }); }
  saveLocalFile(path, content) { return this.request('save_local_file', { path, content }); }
  saveAsLocalFile(path, content) { return this.request('save_as_local_file', { path, content }); }
  uploadToCloud(path) { return this.request('upload_to_cloud', { path }); }
  downloadFromDevice(device_id, loader_num, device_path, local_path) {
    return this.request('download_from_device', { device_id, loader_num, device_path, local_path });
  }
  applyParamsToDevice(device_id, loader_num, path, content) {
    return this.request('apply_params_to_device', { device_id, loader_num, path, content });
  }
  deleteLocalFile(path) { return this.request('delete_local_file', { path }); }
  loaderOta(device_id, loader_num, path) { return this.request('loader_ota', { device_id, loader_num, path }); }
  pullFile(device_id, loader_num, path) { return this.request('pull_file', { device_id, loader_num, path }); }
  getFileInfo(device_id, loader_num, name = '') { return this.request('get_file_info', { device_id, loader_num, name }); }
  checkLoadersNewVersion() { return this.request('check_loaders_new_version', {}); }
  updateOneLoader(device_id, loader_num) { return this.request('update_one_loader', { device_id, loader_num }); }
  loadModel(device_id, loader_num, modelzip, project, all_devices = false) {
    const payload = all_devices ? { modelzip, project, all_devices: true } : { device_id, loader_num, modelzip, project, all_devices: false };
    return this.request('load_model', payload);
  }
  downloadCloudModels(device_id, loader_num, model_name, model_id, project) {
    return this.request('download_cloud_models', { device_id, loader_num, model_name, model_id, project });
  }
  sendCmd(device_id, loader_num, cmd, multi_frames = false) {
    return this.request('send_cmd', { device_id, loader_num, cmd, multi_frames });
  }
}

export default new WSClient();
