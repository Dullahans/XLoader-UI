/**
 * 系统配置路由
 * 管理应用配置、用户偏好设置等
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../../data/config.json');

// 默认配置
const defaultConfig = {
  app: {
    theme: 'dark',
    language: 'zh-CN',
    autoSave: true,
    autoSaveInterval: 30000, // 30秒
    showAdvancedParams: false
  },
  device: {
    defaultIp: '192.168.1.100',
    defaultPort: 8080,
    timeout: 5000,
    retryCount: 3
  },
  cloud: {
    enabled: false,
    endpoint: '',
    apiKey: ''
  },
  paths: {
    binDir: 'data/bin_files',
    backupDir: 'data/backups',
    exportDir: 'data/exports'
  }
};

/**
 * 获取所有配置
 */
router.get('/', async (req, res) => {
  try {
    const config = await loadConfig();
    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 更新配置
 */
router.put('/', async (req, res) => {
  try {
    const newConfig = req.body;
    const currentConfig = await loadConfig();
    
    // 深度合并配置
    const mergedConfig = deepMerge(currentConfig, newConfig);
    
    await saveConfig(mergedConfig);
    
    res.json({ success: true, config: mergedConfig });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 重置配置为默认值
 */
router.post('/reset', async (req, res) => {
  try {
    await saveConfig(defaultConfig);
    res.json({ success: true, config: defaultConfig });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 导出配置
 */
router.get('/export', async (req, res) => {
  try {
    const config = await loadConfig();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=loader-config-${Date.now()}.json`);
    res.send(JSON.stringify(config, null, 2));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 导入配置
 */
router.post('/import', async (req, res) => {
  try {
    const importedConfig = req.body;
    
    // 验证配置结构
    if (!validateConfig(importedConfig)) {
      return res.status(400).json({ success: false, error: '配置格式无效' });
    }
    
    await saveConfig(importedConfig);
    res.json({ success: true, config: importedConfig });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ 辅助函数 ============

async function loadConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    // 配置文件不存在，创建默认配置
    await saveConfig(defaultConfig);
    return defaultConfig;
  }
}

async function saveConfig(config) {
  const dir = path.dirname(CONFIG_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

function validateConfig(config) {
  // 基本验证
  return config && typeof config === 'object';
}

module.exports = router;




