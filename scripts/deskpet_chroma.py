#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
大肥鱼桌宠 · H3 绿幕短视频 → 透明桌宠片段 管线（Python/OpenCV/Pillow，免 ffmpeg）

v4 改动（交接文档"未完成"三项）：
1. 脚步绿影 → 硬绿杀：alpha 前景底部 FEET_ZONE 高度带内，绿明显超红蓝的像素 alpha 强制归零，
   打掉脚底深绿阴影（v3 之前被当实心前景留下，合成后成绿块）。只作用于脚底带，避免误伤
   角色身上的绿色细节（眼睛/配饰）。
2. 右下角水印 → 抠像后右下角矩形 alpha=0（白色水印不会过色键，RGB 距离蒙版裁不掉）。
   只对 WATERMARK_KILL_CLIPS 生效（jump 源无水印，且裁右下角会切到角色右手，故排除）。
3. jump 异模型尺寸不一 → 跨片段归一化：按 alpha 包围盒把各片段角色统一到 TARGET_CHAR_PX 高，
   水平居中 + 贴底，跨片段对齐同一条地面线。每片段用统一缩放因子（保留片段内弹跳/伸缩动作，
   不逐帧压平）。

v3 改动：
- 输出降到 target_width（默认 192，适合桌宠显示，文件小一个量级）
v2 改动：
- 每帧自动采样边角颜色作为 key（适配 H3 的"哑绿"背景，非纯屏绿）
- RGB 距离式软蒙版抠像 + 去绿边 despill（不依赖固定阈值）
- stdout 强制 UTF-8，后台跑时输出不花屏

对每个 mp4 输出到 <out>:
  - <clip>.webp          带动画+透明通道（PIL save_all，原 fps）
  - <clip>.preview.png   首帧抠像预览（做在棋盘格半透明底上）
  - life.json            片段清单

用法：python scripts/deskpet_chroma.py <输入mp4目录> <输出目录> [targetWidth] [targetCharPx]
  targetWidth  画布宽（默认 256；源为方形，画布保持方形）
  targetCharPx 素材角色高（默认 120 = 展示 ~60px 的 2x，符合规格"素材出 2x≈128px"）
"""
import sys, json, pathlib, time, re
import cv2
import numpy as np
from PIL import Image

# 后台管道/无 TTY 时也立即刷出中文
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stdout.flush()
except Exception:
    pass

CLIP_MAP = [
    ('原地', 'jump'), ('跳', 'jump'), ('张望', 'look'), ('望', 'look'),
    ('呼吸', 'idle'), ('待机', 'idle'),
    ('挥手', 'wave'), ('走', 'walk'), ('睡', 'sleep'), ('哭', 'cry'),
    ('坐', 'sit'), ('惊吓', 'surprise'), ('摇', 'sway'), ('举', 'raise'),
]

# —— v4 常量（可调）——
TARGET_CHAR_PX = 120            # 跨片段统一角色高（素材 2x；= 展示 ~60px 的 2 倍）
HARD_GREEN_MARGIN = 0.035       # 硬绿杀判定：G-R > 该值 且 G-B > 该值（归一化 0..1）
FEET_ZONE = 0.35                # 硬绿杀只作用于 alpha 前景底部该比例高度带（脚底阴影区）
# H3 exports place a white watermark along the lower-right edge.  Keep the
# mask explicit per clip so we do not accidentally crop character pixels from
# clips whose tail/hand reaches that corner.
WATERMARK_KILL_CLIPS = {'idle', 'jump', 'look', 'ice_dance', 'sleep', 'walk', 'wave'}
# The source videos place the watermark only in the bottom-right footer. Keep
# the mask tight so the character's tail/hand above it is not erased.
WM_RECT = (0.79, 0.93, 0.995, 1.0)           # 水印矩形（相对整帧）
WATERMARK_RECTS = {
    'ice_dance': [(0.80, 0.825, 1.0, 0.895)],
}
CANVAS_MARGIN_BOTTOM = 8        # 贴底后底部留白（画布高 - 该值 = 跨片段共用地面线）
BBOX_PAD = 2                    # 归一化裁剪时包围盒外扩像素（防硬边）


def clip_id_for(name: str) -> str:
    # Stable batch naming: `wave__挥手.mp4` maps to `wave` without editing this
    # script. The description after `__` is for humans only.
    if '__' in name:
        candidate = name.split('__', 1)[0].strip().lower()
        if re.fullmatch(r'[a-z][a-z0-9_-]*', candidate):
            return candidate
    for key, cid in CLIP_MAP:
        if key in name:
            return cid
    return name


def border_key(bgr: np.ndarray, ring: int = 10) -> np.ndarray:
    """取四边外圈的非黑主色当作该帧 key 色（BGR）。

    竖屏生成视频常带黑色上下 letterbox；如果直接把四角中位数当 key，
    黑边会压过绿色幕布，整片绿幕就会被误留。过滤低亮/低饱和边缘后，
    仍兼容原先四角就是绿幕的素材。
    """
    reg = np.concatenate([
        bgr[:ring, :, :].reshape(-1, 3),
        bgr[-ring:, :, :].reshape(-1, 3),
        bgr[:, :ring, :].reshape(-1, 3),
        bgr[:, -ring:, :].reshape(-1, 3),
    ])
    mx = reg.max(axis=1).astype(np.float32)
    mn = reg.min(axis=1).astype(np.float32)
    candidates = reg[(mx >= 32) & ((mx - mn) >= 18)]
    return np.median(candidates if len(candidates) else reg, axis=0)


def clear_letterbox_alpha(rgba: np.ndarray, threshold: int = 24) -> None:
    """Remove contiguous near-black rows used as portrait-video letterbox bars."""
    rgb = rgba[..., :3]
    dark = rgb.max(axis=2) <= threshold
    h = dark.shape[0]
    top = 0
    while top < h and float(dark[top].mean()) >= 0.8:
        top += 1
    bottom = h
    while bottom > top and float(dark[bottom - 1].mean()) >= 0.8:
        bottom -= 1
    if top:
        rgba[:top, :, 3] = 0
    if bottom < h:
        rgba[bottom:, :, 3] = 0


def chroma_key(bgr: np.ndarray, d0=0.10, d1=0.18, despill=0.9,
               hard_green_margin=HARD_GREEN_MARGIN, feet_zone=FEET_ZONE):
    """
    RGB 距离式软蒙版：
      dist = |color - key| (通道归一化欧氏距离, 0..sqrt3)
    alpha = 1 当 dist>=d1（确定前景），0 当 dist<=d0（背景），之间线性。
    再按"接近 key 的程度"强去绿边（closeness 越高越去绿，专门打绿残边），
    最后 alpha 再做一次压缩（把半透明鬼影压到透明）。

    v4 硬绿杀：alpha 前景底部 feet_zone 高度带内，绿明显超红蓝的像素 alpha 强制归零。
    这是给"脚步绿影"（比背景绿更深的脚底阴影）兜底——RGB 距离蒙版里它是深绿，距离 key 远，
    会被当成实心前景留下；硬绿杀直接按色调判死。只作用于脚底带，不碰身体上的绿细节。
    """
    key = border_key(bgr).astype(np.float32) / 255.0
    f = bgr.astype(np.float32) / 255.0
    dist2 = ((f[..., 2] - key[2]) ** 2 + (f[..., 1] - key[1]) ** 2 + (f[..., 0] - key[0]) ** 2)
    dist = np.sqrt(dist2)
    a = np.clip((dist - d0) / (d1 - d0), 0, 1)
    # 去绿边：越接近 key 色、绿超红蓝越多 → 压得越狠
    spG = np.clip(f[..., 1] - np.maximum(f[..., 2], f[..., 0]), 0, None)
    closeness = np.clip((d1 - dist) / max(d1 - d0, 1e-5), 0, 1)
    g = f[..., 1] - despill * closeness * spG
    out = f.copy()
    out[..., 1] = np.clip(g, 0, 1)
    # —— v4 硬绿杀（脚底阴影带）——
    m_fg = a > 0.5
    ys_f, xs_f = np.where(m_fg)
    if len(ys_f):
        top_f, bot_f = ys_f.min(), ys_f.max()
        left_f, right_f = xs_f.min(), xs_f.max()
        h, w = a.shape
        zone_y = max(0, int(bot_f - (bot_f - top_f + 1) * feet_zone))
        x0z = max(0, int(left_f - BBOX_PAD * 4))
        x1z = min(w, int(right_f + BBOX_PAD * 4))
        gdom = ((f[..., 1] - f[..., 0] > hard_green_margin) &
                (f[..., 1] - f[..., 2] > hard_green_margin))
        rows = np.arange(h)[:, None] >= zone_y
        cols = (np.arange(w)[None, :] >= x0z) & (np.arange(w)[None, :] < x1z)
        a[gdom & rows & cols] = 0.0
    # 形态学清理噪点 + 边缘柔化 + alpha 压缩（半透明鬼影→透明）
    m = (a * 255).astype(np.uint8)
    k = np.ones((3, 3), np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, k)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, k)
    m = cv2.GaussianBlur(m, (5, 5), 0)
    m = np.clip((m.astype(np.float32) - 96.0) * (255.0 / (255.0 - 96.0)), 0, 255).astype(np.uint8)
    a2 = m.astype(np.float32) / 255.0
    rgba = np.dstack([np.clip(out * 255, 0, 255).astype(np.uint8), (a2 * 255).astype(np.uint8)])
    return rgba, a2


def _bbox_on_alpha(rgba: np.ndarray, thr: int = 128):
    """返回 (top, bottom, left, right) 或 None。"""
    a = rgba[..., 3]
    ys, xs = np.where(a > thr)
    if not len(ys):
        return None
    return int(ys.min()), int(ys.max()), int(xs.min()), int(xs.max())


def _paste_scaled(canvas: np.ndarray, crop: np.ndarray, x: int, y: int):
    """把 crop 粘贴到 canvas 的 (x,y)，越界部分裁剪。"""
    th_, tw_ = canvas.shape[:2]
    ch_, cw_ = crop.shape[:2]
    xo, yo = max(0, x), max(0, y)
    xo2, yo2 = min(tw_, x + cw_), min(th_, y + ch_)
    if xo2 <= xo or yo2 <= yo:
        return
    sx0, sy0 = xo - x, yo - y
    canvas[yo:yo2, xo:xo2] = crop[sy0:sy0 + (yo2 - yo), sx0:sx0 + (xo2 - xo)]


def _remove_still_green_fringe(rgba: np.ndarray) -> None:
    """Remove residual green-screen pixels after resize/interpolation.

    The still PNG has a much brighter flat green background than the videos.
    Resizing mixes that green back into anti-aliased silhouette pixels, so the
    first key pass alone leaves a translucent green rectangle around the pet.
    Blue hair/clothes, white trim, and warm skin are intentionally unaffected.
    """
    rgb = rgba[..., :3].astype(np.int16)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    dominance = g - np.maximum(r, b)
    hard = (dominance >= 10) & (g >= 45)
    soft = (dominance >= 3) & (g >= 38) & ~hard
    alpha = rgba[..., 3].astype(np.float32)
    alpha[hard] = 0
    alpha[soft] *= np.clip(1.0 - (dominance[soft] - 3.0) / 12.0, 0.0, 1.0)
    rgba[..., 3] = alpha.astype(np.uint8)
    # Preserve the anti-aliased edge but remove the green colour that was
    # blended into those partially transparent pixels before the key was made.
    partial = (rgba[..., 3] > 0) & (rgba[..., 3] < 255) & (g > np.maximum(r, b))
    rgba[..., 1][partial] = np.maximum(r[partial], b[partial]).astype(np.uint8)


def process(input_path: pathlib.Path, out_dir: pathlib.Path, tw: int, target_char_px: int):
    stem = input_path.stem
    cid = clip_id_for(stem)
    cap = cv2.VideoCapture(str(input_path))
    if not cap.isOpened():
        print(f'[SKIP] cannot open {stem}')
        return None
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    scale = tw / max(W, H)
    tw_, th_ = max(1, int(round(W * scale))), max(1, int(round(H * scale)))
    kill_wm = cid in WATERMARK_KILL_CLIPS
    frames = []          # 处理后 rgba（tw_×th_）
    bboxes = []          # 每帧 alpha bbox（None = 空帧）
    total_bg = 0.0
    t0 = time.time()
    # —— 第一遍：抠像 + 硬绿杀 + 水印裁 + 记录 bbox ——
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        rgba, a2 = chroma_key(frame)
        clear_letterbox_alpha(rgba)
        if kill_wm:
            h_f, w_f = rgba.shape[:2]
            for rect in WATERMARK_RECTS.get(cid, [WM_RECT]):
                x0wm, y0wm, x1wm, y1wm = [int(v * s) for v, s in zip(rect, (w_f, h_f, w_f, h_f))]
                rgba[y0wm:y1wm, x0wm:x1wm, 3] = 0
        if scale != 1.0:
            rgba = cv2.resize(rgba, (tw_, th_), interpolation=cv2.INTER_AREA)
        # cv2 是 BGR；PIL 要 RGB —— 只翻转三个颜色通道（Alpha 保持），否则蓝会渲染成橙。
        # 这里统一存 RGBa 的 numpy（PIL 用 RGB 顺序），归一化阶段直接用，存 webp 时转 Image。
        frames.append(rgba[..., [2, 1, 0, 3]])
        bboxes.append(_bbox_on_alpha(rgba))
        total_bg += float((a2 < 0.5).mean() * ((rgba.shape[1] * rgba.shape[0]) / (tw_ * th_)))
    cap.release()
    if not frames:
        print(f'[SKIP] no frames: {stem}')
        return None

    # —— 跨片段归一化：按 alpha 包围盒统一角色高 + 居中贴底（每片段统一缩放因子，保留片内动作）——
    valid = [bb for bb in bboxes if bb is not None]
    if valid:
        bb_arr = np.array(valid)  # N x (top,bottom,left,right)
        med_h = float(np.median(bb_arr[:, 1] - bb_arr[:, 0] + 1))
        med_bottom = float(np.median(bb_arr[:, 1]))
        med_cx = float(np.median((bb_arr[:, 2] + bb_arr[:, 3]) / 2.0))
    else:
        med_h, med_bottom, med_cx = 1.0, 0.0, tw_ / 2.0
    factor = max(0.05, target_char_px / med_h) if med_h > 0 else 1.0
    # Every clip is ultimately stored on the same square canvas as the base
    # sprite.  The source may be portrait (for example 828x1108), but the
    # character crop keeps its aspect ratio and is placed on a transparent
    # 256x256 canvas.  The old code wrote the intermediate portrait width to
    # WebP and the sheet builder stretched it horizontally, causing wide pets.
    canvas_w = canvas_h = tw
    ground = canvas_h - CANVAS_MARGIN_BOTTOM
    cx_center = canvas_w / 2.0
    out_frames = []
    for rgba, bb in zip(frames, bboxes):
        if bb is None:
            # 空帧：同画布全透明
            out_frames.append(Image.fromarray(np.zeros((canvas_h, canvas_w, 4), np.uint8)))
            continue
        top, bottom, left, right = bb
        ch_, cw_ = bottom - top + 1, right - left + 1
        # 包围盒外扩裁剪（防硬边）
        y0c, y1c = max(0, top - BBOX_PAD), min(th_, bottom + BBOX_PAD + 1)
        x0c, x1c = max(0, left - BBOX_PAD), min(tw_, right + BBOX_PAD + 1)
        crop = rgba[y0c:y1c, x0c:x1c]
        new_h = max(1, int(round(ch_ * factor)))
        new_w = max(1, int(round(cw_ * factor)))
        crop = cv2.resize(crop, (new_w, new_h), interpolation=cv2.INTER_AREA)
        # 贴底：保留相对基准底线的垂直偏移（片段内弹跳/抬脚不变形）
        rel_bottom = (bottom - med_bottom) * factor
        y = int(round(ground + rel_bottom)) - new_h
        # 水平居中：保留相对基准中心的横向偏移（片内左右摇摆保留）
        rel_cx = ((left + right) / 2.0 - med_cx) * factor
        x = int(round(cx_center + rel_cx - new_w / 2.0))
        canvas = np.zeros((canvas_h, canvas_w, 4), np.uint8)
        _paste_scaled(canvas, crop, x, y)
        out_frames.append(Image.fromarray(canvas))

    avg_bg = total_bg / len(frames)
    dur = max(1, int(round(1000.0 / fps)))
    out_webp = out_dir / f'{cid}.webp'
    out_frames[0].save(out_webp, format='WEBP', save_all=True,
                       append_images=out_frames[1:], duration=dur, loop=0, lossless=False, quality=82, method=6)
    # 预览：棋盘格半透明底
    comp = _composite_checker(out_frames[0])
    comp.save(out_dir / f'{cid}.preview.png')
    # 归一化后的角色高（从产物 canvas alpha 实测，供 life.json 记录）
    norm_h = []
    for im in out_frames:
        a = np.asarray(im)[..., 3]
        ys = np.where(a > 128)[0]
        if len(ys):
            norm_h.append(float(ys.max() - ys.min() + 1))
    meta = {
        'clip': cid, 'source': input_path.name,
        'width': canvas_w, 'height': canvas_h, 'fps': round(fps, 3),
        'frames': len(frames),
        'duration_ms': round(len(frames) / fps * 1000),
        'loop': True,
        'avg_background_ratio': round(avg_bg, 3),
        'char_height_norm': round(float(np.mean(norm_h)) if norm_h else 0.0, 1),
        'scale_factor': round(factor, 3),
        'webp': out_webp.name, 'preview': f'{cid}.preview.png',
    }
    print(f'[OK] {cid}: {tw_}x{th_} {len(frames)}f @{fps:.1f}fps 背景占比{avg_bg:.1%} '
          f'角色高→{meta["char_height_norm"]}px(scalex{factor:.2f}) '
          f'{out_webp.stat().st_size/1024:.0f}KB {time.time()-t0:.1f}s', flush=True)
    return meta


def _composite_checker(img: Image.Image, size=10):
    w, h = img.size
    i = np.arange(h)[:, None]
    j = np.arange(w)[None, :]
    arr = (((i // size) + (j // size)) % 2 * 255).astype(np.uint8)
    check = Image.fromarray(np.stack([arr, arr, arr], axis=2), 'RGB').convert('RGBA')
    return Image.alpha_composite(check, img.convert('RGBA'))


def process_still(input_path: pathlib.Path, out_dir: pathlib.Path, tw: int, target_char_px: int,
                  cid: str = 'base'):
    """
    处理静止基准图（H3「首帧/参考图」绿幕 PNG，如 生成正视图.png）→ 单帧透明基准 webp。
    与片段共享同一套：硬绿杀 + 右下角水印裁 + 归一化（等高/居中/贴底），
    保证和其他动作片段对齐同一画布与地面线，前端当作桌宠基准体无缝衔接。
    """
    bgr = None
    try:
        # OpenCV imread 在 Windows 不支持中文路径 → np.fromfile + imdecode（Unicode 安全）
        bgr = cv2.imdecode(np.fromfile(str(input_path), dtype=np.uint8), cv2.IMREAD_COLOR)
    except Exception:
        bgr = None
    if bgr is None:
        print(f'[SKIP] cannot read still {input_path.name}')
        return None
    H, W = bgr.shape[:2]
    scale = tw / max(W, H)
    tw_, th_ = max(1, int(round(W * scale))), max(1, int(round(H * scale)))
    rgba, a2 = chroma_key(bgr)
    # The still reference has a brighter, uneven green screen than the clips.
    # The distance-only matte can keep a translucent green rectangle around
    # the silhouette. For this image we can safely remove globally green-dominant
    # pixels: the character uses blue hair/clothes, warm skin and white trim.
    rgb = rgba[..., :3].astype(np.float32) / 255.0
    green_dominant = (
        (rgb[..., 1] - np.maximum(rgb[..., 0], rgb[..., 2]) > 0.035) &
        (rgb[..., 1] > 0.20)
    )
    rgba[..., 3][green_dominant] = 0
    # 右下角水印（豆包AI生成等）→ alpha=0
    h_f, w_f = rgba.shape[:2]
    x0wm, y0wm, x1wm, y1wm = [int(v * s) for v, s in zip(WM_RECT, (w_f, h_f, w_f, h_f))]
    rgba[y0wm:y1wm, x0wm:x1wm, 3] = 0
    if scale != 1.0:
        rgba = cv2.resize(rgba, (tw_, th_), interpolation=cv2.INTER_AREA)
    rgba = rgba[..., [2, 1, 0, 3]]  # BGR→RGB，alpha 保持
    _remove_still_green_fringe(rgba)
    bb = _bbox_on_alpha(rgba)
    if bb is None:
        print(f'[SKIP] no foreground in still {input_path.name}')
        return None
    top, bottom, left, right = bb
    ch_ = bottom - top + 1
    factor = max(0.05, target_char_px / ch_) if ch_ > 0 else 1.0
    ground = th_ - CANVAS_MARGIN_BOTTOM
    y0c, y1c = max(0, top - BBOX_PAD), min(th_, bottom + BBOX_PAD + 1)
    x0c, x1c = max(0, left - BBOX_PAD), min(tw_, right + BBOX_PAD + 1)
    crop = rgba[y0c:y1c, x0c:x1c]
    new_h = max(1, int(round(ch_ * factor)))
    new_w = max(1, int(round((right - left + 1) * factor)))
    crop = cv2.resize(crop, (new_w, new_h), interpolation=cv2.INTER_AREA)
    # 输出统一方形画布（tw×tw，同片段；tw_ 是按源比例缩放的中间值，画布一律用目标 tw）
    canvas_w = canvas_h = tw
    x = int(round(canvas_w / 2.0 - new_w / 2.0))
    y = canvas_h - CANVAS_MARGIN_BOTTOM - new_h  # 贴底（同一地面线）
    canvas = np.zeros((canvas_h, canvas_w, 4), np.uint8)
    _paste_scaled(canvas, crop, x, y)
    img = Image.fromarray(canvas)
    out_webp = out_dir / f'{cid}.webp'
    debug_png = out_dir / f'{cid}.debug.png'
    img.save(out_webp, format='WEBP', lossless=True, method=6)
    img.save(debug_png, format='PNG')
    comp = _composite_checker(img)
    comp.save(out_dir / f'{cid}.preview.png')
    print(f'[OK] still {cid}: {tw}x{tw} 角色高→{target_char_px}px(scalex{factor:.2f}) '
          f'{out_webp.stat().st_size/1024:.0f}KB {input_path.name}', flush=True)
    return {'clip': cid, 'source': input_path.name, 'width': tw, 'height': tw,
            'char_height_norm': float(target_char_px), 'scale_factor': round(factor, 3),
            'webp': out_webp.name, 'preview': f'{cid}.preview.png', 'kind': 'still'}


def main():
    src_dir = pathlib.Path(sys.argv[1])
    out_dir = pathlib.Path(sys.argv[2])
    tw = int(sys.argv[3]) if len(sys.argv) > 3 else 256
    target_char_px = int(sys.argv[4]) if len(sys.argv) > 4 else TARGET_CHAR_PX
    out_dir.mkdir(parents=True, exist_ok=True)
    metas = []
    for f in sorted(src_dir.glob('*.mp4')):
        print('== ', f.name, flush=True)
        m = process(f, out_dir, tw, target_char_px)
        if m:
            metas.append(m)
    # 静止基准图（H3「首帧/参考图」绿幕 PNG → base）
    for f in sorted(src_dir.glob('*.png')):
        if '正视图' in f.stem or 'front' in f.stem.lower():
            print('== still:', f.name, flush=True)
            m = process_still(f, out_dir, tw, target_char_px)
            if m:
                metas.append(m)
    # Processing a small replacement batch must not erase clips that are
    # already installed in the asset directory.  Replace entries by clip id,
    # retain the existing order for untouched clips, then append new clips.
    life_path = out_dir / 'life.json'
    existing = {}
    prior_clips = []
    if life_path.exists():
        try:
            payload = json.loads(life_path.read_text(encoding='utf-8'))
            prior_clips = payload.get('clips', [])
            existing = {c.get('clip'): c for c in prior_clips if c.get('clip')}
        except Exception:
            existing = {}
    for meta in metas:
        previous = existing.get(meta['clip'], {})
        existing[meta['clip']] = {**previous, **meta}
    ordered = []
    seen = set()
    for clip in prior_clips:
        cid = clip.get('clip')
        if cid in existing and cid not in seen:
            ordered.append(existing[cid])
            seen.add(cid)
    ordered.extend(meta for meta in metas if meta['clip'] not in seen)
    # Drop fields from the retired two-layer player even when they remain in
    # an older life.json. The single-canvas runtime has no end-mode metadata.
    retired = {'end_mode', 'hold_ms', 'fade_ms'}
    ordered = [{key: value for key, value in clip.items() if key not in retired} for clip in ordered]
    life_path.write_text(json.dumps({
        'schema': 1,
        'asset_version': str(int(time.time())),
        'clips': ordered,
    }, ensure_ascii=False, indent=2), encoding='utf-8')
    print('life.json written', flush=True)


if __name__ == '__main__':
    main()
