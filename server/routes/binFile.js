/**
 * Bin文件管理路由
 * 处理仿真模型参数文件的读取、编辑、保存
 * 
 * 【API 接口列表】
 * GET  /api/bin/list/:deviceSN         - 获取文件列表（按设备SN）
 * GET  /api/bin/read/:deviceSN/:filename - 读取文件
 * POST /api/bin/save/:deviceSN/:filename - 保存文件
 * POST /api/bin/save-as/:deviceSN       - 另存为
 * POST /api/bin/upload/:deviceSN        - 上传文件
 * GET  /api/bin/schema                  - 获取参数Schema
 * GET  /api/bin/backups/:deviceSN       - 获取备份列表
 * POST /api/bin/restore/:deviceSN/:backupName - 恢复备份
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const BinParser = require('../utils/binParser');

// 数据存储目录
const DATA_DIR = path.join(__dirname, '../../data');

/**
 * 获取设备数据目录
 * 文件按设备SN号分目录存储: data/{deviceSN}/
 */
function getDeviceDir(deviceSN) {
  return path.join(DATA_DIR, deviceSN);
}

function getBackupDir(deviceSN) {
  return path.join(DATA_DIR, deviceSN, 'backups');
}

// 确保目录存在
async function ensureDeviceDirs(deviceSN) {
  await fs.mkdir(getDeviceDir(deviceSN), { recursive: true });
  await fs.mkdir(getBackupDir(deviceSN), { recursive: true });
}

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, BIN_DIR),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}_${file.originalname}`);
  }
});
const upload = multer({ storage });

/**
 * 获取设备的bin文件列表
 * GET /api/bin/list/:deviceSN
 * 
 * 【Python 对接】无需 Python，Node.js 直接处理
 */
router.get('/list/:deviceSN', async (req, res) => {
  try {
    const { deviceSN } = req.params;
    const deviceDir = getDeviceDir(deviceSN);
    
    await ensureDeviceDirs(deviceSN);
    
    const files = await fs.readdir(deviceDir);
    const binFiles = [];
    
    for (const file of files) {
      if (file.endsWith('.bin')) {
        const filePath = path.join(deviceDir, file);
        const stat = await fs.stat(filePath);
        binFiles.push({
          name: file,
          size: stat.size,
          modified: stat.mtime,
          created: stat.birthtime
        });
      }
    }
    
    res.json({ success: true, deviceSN, files: binFiles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 读取bin文件
 * GET /api/bin/read/:deviceSN/:filename
 * 
 * 【说明】使用 BinParser 解析文本格式的 bin 文件
 */
router.get('/read/:deviceSN/:filename', async (req, res) => {
  try {
    const { deviceSN, filename } = req.params;
    const filePath = path.join(getDeviceDir(deviceSN), filename);
    
    // 检查文件是否存在
    await fs.access(filePath);
    
    // 读取文件内容（文本格式）
    const content = await fs.readFile(filePath, 'utf-8');
    
    // 使用 BinParser 解析
    const parser = new BinParser();
    const parseResult = parser.parse(content, filename);
    
    res.json({ 
      success: true, 
      deviceSN,
      filename,
      ...parseResult
    });
  } catch (err) {
    res.status(404).json({ success: false, error: `文件不存在或读取失败: ${err.message}` });
  }
});

/**
 * 保存bin文件
 * POST /api/bin/save/:deviceSN/:filename
 * Body: { content: "文件内容", createBackup: true }
 * 
 * 【Python 对接】无需 Python，Node.js 直接处理
 */
router.post('/save/:deviceSN/:filename', async (req, res) => {
  try {
    const { deviceSN, filename } = req.params;
    const { content, createBackup = true } = req.body;
    const filePath = path.join(getDeviceDir(deviceSN), filename);
    
    await ensureDeviceDirs(deviceSN);
    
    // 创建备份
    if (createBackup) {
      try {
        const existingData = await fs.readFile(filePath, 'utf-8');
        const backupName = `${Date.now()}_${filename}`;
        await fs.writeFile(path.join(getBackupDir(deviceSN), backupName), existingData);
      } catch (e) {
        // 文件不存在，无需备份
      }
    }
    
    // 保存文件
    await fs.writeFile(filePath, content, 'utf-8');
    
    res.json({ 
      success: true, 
      message: '文件保存成功',
      deviceSN,
      filename,
      size: content.length 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 另存为新文件
 * POST /api/bin/save-as/:deviceSN
 * Body: { filename: "新文件名", content: "文件内容" }
 */
router.post('/save-as/:deviceSN', async (req, res) => {
  try {
    const { deviceSN } = req.params;
    const { filename, content } = req.body;
    
    if (!filename || !filename.endsWith('.bin')) {
      return res.status(400).json({ success: false, error: '文件名必须以.bin结尾' });
    }
    
    const filePath = path.join(getDeviceDir(deviceSN), filename);
    
    await ensureDeviceDirs(deviceSN);
    
    // 检查文件是否已存在
    try {
      await fs.access(filePath);
      return res.status(400).json({ success: false, error: '文件已存在' });
    } catch (e) {
      // 文件不存在，可以创建
    }
    
    await fs.writeFile(filePath, content, 'utf-8');
    
    res.json({ 
      success: true, 
      message: '文件已创建',
      deviceSN,
      filename,
      size: content.length 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 上传新的bin文件
 */
router.post('/upload', upload.single('binfile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未选择文件' });
    }
    
    res.json({
      success: true,
      message: '文件上传成功',
      file: {
        name: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 获取参数模板/schema定义
 * 定义bin文件中各参数的类型、范围、描述等
 */
router.get('/schema', (req, res) => {
  res.json({
    success: true,
    schema: getParameterSchema()
  });
});

/**
 * 获取备份列表
 * GET /api/bin/backups/:deviceSN
 */
router.get('/backups/:deviceSN', async (req, res) => {
  try {
    const { deviceSN } = req.params;
    const backupDir = getBackupDir(deviceSN);
    
    await ensureDeviceDirs(deviceSN);
    
    const files = await fs.readdir(backupDir);
    const backups = [];
    
    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stat = await fs.stat(filePath);
      backups.push({
        name: file,
        size: stat.size,
        created: stat.birthtime
      });
    }
    
    res.json({ success: true, deviceSN, backups });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 从备份恢复
 * POST /api/bin/restore/:deviceSN/:backupName
 * Body: { targetName: "恢复后的文件名" }
 */
router.post('/restore/:deviceSN/:backupName', async (req, res) => {
  try {
    const { deviceSN, backupName } = req.params;
    const { targetName } = req.body;
    
    const backupPath = path.join(getBackupDir(deviceSN), backupName);
    const targetPath = path.join(getDeviceDir(deviceSN), targetName || backupName.split('_').slice(1).join('_'));
    
    const data = await fs.readFile(backupPath, 'utf-8');
    await fs.writeFile(targetPath, data, 'utf-8');
    
    res.json({ success: true, message: '备份恢复成功', deviceSN });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ 辅助函数 ============

/**
 * 解析bin文件为参数对象
 * 注意：这里是示例结构，需要根据实际bin文件格式调整
 */
function parseBinFile(buffer) {
  // 示例参数结构 - 需要根据实际bin文件格式实现
  const params = {
    header: {
      version: buffer.length > 0 ? buffer.readUInt8(0) : 1,
      timestamp: buffer.length > 4 ? buffer.readUInt32LE(1) : Date.now()
    },
    model: {
      // 仿真模型参数组
      groups: []
    },
    io: {
      // 输入输出配置
      inputs: [],
      outputs: []
    }
  };
  
  // TODO: 根据实际bin文件格式解析
  // 这里先返回示例结构，后续需要对接实际格式
  
  return params;
}

/**
 * 将参数对象构建为bin格式
 */
function buildBinFile(params) {
  // 示例实现 - 需要根据实际格式调整
  const bufferSize = 1024; // 根据实际需要调整
  const buffer = Buffer.alloc(bufferSize);
  
  let offset = 0;
  
  // 写入头部
  if (params.header) {
    buffer.writeUInt8(params.header.version || 1, offset);
    offset += 1;
    buffer.writeUInt32LE(params.header.timestamp || Date.now(), offset);
    offset += 4;
  }
  
  // TODO: 根据实际bin文件格式写入其他参数
  
  return buffer.slice(0, offset || 5);
}

/**
 * 获取参数Schema定义
 * 定义每个参数的类型、范围、单位等元数据
 */
function getParameterSchema() {
  return {
    version: '1.0',
    groups: [
      {
        id: 'basic',
        name: '基础参数',
        description: '仿真模型基础配置',
        params: [
          {
            key: 'sample_rate',
            name: '采样率',
            type: 'number',
            unit: 'Hz',
            min: 100,
            max: 100000,
            default: 10000,
            description: '模型计算采样频率'
          },
          {
            key: 'precision',
            name: '计算精度',
            type: 'select',
            options: ['float32', 'float64'],
            default: 'float32',
            description: '浮点计算精度'
          }
        ]
      },
      {
        id: 'load',
        name: '负载参数',
        description: '电子负载特性配置',
        params: [
          {
            key: 'max_current',
            name: '最大电流',
            type: 'number',
            unit: 'A',
            min: 0,
            max: 1000,
            default: 100,
            description: '负载最大允许电流'
          },
          {
            key: 'max_voltage',
            name: '最大电压',
            type: 'number',
            unit: 'V',
            min: 0,
            max: 1500,
            default: 600,
            description: '负载最大允许电压'
          },
          {
            key: 'max_power',
            name: '最大功率',
            type: 'number',
            unit: 'W',
            min: 0,
            max: 150000,
            default: 50000,
            description: '负载最大允许功率'
          }
        ]
      },
      {
        id: 'control',
        name: '控制参数',
        description: '控制环路配置',
        params: [
          {
            key: 'kp',
            name: '比例系数',
            type: 'number',
            min: 0,
            max: 100,
            step: 0.01,
            default: 1.0,
            description: 'PID比例系数'
          },
          {
            key: 'ki',
            name: '积分系数',
            type: 'number',
            min: 0,
            max: 100,
            step: 0.001,
            default: 0.1,
            description: 'PID积分系数'
          },
          {
            key: 'kd',
            name: '微分系数',
            type: 'number',
            min: 0,
            max: 100,
            step: 0.001,
            default: 0.01,
            description: 'PID微分系数'
          }
        ]
      }
    ]
  };
}

module.exports = router;



