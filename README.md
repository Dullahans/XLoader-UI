# 电子负载参数管理系统

基于 Vue2 + Node.js 的电子负载设备上位机参数管理界面，用于管理仿真模型的 `.bin` 配置文件。

## 📋 功能特性

- **参数编辑**: 可视化编辑仿真模型参数，支持分组展示、参数校验
- **文件管理**: 本地 bin 文件的上传、下载、备份管理
- **设备连接**: 通过 UDP 协议与电子负载设备通信
- **实时同步**: 参数修改后可实时同步到设备
- **备份恢复**: 自动备份和一键恢复功能

## 🏗️ 项目结构

```
loader_ui/
├── client/                 # Vue2 前端
│   ├── public/
│   ├── src/
│   │   ├── api/           # API 接口模块
│   │   ├── router/        # 路由配置
│   │   ├── store/         # Vuex 状态管理
│   │   ├── styles/        # 全局样式
│   │   ├── views/         # 页面组件
│   │   ├── App.vue
│   │   └── main.js
│   ├── package.json
│   └── vue.config.js
│
├── server/                 # Node.js 后端
│   ├── routes/
│   │   ├── binFile.js     # bin文件管理路由
│   │   ├── device.js      # 设备通信路由
│   │   └── config.js      # 配置管理路由
│   └── index.js           # 服务入口
│
├── python_bridge/          # Python 桥接层
│   ├── bridge.py          # 设备通信桥接
│   └── bin_parser.py      # bin文件解析器
│
├── data/                   # 数据目录（运行时生成）
│   ├── bin_files/         # bin 参数文件
│   ├── backups/           # 备份文件
│   └── config.json        # 应用配置
│
└── package.json
```

## 🚀 快速开始

### 环境要求

- Node.js >= 16.x
- Python >= 3.8
- npm 或 yarn

### 安装依赖

```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd client
npm install
```

### 开发模式

```bash
# 同时启动前后端（推荐）
npm run dev

# 或分别启动
npm run server   # 启动 Node.js 后端 (端口 3000)
npm run client   # 启动 Vue 前端 (端口 8080)
```

### 生产构建

```bash
# 构建前端
npm run build

# 启动生产服务
npm start
```

## 📡 与 Python 工程集成

### 方式一：独立运行

UI 系统作为独立服务运行，通过 HTTP API 与现有 Python 工程交互。

```python
# 在 Python 工程中调用 UI 服务
import requests

# 获取参数
response = requests.get('http://localhost:3000/api/bin/read/model.bin')
params = response.json()

# 更新参数
requests.post('http://localhost:3000/api/bin/save/model.bin', json={
    'params': new_params
})
```

### 方式二：嵌入式运行

将 Node.js 服务作为子进程启动：

```python
import subprocess
import os

# 启动 UI 服务
ui_process = subprocess.Popen(
    ['node', 'server/index.js'],
    cwd='/path/to/loader_ui',
    env={**os.environ, 'PORT': '3000'}
)

# 在 Python 主程序中使用 UDP 通信
# UI 通过 python_bridge 调用您现有的 UDP 通信代码
```

### 方式三：直接集成 Python 桥接

修改 `python_bridge/bridge.py`，导入您现有的 UDP 通信模块：

```python
# bridge.py
from your_project.udp_client import UDPClient  # 导入现有模块

class DeviceBridge:
    def __init__(self):
        self.client = UDPClient()  # 使用现有客户端
    
    def connect(self, ip, port):
        return self.client.connect(ip, port)
    
    # ... 其他方法
```

## 📝 配置说明

### 服务端口

```bash
# 通过环境变量配置端口
PORT=3000 npm start
```

### 设备连接参数

编辑 `data/config.json`:

```json
{
  "device": {
    "defaultIp": "192.168.1.100",
    "defaultPort": 8080,
    "timeout": 5000,
    "retryCount": 3
  }
}
```

## 🔧 自定义 Bin 文件格式

如果您的 bin 文件格式不同，需要修改以下文件：

1. **`python_bridge/bin_parser.py`**: 修改解析和构建逻辑
2. **`server/routes/binFile.js`**: 修改 `parseBinFile` 和 `buildBinFile` 函数
3. **参数 Schema**: 修改 `getParameterSchema` 函数定义参数结构

### Bin 文件格式示例

```
[Header - 32 bytes]
  Magic: "ELBIN" (5 bytes)
  Version: uint8
  ParamCount: uint16
  Checksum: uint32
  Timestamp: uint32
  Reserved: 16 bytes

[Params - Variable]
  ParamID: uint16
  ParamType: uint8
  NameLen: uint8
  Name: string
  Value: (根据类型)
```

## 🎨 UI 主题定制

编辑 `client/src/styles/main.scss` 中的 CSS 变量：

```scss
:root {
  --primary-color: #00d4ff;    // 主题色
  --accent-color: #ff6b35;     // 强调色
  --bg-primary: #0a0e14;       // 背景色
  // ...
}
```

## 📄 API 文档

### Bin 文件接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/bin/list` | 获取文件列表 |
| GET | `/api/bin/read/:filename` | 读取文件参数 |
| POST | `/api/bin/save/:filename` | 保存文件参数 |
| POST | `/api/bin/upload` | 上传文件 |
| GET | `/api/bin/schema` | 获取参数 Schema |
| GET | `/api/bin/backups` | 获取备份列表 |
| POST | `/api/bin/restore/:backupName` | 恢复备份 |

### 设备接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/device/status` | 获取设备状态 |
| POST | `/api/device/connect` | 连接设备 |
| POST | `/api/device/disconnect` | 断开设备 |
| POST | `/api/device/sync` | 同步参数到设备 |
| GET | `/api/device/read-bin` | 从设备读取参数 |
| POST | `/api/device/command` | 发送命令 |
| GET | `/api/device/discover` | 设备发现 |

## 🤝 与现有 Python 工程协作

### UDP 通信协议对接

1. 在 `python_bridge/bridge.py` 中实现实际的协议：
   - `_build_handshake_packet()`: 握手包格式
   - `_parse_device_info()`: 设备信息解析
   - `_build_sync_packet()`: 同步数据包格式

2. 或直接导入现有的 Python 通信模块

### 数据同步流程

```
[前端 UI] 
    ↓ HTTP/WebSocket
[Node.js 后端]
    ↓ python-shell
[Python 桥接层]
    ↓ 调用现有模块
[UDP 通信] 
    ↓
[电子负载设备]
```

## 📜 License

MIT




