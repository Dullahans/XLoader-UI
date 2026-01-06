#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
电子负载上位机 - Python API 接口定义
此文件定义了所有需要实现的 Python 接口函数

【使用说明】
1. 每个函数的参数和返回值格式已在注释中说明
2. 函数实现后，通过 Node.js 的 python-shell 调用
3. 所有返回值必须是 JSON 可序列化的字典
"""

import json
import sys
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from abc import ABC, abstractmethod


# ============================================================
# 数据结构定义
# ============================================================

@dataclass
class DeviceInfo:
    """设备信息"""
    sn: str              # 设备序列号
    model: str           # 设备型号
    firmware: str        # 固件版本
    ip: str = ""         # IP地址
    port: int = 8080     # 端口


@dataclass
class FileInfo:
    """文件信息"""
    filename: str        # 文件名
    size: int            # 文件大小（字节）
    version: str = ""    # 版本号
    updated_at: str = "" # 更新时间


@dataclass
class DeviceStatus:
    """设备运行状态"""
    connected: bool          # 是否连接
    running_file: str = ""   # 当前运行的文件
    running_module: str = "" # 当前运行的模块
    current: float = 0.0     # 电流 (A)
    voltage: float = 0.0     # 电压 (V)
    power: float = 0.0       # 功率 (kW)
    temperature: float = 0.0 # 温度 (°C)


# ============================================================
# 接口基类
# ============================================================

class APIResponse:
    """API 响应封装"""
    
    @staticmethod
    def success(data: Dict = None, message: str = "success") -> Dict:
        """成功响应"""
        resp = {"success": True, "message": message}
        if data:
            resp.update(data)
        return resp
    
    @staticmethod
    def error(message: str, code: int = -1) -> Dict:
        """错误响应"""
        return {"success": False, "error": message, "code": code}


# ============================================================
# 云端接口
# ============================================================

class CloudAPI:
    """
    云端 API 接口
    
    【对接要求】
    - 实现与云端服务器的 HTTP 通信
    - 处理认证和授权
    - 文件上传/下载需要支持断点续传
    """
    
    def upload(self, device_sn: str, filename: str, content: str, 
               metadata: Dict = None) -> Dict:
        """
        上传文件到云端
        
        【参数】
        - device_sn: 设备序列号，用于关联文件
        - filename: 文件名
        - content: 文件内容（bin格式文本）
        - metadata: 元数据，如 {"version": "1.0", "description": "xxx"}
        
        【返回】
        {
            "success": True,
            "url": "cloud://xxx/xxx.bin",  # 云端文件URL
            "version": "1.0.0"             # 版本号
        }
        """
        # TODO: 实现云端上传逻辑
        raise NotImplementedError("请实现 CloudAPI.upload")
    
    def download(self, device_sn: str, filename: str, 
                 version: str = None) -> Dict:
        """
        从云端下载文件
        
        【参数】
        - device_sn: 设备序列号
        - filename: 文件名
        - version: 版本号（可选，默认下载最新版本）
        
        【返回】
        {
            "success": True,
            "content": "文件内容...",
            "metadata": {"version": "1.0", ...}
        }
        """
        # TODO: 实现云端下载逻辑
        raise NotImplementedError("请实现 CloudAPI.download")
    
    def list_files(self, device_sn: str, project_id: str = None) -> Dict:
        """
        获取云端文件列表
        
        【参数】
        - device_sn: 设备序列号
        - project_id: 项目ID（可选）
        
        【返回】
        {
            "success": True,
            "files": [
                {"filename": "xxx.bin", "size": 1024, "version": "1.0", "updated_at": "2024-01-01"}
            ]
        }
        """
        # TODO: 实现文件列表获取逻辑
        raise NotImplementedError("请实现 CloudAPI.list_files")


# ============================================================
# 设备接口
# ============================================================

class DeviceAPI:
    """
    设备通信 API 接口
    
    【对接要求】
    - 使用 UDP 协议与设备通信
    - 需要处理超时和重试
    - 支持设备状态实时监控
    """
    
    def __init__(self):
        self._connected = False
        self._device_info = None
        self._socket = None
    
    def connect(self, ip: str, port: int, timeout: int = 5000) -> Dict:
        """
        连接设备
        
        【参数】
        - ip: 设备IP地址
        - port: UDP端口
        - timeout: 超时时间（毫秒）
        
        【返回】
        {
            "success": True,
            "device_info": {
                "sn": "EL5000-2024-00128",
                "model": "EL-5000",
                "firmware": "v2.1.0"
            }
        }
        
        【实现说明】
        1. 创建 UDP socket
        2. 发送握手包
        3. 接收设备信息响应
        4. 保存连接状态
        """
        # TODO: 实现设备连接逻辑
        raise NotImplementedError("请实现 DeviceAPI.connect")
    
    def disconnect(self) -> Dict:
        """
        断开设备连接
        
        【返回】
        {"success": True}
        """
        # TODO: 实现断开连接逻辑
        raise NotImplementedError("请实现 DeviceAPI.disconnect")
    
    def get_status(self) -> Dict:
        """
        获取设备运行状态
        
        【返回】
        {
            "success": True,
            "connected": True,
            "running_file": "example.bin",
            "running_module": "WINDOW_R",
            "current": 50.2,
            "voltage": 380,
            "power": 19.1,
            "temperature": 45
        }
        
        【实现说明】
        读取设备状态寄存器获取以上信息
        """
        # TODO: 实现状态获取逻辑
        raise NotImplementedError("请实现 DeviceAPI.get_status")
    
    def upload_file(self, filename: str, content: str) -> Dict:
        """
        上传文件到设备
        
        【参数】
        - filename: 文件名
        - content: 文件内容
        
        【返回】
        {
            "success": True,
            "bytes_transferred": 1024
        }
        
        【实现说明】
        1. 将内容分块传输
        2. 每块等待ACK确认
        3. 传输完成后校验
        """
        # TODO: 实现文件上传逻辑
        raise NotImplementedError("请实现 DeviceAPI.upload_file")
    
    def download_file(self, filename: str = None) -> Dict:
        """
        从设备下载文件
        
        【参数】
        - filename: 文件名（可选，默认为当前运行的文件）
        
        【返回】
        {
            "success": True,
            "content": "文件内容..."
        }
        """
        # TODO: 实现文件下载逻辑
        raise NotImplementedError("请实现 DeviceAPI.download_file")
    
    def list_files(self) -> Dict:
        """
        获取设备中的文件列表
        
        【返回】
        {
            "success": True,
            "files": [
                {"filename": "xxx.bin", "size": 1024}
            ]
        }
        """
        # TODO: 实现文件列表获取逻辑
        raise NotImplementedError("请实现 DeviceAPI.list_files")
    
    def apply_params(self, module_name: str, params: Dict) -> Dict:
        """
        应用参数到设备（立即生效）
        
        【参数】
        - module_name: 模块名称
        - params: 参数字典 {"param_name": value, ...}
        
        【返回】
        {"success": True}
        
        【实现说明】
        1. 将参数转换为设备协议格式
        2. 写入对应的寄存器
        3. 触发设备更新输出
        """
        # TODO: 实现参数应用逻辑
        raise NotImplementedError("请实现 DeviceAPI.apply_params")
    
    def read_register(self, address: int, count: int = 1) -> Dict:
        """
        读取设备寄存器
        
        【参数】
        - address: 寄存器起始地址
        - count: 读取数量
        
        【返回】
        {
            "success": True,
            "values": [value1, value2, ...]
        }
        """
        # TODO: 实现寄存器读取逻辑
        raise NotImplementedError("请实现 DeviceAPI.read_register")
    
    def write_register(self, address: int, values: List) -> Dict:
        """
        写入设备寄存器
        
        【参数】
        - address: 寄存器起始地址
        - values: 要写入的值列表
        
        【返回】
        {"success": True}
        """
        # TODO: 实现寄存器写入逻辑
        raise NotImplementedError("请实现 DeviceAPI.write_register")


# ============================================================
# 寄存器管理接口
# ============================================================

@dataclass
class RegisterInfo:
    """寄存器信息"""
    address: int         # 寄存器地址
    name: str            # 寄存器名称
    type: str            # 类型: 'int' 或 'string'
    access: str          # 权限: 'read', 'write', 'readwrite'
    description: str     # 描述


class RegisterAPI:
    """
    寄存器管理 API 接口
    
    【对接要求】
    - 封装底层寄存器读写操作
    - 提供类型转换（整数/字符串）
    - 支持批量读取
    """
    
    def __init__(self, device_api: DeviceAPI):
        self._device = device_api
        
    def read(self, address: int) -> Dict:
        """
        读取单个寄存器
        
        【参数】
        - address: 寄存器地址（十六进制）
        
        【返回】
        {
            "success": True,
            "address": 0x0020,
            "value": 5000,           # 或字符串
            "type": "int"            # "int" 或 "string"
        }
        
        【实现说明】
        1. 根据地址查找寄存器定义获取类型
        2. 调用底层 UDP 读取
        3. 根据类型解析返回值
        """
        # TODO: 实现单个寄存器读取
        raise NotImplementedError("请实现 RegisterAPI.read")
    
    def write(self, address: int, value: Any) -> Dict:
        """
        写入单个寄存器
        
        【参数】
        - address: 寄存器地址
        - value: 要写入的值（整数或字符串）
        
        【返回】
        {
            "success": True,
            "address": 0x0020,
            "written": True
        }
        
        【实现说明】
        1. 检查寄存器是否可写
        2. 根据类型编码数据
        3. 调用底层 UDP 写入
        4. 等待写入确认
        """
        # TODO: 实现单个寄存器写入
        raise NotImplementedError("请实现 RegisterAPI.write")
    
    def read_all(self) -> Dict:
        """
        批量读取所有可读寄存器
        
        【返回】
        {
            "success": True,
            "registers": [
                {"address": 0x0000, "value": 5000, "type": "int"},
                {"address": 0x0001, "value": "v2.1.0", "type": "string"},
                ...
            ]
        }
        
        【实现说明】
        1. 获取所有可读寄存器地址列表
        2. 批量发送读取请求
        3. 解析并返回所有结果
        """
        # TODO: 实现批量寄存器读取
        raise NotImplementedError("请实现 RegisterAPI.read_all")
    
    def get_definitions(self) -> Dict:
        """
        获取寄存器定义列表
        
        【返回】
        {
            "success": True,
            "definitions": [
                {
                    "address": 0x0000,
                    "name": "DEVICE_ID",
                    "type": "int",
                    "access": "read",
                    "description": "设备ID"
                },
                ...
            ]
        }
        
        【实现说明】
        从配置文件或内置定义返回寄存器元数据
        """
        # 寄存器定义（可从配置文件加载）
        definitions = [
            {"address": 0x0000, "name": "DEVICE_ID", "type": "int", "access": "read", "description": "设备ID"},
            {"address": 0x0001, "name": "FIRMWARE_VER", "type": "string", "access": "read", "description": "固件版本"},
            {"address": 0x0002, "name": "HARDWARE_VER", "type": "string", "access": "read", "description": "硬件版本"},
            {"address": 0x0010, "name": "RUN_STATUS", "type": "int", "access": "read", "description": "运行状态 (0:停止 1:运行)"},
            {"address": 0x0011, "name": "ERROR_CODE", "type": "int", "access": "read", "description": "错误码"},
            {"address": 0x0020, "name": "CURRENT_SETPOINT", "type": "int", "access": "readwrite", "description": "电流设定值 (mA)"},
            {"address": 0x0021, "name": "VOLTAGE_LIMIT", "type": "int", "access": "readwrite", "description": "电压限制 (mV)"},
            {"address": 0x0022, "name": "POWER_LIMIT", "type": "int", "access": "readwrite", "description": "功率限制 (W)"},
            {"address": 0x0030, "name": "MODEL_NAME", "type": "string", "access": "readwrite", "description": "当前模型名称"},
            {"address": 0x0031, "name": "MODULE_NAME", "type": "string", "access": "readwrite", "description": "当前模块名称"},
            {"address": 0x0040, "name": "CTRL_START", "type": "int", "access": "write", "description": "写1启动模型"},
            {"address": 0x0041, "name": "CTRL_STOP", "type": "int", "access": "write", "description": "写1停止模型"},
            {"address": 0x0042, "name": "CTRL_RESET", "type": "int", "access": "write", "description": "写1复位设备"},
            {"address": 0x0050, "name": "SAMPLE_RATE", "type": "int", "access": "readwrite", "description": "采样率 (Hz)"},
            {"address": 0x0051, "name": "OUTPUT_MODE", "type": "int", "access": "readwrite", "description": "输出模式 (0:CC 1:CV 2:CP)"},
            {"address": 0x0060, "name": "TEMP_CURRENT", "type": "int", "access": "read", "description": "当前温度 (°C)"},
            {"address": 0x0061, "name": "TEMP_LIMIT", "type": "int", "access": "readwrite", "description": "温度限制 (°C)"},
            {"address": 0x0070, "name": "SERIAL_NUMBER", "type": "string", "access": "read", "description": "设备序列号"},
            {"address": 0x0080, "name": "USER_DATA", "type": "string", "access": "write", "description": "用户自定义数据"},
        ]
        return APIResponse.success({"definitions": definitions})


# ============================================================
# 入口函数
# ============================================================

def main():
    """
    命令行入口，供 Node.js 调用
    
    调用方式: python api_interface.py <function_name> <json_params>
    """
    if len(sys.argv) < 2:
        print(json.dumps(APIResponse.error("缺少函数名参数")))
        return
    
    function_name = sys.argv[1]
    params = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
    
    # 创建 API 实例
    cloud_api = CloudAPI()
    device_api = DeviceAPI()
    register_api = RegisterAPI(device_api)
    
    # 路由到对应函数
    api_map = {
        # 云端接口
        "cloud_upload": lambda: cloud_api.upload(
            params.get("device_sn"),
            params.get("filename"),
            params.get("content"),
            params.get("metadata", {})
        ),
        "cloud_download": lambda: cloud_api.download(
            params.get("device_sn"),
            params.get("filename"),
            params.get("version")
        ),
        "cloud_list_files": lambda: cloud_api.list_files(
            params.get("device_sn"),
            params.get("project_id")
        ),
        
        # 设备接口
        "device_connect": lambda: device_api.connect(
            params.get("ip"),
            params.get("port", 8080),
            params.get("timeout", 5000)
        ),
        "device_disconnect": lambda: device_api.disconnect(),
        "device_get_status": lambda: device_api.get_status(),
        "device_upload_file": lambda: device_api.upload_file(
            params.get("filename"),
            params.get("content")
        ),
        "device_download_file": lambda: device_api.download_file(
            params.get("filename")
        ),
        "device_list_files": lambda: device_api.list_files(),
        "device_apply_params": lambda: device_api.apply_params(
            params.get("module_name"),
            params.get("params", {})
        ),
        "device_read_register": lambda: device_api.read_register(
            params.get("address"),
            params.get("count", 1)
        ),
        "device_write_register": lambda: device_api.write_register(
            params.get("address"),
            params.get("values", [])
        ),
        
        # 寄存器管理接口
        "register_read": lambda: register_api.read(
            params.get("address")
        ),
        "register_write": lambda: register_api.write(
            params.get("address"),
            params.get("value")
        ),
        "register_read_all": lambda: register_api.read_all(),
        "register_get_definitions": lambda: register_api.get_definitions(),
    }
    
    if function_name not in api_map:
        print(json.dumps(APIResponse.error(f"未知函数: {function_name}")))
        return
    
    try:
        result = api_map[function_name]()
        print(json.dumps(result))
    except NotImplementedError as e:
        print(json.dumps(APIResponse.error(str(e))))
    except Exception as e:
        print(json.dumps(APIResponse.error(f"执行错误: {str(e)}")))


if __name__ == "__main__":
    main()

