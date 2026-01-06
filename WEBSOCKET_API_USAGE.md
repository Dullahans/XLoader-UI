# WebSocket 接口调用说明文档

本文档说明前端代码中如何使用 WebSocket 接口。

## 一、WebSocket 连接与消息格式

### 1.1 连接建立
- **连接地址**: 通过 `WSClient` 类管理 WebSocket 连接
- **握手消息**: 连接建立后发送 `'Hello, I am loader'` 字符串
- **Topic**: 所有消息使用 `topic: "LOADER"`

### 1.2 消息格式
**请求消息格式**:
```json
{
  "topic": "LOADER",
  "cmd_id": 时间戳（毫秒*1000 + 序号）,
  "name": "接口名称",
  "data": "JSON字符串格式的参数"
}
```

**响应消息格式**:
```json
{
  "topic": "LOADER",
  "cmd_id": "对应的请求cmd_id",
  "name": "接口名称",
  "data": {
    "ret": true/false,  // 成功/失败标识
    "desc": "描述信息或数据内容",
    "data": {}  // 部分接口返回的数据字段
  }
}
```

### 1.3 判断依据
- **成功判断**: 仅根据 `ret` 字段判断，`ret === true` 表示成功
- **失败判断**: `ret === false` 表示失败
- **注意**: `desc` 字段仅用于显示错误信息或数据内容，不作为判断依据

## 二、接口调用列表

### 2.1 设备状态相关

#### 1. 开启状态上报定时器
- **接口名**: `start_get_connect_status`
- **调用方法**: `wsClient.startGetConnectStatus()`
- **参数**: 无
- **响应**: 服务端每5秒推送一次 `get_connect_status` 消息
- **使用场景**: 页面初始化时调用，获取设备连接状态

#### 2. 停止所有定时器
- **接口名**: `stop_all_timers`
- **调用方法**: `wsClient.stopAllTimers()`
- **参数**: 无
- **使用场景**: 页面退出或刷新时调用

#### 3. 获取实验室位置信息
- **接口名**: `query_location_info`
- **调用方法**: `wsClient.queryLocationInfo()`
- **参数**: 无
- **响应数据**: `{ loader_location: "位置名称", location_list: ["位置1", "位置2", ...] }`
- **使用场景**: 页面初始化时获取并显示实验室位置

#### 4. 保存实验室位置信息
- **接口名**: `save_location_info`
- **调用方法**: `wsClient.saveLocationInfo(location)`
- **参数**: `{ location: "位置名称" }`
- **使用场景**: 用户选择实验室位置后保存

### 2.2 模型管理相关

#### 5. 获取模型列表
- **接口名**: `get_models`
- **调用方法**: `wsClient.getModels(device_id, loader_num, sim_type)`
- **参数**: 
  - `device_id`: 设备IP
  - `loader_num`: Loader编号
  - `sim_type`: 运行方式 (`'component_emulation'` 或 `'data_replay'`)
- **响应数据**: `{ ret: true, desc: [{ value, label, children: [...] }] }`
- **使用场景**: 参数编辑页面，获取可用模型列表

#### 6. 启动模型播放
- **接口名**: `start_loader`
- **调用方法**: `wsClient.startLoader(device_id, loader_num, model, sim_type)`
- **参数**: 
  - `device_id`: 设备IP
  - `loader_num`: Loader编号
  - `model`: 模型路径数组，如 `["project1", "Window_Left"]`
  - `sim_type`: 运行方式
- **使用场景**: 启动模型运行

#### 7. 停止模型播放
- **接口名**: `stop_loader`
- **调用方法**: `wsClient.stopLoader(device_id, loader_num, model, sim_type)`
- **参数**: 
  - `device_id`: 设备IP
  - `loader_num`: Loader编号
  - `model`: 模型路径数组
  - `sim_type`: 运行方式
- **使用场景**: 停止模型运行
- **特殊处理**: 先尝试 `sim_type='data_replay'`，失败后再尝试 `sim_type='component_emulation'`

#### 8. 导入模型文件
- **接口名**: `load_model`
- **调用方法**: `wsClient.loadModel(device_id, loader_num, modelzip, project, all_devices)`
- **参数**: 
  - `device_id`: 设备IP（导入当前设备时）
  - `loader_num`: Loader编号（导入当前设备时）
  - `modelzip`: 模型文件路径
  - `project`: 项目名称
  - `all_devices`: 是否导入所有设备（true/false）
- **使用场景**: 参数编辑页面，导入模型到设备

#### 9. 从云端导入模型
- **接口名**: `download_cloud_models`
- **调用方法**: `wsClient.downloadCloudModels(device_id, loader_num, model_name, model_id, project)`
- **参数**: 
  - `device_id`: 设备IP
  - `loader_num`: Loader编号
  - `model_name`: 模型名称
  - `model_id`: 模型ID
  - `project`: 项目名称
- **使用场景**: 从云端下载模型

### 2.3 寄存器相关

#### 10. 批量获取寄存器值（单次刷新）
- **接口名**: `get_signals`
- **调用方法**: `wsClient.getSignals(device_id, loader_num, regs)`
- **参数**: 
  - `device_id`: 设备IP
  - `loader_num`: Loader编号
  - `regs`: 寄存器名称数组，如 `["CCV", "DO1", ...]`
- **响应数据**: 数组格式 `[{ name: "CCV", value: "100", desc: "描述" }, ...]`
- **使用场景**: 
  - 手动刷新寄存器值
  - 获取设备基本信息（NAME, VERSION, HVERSION, SN, MFILE）

#### 11. 定时获取寄存器值
- **接口名**: `schedule_refresh_signals`
- **调用方法**: `wsClient.scheduleRefreshSignals(device_id, loader_num, regs, period)`
- **参数**: 
  - `device_id`: 设备IP
  - `loader_num`: Loader编号
  - `regs`: 寄存器名称数组
  - `period`: 刷新周期（毫秒），最小500ms，最大20000ms
- **响应**: 服务端定时推送 `refresh_signals` 消息
- **使用场景**: 寄存器管理页面，启用自动刷新时调用

#### 12. 停止定时获取寄存器值
- **接口名**: `stop_refresh_regs`
- **调用方法**: `wsClient.stopRefreshRegs()`
- **参数**: 无
- **响应数据**: `{ ret: true, desc: "success" }`
- **使用场景**: 
  - 切换设备时自动调用
  - 切换寄存器页签时自动调用
  - 手动停止定时刷新时调用

#### 13. 设置单个寄存器值
- **接口名**: `set_reg_value`
- **调用方法**: `wsClient.setRegValue(device_id, loader_num, reg_name, reg_value)`
- **参数**: 
  - `device_id`: 设备IP
  - `loader_num`: Loader编号
  - `reg_name`: 寄存器名称
  - `reg_value`: 寄存器值（字符串格式）
- **使用场景**: 寄存器管理页面，写入寄存器值
- **后续处理**: 写入成功后调用 `waitRegValue` 获取实际值

#### 14. 单个寄存器刷新
- **接口名**: `wait_reg_value`
- **调用方法**: `wsClient.waitRegValue(device_id, loader_num, reg_name)`
- **参数**: 
  - `device_id`: 设备IP
  - `loader_num`: Loader编号
  - `reg_name`: 寄存器名称
- **响应数据**: `{ ret: true, desc: "寄存器值" }`
- **使用场景**: 
  - 手动读取单个寄存器
  - 写入寄存器后获取实际值
  - 寄存器读取失败时重试（最多3次）

### 2.4 文件操作相关

#### 15. 获取文件信息
- **接口名**: `get_file_info`
- **调用方法**: `wsClient.getFileInfo(device_id, loader_num, name)`
- **参数**: 
  - `device_id`: 设备IP
  - `loader_num`: Loader编号
  - `name`: 文件路径（可选，默认为空）
- **使用场景**: 日志拉取页面，获取设备中的文件列表

#### 16. 文件拉取
- **接口名**: `pull_file`
- **调用方法**: `wsClient.pullFile(device_id, loader_num, path)`
- **参数**: 
  - `device_id`: 设备IP
  - `loader_num`: Loader编号
  - `path`: 文件路径
- **使用场景**: 日志拉取页面，从设备拉取日志文件到本地

#### 17. 获取服务器本地文件列表
- **接口名**: `get_local_file_list`
- **调用方法**: `wsClient.getLocalFileList()`
- **参数**: 无
- **响应数据**: `{ ret: true, desc: [{ filename, path, size, modified_time }, ...] }`
- **使用场景**: 参数编辑页面打开时，获取服务器本地文件列表

#### 18. 从服务器本地读取文件
- **接口名**: `read_local_file`
- **调用方法**: `wsClient.readLocalFile(path)`
- **参数**: `{ path: "文件路径" }`
- **响应数据**: `{ ret: true, data: { content: "文件内容", filename, path } }`
- **使用场景**: 参数编辑页面，选中文件后读取内容

#### 19. 保存文件到服务器本地
- **接口名**: `save_local_file`
- **调用方法**: `wsClient.saveLocalFile(path, content)`
- **参数**: `{ path: "文件路径", content: "文件内容" }`
- **使用场景**: 参数编辑页面，保存修改后的文件

#### 20. 另存为文件
- **接口名**: `save_as_local_file`
- **调用方法**: `wsClient.saveAsLocalFile(path, content)`
- **参数**: `{ path: "新文件路径", content: "文件内容" }`
- **使用场景**: 参数编辑页面，另存为文件

#### 21. 删除服务器本地文件
- **接口名**: `delete_local_file`
- **调用方法**: `wsClient.deleteLocalFile(path)`
- **参数**: `{ path: "文件路径" }`
- **使用场景**: 参数编辑页面，删除文件

#### 22. 上传文件到云端
- **接口名**: `upload_to_cloud`
- **调用方法**: `wsClient.uploadToCloud(path)`
- **参数**: `{ path: "文件路径" }`
- **使用场景**: 参数编辑页面，上传文件到云端

#### 23. 从设备获取文件到服务器本地
- **接口名**: `download_from_device`
- **调用方法**: `wsClient.downloadFromDevice(device_id, loader_num, device_path, local_path)`
- **参数**: 
  - `device_id`: 设备IP
  - `loader_num`: Loader编号
  - `device_path`: 设备中的文件路径
  - `local_path`: 服务器本地保存路径
- **使用场景**: 参数编辑页面，从设备获取文件

#### 24. 应用参数到设备
- **接口名**: `apply_params_to_device`
- **调用方法**: `wsClient.applyParamsToDevice(device_id, loader_num, path, content)`
- **参数**: 
  - `device_id`: 设备IP
  - `loader_num`: Loader编号
  - `path`: 文件路径
  - `content`: 文件内容
- **使用场景**: 参数编辑页面，应用修改后的参数到设备

### 2.5 OTA升级相关

#### 25. 检查云端新版本
- **接口名**: `check_loaders_new_version`
- **调用方法**: `wsClient.checkLoadersNewVersion()`
- **参数**: 无
- **响应数据**: `{ ret: true, desc: [{ ip, devices: [{ loader_name, loader_num, sn, current_version, target_version, progress }, ...] }, ...] }`
- **使用场景**: 设备升级页面，检查是否有新版本

#### 26. 单设备云端OTA升级
- **接口名**: `update_one_loader`
- **调用方法**: `wsClient.updateOneLoader(device_id, loader_num)`
- **参数**: `{ device_id: "设备IP", loader_num: Loader编号 }`
- **响应**: 
  - 进度推送: `update_ota_progress` 消息
  - 最终结果: `update_loaders` 消息
- **使用场景**: 设备升级页面，对指定设备进行云端OTA升级

#### 27. OTA近端升级
- **接口名**: `loader_ota`
- **调用方法**: `wsClient.loaderOta(device_id, loader_num, path)`
- **参数**: 
  - `device_id`: 设备IP
  - `loader_num`: Loader编号
  - `path`: HEX文件的绝对路径
- **响应**: 
  - 进度推送: `update_ota_progress` 消息
  - 最终结果: `update_loaders` 消息
- **使用场景**: 设备升级页面，使用本地HEX文件进行近端升级
- **特殊处理**: 
  - 文件选择后需要上传到服务器获取路径
  - 只有成功启动升级后才设置升级状态

### 2.6 控制台相关

#### 28. 发送控制台命令
- **接口名**: `send_cmd`
- **调用方法**: `wsClient.sendCmd(device_id, loader_num, cmd, multi_frames)`
- **参数**: 
  - `device_id`: 设备IP
  - `loader_num`: Loader编号
  - `cmd`: 控制台命令字符串
  - `multi_frames`: 是否多帧（默认false）
- **响应数据**: `{ ret: true, desc: "命令执行结果" }`
- **使用场景**: 控制台页面，发送命令到设备

## 三、推送消息处理

### 3.1 设备状态推送
- **消息名**: `get_connect_status`
- **触发**: 服务端每5秒推送一次
- **数据格式**: `{ lab-1: [{ ip, port, value: [{ ip, loader_num, loader_name, sn, version, name, connect, running, running_model, ... }, ...] }, ...] }`
- **处理**: 
  - 更新设备连接状态
  - 同步设备运行状态
  - 自动选择第一个设备（如果未选中）

### 3.2 寄存器定时刷新推送
- **消息名**: `refresh_signals`
- **触发**: 调用 `schedule_refresh_signals` 后，服务端定时推送
- **数据格式**: 数组格式 `[{ name: "CCV", value: "100", desc: "描述" }, ...]`
- **处理**: 
  - 更新当前活动页签的寄存器值
  - 只更新页签中存在的寄存器

### 3.3 OTA升级进度推送
- **消息名**: `update_ota_progress`
- **触发**: OTA升级过程中，服务端定时推送
- **数据格式**: `{ ip: "设备IP", loader_name: "loader-0", loader_num: 0, progress: 68.0 }`
- **处理**: 更新升级进度条

### 3.4 OTA升级结果推送
- **消息名**: `update_loaders`
- **触发**: OTA升级完成后，服务端推送
- **数据格式**: `{ ip: "设备IP", loader_num: 0, loader_ota_status: "success", desc: "描述" }`
- **处理**: 
  - 更新升级状态
  - 根据 `loader_ota_status` 判断成功/失败（仅判断状态，不依赖desc）

## 四、错误处理

### 4.1 通用错误处理
- 所有接口调用都通过 `try-catch` 捕获错误
- 错误信息从 `payload.desc` 获取（仅用于显示）
- 成功/失败判断仅依据 `ret` 字段

### 4.2 重试机制
- **寄存器读取**: 如果值为空或读取失败，自动重试最多3次，每次间隔300ms
- **WebSocket连接**: 连接断开后自动重连，最多重试5次

### 4.3 超时处理
- 所有请求设置30秒超时
- 超时后返回错误信息

## 五、特殊处理说明

### 5.1 寄存器值获取
- **单次刷新**: 使用 `get_signals` 批量获取
- **定时刷新**: 使用 `schedule_refresh_signals` 启动定时刷新，通过 `refresh_signals` 推送接收更新
- **停止定时刷新**: 使用 `stop_refresh_regs` 停止定时刷新，在以下场景自动调用：
  - 切换设备时
  - 切换寄存器页签时
  - 手动停止定时刷新时
- **单个读取**: 使用 `wait_reg_value` 读取单个寄存器

### 5.2 寄存器写入
- 写入成功后，调用 `wait_reg_value` 获取实际值
- 使用实际值更新UI，而不是直接使用输入值

### 5.3 模型运行状态判断
- 通过 `get_connect_status` 推送中的 `running` 和 `running_model` 字段判断
- 通过 `MFILE` 寄存器值判断，如果包含 `"FAIL:MFILE->"` 前缀，表示模型未运行
- 停止模型后，不再次调用 `read MFILE` 接口

### 5.4 文件路径处理
- 参数编辑页面：所有文件存储在统一的 `resource/loader/` 目录
- OTA升级：文件选择后上传到服务器获取绝对路径

## 六、注意事项

1. **判断依据**: 所有接口的成功/失败判断仅依据 `ret` 字段，`desc` 仅用于显示信息
2. **数据格式**: 响应数据可能在不同层级，需要兼容处理
3. **数组响应**: `get_signals` 和 `refresh_signals` 返回数组格式，需要特殊处理
4. **定时刷新**: 同一时间只能有一个页签启用定时刷新
5. **停止定时刷新**: 切换设备、切换页签或手动停止时，会自动调用 `stop_refresh_regs` 停止定时刷新
6. **设备切换**: 切换设备时，使用 `get_connect_status` 历史消息，不重新请求SN、NAME等，并自动停止定时刷新
7. **页面退出**: 页面退出或刷新时，调用 `stop_all_timers` 停止所有定时器

