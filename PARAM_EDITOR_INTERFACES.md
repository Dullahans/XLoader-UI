# 参数编辑页面接口调用说明

本文档说明参数编辑页面中各个操作调用的 WebSocket 接口。

## 一、接口调用列表

### 1. 导入设备
- **按钮位置**: 参数编辑页面工具栏，点击"导入设备"按钮
- **调用方法**: `handleLoadModelToDevice()` → `confirmImportDevice()`
- **WebSocket 接口**: `load_model` (接口11)
- **调用代码**: `wsClient.loadModel(device_id, loader_num, modelzip, project, all_devices)`
- **参数说明**:
  - `device_id`: 设备IP（导入当前设备时）
  - `loader_num`: Loader编号（导入当前设备时）
  - `modelzip`: 模型文件路径（如 `project1/example.bin`）
  - `project`: 项目名称（从文件路径提取，如 `project1`）
  - `all_devices`: 是否导入所有设备（true/false）
- **特殊处理**:
  - 导入前会先保存当前修改（如果有）
  - 支持选择"导入当前设备"或"导入所有设备"
  - 导入所有设备时，`device_id` 和 `loader_num` 传 `null`

### 2. 设备获取
- **按钮位置**: 参数编辑页面工具栏，点击"设备获取"按钮
- **调用方法**: `handleDownloadDevice()`
- **WebSocket 接口**: `download_from_device` (接口25)
- **调用代码**: `wsClient.downloadFromDevice(device_id, loader_num, device_path, local_path)`
- **参数说明**:
  - `device_id`: 设备IP
  - `loader_num`: Loader编号
  - `device_path`: 设备中的文件路径（用户输入）
  - `local_path`: 服务器本地保存路径（与 `device_path` 相同）
- **操作流程**:
  1. 弹出对话框，提示用户输入设备中的文件路径
  2. 调用接口从设备获取文件到服务器本地
  3. 刷新文件列表
  4. 显示成功消息

### 3. 保存
- **按钮位置**: 参数编辑页面工具栏，点击"保存"按钮
- **调用方法**: `handleSave()`
- **WebSocket 接口**: `save_local_file` (接口22)
- **调用代码**: `wsClient.saveLocalFile(path, content)`
- **参数说明**:
  - `path`: 文件路径（当前文件的路径，如 `project1/example.bin`）
  - `content`: 文件内容（通过 `generateBinContent()` 生成）
- **操作流程**:
  1. 生成文件内容（将模块和参数转换为 bin 文件格式）
  2. 调用接口保存到服务器本地
  3. 清除修改标记（`hasModified = false`）
  4. 更新原始内容（`currentModel.raw = content`）
  5. 显示成功消息

### 4. 另存为
- **按钮位置**: 参数编辑页面工具栏，点击"另存为"按钮
- **调用方法**: `handleSaveAs()`
- **WebSocket 接口**: `save_as_local_file` (接口23)
- **调用代码**: `wsClient.saveAsLocalFile(path, content)`
- **参数说明**:
  - `path`: 新文件路径（用户输入，如 `project1/new_example.bin`）
  - `content`: 文件内容（通过 `generateBinContent()` 生成）
- **操作流程**:
  1. 弹出对话框，提示用户输入新文件路径
  2. 生成文件内容
  3. 调用接口另存为新文件
  4. 刷新文件列表
  5. 自动选中新文件
  6. 清除修改标记
  7. 显示成功消息

### 5. 应用
- **按钮位置**: 参数编辑页面工具栏，点击"应用"按钮
- **调用方法**: `handleApply()`
- **WebSocket 接口**: `apply_params_to_device` (接口26)
- **调用代码**: `wsClient.applyParamsToDevice(device_id, loader_num, path, content)`
- **参数说明**:
  - `device_id`: 设备IP
  - `loader_num`: Loader编号
  - `path`: 文件路径（当前文件的路径）
  - `content`: 文件内容（通过 `generateBinContent()` 生成）
- **操作流程**:
  1. 检查是否可以应用（`canApply` 计算属性）
  2. 生成文件内容
  3. 调用接口将参数应用到设备
  4. 显示成功消息
- **启用条件**: 
  - 设备已连接（`deviceConnected`）
  - 模型正在运行（`isModelRunning`）
  - 当前文件正在运行（`isFileRunning`）
  - 当前模型解析成功（`currentModel.success`）

## 二、接口详细说明

### 接口11: load_model（导入模型文件）
**请求格式**:
```json
{
  "topic": "LOADER",
  "cmd_id": 时间戳,
  "name": "load_model",
  "data": "{\"device_id\":\"127.0.0.1\",\"loader_num\":0,\"modelzip\":\"project1/example.bin\",\"project\":\"project1\",\"all_devices\":false}"
}
```

**响应格式**:
```json
{
  "topic": "LOADER",
  "cmd_id": "对应的cmd_id",
  "name": "load_model",
  "data": {
    "ret": true,
    "desc": ""
  }
}
```

### 接口25: download_from_device（从设备获取文件）
**请求格式**:
```json
{
  "topic": "LOADER",
  "cmd_id": 时间戳,
  "name": "download_from_device",
  "data": "{\"device_id\":\"127.0.0.1\",\"loader_num\":0,\"device_path\":\"project1/example.bin\",\"local_path\":\"project1/example.bin\"}"
}
```

**响应格式**:
```json
{
  "topic": "LOADER",
  "cmd_id": "对应的cmd_id",
  "name": "download_from_device",
  "data": {
    "ret": true,
    "desc": "download from device success"
  }
}
```

### 接口22: save_local_file（保存文件到服务器本地）
**请求格式**:
```json
{
  "topic": "LOADER",
  "cmd_id": 时间戳,
  "name": "save_local_file",
  "data": "{\"path\":\"project1/example.bin\",\"content\":\"...bin文件内容\"}"
}
```

**响应格式**:
```json
{
  "topic": "LOADER",
  "cmd_id": "对应的cmd_id",
  "name": "save_local_file",
  "data": {
    "ret": true,
    "desc": "save local file success"
  }
}
```

### 接口23: save_as_local_file（另存为文件）
**请求格式**:
```json
{
  "topic": "LOADER",
  "cmd_id": 时间戳,
  "name": "save_as_local_file",
  "data": "{\"path\":\"project1/new_example.bin\",\"content\":\"...bin文件内容\"}"
}
```

**响应格式**:
```json
{
  "topic": "LOADER",
  "cmd_id": "对应的cmd_id",
  "name": "save_as_local_file",
  "data": {
    "ret": true,
    "desc": "save as local file success"
  }
}
```

### 接口26: apply_params_to_device（应用参数到设备）
**请求格式**:
```json
{
  "topic": "LOADER",
  "cmd_id": 时间戳,
  "name": "apply_params_to_device",
  "data": "{\"device_id\":\"127.0.0.1\",\"loader_num\":0,\"path\":\"project1/example.bin\",\"content\":\"...bin文件内容\"}"
}
```

**响应格式**:
```json
{
  "topic": "LOADER",
  "cmd_id": "对应的cmd_id",
  "name": "apply_params_to_device",
  "data": {
    "ret": true,
    "desc": "apply params to device success"
  }
}
```

## 三、相关辅助方法

### generateBinContent()
- **作用**: 将当前模型的模块和参数转换为 bin 文件格式的文本内容
- **调用位置**: 保存、另存为、应用操作都会调用此方法生成文件内容
- **返回**: bin 文件格式的字符串

### parseAllFiles()
- **作用**: 刷新文件列表，从服务器获取最新的文件列表
- **调用位置**: 
  - 另存为操作后
  - 设备获取操作后
  - 页面初始化时

## 四、注意事项

1. **导入设备**:
   - 导入前会自动保存当前修改
   - 支持导入当前设备或所有设备
   - 导入所有设备时不需要指定 `device_id` 和 `loader_num`

2. **设备获取**:
   - 需要用户手动输入设备中的文件路径
   - 获取后会自动刷新文件列表

3. **保存**:
   - 只保存到服务器本地，不发送到设备
   - 保存后会清除修改标记

4. **另存为**:
   - 保存为新文件后会自动选中新文件
   - 需要用户输入新文件路径

5. **应用**:
   - 只有模型正在运行时才能应用
   - 应用会将参数直接发送到设备
   - 应用不会保存文件到服务器本地

