# DeskPet 素材导入工作流

状态时间：2026-08-22

这份文档是后续批量添加动作的固定入口。每个动作只需要准备一个绿幕 MP4；不要手工逐帧抠图、改 sheet 或编辑 `life.json`。

## 目录约定

把待处理视频放进一个临时输入目录，例如：

```text
<Downloads>\dafeiyu-actions-inbox\
├── idle__呼吸.mp4
├── jump__跳跃.mp4
├── wave__挥手.mp4
└── sleep__睡觉.mp4
```

文件名使用 `动作ID__描述.mp4`：

- `动作ID` 使用小写 ASCII：`idle`、`jump`、`wave`、`sleep` 等。
- `描述` 只用于人类识别，可以写中文；它不会影响程序 ID。
- 同一批次不要放两个相同动作 ID，否则后一个会覆盖前一个。
- 旧中文名仍兼容：`待机.mp4` → `idle`，`跳跃.mp4` → `jump`，`挥手.mp4` → `wave`。

脚本会逐帧完成抠像、去绿边、去水印、等比例归一化和贴地。当前播放器是单 canvas：动作会接管 idle，播完立即重启 idle。因此首帧/尾帧不强制相同，但如果尾帧与 idle 姿态差异很大，切回时会明显硬切；希望平滑时应让动作尾帧接近 idle。

## 一键导入

在仓库根目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\import_deskpet_actions.ps1 `
  -InputDir "<Downloads>\dafeiyu-actions-inbox"
```

脚本固定使用：

- 256×256 透明方形画布
- 角色归一化高度 120px（前端约 60px）
- 24fps（以视频实际 fps 写入 `life.json`）
- 透明 WebP 中间帧 + PNG 二维 sheet（播放器实际读取 PNG）
- 自动合并已有 `life.json`，只替换本次导入的动作
- 自动写入 `asset_version`，避免浏览器继续使用旧 sheet 缓存
- 自动合并已有 `life.json`，只更新本次导入动作的素材和帧参数
- 默认写入 `current` 人物目录；只有维护旧人物时才传 `-Variant legacy`

默认产物目录：

```text
~/.dsh\dsh-dafeiyu\deskpet-assets\
```

## 验收清单

1. 查看 `<动作ID>.preview.png`：角色完整、右下尾巴/手没有被水印蒙版抹掉、没有绿色大块。
2. 查看 `life.json`：有 `sheet`、`frames`、`fps`、`cell=256`、`columns=11`、`rows=11`。
3. 确认 sheet 是透明 PNG 网格：普通 121 帧动作为 `2816×2816`，冰舞为 `5120×4864`（20×19）；不要改成横向长条。
4. 重启 dsh 或执行硬刷新 `Ctrl+Shift+R`。
5. 页面中确认 idle 常驻，所有多帧动作按队列接管同一 canvas 后重新回到 idle；不应出现动作被长冰舞吞掉、变宽、变大变小、透明空帧或闪烁。

## 重复故障：文件已更新，但页面仍是旧动作

这是桌宠线已经实际出现过多次的运行时同步问题，不是视频抠像失败。资产文件和 `life.json` 更新后，已经运行的 dsh 页面不会自动卸载旧的 client bundle，也不会自动销毁旧桌宠 DOM。旧实例会继续按它启动时读到的动作清单播放，所以页面可能一直只看到旧的几个动作（例如 `stretch`），即使磁盘和 HTTP 接口已经有新动作。

按下面顺序确认，不要先重复导入视频：

1. 先读 `~/.dsh\dsh-dafeiyu\deskpet-assets\life.json`，确认新动作存在；再请求 `http://127.0.0.1:3080/api/dsh-dafeiyu/deskpet/assets/life.json`，确认服务端返回同一份清单。
2. 看 `deskpet-debug.log` 的最新 `mount:` 行。它必须包含当前动作，例如 `feed,sleep,walk,wave`；如果最新日志仍是旧清单，说明页面没有重新挂载。
3. **重启 dsh web**，这是改 client bundle 后的首选恢复方式；只替换 sheet/视频时也建议一起做。
4. 当前 client 会每 30 秒检查一次 `life.json` 的 `asset_version`；导入脚本写入新版本后，它会自动重新加载页面并创建新 controller。若导入后超过 35 秒仍没有新的 `mount:`，关闭当前 dsh 页面后重新打开，并执行一次 `Ctrl+Shift+R`。只刷新外层页面而没有重新创建桌宠实例时，旧 DOM 仍可能留下。
5. 重载后再看调试角标/日志：应显示新的 `actions:` 和 `mount:`，且旧动作文件（例如已删除的 `stretch.sheet.png`）请求应为 `404`。

判断标准：`life.json` 正确但最新 `mount:` 仍旧 = 运行实例问题；最新 `mount:` 已正确且 `decode:` 全部 `ok=true` = 资源与播放器已加载，继续检查动作画面本身，不要再改动作白名单。

首次安装此保护前已经打开的旧 bundle 仍需手动硬刷新一次；之后每次批量导入会由 `asset_version` 驱动自动重挂载。该版本同时负责 sheet 缓存失效和动作清单同步。

## 需要改代码时

只有在新增播放策略或 CSS 行为时才需要重新构建 client：

```powershell
npm run build:client
```

单纯新增/替换视频只需要运行上面的导入脚本，不要手工修改 `lib/client.js`、sheet 或 `life.json`。

动作导入后，播放器会自动让 `idle` 常驻；多帧动作会按对应人物目录的 `life.json` 自动进入普通轮播。设置中的“使用旧版人物”会整套切换到 `legacy`，不会把新旧动作混播；“主输入框同步鲸鱼娘”控制主输入框/dock 发送是否同时请求鲸鱼娘对话。已删除的 `stretch/lanyao/feed` 会在资源路由层返回 `404`。

## 绿幕与水印规则

普通视频水印遮罩是右下角窄区域 `x=79%..99.5%`、`y=93%..100%`；`ice_dance` 使用单独的 `WATERMARK_RECTS`。如果未来素材水印位置改变，先调整 `scripts/deskpet_chroma.py` 对应区域，重新导入并检查预览；不要扩大遮罩到角色尾巴所在区域。
