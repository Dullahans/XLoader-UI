#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bin文件解析器
用于解析和生成仿真模型参数的.bin文件

注意：此文件中的结构定义需要根据实际bin文件格式进行调整
"""

import struct
import json
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from enum import IntEnum


class ParamType(IntEnum):
    """参数类型枚举"""
    INT8 = 0x01
    INT16 = 0x02
    INT32 = 0x03
    UINT8 = 0x11
    UINT16 = 0x12
    UINT32 = 0x13
    FLOAT32 = 0x20
    FLOAT64 = 0x21
    STRING = 0x30
    ARRAY = 0x40


@dataclass
class BinHeader:
    """Bin文件头部结构"""
    magic: bytes = b'ELBIN'   # 魔数标识
    version: int = 1          # 版本号
    param_count: int = 0      # 参数数量
    checksum: int = 0         # 校验和
    timestamp: int = 0        # 时间戳
    reserved: bytes = b'\x00' * 16  # 保留字段


@dataclass
class ParamEntry:
    """参数条目"""
    id: int                   # 参数ID
    type: ParamType           # 参数类型
    name: str                 # 参数名称
    value: Any                # 参数值
    unit: str = ""            # 单位
    min_val: Optional[float] = None  # 最小值
    max_val: Optional[float] = None  # 最大值
    description: str = ""     # 描述


class BinParser:
    """Bin文件解析器"""
    
    # 类型到struct格式的映射
    TYPE_FORMAT = {
        ParamType.INT8: 'b',
        ParamType.INT16: 'h',
        ParamType.INT32: 'i',
        ParamType.UINT8: 'B',
        ParamType.UINT16: 'H',
        ParamType.UINT32: 'I',
        ParamType.FLOAT32: 'f',
        ParamType.FLOAT64: 'd',
    }
    
    def __init__(self):
        self.header: Optional[BinHeader] = None
        self.params: List[ParamEntry] = []
    
    def parse(self, data: bytes) -> Dict[str, Any]:
        """
        解析bin文件数据
        
        Args:
            data: bin文件的字节数据
            
        Returns:
            解析后的参数字典
        """
        offset = 0
        
        # 解析头部
        self.header = self._parse_header(data, offset)
        offset += 32  # 头部固定32字节
        
        # 解析参数
        self.params = []
        for _ in range(self.header.param_count):
            param, size = self._parse_param(data, offset)
            self.params.append(param)
            offset += size
        
        # 转换为字典格式
        return self._to_dict()
    
    def build(self, params: Dict[str, Any]) -> bytes:
        """
        将参数字典构建为bin文件格式
        
        Args:
            params: 参数字典
            
        Returns:
            bin文件的字节数据
        """
        # 从字典恢复参数列表
        self._from_dict(params)
        
        # 构建头部
        header_data = self._build_header()
        
        # 构建参数数据
        params_data = b''
        for param in self.params:
            params_data += self._build_param(param)
        
        # 计算校验和并更新头部
        full_data = header_data + params_data
        checksum = self._calculate_checksum(full_data)
        
        # 更新校验和字段（偏移量根据实际格式调整）
        full_data = full_data[:12] + struct.pack('>I', checksum) + full_data[16:]
        
        return full_data
    
    def _parse_header(self, data: bytes, offset: int) -> BinHeader:
        """解析文件头部"""
        header = BinHeader()
        
        # 读取魔数
        header.magic = data[offset:offset+5]
        if header.magic != b'ELBIN':
            # 可能是旧格式或其他格式，尝试兼容
            pass
        
        # 读取版本和参数数量
        header.version = struct.unpack_from('>B', data, offset + 5)[0]
        header.param_count = struct.unpack_from('>H', data, offset + 6)[0]
        header.checksum = struct.unpack_from('>I', data, offset + 8)[0]
        header.timestamp = struct.unpack_from('>I', data, offset + 12)[0]
        
        return header
    
    def _parse_param(self, data: bytes, offset: int) -> tuple:
        """解析单个参数"""
        # 读取参数ID和类型
        param_id = struct.unpack_from('>H', data, offset)[0]
        param_type = ParamType(struct.unpack_from('>B', data, offset + 2)[0])
        
        # 读取名称长度和名称
        name_len = struct.unpack_from('>B', data, offset + 3)[0]
        name = data[offset + 4:offset + 4 + name_len].decode('utf-8')
        
        current_offset = offset + 4 + name_len
        
        # 读取值
        value, value_size = self._read_value(data, current_offset, param_type)
        current_offset += value_size
        
        # 创建参数对象
        param = ParamEntry(
            id=param_id,
            type=param_type,
            name=name,
            value=value
        )
        
        total_size = current_offset - offset
        return param, total_size
    
    def _read_value(self, data: bytes, offset: int, param_type: ParamType) -> tuple:
        """读取参数值"""
        if param_type in self.TYPE_FORMAT:
            fmt = '>' + self.TYPE_FORMAT[param_type]
            size = struct.calcsize(fmt)
            value = struct.unpack_from(fmt, data, offset)[0]
            return value, size
        elif param_type == ParamType.STRING:
            str_len = struct.unpack_from('>H', data, offset)[0]
            value = data[offset + 2:offset + 2 + str_len].decode('utf-8')
            return value, 2 + str_len
        elif param_type == ParamType.ARRAY:
            # 数组：[长度(2)] [元素类型(1)] [元素数据...]
            arr_len = struct.unpack_from('>H', data, offset)[0]
            elem_type = ParamType(struct.unpack_from('>B', data, offset + 2)[0])
            values = []
            current = offset + 3
            for _ in range(arr_len):
                val, size = self._read_value(data, current, elem_type)
                values.append(val)
                current += size
            return values, current - offset
        
        return None, 0
    
    def _build_header(self) -> bytes:
        """构建文件头部"""
        header = struct.pack(
            '>5sBHII16s',
            b'ELBIN',
            self.header.version if self.header else 1,
            len(self.params),
            0,  # 校验和，后面更新
            self.header.timestamp if self.header else 0,
            b'\x00' * 16
        )
        return header
    
    def _build_param(self, param: ParamEntry) -> bytes:
        """构建单个参数的字节数据"""
        # 参数ID和类型
        data = struct.pack('>HB', param.id, param.type)
        
        # 名称
        name_bytes = param.name.encode('utf-8')
        data += struct.pack('>B', len(name_bytes))
        data += name_bytes
        
        # 值
        data += self._build_value(param.value, param.type)
        
        return data
    
    def _build_value(self, value: Any, param_type: ParamType) -> bytes:
        """构建参数值的字节数据"""
        if param_type in self.TYPE_FORMAT:
            fmt = '>' + self.TYPE_FORMAT[param_type]
            return struct.pack(fmt, value)
        elif param_type == ParamType.STRING:
            str_bytes = value.encode('utf-8')
            return struct.pack('>H', len(str_bytes)) + str_bytes
        elif param_type == ParamType.ARRAY:
            if not value:
                return struct.pack('>HB', 0, ParamType.FLOAT32)
            # 假设数组元素类型一致
            elem_type = ParamType.FLOAT32  # 默认float
            data = struct.pack('>HB', len(value), elem_type)
            for v in value:
                data += self._build_value(v, elem_type)
            return data
        
        return b''
    
    def _calculate_checksum(self, data: bytes) -> int:
        """计算校验和"""
        checksum = 0
        for byte in data:
            checksum = (checksum + byte) & 0xFFFFFFFF
        return checksum
    
    def _to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        result = {
            "header": {
                "version": self.header.version if self.header else 1,
                "timestamp": self.header.timestamp if self.header else 0
            },
            "params": {}
        }
        
        for param in self.params:
            result["params"][param.name] = {
                "id": param.id,
                "type": param.type.name,
                "value": param.value,
                "unit": param.unit,
                "description": param.description
            }
        
        return result
    
    def _from_dict(self, data: Dict[str, Any]) -> None:
        """从字典恢复"""
        # 恢复头部
        header_data = data.get("header", {})
        self.header = BinHeader(
            version=header_data.get("version", 1),
            timestamp=header_data.get("timestamp", 0)
        )
        
        # 恢复参数
        self.params = []
        params_data = data.get("params", {})
        
        for name, param_info in params_data.items():
            param = ParamEntry(
                id=param_info.get("id", 0),
                type=ParamType[param_info.get("type", "FLOAT32")],
                name=name,
                value=param_info.get("value"),
                unit=param_info.get("unit", ""),
                description=param_info.get("description", "")
            )
            self.params.append(param)


# ============ 便捷函数 ============

def parse_bin_file(filepath: str) -> Dict[str, Any]:
    """解析bin文件"""
    with open(filepath, 'rb') as f:
        data = f.read()
    
    parser = BinParser()
    return parser.parse(data)


def save_bin_file(filepath: str, params: Dict[str, Any]) -> None:
    """保存bin文件"""
    parser = BinParser()
    data = parser.build(params)
    
    with open(filepath, 'wb') as f:
        f.write(data)


def bin_to_json(bin_path: str, json_path: str) -> None:
    """将bin文件转换为JSON"""
    params = parse_bin_file(bin_path)
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(params, f, indent=2, ensure_ascii=False)


def json_to_bin(json_path: str, bin_path: str) -> None:
    """将JSON转换为bin文件"""
    with open(json_path, 'r', encoding='utf-8') as f:
        params = json.load(f)
    save_bin_file(bin_path, params)


if __name__ == "__main__":
    # 测试代码
    import sys
    
    if len(sys.argv) < 2:
        print("用法: python bin_parser.py <命令> [参数...]")
        print("命令:")
        print("  parse <bin文件>              - 解析bin文件并输出JSON")
        print("  convert <bin文件> <json文件> - 将bin转换为JSON")
        print("  build <json文件> <bin文件>   - 将JSON转换为bin")
        sys.exit(1)
    
    cmd = sys.argv[1]
    
    if cmd == "parse" and len(sys.argv) > 2:
        result = parse_bin_file(sys.argv[2])
        print(json.dumps(result, indent=2, ensure_ascii=False))
    elif cmd == "convert" and len(sys.argv) > 3:
        bin_to_json(sys.argv[2], sys.argv[3])
        print(f"已转换: {sys.argv[2]} -> {sys.argv[3]}")
    elif cmd == "build" and len(sys.argv) > 3:
        json_to_bin(sys.argv[2], sys.argv[3])
        print(f"已构建: {sys.argv[2]} -> {sys.argv[3]}")
    else:
        print("参数错误")




