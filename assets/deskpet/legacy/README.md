# deskpet 包内资产目录

运行时桌宠媒体优先放在 `~/.dsh/dsh-dafeiyu/deskpet-assets/`，由 host 静态路由服务：
`GET /api/dsh-dafeiyu/deskpet/assets/<文件名>`。本目录只用于随包分发的回退资产。

支持的格式：`.webm` / `.mp4` / `.png` / `.webp` / `.gif` / `.svg` / `.json`

## 放什么
- H3 生成的生活片段视频处理后的透明 WebP
- 二维网格帧图：`<clip>.sheet.png`，每格 256x256；禁止把 121 帧横排成超宽图片
- `life.json`：至少包含 `sheet`、`frames`、`fps`、`cell`、`columns`、`rows`；动作可选 `end_mode`、`hold_ms`、`fade_ms`
- 静态 `base.webp` 仅作为待机/加载兜底；正式无缝待机应由同源 `idle/breathe` 视频承担

命名建议：`01-idle-breathe.webm`、`02-look-up.webm` 这种编号，与 `h3-life-prompts.md` 对应。

当前真实资产在用户落地区，`src/client/deskpet/view/clips.ts` 用 canvas 对网格帧图逐帧绘制。

播放器是单 canvas：动作直接接管 idle，播放结束后重启 idle。普通动作尾帧最好接近 idle，避免硬切。
