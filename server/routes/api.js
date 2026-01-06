/**
 * API 路由汇总
 * 
 * 【接口分类】
 * /api/file/*   - 本地文件操作
 * /api/device/* - 设备通信操作
 * /api/cloud/*  - 云端同步操作
 * 
 * 【Python 接口标注】
 * 标注 [Python] 的接口需要调用 Python 后端
 * 标注 [Node.js] 的接口由 Node.js 直接处理
 */

const express = require('express');
const router = express.Router();
const pythonBridge = require('../api/pythonBridge');

// ============================================================
// 本地文件接口 [Node.js]
// ============================================================

/**
 * 保存文件到本地
 * POST /api/file/save
 * Body: { device_sn, filename, content }
 * 
 * [Node.js] 直接处理，无需 Python
 */
router.post('/file/save', async (req, res) => {
  try {
    const { device_sn, filename, content } = req.body;
    const result = await pythonBridge.saveToLocal(device_sn, filename, content);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 另存为新文件
 * POST /api/file/save-as
 * Body: { device_sn, filename, content }
 * 
 * [Node.js] 直接处理，无需 Python
 */
router.post('/file/save-as', async (req, res) => {
  try {
    const { device_sn, filename, content } = req.body;
    const result = await pythonBridge.saveAsLocal(device_sn, filename, content);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 读取本地文件
 * GET /api/file/read?device_sn=xxx&filename=xxx
 * 
 * [Node.js] 直接处理，无需 Python
 */
router.get('/file/read', async (req, res) => {
  try {
    const { device_sn, filename } = req.query;
    const result = await pythonBridge.readFromLocal(device_sn, filename);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 获取本地文件列表
 * GET /api/file/list?device_sn=xxx
 * 
 * [Node.js] 直接处理，无需 Python
 */
router.get('/file/list', async (req, res) => {
  try {
    const { device_sn } = req.query;
    const result = await pythonBridge.getLocalFileList(device_sn);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// 设备通信接口 [Python]
// ============================================================

/**
 * 连接设备
 * POST /api/device/connect
 * Body: { ip, port, timeout }
 * 
 * [Python] 需要调用 python_bridge/api_interface.py :: device_connect
 */
router.post('/device/connect', async (req, res) => {
  try {
    const { ip, port, timeout } = req.body;
    const result = await pythonBridge.connectDevice(ip, port, timeout);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 断开设备
 * POST /api/device/disconnect
 * 
 * [Python] 需要调用 python_bridge/api_interface.py :: device_disconnect
 */
router.post('/device/disconnect', async (req, res) => {
  try {
    const result = await pythonBridge.disconnectDevice();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 获取设备状态
 * GET /api/device/status
 * 
 * [Python] 需要调用 python_bridge/api_interface.py :: device_get_status
 */
router.get('/device/status', async (req, res) => {
  try {
    const result = await pythonBridge.getDeviceStatus();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 上传文件到设备
 * POST /api/device/upload
 * Body: { filename, content }
 * 
 * [Python] 需要调用 python_bridge/api_interface.py :: device_upload_file
 */
router.post('/device/upload', async (req, res) => {
  try {
    const { filename, content } = req.body;
    const result = await pythonBridge.uploadToDevice(filename, content);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 从设备下载文件
 * GET /api/device/download?filename=xxx
 * 
 * [Python] 需要调用 python_bridge/api_interface.py :: device_download_file
 */
router.get('/device/download', async (req, res) => {
  try {
    const { filename } = req.query;
    const result = await pythonBridge.downloadFromDevice(filename);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 获取设备文件列表
 * GET /api/device/files
 * 
 * [Python] 需要调用 python_bridge/api_interface.py :: device_list_files
 */
router.get('/device/files', async (req, res) => {
  try {
    const result = await pythonBridge.getDeviceFileList();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 应用参数到设备（立即生效）
 * POST /api/device/apply
 * Body: { module_name, params }
 * 
 * [Python] 需要调用 python_bridge/api_interface.py :: device_apply_params
 */
router.post('/device/apply', async (req, res) => {
  try {
    const { module_name, params } = req.body;
    const result = await pythonBridge.applyParamsToDevice(module_name, params);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// 寄存器操作接口 [Python]
// ============================================================

/**
 * 读取单个寄存器
 * GET /api/register/read?address=xxx
 * 
 * [Python] 需要调用 python_bridge/api_interface.py :: register_read
 * 返回: { success: true, address: number, value: number|string, type: 'int'|'string' }
 */
router.get('/register/read', async (req, res) => {
  try {
    const { address } = req.query;
    const result = await pythonBridge.readRegister(parseInt(address, 16) || parseInt(address));
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 写入单个寄存器
 * POST /api/register/write
 * Body: { address: number, value: number|string }
 * 
 * [Python] 需要调用 python_bridge/api_interface.py :: register_write
 * 返回: { success: true, address: number, written: true }
 */
router.post('/register/write', async (req, res) => {
  try {
    const { address, value } = req.body;
    const result = await pythonBridge.writeRegister(address, value);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 批量读取所有可读寄存器
 * GET /api/register/readAll
 * 
 * [Python] 需要调用 python_bridge/api_interface.py :: register_read_all
 * 返回: { success: true, registers: [{ address, value, type }] }
 */
router.get('/register/readAll', async (req, res) => {
  try {
    const result = await pythonBridge.readAllRegisters();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 获取寄存器定义列表
 * GET /api/register/definitions
 * 
 * [Node.js] 返回寄存器的元数据定义（地址、名称、类型、权限、描述等）
 * 返回: { success: true, definitions: [...] }
 */
router.get('/register/definitions', async (req, res) => {
  try {
    const result = await pythonBridge.getRegisterDefinitions();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 读取设备寄存器 (旧接口，保留兼容)
 * GET /api/device/register?address=xxx&count=xxx
 * 
 * [Python] 需要调用 python_bridge/api_interface.py :: device_read_register
 */
router.get('/device/register', async (req, res) => {
  try {
    const { address, count } = req.query;
    const result = await pythonBridge.readDeviceRegister(parseInt(address), parseInt(count) || 1);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 写入设备寄存器 (旧接口，保留兼容)
 * POST /api/device/register
 * Body: { address, values }
 * 
 * [Python] 需要调用 python_bridge/api_interface.py :: device_write_register
 */
router.post('/device/register', async (req, res) => {
  try {
    const { address, values } = req.body;
    const result = await pythonBridge.writeDeviceRegister(address, values);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// 云端同步接口 [Python]
// ============================================================

/**
 * 上传文件到云端
 * POST /api/cloud/upload
 * Body: { device_sn, filename, content, metadata }
 * 
 * [Python] 需要调用 python_bridge/api_interface.py :: cloud_upload
 */
router.post('/cloud/upload', async (req, res) => {
  try {
    const { device_sn, filename, content, metadata } = req.body;
    const result = await pythonBridge.uploadToCloud(device_sn, filename, content, metadata);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 从云端下载文件
 * GET /api/cloud/download?device_sn=xxx&filename=xxx&version=xxx
 * 
 * [Python] 需要调用 python_bridge/api_interface.py :: cloud_download
 */
router.get('/cloud/download', async (req, res) => {
  try {
    const { device_sn, filename, version } = req.query;
    const result = await pythonBridge.downloadFromCloud(device_sn, filename, version);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 获取云端文件列表
 * GET /api/cloud/list?device_sn=xxx&project_id=xxx
 * 
 * [Python] 需要调用 python_bridge/api_interface.py :: cloud_list_files
 */
router.get('/cloud/list', async (req, res) => {
  try {
    const { device_sn, project_id } = req.query;
    const result = await pythonBridge.getCloudFileList(device_sn, project_id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

