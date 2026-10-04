#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""CLI runner：处理单个静止基准图（H3 首帧/参考图）→ base.webp，避免内联 -c 的汉字路径乱码。
用法：python scripts/process_still_cli.py <png路径> <输出目录> [targetWidth] [targetCharPx]
"""
import sys, json, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from scripts.deskpet_chroma import process_still

try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

if __name__ == '__main__':
    src = pathlib.Path(sys.argv[1])
    out = pathlib.Path(sys.argv[2])
    tw = int(sys.argv[3]) if len(sys.argv) > 3 else 256
    tcp = int(sys.argv[4]) if len(sys.argv) > 4 else 120
    out.mkdir(parents=True, exist_ok=True)
    meta = process_still(src, out, tw, tcp)
    if meta:
        # 合并进 life.json：base 是静止基准（kind='still'），让前端能查到 char_height_norm。
        life = out / 'life.json'
        payload = {'schema': 1, 'clips': []}
        if life.exists():
            try:
                old = json.loads(life.read_text(encoding='utf-8'))
                payload['clips'] = old.get('clips') or []
            except Exception:
                payload['clips'] = []
        # 以 clip 名为 key 去重，保留新条目；base 固定追加在最后。
        payload['clips'] = [c for c in payload['clips'] if c.get('clip') != meta['clip']]
        payload['clips'].append(meta)
        life.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
        print('life.json updated with base', flush=True)
