# DeskPet 线 · 输入框上方动态角色：当前状态

> ⚠️ 本插件有**两条分开开发的主线**，别混：气泡会话线见 `01-Dialog.md`，桌宠线（本文）只管输入框上方的角色与其气泡载体。
> 状态时间：2026-08-21。若与代码冲突，以磁盘代码为准（本文描述的就是磁盘当前实现）。
> 相关：`<插件上级目录>\deskpet-spec.md`（原规格）、`<插件上级目录>\h3-life-prompts.md`（素材提示词）、`src/client/deskpet/`。

## 一句话

桌宠 = 鲸鱼娘，常驻在**鲸鱼娘聊天输入框的上沿**。用**用户提供的绿幕视频**做真实动作，视频去背景 → **拆成一帧帧（二维网格帧图 sheet）→ 前端用 canvas `drawImage()` 逐帧画出来**。旧的 CSS 假动作、自动台词、趴睡、散步、吐泡泡**已全部移除**。

## 当前焦点：气泡会话迁移（已实现，待页面验收）

用户取消面板内聊天，改用 dsh 外层主输入框和左下角 dock 输入框；桌宠监听输入、发送与回复事件，所有会话输出改由桌宠气泡承载。桌宠位置可在设置中选择“主输入框上方”或“左侧栏输入框上方”，默认主输入框上方，切换立即生效且仍只有一个 viewport overlay。每次输出先展示仿模型思考状态的**伪思维区**，再展示面向用户的**正常正文区**。目标格式：

主输入框与 dsh 工作 AI 的正常聊天也会触发桌宠气泡。桌宠对此采用旁路监听，不接管、不阻断工作 AI 的原有回复；这项联动是当前正式设定，维护时不得以“误触发”名义移除。

```text
已思考（用时 5 秒）
• 很难想象用户是人类

好啦，问题已经查到了，改这里就行。
```

规则：

- 思维区第一行固定表达“已思考”，括号内填本次请求的展示耗时，按秒展示（例如 `1 秒`、`5 秒`）；它只是产品 UI，**绝不是模型真实思考用时**。
- 思维区第二行是短的旁观式吐槽，优先明确点名“用户 / 这位杂鱼 / 这个人类”，像屏幕边上突然飘过的毒舌旁白；不要总写成“本鱼在想什么”，也不要用温和的客服式确认。
- 当前受控人设池按可见语境分为：普通吐槽、技术甩活、工作区梗、报错吐槽、吃饭/摆烂和低落陪伴；明确成人语境才允许进入 R18 台词池。
- 示例：`用户又在这自我麻痹呢，真是杂鱼`、`很难想象用户是人类`、`哇哦，用户切到了劲爆的 R18 模式`、`文件夹里的 dsh 是大烧货吗`、`用户把简单改改说得像改个标点`。
- 随后显示正常正文：它是对用户的正式回复，语义和可读性优先于思维区。
- 保持九分娇一分傲：吐槽可以尖锐、荒诞、嘴欠，但只出现一条短句；不能持续辱骂、针对敏感身份、威胁用户或盖过正文。连续回复会做短窗口去重。
- 思维内容必须是**受控的假思维内容**，可以由 LLM 按独立伪思维人设提示生成，但不得改写/泄露 LLM 的 chain-of-thought、隐藏推理、工具过程或系统提示。提示词只提供用户可见上下文和已完成回复，并限制为一条短台词；失败时回退本地文案池。
- R18 台词只检查用户明确输入中的相关词，不因模型正文或普通技术词误触发；它不是内容升级器，也不是对用户的真实判断。
- 视觉上思维区偏灰、小一档、弱对比；正文维持正常色彩、字号和清晰度。必须结构化渲染两个区域，不能整条气泡一起调灰。
- 该格式用于桌宠气泡会话；双击不再触发旧的固定内心戏气泡，不恢复自动待机台词；表情包功能暂停。

实现已落在 `src/client/deskpet/view/bubble.ts`（结构化展示格式）、`src/client/deskpet/view/overlay.ts`（气泡生命周期、分类选句、短窗口去重和耗时）、`src/client/deskpet/config/copy.json`（受控人设池）以及 `src/client/index.ts`（dock/主 composer 输入桥接、线性设置入口、输入排版）。dock 不显示“桌宠已关闭”等状态副文案；桌宠 host 改为固定在视口坐标系，并以 `[data-composer-card]` 为锚点。尚待实际页面验收思维区/正文区的灰度、换行、顺序、长回复停留时长和不泄露真实推理。

## 当前实现（磁盘现状，已核对）

- **播放器** `src/client/deskpet/view/clips.ts`：`canvas.drawImage()` 从原始 PNG 网格帧图按 `(列,行)` 裁一格逐帧绘制；**不用**动画 WebP、**不用** CSS `background-position`、**不用**布局查询参数。`sprite.root` 内只有这一张 canvas，idle 和动作共用它。
- **动作切换** `src/client/deskpet/view/overlay.ts`：idle 常驻循环；动作开始时直接接管同一 canvas，动作播完停止并重新启动 idle。单 canvas 会保留原来的硬切行为，动作尾帧最好与 idle 姿态接近。
- **基准体** `src/client/deskpet/view/sprite.ts`：动作 canvas 自己承载 idle，不再显示第二个 `base.webp` 视觉节点。
- **循环**：`idle.sheet.png` 是唯一常驻身体；当前自动演出队列按 `life.json` 中所有帧数大于 1 的非 `idle/base` 动作轮播（目前为 `jump → look → ice_dance → sleep → walk → wave`）。动作完成后才启动下一轮冷却，较长的冰舞不会把下一次动作请求丢掉。
- **资源缓存与人物切换**：`current/` 与 `legacy/` 各自保存完整人物动作清单；`life.json` 的 `asset_version` 会进入 sheet URL，每次重建 sheet 自动换版本。已挂载 client 每 30 秒检查所选目录的版本，变化时自动重新加载。设置中的“使用旧版人物”整套切换人物，首次升级旧页面仍需手动硬刷新一次。
- **保留的交互**：戳击、拖拽、坠落和双击；双击仅保留交互反馈，不再触发固定内心戏气泡。
- **演出总线**：`src/client/deskpet/core/events.ts` 接收输入、发送、回复、工作成功/失败、新会话等事件；`core/performance.ts` 按 `ambient < contextual < direct < critical` 排优先级，用户输入/工作进行中会压低随机演出，高优先级事件可以打断低优先级动作。

## 演出事件与优先级

业务侧只发事件，不直接选择动画。桌宠导演负责动作、气泡、冷却和打断：

| 事件 | 默认优先级 | 当前表现 |
|---|---|---|
| `typing-start` / `reply-start` / `work-start` | 抑制随机 | 不主动说话，不让 ambient 插播打断用户 |
| `message-sent` | `direct` | 有 `jump` 时回应一次“收到。” |
| `reply-done` / `work-success` | `contextual` | 有 `cheer` 时播放，否则只显示短气泡 |
| `reply-error` / `work-error` | `critical` | 有 `startled` 时立即打断低优先级动作，否则显示错误气泡 |
| `new-session` | `direct` | 有 `jump` 时回应一次新会话气泡 |

当前已接入的事件来源：输入框打字、发送聊天、等待/完成/失败回复、点子整理、新建会话。通用工作区任务的成功/失败事件目前还没有稳定的宿主 hook，等接入后直接映射到 `work-start/work-success/work-error`。以后新增业务入口只需调用桌宠 controller 的 `emit()`，不要把动画逻辑复制到 UI 文件。

## 资产与管线

资产实际在 `~/.dsh/dsh-dafeiyu/deskpet-assets/`，由 `/api/dsh-dafeiyu/deskpet/assets/<file>` 服务。

| 文件 | 规格 |
|---|---|
| `base.webp` | `生成正视图.png` 无损抠像，256×256，角色高 120px，贴地面线 |
| `idle/jump/look/sleep/walk/wave.webp` | 每段 121 帧 / 24fps / 透明 WebP（播放器实际读取对应 `.sheet.png`） |
| `ice_dance.webp` | 366 帧 / 30fps / 透明 WebP（对应 `5120×4864` PNG sheet） |
| `*.sheet.png` | 普通动作 **11×11，2816×2816**；冰舞 **20×19，5120×4864**（透明 PNG，不能改回横向长条） |
| `life.json` | 含 `asset_version`；每段含 `sheet/frames/fps/cell/columns/rows/char_height_norm` |

重建/重跑脚本（按序）：

```powershell
python scripts\deskpet_chroma.py <视频目录> "$env:USERPROFILE\.dsh\dsh-dafeiyu\deskpet-assets"
python scripts\process_still_cli.py "<Downloads>\生成正视图.png" "$env:USERPROFILE\.dsh\dsh-dafeiyu\deskpet-assets" 256 120
python scripts\build_sheets.py "$env:USERPROFILE\.dsh\dsh-dafeiyu\deskpet-assets"   # 必须输出二维网格

# 后续批量新增动作，优先使用固定的一键入口：
powershell -ExecutionPolicy Bypass -File .\scripts\import_deskpet_actions.ps1 -InputDir "<绿幕视频目录>"
```

改 client 后构建/热载：

```powershell
node <tsdown-global>\dist\run.mjs
```

## 最近完成

1. 已处理并替换 `idle` 与 `jump`：来源为 `20260820_184341187.mp4`（待机呼吸）和 `20260820_185031842.mp4`（原地跳跃）。两段均完成绿幕抠像、右下水印遮罩、透明 WebP 和 11×11 二维帧图。
2. 管线现在会合并已有 `life.json`，只替换本次处理的片段，不会清掉其他动作或 `base`。
3. 修复竖幅视频被帧图横向拉伸的问题：`idle/jump` 现在都先保持比例，再落到统一 `256×256` 透明画布；播放器恢复单 canvas，避免双层播放造成视觉错位。
4. 收窄右下水印蒙版到视频底部窄区域，恢复被误抠除的尾巴/右下角色区域；重建 idle/jump sheet。
5. 移除额外 CSS 呼吸缩放，idle 不再变大变小；保留原视频逐帧动画。
6. 固化批量导入脚本、动作 ID 命名约定和 `asset_version` 缓存换版本机制，详见 `05-DeskPet-Import-Workflow.md`。
7. 增加事件总线和演出优先级导演；素材缺失时气泡仍可工作，补齐对应动作后自动接入。
8. 恢复 idle/action 共用单 canvas；固定显示尺寸，动作结束后重新启动 idle。尾帧戛然而止时会硬切回 idle，后续素材需按首尾姿态接近原则制作。
9. 导入 `ice_dance__跳Q冰舞.mp4`，修正竖幅视频黑边取色导致的绿幕残留，并加入冰舞专用水印遮罩。
10. 修正透明方形画布导致的交互错位：拖拽命中区域收窄到角色附近，气泡锚定角色头顶而不是画布顶部。
11. 修复长动作期间的演出计时：旧计时器每 9 秒触发一次，冰舞尚未结束时会丢弃下一动作；现在动作结束后才重新安排下一次演出，并拒绝过期计时器覆盖正在播放的动作。
12. 修复动作白名单遗漏：旧逻辑只把 `jump` 与 `ice_dance` 放入自动队列，导致其他多帧动作虽在 `life.json` 中却永远不播放；现在按元数据自动纳入所有多帧动作。
13. 移除 `stretch/lanyao`（懒腰）和 `feed`（喂养），保留 `sleep`（睡觉）、`walk`（向左走）和 `wave`（打招呼）；资源路由也显式拒绝这些已删除动作。
14. 固化资产更新验收：运行中的旧 client 实例不会自动卸载，出现旧 `stretch` 清单时必须重启 dsh 或硬刷新；新 bundle 已显式过滤 `stretch`。

## 下一步（还没做 / 待做）

1. 按固定工作流持续导入新的 `动作ID__描述.mp4`，每次检查 preview 和 sheet。单 canvas 下动作尾帧若与 idle 差异很大，会硬切回 idle；应优先让首尾姿态接近，或接受这是一次性演出的切换感。
2. 新视频导入后必须重跑抠像 + 网格帧图脚本，`life.json` 保留 `asset_version` 与 `columns/rows`。
3. 如需把新动作加入自动插播，再单独修改播放策略；素材导入和播放策略分开维护。
4. 在 dsh 页面验收气泡会话：主输入框 Enter/发送均能触发，桌宠按设置显示在 composer 或 dock 上沿，窄屏不越界，长回复可读完后才消失。

## 红线（别回退）

- ❌ 不退回 旧 atlas / CSS 假动作 / 动画 WebP / `background-position` 精灵条 / "偶尔闪一下"的插播。
- ❌ 不恢复 自动待机台词、趴睡、旋转躺倒、变暗、散步、吐泡泡。
- ✅ `base.webp?matte=2` 是正确基准体加载方式；sheet 是**二维网格**。
- ✅ 思考气泡采用“已思考（用时 xx 秒）+ 第二段内心活动”的两段式规格；在实现前不要把它写成普通单行气泡。
- ✅ 会话气泡固定为“偏灰的伪思维区 → 正常正文区”；伪思维不是真实 LLM 推理，绝不可暴露内部思考过程。
- ❌ 不恢复聊天面板内的消息列表、输入框、表情展示或表情预加载；表情包处于暂停状态。
- ✅ 用户输入使用 dsh 外层主输入框或左下角 dock 输入框；桌宠监听其生命周期事件并展示输出，不另建聊天面板输入框。
- ✅ 双击桌宠不再弹出固定内心戏气泡。
- ✅ 主输入框与工作 AI 的普通聊天会同步触发桌宠气泡；工作 AI 回复与桌宠气泡并行保留，不能过滤或拦截主输入框事件。
- ✅ 设置可在两个锚点间切换，保存到 `~/.dsh/dafeiyu-deskpet-settings.json`，默认 `composer`，切换即时生效。
- ✅ 开发排查时可临时显示 `pick: idle/jump/ice_dance frame N/total`；发布状态默认隐藏调试角标；不出现透明空帧频闪、旧旋转、变暗或 CSS 缩放。
- ✅ idle/action 共用一个固定尺寸 canvas；动作结束后立即回到 idle，不使用双层渐隐。

## 验证入口（给接手人）

1. 重启 dsh web 或硬刷新 `Ctrl+Shift+R`（避免旧 bundle / 旧基准图缓存）。
2. 看左上调试角标 `frame N/121` 是否连续变化、画面是否同步在动。
3. 若再次出现旋转/变暗，先查是否有旧 bundle 残留 DOM（新版会清 `.dafeiyu-deskpet`）。

## 已知重复故障：旧实例遮住新动作

动作导入成功不等于当前页面实例已经更新。dsh 的 client bundle 通常在 web 进程启动时装载；正在运行的页面会继续持有旧的桌宠 controller、旧动作清单和旧 DOM。于是会出现“磁盘里的 `life.json` 已经有全部动作，但用户画面仍只有静止/Q 冰舞/旧 lanyao”的重复现象。

排查顺序固定为：

1. 对比磁盘 `life.json` 与 `http://127.0.0.1:3080/api/dsh-dafeiyu/deskpet/assets/life.json` 的清单。
2. 查看 `~/.dsh/dsh-dafeiyu/deskpet-assets/deskpet-debug.log` 最新 `mount:` 行；它代表当前页面真正挂载的动作清单。
3. `mount:` 仍是旧清单时，重启 dsh web；不能重启时关闭并重新打开 dsh 页面，再 `Ctrl+Shift+R`。
4. 只有在最新 `mount:` 已包含新动作、且对应 `decode: ... ok=true` 后，才继续排查素材画面、比例或抠像。

当前 client 已用 `asset_version` 每 30 秒进行一次轻量轮询；更新时自动重新加载页面并创建新的 controller。该保护不能回溯替换已经运行的旧 bundle，所以第一次升级仍要手动硬刷新一次。

## 维护记账

- 2026-08-20：确认磁盘为 canvas 逐帧实现；拆出「对话框 / 桌宠」两条线；文档重命名为 ASCII 名（`04-DeskPet.md`）。
- 2026-08-22：移除 `stretch`，导入 `feed/sleep/walk/wave` 四个动作并生成 PNG 二维帧图。
- 2026-08-22：按用户要求移除 `feed`（梗图-喂养用户）；`sleep` 增加动作级显示比例校正，避免趴睡帧视觉放大；资源路由永久拒绝 `stretch/lanyao/feed`。
- 2026-08-25：新增 `current/legacy` 人物资源分层与“使用旧版人物”开关；新增“主输入框同步鲸鱼娘”开关。新人物三视图视频先抽取稳定正面帧作为 current 静态待机，避免把转面展示误当呼吸循环。
- 2026-08-25：按用户反馈将默认选择恢复为 `legacy` 旧版人物；`current` 新人物资源保留，后续可通过设置重新切换。
- 2026-08-20 22:35：修复竖幅视频输出画布导致的横向拉伸，并修复动作末帧切换时的透明空窗；重新生成 `idle/jump` 帧图与 client bundle。
- 2026-08-20 23:05：将 idle 改为常驻循环；动作切换/打断停止 RAF 后立即重启共享 canvas 上的 idle，避免 base 淡入造成持续闪烁。
- 2026-08-21：收窄水印蒙版并重建 idle/jump；移除额外 CSS 呼吸缩放；加入 `05-DeskPet-Import-Workflow.md`、一键批量导入脚本和 `asset_version` 缓存版本。
- 2026-08-21：加入 `core/events.ts` 事件总线与 `core/performance.ts` 演出导演；接入输入、聊天回复、点子整理和新会话事件，按优先级抑制/打断演出。
- 2026-08-21：确认新的思考气泡规格：先显示“已思考（用时 xx 秒）”，再显示 AI 按独立伪思维人设生成或本地回退的嘴欠/碎念/摆烂内心活动；绝不读取真实 LLM 推理。
- 2026-08-21：取消面板内聊天，确定所有会话输出转入桌宠气泡；思维区为偏灰、恰当好处的伪思维，正文正常显示，表情包暂停。
- 2026-08-21：完成 Bubble Chat 实现：桌宠支持锚定 `[data-composer-card]` 或左侧栏 `.dfy-dock`，监听主输入框/dock Enter/发送并显示“伪思维 → 正文”气泡；host 停止表情扫描和选图。
- 2026-08-21：取消双层舞台，恢复 idle/action 共用单 canvas；移除 `end_mode/hold_ms/fade_ms` 收尾字段。导入冰舞并修复黑边取色与水印遮罩。
- 2026-08-22：清理双层播放遗留的第二个视觉节点；动作和 idle 现在真正绘制到 `sprite.root` 内的唯一 canvas。修复预加载失败后永久复用 `naturalWidth=0` 的图片状态，并移除会触发错误缓存路径的布局查询参数。
