from __future__ import annotations

import os
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from python_bridge.bin_parser_text import parse_text_bin, build_text_bin


ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
CS_DIR = ROOT / "cs"

MODEL_DICT_PATH = DATA_DIR / "model_dictionary.json"
REG_DEF_PATH = DATA_DIR / "register_definitions.json"

# 资源目录：默认使用项目根目录下的 resource/
# 对方可以通过环境变量 RESOURCE_DIR 指向“他的 Python 工程/resource 目录”
RESOURCE_DIR = Path(os.environ.get("RESOURCE_DIR", str(ROOT / "resource"))).resolve()

app = FastAPI()

# 1) 托管打包产物 cs/（访问 / 即打开 cs/index.html）
app.mount("/", StaticFiles(directory=str(CS_DIR), html=True), name="cs")


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))

def _safe_name(name: str) -> str:
    # 防止 ../ 路径穿越
    n = (name or "").strip()
    if not n or "/" in n or "\\" in n:
        raise ValueError("非法文件名")
    return n

def _resource_dir_for_device(device_sn: Optional[str]) -> Path:
    """
    约定：
    - 如果存在 resource/{device_sn}/ 则优先使用该目录
    - 否则使用 resource/ 根目录
    """
    if device_sn:
        candidate = RESOURCE_DIR / device_sn
        if candidate.exists() and candidate.is_dir():
            return candidate
    return RESOURCE_DIR

def _list_bin_files(dir_path: Path) -> List[Dict[str, Any]]:
    dir_path.mkdir(parents=True, exist_ok=True)
    out: List[Dict[str, Any]] = []
    for p in sorted(dir_path.glob("*.bin")):
        st = p.stat()
        out.append(
            {
                "filename": p.name,
                "size": st.st_size,
                "modified": st.st_mtime,
            }
        )
    return out

def _read_text_file(path: Path) -> str:
    # 文本 bin：按 utf-8 读取；若有乱码，替换字符保证不抛异常
    return path.read_text(encoding="utf-8", errors="replace")

def _write_text_file(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


# 2) 两个 JSON：模型字典 + 寄存器定义
@app.get("/api/model/dictionary")
def get_model_dictionary():
    return _read_json(MODEL_DICT_PATH)


@app.get("/api/register/definitions")
def get_register_definitions():
    return _read_json(REG_DEF_PATH)

#
# 2.1) 从 resource/ 读取模型文件（HTTP）
#
@app.get("/api/model/list")
def api_model_list(device_sn: Optional[str] = None):
    base = _resource_dir_for_device(device_sn)
    return {"success": True, "device_sn": device_sn, "base": str(base), "files": _list_bin_files(base)}

@app.get("/api/model/get")
def api_model_get(filename: str, device_sn: Optional[str] = None):
    base = _resource_dir_for_device(device_sn)
    fn = _safe_name(filename)
    p = base / fn
    if not p.exists():
        return JSONResponse({"success": False, "error": "文件不存在", "filename": fn}, status_code=404)
    return {"success": True, "filename": fn, "content": _read_text_file(p)}

@app.post("/api/model/save")
async def api_model_save(payload: Dict[str, Any]):
    device_sn = payload.get("device_sn")
    filename = _safe_name(payload.get("filename") or "")
    content = payload.get("content") or ""
    base = _resource_dir_for_device(device_sn)
    _write_text_file(base / filename, content)
    return {"success": True, "filename": filename}


# 3) bin 解析/生成（HTTP）
@app.post("/api/bin/parse")
async def api_bin_parse(payload: Dict[str, Any]):
    content = payload.get("content") or ""
    filename = payload.get("filename") or "unknown.bin"
    return parse_text_bin(content, filename)


@app.post("/api/bin/build")
async def api_bin_build(payload: Dict[str, Any]):
    # payload 可以直接是 parse_text_bin 的输出，也可以是 {modules:[...]} 结构
    return {"success": True, "content": build_text_bin(payload)}


# 4) WebSocket：兼容前端 WSClient 的 {id, action, params} 协议
@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            msg = await ws.receive_text()
            try:
                # 兼容两种协议：
                # 1) 旧协议：{ "id": 1, "action": "xxx", "params": {...} }
                # 2) 新协议：{ "topic": "xxx", "cmd_id": 123, "name": "xxx", "data": "JSON_STRING" }
                req = json.loads(msg)
                
                # 提取参数
                req_id = req.get("cmd_id") or req.get("id")
                action = req.get("name") or req.get("action")
                raw_data = req.get("data")
                
                params = {}
                if isinstance(raw_data, str):
                    try:
                        params = json.loads(raw_data)
                    except:
                        params = {}
                elif isinstance(raw_data, dict):
                    params = raw_data
                else:
                    params = req.get("params") or {}

                async def reply_ok(data: Dict[str, Any]):
                    # 响应格式也需要兼容：
                    # 新协议：{ "topic": "...", "cmd_id": 123, "name": "xxx", "data": {...} }
                    payload = {
                        "topic": req.get("topic", "LOADER"),
                        "cmd_id": req_id,
                        "name": action,
                        "data": data
                    }
                    await ws.send_text(json.dumps(payload, ensure_ascii=False))

                async def reply_err(err: str):
                    payload = {
                        "topic": req.get("topic", "LOADER"),
                        "cmd_id": req_id,
                        "name": action,
                        "data": {"ret": False, "desc": err, "success": False, "error": err}
                    }
                    await ws.send_text(json.dumps(payload, ensure_ascii=False))

                # ---- actions ----
                if action == "model.dictionary":
                    await reply_ok({"success": True, **_read_json(MODEL_DICT_PATH)})
                elif action == "model.list":
                    device_sn = params.get("device_sn")
                    base = _resource_dir_for_device(device_sn)
                    await reply_ok({"success": True, "files": _list_bin_files(base)})
                elif action == "model.get":
                    device_sn = params.get("device_sn")
                    filename = _safe_name(params.get("filename") or "")
                    base = _resource_dir_for_device(device_sn)
                    p = base / filename
                    if not p.exists():
                        await reply_ok({"success": False, "error": "文件不存在", "filename": filename})
                    else:
                        await reply_ok({"success": True, "content": _read_text_file(p), "filename": filename})
                elif action == "register.definitions":
                    data = _read_json(REG_DEF_PATH)
                    # 允许文件是 {definitions: []} 或 []
                    defs = data if isinstance(data, list) else data.get("definitions", [])
                    await reply_ok({"success": True, "definitions": defs})
                # 文件接口（模型编辑页“保存/另存为/读取/列表”会用到）
                elif action == "file.list":
                    device_sn = params.get("device_sn")
                    base = _resource_dir_for_device(device_sn)
                    await reply_ok({"success": True, "files": _list_bin_files(base)})
                elif action == "file.read":
                    device_sn = params.get("device_sn")
                    filename = _safe_name(params.get("filename") or "")
                    base = _resource_dir_for_device(device_sn)
                    p = base / filename
                    if not p.exists():
                        await reply_ok({"success": False, "error": "文件不存在", "filename": filename})
                    else:
                        await reply_ok({"success": True, "content": _read_text_file(p), "filename": filename})
                elif action == "file.save":
                    device_sn = params.get("device_sn")
                    filename = _safe_name(params.get("filename") or "")
                    content = params.get("content") or ""
                    base = _resource_dir_for_device(device_sn)
                    _write_text_file(base / filename, content)
                    await reply_ok({"success": True})
                elif action == "file.saveAs":
                    device_sn = params.get("device_sn")
                    filename = _safe_name(params.get("filename") or "")
                    content = params.get("content") or ""
                    base = _resource_dir_for_device(device_sn)
                    target = base / filename
                    if target.exists():
                        await reply_ok({"success": False, "error": "文件已存在"})
                    else:
                        _write_text_file(target, content)
                        await reply_ok({"success": True})
                elif action == "file.delete":
                    device_sn = params.get("device_sn")
                    filename = _safe_name(params.get("filename") or "")
                    base = _resource_dir_for_device(device_sn)
                    p = base / filename
                    if p.exists():
                        p.unlink()
                        await reply_ok({"success": True})
                    else:
                        await reply_ok({"success": False, "error": "文件不存在"})
                elif action == "bin.parse":
                    content = params.get("content") or ""
                    filename = params.get("filename") or "unknown.bin"
                    await reply_ok(parse_text_bin(content, filename))
                elif action == "bin.build":
                    await reply_ok({"success": True, "content": build_text_bin(params)})
                else:
                    await reply_err(f"未知 action: {action}")
            except Exception as e:
                await ws.send_text(json.dumps({"success": False, "error": str(e)}, ensure_ascii=False))
    except WebSocketDisconnect:
        pass


