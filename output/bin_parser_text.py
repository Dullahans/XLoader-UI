#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文本 bin（模型文件）解析器

支持 preview/前端用的“文本格式 .bin”：
- # 开头为注释
- 无冒号的非空行：模块名
- param:value：单值
- param:1 2 3：数组
- param: 后续缩进行：矩阵（二维数组）
"""

from __future__ import annotations

import re
from dataclasses import dataclass, asdict
from typing import Any, Dict, List, Optional, Tuple, Union


Number = Union[int, float]


@dataclass
class ParseMsg:
    lineNum: int
    message: str
    type: str  # "error" | "warning"


def _parse_value(token: str) -> Any:
    t = token.strip()
    if re.fullmatch(r"-?\d+", t):
        return int(t, 10)
    if re.fullmatch(r"-?\d+\.\d*|-?\d*\.\d+|-?\d+\.", t):
        return float(t)
    if t.lower() == "true":
        return True
    if t.lower() == "false":
        return False
    return t


def parse_text_bin(content: str, filename: str = "unknown") -> Dict[str, Any]:
    errors: List[ParseMsg] = []
    warnings: List[ParseMsg] = []

    result: Dict[str, Any] = {
        "success": True,
        "filename": filename,
        "modules": [],
        "errors": [],
        "warnings": [],
        "raw": content,
    }

    if not isinstance(content, str) or not content:
        errors.append(ParseMsg(0, "文件内容为空或格式无效", "error"))
        result["errors"] = [asdict(x) for x in errors]
        result["warnings"] = [asdict(x) for x in warnings]
        result["success"] = False
        return result

    lines = content.splitlines()
    current_module: Optional[Dict[str, Any]] = None
    pending_multiline: Optional[Tuple[str, int]] = None  # (param_name, line_num)
    multiline_rows: List[List[Any]] = []

    def flush_multiline():
        nonlocal pending_multiline, multiline_rows, current_module
        if pending_multiline and current_module is not None:
            name, ln = pending_multiline
            current_module["params"].append(
                {"name": name, "value": multiline_rows, "type": "matrix", "lineNum": ln}
            )
        pending_multiline = None
        multiline_rows = []

    for idx, raw_line in enumerate(lines):
        line_num = idx + 1
        line = raw_line.strip()

        # multiline block
        if pending_multiline is not None:
            if raw_line.startswith("    ") or raw_line.startswith("\t"):
                row = [ _parse_value(v) for v in line.split() ] if line else []
                if row:
                    multiline_rows.append(row)
                continue
            else:
                flush_multiline()

        if not line or line.startswith("#"):
            continue

        if ":" in line:
            colon = line.find(":")
            key = line[:colon].strip()
            val = line[colon + 1 :].strip()

            if not key:
                errors.append(ParseMsg(line_num, "参数名不能为空", "error"))
                continue
            if current_module is None:
                errors.append(ParseMsg(line_num, f'参数 "{key}" 没有所属模块，请先定义模块名', "error"))
                continue

            # duplicated param -> keep last, warn
            exists = any(p.get("name") == key for p in current_module["params"])
            if exists:
                warnings.append(ParseMsg(line_num, f'模块 "{current_module["name"]}" 中参数 "{key}" 重复定义，将使用最后一个值', "warning"))
                current_module["params"] = [p for p in current_module["params"] if p.get("name") != key]

            if val == "":
                pending_multiline = (key, line_num)
                multiline_rows = []
            elif " " in val:
                arr = [_parse_value(v) for v in val.split()]
                current_module["params"].append({"name": key, "value": arr, "type": "array", "lineNum": line_num})
            else:
                current_module["params"].append({"name": key, "value": _parse_value(val), "type": "single", "lineNum": line_num})
        else:
            # module line
            current_module = {"name": line, "params": [], "lineNum": line_num}
            result["modules"].append(current_module)

    # file end multiline
    flush_multiline()

    if len(result["modules"]) == 0:
        errors.append(ParseMsg(0, "文件中没有找到任何模块定义", "error"))

    result["errors"] = [asdict(x) for x in errors]
    result["warnings"] = [asdict(x) for x in warnings]
    result["success"] = len(errors) == 0
    return result


def build_text_bin(model: Dict[str, Any]) -> str:
    """
    把 parse_text_bin 的结果（或同结构）序列化回文本 bin
    """
    modules = model.get("modules") or []
    out: List[str] = []
    for mod in modules:
        name = mod.get("name", "")
        if not name:
            continue
        out.append(str(name))
        for p in mod.get("params") or []:
            p_name = p.get("name", "")
            p_type = p.get("type")
            p_val = p.get("value")
            if not p_name:
                continue
            if p_type == "matrix":
                out.append(f"{p_name}:")
                for row in (p_val or []):
                    if isinstance(row, list):
                        out.append("    " + " ".join(str(x) for x in row))
            elif p_type == "array":
                arr = p_val if isinstance(p_val, list) else []
                out.append(f"{p_name}:" + " ".join(str(x) for x in arr))
            else:
                out.append(f"{p_name}:{p_val}")
        out.append("")
    return "\n".join(out).rstrip() + "\n"


