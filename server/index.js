/**
 * 电子负载上位机 - Node.js 后端服务
 * 功能：提供REST API和WebSocket通信，桥接Vue前端与Python后端
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

// 导入路由模块
const binFileRoutes = require('./routes/binFile');
const deviceRoutes = require('./routes/device');
const configRoutes = require('./routes/config');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（Vue打包后的文件）
app.use(express.static(path.join(__dirname, '../client/dist')));

// API 路由
app.use('/api/bin', binFileRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api/config', configRoutes);
app.use('/api', apiRoutes);  // 新增统一API路由

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 创建HTTP服务器
const server = http.createServer(app);

// WebSocket服务器 - 用于实时通信
const wss = new WebSocket.Server({ server, path: '/ws' });

// WebSocket连接管理
const clients = new Set();

wss.on('connection', (ws, req) => {
  const remoteAddress = req?.socket?.remoteAddress;
  const remotePort = req?.socket?.remotePort;
  const ua = req?.headers?.['user-agent'];
  const url = req?.url;

  console.log('WebSocket客户端已连接', {
    remoteAddress,
    remotePort,
    url,
    ua
  });
  clients.add(ws);

  ws.on('message', (message) => {
    try {
      // ws 的 message 可能是 Buffer；统一转成 string 再 parse
      const text = Buffer.isBuffer(message) ? message.toString('utf8') : String(message);
      const data = JSON.parse(text);
      handleWebSocketMessage(ws, data);
    } catch (err) {
      console.error('WebSocket消息解析错误:', err);
    }
  });

  ws.on('close', (code, reason) => {
    // reason 可能是 Buffer
    const reasonText = Buffer.isBuffer(reason) ? reason.toString('utf8') : String(reason || '');
    console.log('WebSocket客户端已断开', { remoteAddress, remotePort, code, reason: reasonText });
    clients.delete(ws);
  });

  ws.on('error', (err) => {
    // 这里的错误经常是“无效 frame”，通常意味着有非预期客户端/代理在往 /ws 发数据
    console.error('WebSocket错误:', {
      remoteAddress,
      remotePort,
      url,
      message: err?.message,
      code: err?.code,
      stack: err?.stack
    });
    clients.delete(ws);
  });

  // 发送连接成功消息
  ws.send(JSON.stringify({ type: 'connected', message: '连接成功' }));
});

// 导入Python桥接模块
const pythonBridge = require('./api/pythonBridge');

// 处理WebSocket消息
async function handleWebSocketMessage(ws, data) {
  const { id, action, params = {} } = data;
  
  // 如果有id，说明是请求-响应模式
  const sendResponse = (result) => {
    if (id) {
      ws.send(JSON.stringify({ id, ...result }));
    }
  };

  try {
    let result;

    switch (action) {
      // ============================================================
      // 设备接口
      // ============================================================
      case 'device.connect':
        result = await pythonBridge.connectDevice(params.ip, params.port, params.timeout);
        sendResponse(result);
        break;

      case 'device.disconnect':
        result = await pythonBridge.disconnectDevice();
        sendResponse(result);
        break;

      case 'device.status':
        result = await pythonBridge.getDeviceStatus();
        sendResponse(result);
        break;

      case 'device.info':
        result = await pythonBridge.getDeviceInfo();
        sendResponse(result);
        break;

      case 'device.realtime':
        result = await pythonBridge.getRealtimeData();
        sendResponse(result);
        break;

      case 'device.upload':
        result = await pythonBridge.uploadToDevice(params.filename, params.content);
        sendResponse(result);
        break;

      case 'device.download':
        result = await pythonBridge.downloadFromDevice(params.filename);
        sendResponse(result);
        break;

      case 'device.files':
        result = await pythonBridge.getDeviceFileList();
        sendResponse(result);
        break;

      case 'device.apply':
        result = await pythonBridge.applyParamsToDevice(params.module_name, params.params);
        sendResponse(result);
        break;

      // ============================================================
      // 寄存器接口
      // ============================================================
      case 'register.read':
        result = await pythonBridge.readRegister(params.address);
        sendResponse(result);
        break;

      case 'register.write':
        result = await pythonBridge.writeRegister(params.address, params.value);
        sendResponse(result);
        // 广播寄存器变化
        broadcast({ type: 'register.changed', data: { address: params.address, value: params.value } });
        break;

      case 'register.readAll':
        result = await pythonBridge.readAllRegisters();
        sendResponse(result);
        break;

      case 'register.definitions':
        result = await pythonBridge.getRegisterDefinitions();
        sendResponse(result);
        break;

      // ============================================================
      // 本地文件接口
      // ============================================================
      case 'file.save':
        result = await pythonBridge.saveToLocal(params.device_sn, params.filename, params.content);
        sendResponse(result);
        break;

      case 'file.saveAs':
        result = await pythonBridge.saveAsLocal(params.device_sn, params.filename, params.content);
        sendResponse(result);
        break;

      case 'file.read':
        result = await pythonBridge.readFromLocal(params.device_sn, params.filename);
        sendResponse(result);
        break;

      case 'file.list':
        result = await pythonBridge.getLocalFileList(params.device_sn);
        sendResponse(result);
        break;

      // ============================================================
      // 云端接口
      // ============================================================
      case 'cloud.upload':
        result = await pythonBridge.uploadToCloud(params.device_sn, params.filename, params.content, params.metadata);
        sendResponse(result);
        break;

      case 'cloud.download':
        result = await pythonBridge.downloadFromCloud(params.device_sn, params.filename, params.version);
        sendResponse(result);
        break;

      case 'cloud.list':
        result = await pythonBridge.getCloudFileList(params.device_sn, params.project_id);
        sendResponse(result);
        break;

      // ============================================================
      // 模型文件接口
      // ============================================================
      case 'model.list':
        result = await pythonBridge.getModelList(params.device_sn);
        sendResponse(result);
        break;

      case 'model.get':
        result = await pythonBridge.getModelContent(params.device_sn, params.filename);
        sendResponse(result);
        break;

      // ============================================================
      // 其他
      // ============================================================
      case 'ping':
        sendResponse({ success: true, pong: Date.now() });
        break;

      case 'subscribe':
        ws.subscribed = params.topics || [];
        sendResponse({ success: true, subscribed: ws.subscribed });
        break;

      default:
        // 兼容旧格式：使用 data.type 字段
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        } else if (data.type === 'subscribe') {
          ws.subscribed = data.topics || [];
        } else {
          console.log('未知消息:', action || data.type);
          sendResponse({ success: false, error: `未知的操作: ${action || data.type}` });
        }
    }
  } catch (err) {
    console.error('WebSocket处理错误:', err);
    sendResponse({ success: false, error: err.message });
  }
}

// 广播消息到所有客户端
function broadcast(message) {
  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// 导出广播函数供其他模块使用
module.exports.broadcast = broadcast;

// SPA路由回退
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// 启动服务器
server.listen(PORT, () => {
  // 说明：Windows/PowerShell 对中文字符宽度处理会导致 Unicode “方框边框”看起来断裂/不对齐
  // 这里改为纯 ASCII 分隔线，保证任何终端显示一致
  const sep = '============================================================';
  console.log(
    [
      sep,
      '电子负载上位机服务已启动',
      `HTTP: http://localhost:${PORT}`,
      `WS:   ws://localhost:${PORT}/ws`,
      sep
    ].join('\n')
  );
});



