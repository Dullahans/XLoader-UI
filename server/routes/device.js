/**
 * 设备通信路由
 * 处理与电子负载设备的UDP通信（通过Python桥接）
 */

const express = require('express');
const router = express.Router();
const { PythonShell } = require('python-shell');
const path = require('path');

// Python脚本路径（指向Python工程中的通信模块）
const PYTHON_BRIDGE_PATH = path.join(__dirname, '../../python_bridge');

// 设备状态缓存
let deviceStatus = {
  connected: false,
  ip: '',
  port: 0,
  lastHeartbeat: null,
  info: null
};

/**
 * 获取设备连接状态
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: deviceStatus
  });
});

/**
 * 连接设备
 */
router.post('/connect', async (req, res) => {
  try {
    const { ip, port = 8080 } = req.body;
    
    if (!ip) {
      return res.status(400).json({ success: false, error: '请提供设备IP地址' });
    }
    
    // 调用Python脚本进行UDP连接
    const result = await callPythonBridge('connect', { ip, port });
    
    if (result.success) {
      deviceStatus = {
        connected: true,
        ip,
        port,
        lastHeartbeat: new Date(),
        info: result.deviceInfo
      };
    }
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 断开设备连接
 */
router.post('/disconnect', async (req, res) => {
  try {
    const result = await callPythonBridge('disconnect', {});
    
    deviceStatus = {
      connected: false,
      ip: '',
      port: 0,
      lastHeartbeat: null,
      info: null
    };
    
    res.json({ success: true, message: '设备已断开' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 同步bin文件到设备
 */
router.post('/sync', async (req, res) => {
  try {
    const { filename, data } = req.body;
    
    if (!deviceStatus.connected) {
      return res.status(400).json({ success: false, error: '设备未连接' });
    }
    
    // 调用Python脚本发送bin文件到设备
    const result = await callPythonBridge('sync_bin', {
      filename,
      data,
      deviceIp: deviceStatus.ip,
      devicePort: deviceStatus.port
    });
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 从设备读取当前bin文件
 */
router.get('/read-bin', async (req, res) => {
  try {
    if (!deviceStatus.connected) {
      return res.status(400).json({ success: false, error: '设备未连接' });
    }
    
    const result = await callPythonBridge('read_bin', {
      deviceIp: deviceStatus.ip,
      devicePort: deviceStatus.port
    });
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 发送UDP命令到设备
 */
router.post('/command', async (req, res) => {
  try {
    const { command, params } = req.body;
    
    if (!deviceStatus.connected) {
      return res.status(400).json({ success: false, error: '设备未连接' });
    }
    
    const result = await callPythonBridge('send_command', {
      command,
      params,
      deviceIp: deviceStatus.ip,
      devicePort: deviceStatus.port
    });
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 设备发现（扫描局域网设备）
 */
router.get('/discover', async (req, res) => {
  try {
    const { subnet = '192.168.1' } = req.query;
    
    const result = await callPythonBridge('discover', { subnet });
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ Python桥接函数 ============

/**
 * 调用Python桥接脚本
 * @param {string} action - 操作类型
 * @param {object} params - 参数
 */
async function callPythonBridge(action, params) {
  return new Promise((resolve, reject) => {
    const options = {
      mode: 'json',
      pythonPath: 'python', // 或指定具体Python路径
      pythonOptions: ['-u'],
      scriptPath: PYTHON_BRIDGE_PATH,
      args: [action, JSON.stringify(params)]
    };
    
    // 如果Python桥接脚本不存在，返回模拟数据用于开发
    const scriptPath = path.join(PYTHON_BRIDGE_PATH, 'bridge.py');
    const fs = require('fs');
    
    if (!fs.existsSync(scriptPath)) {
      // 开发模式：返回模拟数据
      console.log(`[DEV] Python桥接调用: ${action}`, params);
      resolve(getMockResponse(action, params));
      return;
    }
    
    PythonShell.run('bridge.py', options)
      .then(results => {
        resolve(results[0] || { success: true });
      })
      .catch(err => {
        reject(err);
      });
  });
}

/**
 * 开发模式下的模拟响应
 */
function getMockResponse(action, params) {
  const responses = {
    connect: {
      success: true,
      message: '连接成功（模拟）',
      deviceInfo: {
        model: 'EL-5000',
        firmware: 'v2.1.0',
        serial: 'EL5000-2024-001'
      }
    },
    disconnect: {
      success: true,
      message: '断开成功（模拟）'
    },
    sync_bin: {
      success: true,
      message: '文件同步成功（模拟）',
      bytesTransferred: 1024
    },
    read_bin: {
      success: true,
      message: '读取成功（模拟）',
      data: {}
    },
    send_command: {
      success: true,
      message: '命令发送成功（模拟）',
      response: 'OK'
    },
    discover: {
      success: true,
      devices: [
        { ip: '192.168.1.100', port: 8080, model: 'EL-5000' },
        { ip: '192.168.1.101', port: 8080, model: 'EL-3000' }
      ]
    }
  };
  
  return responses[action] || { success: false, error: '未知操作' };
}

module.exports = router;




