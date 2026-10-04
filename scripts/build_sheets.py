#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把已有片段 webp（动画）拆成「一帧一帧」的网格 sheet.png，供前端 JS 逐帧演出。

需求背景（用户原话）："视频去除背景后分割成一帧一帧然后演出"——
桌宠片段不是用 <img src=webp> 当动图/视频播，而是拆成帧、用 JS 按帧切换。

对每个 clip：
  读取 <clip>.webp 的全部帧
  → 排成二维网格 sheet.png（每格 256×256，与 base 同画布）
  → 更新 life.json：加 { sheet, frames, fps, cell, columns, rows }

二维网格避免 121 帧横排后达到 30976px，超过部分浏览器/GPU 的单纹理尺寸上限。
用法：python scripts/build_sheets.py <资产目录>
"""
import sys, json, math, pathlib, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from PIL import Image

CEL = 256  # 每帧格尺寸（= 归一化画布，与 base 一致）


def build(out_dir: pathlib.Path):
    life_path = out_dir / 'life.json'
    payload = json.loads(life_path.read_text(encoding='utf-8'))
    # Every sheet rebuild gets a new URL revision so dsh cannot serve an old
    # Keep the sheet as PNG: this is the previously verified browser path and
    # preserves the alpha/channel behavior of the original pipeline.
    payload['asset_version'] = str(int(time.time()))
    clips = payload.get('clips') or []
    for c in clips:
        webp = out_dir / c.get('webp', '')
        cid = c.get('clip', '')
        if not webp.exists():
            print(f'[skip] {cid}: webp missing')
            continue
        im = Image.open(webp)
        n = im.n_frames
        if n <= 0:
            print(f'[skip] {cid}: no frames')
            continue
        columns = max(1, math.ceil(math.sqrt(n)))
        rows = math.ceil(n / columns)
        sheet = Image.new('RGBA', (CEL * columns, CEL * rows))
        for i in range(n):
            im.seek(i)
            f = im.convert('RGBA')
            if f.size != (CEL, CEL):
                f = f.resize((CEL, CEL), Image.LANCZOS)
            x = (i % columns) * CEL
            y = (i // columns) * CEL
            sheet.paste(f, (x, y))
        sheet_path = out_dir / f'{cid}.sheet.png'
        sheet.save(sheet_path, format='PNG', optimize=True)
        fps = c.get('fps') or 24.0
        c['sheet'] = sheet_path.name
        c['cell'] = CEL
        c['frames'] = n
        c['fps'] = fps
        c['columns'] = columns
        c['rows'] = rows
        size_kb = sheet_path.stat().st_size / 1024
        print(f'[OK] {cid}: sheet {sheet.size[0]}x{sheet.size[1]} {columns}x{rows}格 {n}帧 {size_kb:.0f}KB', flush=True)
    life_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
    print('life.json updated', flush=True)


if __name__ == '__main__':
    build(pathlib.Path(sys.argv[1]))
