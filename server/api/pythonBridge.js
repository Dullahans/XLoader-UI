/**
 * Python 接口桥接层
 * 用于调用 Python 后端函数
 * 
 * 【对接说明】
 * 每个函数都需要对应一个 Python 函数实现
 * Python 函数应在 python_bridge/ 目录下实现
 */

const { PythonShell } = require('python-shell');
const path = require('path');

// Python 脚本路径
const PYTHON_SCRIPT_PATH = path.join(__dirname, '../../python_bridge');

/**
 * 调用 Python 函数的通用方法
 * @param {string} scriptName - Python 脚本名称
 * @param {string} functionName - 函数名称
 * @param {object} params - 参数对象
 * @returns {Promise<object>} - 返回结果
 */
async function callPython(scriptName, functionName, params = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      mode: 'json',
      pythonPath: 'python',
      pythonOptions: ['-u'],
      scriptPath: PYTHON_SCRIPT_PATH,
      args: [functionName, JSON.stringify(params)]
    };

    PythonShell.run(scriptName, options)
      .then(results => resolve(results[0] || { success: true }))
      .catch(err => reject(err));
  });
}

// ============================================================
// 云端接口
// ============================================================

/**
 * 上传文件到云端
 * 
 * 【Python 接口】
 * 函数名: cloud_upload
 * 参数: { device_sn, filename, content, metadata }
 * 返回: { success, url, version }
 * 
 * @param {string} deviceSN - 设备序列号
 * @param {string} filename - 文件名
 * @param {string} content - 文件内容
 * @param {object} metadata - 元数据（版本、描述等）
 */
async function uploadToCloud(deviceSN, filename, content, metadata = {}) {
  // TODO: 对接 Python 云端上传接口
  // return await callPython('cloud_api.py', 'cloud_upload', {
  //   device_sn: deviceSN,
  //   filename,
  //   content,
  //   metadata
  // });
  
  console.log('[API] uploadToCloud:', { deviceSN, filename });
  return { success: true, message: '模拟上传成功', url: `cloud://${deviceSN}/${filename}` };
}

/**
 * 从云端获取文件列表
 * 
 * 【Python 接口】
 * 函数名: cloud_list_files
 * 参数: { device_sn, project_id }
 * 返回: { success, files: [{ filename, size, version, updated_at }] }
 * 
 * @param {string} deviceSN - 设备序列号
 * @param {string} projectId - 项目ID（可选）
 */
async function getCloudFileList(deviceSN, projectId = null) {
  // TODO: 对接 Python 云端文件列表接口
  // return await callPython('cloud_api.py', 'cloud_list_files', {
  //   device_sn: deviceSN,
  //   project_id: projectId
  // });
  
  console.log('[API] getCloudFileList:', { deviceSN, projectId });
  return { 
    success: true, 
    files: [
      { filename: 'example.bin', size: 1024, version: '1.0.0', updated_at: '2024-12-01' }
    ] 
  };
}

/**
 * 从云端下载文件
 * 
 * 【Python 接口】
 * 函数名: cloud_download
 * 参数: { device_sn, filename, version }
 * 返回: { success, content, metadata }
 * 
 * @param {string} deviceSN - 设备序列号
 * @param {string} filename - 文件名
 * @param {string} version - 版本号（可选，默认最新）
 */
async function downloadFromCloud(deviceSN, filename, version = null) {
  // TODO: 对接 Python 云端下载接口
  // return await callPython('cloud_api.py', 'cloud_download', {
  //   device_sn: deviceSN,
  //   filename,
  //   version
  // });
  
  console.log('[API] downloadFromCloud:', { deviceSN, filename, version });
  return { success: true, content: '', metadata: {} };
}

// ============================================================
// 设备接口
// ============================================================

/**
 * 连接设备
 * 
 * 【Python 接口】
 * 函数名: device_connect
 * 参数: { ip, port, timeout }
 * 返回: { success, device_info: { sn, model, firmware } }
 * 
 * @param {string} ip - 设备IP地址
 * @param {number} port - UDP端口
 * @param {number} timeout - 超时时间（毫秒）
 */
async function connectDevice(ip, port, timeout = 5000) {
  // TODO: 对接 Python 设备连接接口
  // return await callPython('device_api.py', 'device_connect', {
  //   ip, port, timeout
  // });
  
  console.log('[API] connectDevice:', { ip, port });
  return { 
    success: true, 
    device_info: { 
      sn: 'EL5000-2024-00128', 
      model: 'EL-5000', 
      firmware: 'v2.1.0' 
    } 
  };
}

/**
 * 断开设备连接
 * 
 * 【Python 接口】
 * 函数名: device_disconnect
 * 参数: {}
 * 返回: { success }
 */
async function disconnectDevice() {
  // TODO: 对接 Python 设备断开接口
  // return await callPython('device_api.py', 'device_disconnect', {});
  
  console.log('[API] disconnectDevice');
  return { success: true };
}

/**
 * 获取设备状态
 * 
 * 【Python 接口】
 * 函数名: device_get_status
 * 参数: {}
 * 返回: { success, connected, running_file, running_module, current, voltage, power, temperature }
 */
async function getDeviceStatus() {
  // TODO: 对接 Python 设备状态接口
  // return await callPython('device_api.py', 'device_get_status', {});
  
  console.log('[API] getDeviceStatus');
  return { 
    success: true, 
    connected: true,
    running_file: 'example.bin',
    running_module: 'WINDOW_R',
    current: 50.2,
    voltage: 380,
    power: 19.1,
    temperature: 45
  };
}

/**
 * 获取设备基本信息
 * 
 * 【Python 接口】
 * 函数名: device_get_info
 * 参数: {}
 * 返回: { success, sn, hardware_version, software_version, run_time }
 */
async function getDeviceInfo() {
  // TODO: 对接 Python 设备信息接口
  // return await callPython('device_api.py', 'device_get_info', {});
  
  console.log('[API] getDeviceInfo');
  return { 
    success: true, 
    sn: 'EL5000-2024-00128',
    hardware_version: 'Rev.C',
    software_version: 'v2.1.0',
    run_time: '127:45:32'
  };
}

/**
 * 获取实时数据
 * 
 * 【Python 接口】
 * 函数名: device_get_realtime
 * 参数: {}
 * 返回: { success, current, voltage, power, temperature }
 */
async function getRealtimeData() {
  // TODO: 对接 Python 实时数据接口
  // return await callPython('device_api.py', 'device_get_realtime', {});
  
  console.log('[API] getRealtimeData');
  return { 
    success: true, 
    current: 50.2 + Math.random() * 5,
    voltage: 380 + Math.random() * 10,
    power: 19.1 + Math.random() * 2,
    temperature: 45 + Math.random() * 3
  };
}

/**
 * 上传文件到设备
 * 
 * 【Python 接口】
 * 函数名: device_upload_file
 * 参数: { filename, content }
 * 返回: { success, bytes_transferred }
 * 
 * @param {string} filename - 文件名
 * @param {string} content - 文件内容（bin格式的文本内容）
 */
async function uploadToDevice(filename, content) {
  // TODO: 对接 Python 设备上传接口
  // return await callPython('device_api.py', 'device_upload_file', {
  //   filename, content
  // });
  
  console.log('[API] uploadToDevice:', { filename, contentLength: content.length });
  return { success: true, bytes_transferred: content.length };
}

/**
 * 从设备下载文件
 * 
 * 【Python 接口】
 * 函数名: device_download_file
 * 参数: { filename }
 * 返回: { success, content }
 * 
 * @param {string} filename - 文件名（可选，默认当前运行的文件）
 */
async function downloadFromDevice(filename = null) {
  // TODO: 对接 Python 设备下载接口
  // return await callPython('device_api.py', 'device_download_file', {
  //   filename
  // });
  
  console.log('[API] downloadFromDevice:', { filename });
  return { success: true, content: '' };
}

/**
 * 获取设备文件列表
 * 
 * 【Python 接口】
 * 函数名: device_list_files
 * 参数: {}
 * 返回: { success, files: [{ filename, size }] }
 */
async function getDeviceFileList() {
  // TODO: 对接 Python 设备文件列表接口
  // return await callPython('device_api.py', 'device_list_files', {});
  
  console.log('[API] getDeviceFileList');
  return { 
    success: true, 
    files: [
      { filename: 'example.bin', size: 1024 },
      { filename: 'motor_control.bin', size: 2048 }
    ] 
  };
}

/**
 * 应用参数到设备（立即生效）
 * 
 * 【Python 接口】
 * 函数名: device_apply_params
 * 参数: { module_name, params }
 * 返回: { success }
 * 
 * @param {string} moduleName - 模块名称
 * @param {object} params - 参数对象 { param_name: value }
 */
async function applyParamsToDevice(moduleName, params) {
  // TODO: 对接 Python 设备参数应用接口
  // return await callPython('device_api.py', 'device_apply_params', {
  //   module_name: moduleName,
  //   params
  // });
  
  console.log('[API] applyParamsToDevice:', { moduleName, params });
  return { success: true };
}

/**
 * 读取设备寄存器
 * 
 * 【Python 接口】
 * 函数名: device_read_register
 * 参数: { address, count }
 * 返回: { success, values: [value1, value2, ...] }
 * 
 * @param {number} address - 起始地址
 * @param {number} count - 读取数量
 */
async function readDeviceRegister(address, count = 1) {
  // TODO: 对接 Python 寄存器读取接口
  // return await callPython('device_api.py', 'device_read_register', {
  //   address, count
  // });
  
  console.log('[API] readDeviceRegister:', { address, count });
  return { success: true, values: [0] };
}

/**
 * 写入设备寄存器
 * 
 * 【Python 接口】
 * 函数名: device_write_register
 * 参数: { address, values }
 * 返回: { success }
 * 
 * @param {number} address - 起始地址
 * @param {Array} values - 要写入的值
 */
async function writeDeviceRegister(address, values) {
  // TODO: 对接 Python 寄存器写入接口
  // return await callPython('device_api.py', 'device_write_register', {
  //   address, values
  // });
  
  console.log('[API] writeDeviceRegister:', { address, values });
  return { success: true };
}

// ============================================================
// 寄存器管理接口
// ============================================================

/**
 * 读取单个寄存器（按地址）
 * 
 * 【Python 接口】
 * 函数名: register_read
 * 参数: { address }
 * 返回: { success, address, value, type }
 * 
 * @param {number} address - 寄存器地址
 */
async function readRegister(address) {
  // TODO: 对接 Python 单个寄存器读取接口
  // return await callPython('device_api.py', 'register_read', { address });
  
  console.log('[API] readRegister:', { address: '0x' + address.toString(16).toUpperCase() });
  
  // 模拟返回数据
  return { 
    success: true, 
    address,
    value: Math.floor(Math.random() * 10000),
    type: 'int'
  };
}

/**
 * 写入单个寄存器
 * 
 * 【Python 接口】
 * 函数名: register_write
 * 参数: { address, value }
 * 返回: { success, address, written }
 * 
 * @param {number} address - 寄存器地址
 * @param {number|string} value - 要写入的值
 */
async function writeRegister(address, value) {
  // TODO: 对接 Python 单个寄存器写入接口
  // return await callPython('device_api.py', 'register_write', { address, value });
  
  console.log('[API] writeRegister:', { address: '0x' + address.toString(16).toUpperCase(), value });
  
  return { 
    success: true, 
    address,
    written: true 
  };
}

/**
 * 批量读取所有可读寄存器
 * 
 * 【Python 接口】
 * 函数名: register_read_all
 * 参数: {}
 * 返回: { success, registers: [{ address, value, type }] }
 */
async function readAllRegisters() {
  // TODO: 对接 Python 批量寄存器读取接口
  // return await callPython('device_api.py', 'register_read_all', {});
  
  console.log('[API] readAllRegisters');
  
  // 模拟返回所有可读寄存器的数据
  return { 
    success: true, 
    registers: [
      { address: 0x0000, value: 5000, type: 'int' },
      { address: 0x0001, value: 'v2.1.0', type: 'string' },
      { address: 0x0002, value: 'Rev.C', type: 'string' },
      { address: 0x0010, value: 1, type: 'int' },
      { address: 0x0011, value: 0, type: 'int' },
      { address: 0x0020, value: 5000, type: 'int' },
      { address: 0x0021, value: 38000, type: 'int' },
      { address: 0x0022, value: 50000, type: 'int' },
      { address: 0x0030, value: 'example', type: 'string' },
      { address: 0x0031, value: 'WINDOW_R', type: 'string' },
      { address: 0x0050, value: 100000, type: 'int' },
      { address: 0x0051, value: 0, type: 'int' },
      { address: 0x0060, value: 45, type: 'int' },
      { address: 0x0061, value: 80, type: 'int' },
      { address: 0x0070, value: 'EL5000-2024-00128', type: 'string' }
    ]
  };
}

/**
 * 获取寄存器定义元数据
 * 
 * 【说明】此接口返回寄存器的静态定义信息，通常存储在配置文件中
 * 
 * @returns {object} - 寄存器定义列表
 */
async function getRegisterDefinitions() {
  console.log('[API] getRegisterDefinitions');

  // 从运行时配置文件读取（方便用户自行维护真实寄存器表）
  // 支持格式：
  // 1) { "definitions": [ ... ] }
  // 2) [ ... ]
  // address 支持 number 或 "0x1234"/"4660"
  try {
    const fs = require('fs').promises;
    const configPath = path.join(__dirname, '../../data/register_definitions.json');
    const raw = await fs.readFile(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    const defs = Array.isArray(parsed) ? parsed : parsed && Array.isArray(parsed.definitions) ? parsed.definitions : null;

    if (!defs) {
      return { success: false, error: 'register_definitions.json 格式不正确：需要数组或 {definitions: []}', definitions: [] };
    }

    const normalizeAddress = (addr) => {
      if (typeof addr === 'number' && Number.isFinite(addr)) return addr;
      if (typeof addr !== 'string') return null;
      const s = addr.trim().toLowerCase();
      if (s.startsWith('0x')) {
        const n = parseInt(s, 16);
        return Number.isFinite(n) ? n : null;
      }
      const n = parseInt(s, 10);
      return Number.isFinite(n) ? n : null;
    };

    const normalized = defs
      .map((d) => {
        const address = normalizeAddress(d.address ?? d.id);
        return {
          address,
          name: d.name,
          type: d.type,
          access: d.access,
          description: d.description || '',
          min: typeof d.min === 'number' ? d.min : undefined,
          max: typeof d.max === 'number' ? d.max : undefined
        };
      })
      .filter((d) => d.address !== null && d.name && d.type && d.access);

    return { success: true, definitions: normalized };
  } catch (err) {
    // 读不到文件或解析失败时，保持旧行为：回退到内置默认值
    console.warn('[API] getRegisterDefinitions fallback:', err.message);
    return {
      success: true,
      definitions: [
        { address: 0x0000, name: 'DEVICE_ID', type: 'int', access: 'read', description: '设备ID' },
        { address: 0x0001, name: 'FIRMWARE_VER', type: 'string', access: 'read', description: '固件版本' },
        { address: 0x0002, name: 'HARDWARE_VER', type: 'string', access: 'read', description: '硬件版本' },
        { address: 0x0010, name: 'RUN_STATUS', type: 'int', access: 'read', description: '运行状态 (0:停止 1:运行)' },
        { address: 0x0011, name: 'ERROR_CODE', type: 'int', access: 'read', description: '错误码' },
        { address: 0x0020, name: 'CURRENT_SETPOINT', type: 'int', access: 'readwrite', description: '电流设定值 (mA)' },
        { address: 0x0021, name: 'VOLTAGE_LIMIT', type: 'int', access: 'readwrite', description: '电压限制 (mV)' },
        { address: 0x0022, name: 'POWER_LIMIT', type: 'int', access: 'readwrite', description: '功率限制 (W)' },
        { address: 0x0030, name: 'MODEL_NAME', type: 'string', access: 'readwrite', description: '当前模型名称' },
        { address: 0x0031, name: 'MODULE_NAME', type: 'string', access: 'readwrite', description: '当前模块名称' },
        { address: 0x0040, name: 'CTRL_START', type: 'int', access: 'write', description: '写1启动模型' },
        { address: 0x0041, name: 'CTRL_STOP', type: 'int', access: 'write', description: '写1停止模型' },
        { address: 0x0042, name: 'CTRL_RESET', type: 'int', access: 'write', description: '写1复位设备' },
        { address: 0x0050, name: 'SAMPLE_RATE', type: 'int', access: 'readwrite', description: '采样率 (Hz)' },
        { address: 0x0051, name: 'OUTPUT_MODE', type: 'int', access: 'readwrite', description: '输出模式' },
        { address: 0x0060, name: 'TEMP_CURRENT', type: 'int', access: 'read', description: '当前温度 (°C)' },
        { address: 0x0061, name: 'TEMP_LIMIT', type: 'int', access: 'readwrite', description: '温度限制 (°C)' },
        { address: 0x0070, name: 'SERIAL_NUMBER', type: 'string', access: 'read', description: '设备序列号' },
        { address: 0x0080, name: 'USER_DATA', type: 'string', access: 'write', description: '用户自定义数据' }
      ]
    };
  }
}

// ============================================================
// 模型文件接口
// ============================================================

/**
 * 获取模型文件列表
 * 
 * 【Python 接口】
 * 函数名: model_list
 * 参数: { device_sn }
 * 返回: { success, files: [{ filename, size, modified }] }
 * 
 * @param {string} deviceSN - 设备序列号
 */
async function getModelList(deviceSN) {
  // TODO: 对接 Python 模型文件列表接口
  // return await callPython('model_api.py', 'model_list', { device_sn: deviceSN });
  
  console.log('[API] getModelList:', { deviceSN });
  
  const fs = require('fs').promises;
  const modelPath = path.join(__dirname, '../../data/bin_files');
  
  try {
    const files = await fs.readdir(modelPath);
    const fileList = [];
    
    for (const file of files) {
      if (file.endsWith('.bin')) {
        const stat = await fs.stat(path.join(modelPath, file));
        fileList.push({
          filename: file,
          size: stat.size,
          modified: stat.mtime
        });
      }
    }
    
    return { success: true, files: fileList };
  } catch (err) {
    console.error('获取模型列表失败:', err);
    return { success: false, error: err.message, files: [] };
  }
}

/**
 * 获取模型文件内容
 * 
 * 【Python 接口】
 * 函数名: model_get
 * 参数: { device_sn, filename }
 * 返回: { success, content }
 * 
 * @param {string} deviceSN - 设备序列号
 * @param {string} filename - 文件名
 */
async function getModelContent(deviceSN, filename) {
  // TODO: 对接 Python 模型文件读取接口
  // return await callPython('model_api.py', 'model_get', { device_sn: deviceSN, filename });
  
  console.log('[API] getModelContent:', { deviceSN, filename });
  
  const fs = require('fs').promises;
  const filePath = path.join(__dirname, '../../data/bin_files', filename);
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (err) {
    console.error('读取模型文件失败:', err);
    return { success: false, error: err.message };
  }
}

// ============================================================
// 本地文件接口
// ============================================================

/**
 * 保存文件到本地
 * 
 * 【说明】此接口由 Node.js 直接处理，不需要 Python
 * 
 * @param {string} deviceSN - 设备序列号
 * @param {string} filename - 文件名
 * @param {string} content - 文件内容
 */
async function saveToLocal(deviceSN, filename, content) {
  const fs = require('fs').promises;
  const filePath = path.join(__dirname, '../../data', deviceSN, filename);
  
  // 确保目录存在
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
  
  console.log('[API] saveToLocal:', { deviceSN, filename });
  return { success: true, path: filePath };
}

/**
 * 另存为新文件
 * 
 * @param {string} deviceSN - 设备序列号
 * @param {string} newFilename - 新文件名
 * @param {string} content - 文件内容
 */
async function saveAsLocal(deviceSN, newFilename, content) {
  return await saveToLocal(deviceSN, newFilename, content);
}

/**
 * 读取本地文件
 * 
 * @param {string} deviceSN - 设备序列号
 * @param {string} filename - 文件名
 */
async function readFromLocal(deviceSN, filename) {
  const fs = require('fs').promises;
  const filePath = path.join(__dirname, '../../data', deviceSN, filename);
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    console.log('[API] readFromLocal:', { deviceSN, filename });
    return { success: true, content };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * 获取本地文件列表
 * 
 * @param {string} deviceSN - 设备序列号
 */
async function getLocalFileList(deviceSN) {
  const fs = require('fs').promises;
  const dirPath = path.join(__dirname, '../../data', deviceSN);
  
  try {
    await fs.mkdir(dirPath, { recursive: true });
    const files = await fs.readdir(dirPath);
    const fileList = [];
    
    for (const file of files) {
      if (file.endsWith('.bin')) {
        const stat = await fs.stat(path.join(dirPath, file));
        fileList.push({
          filename: file,
          size: stat.size,
          modified: stat.mtime
        });
      }
    }
    
    console.log('[API] getLocalFileList:', { deviceSN, count: fileList.length });
    return { success: true, files: fileList };
  } catch (err) {
    return { success: false, error: err.message, files: [] };
  }
}

// ============================================================
// 导出所有接口
// ============================================================

module.exports = {
  // 云端接口
  uploadToCloud,
  getCloudFileList,
  downloadFromCloud,
  
  // 设备接口
  connectDevice,
  disconnectDevice,
  getDeviceStatus,
  getDeviceInfo,
  getRealtimeData,
  uploadToDevice,
  downloadFromDevice,
  getDeviceFileList,
  applyParamsToDevice,
  readDeviceRegister,
  writeDeviceRegister,
  
  // 寄存器管理接口
  readRegister,
  writeRegister,
  readAllRegisters,
  getRegisterDefinitions,
  
  // 模型文件接口
  getModelList,
  getModelContent,
  
  // 本地文件接口
  saveToLocal,
  saveAsLocal,
  readFromLocal,
  getLocalFileList
};

