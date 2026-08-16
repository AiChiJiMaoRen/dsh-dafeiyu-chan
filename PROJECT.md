# 大肥鱼（鲸鱼娘）· dsh 情绪价值助手 — 项目文档

> DeepSeek Harness 里的「大肥鱼」：一只以鲸鱼娘人设陪伴你聊天的侧栏常驻对话框。
> 群客服式聊天陪伴，非桌宠、非皮肤。目标社区开源。

---

## 1. 项目定位

dsh 内一个以「鲸鱼娘·大肥鱼」人设陪伴用户聊天的轻量助手。

- **形态**：左侧栏最底部的常驻鱼浮条 + dsh 风对话框（非桌宠、非浮窗、非独立窗口）
- **核心价值**：情绪价值陪伴（俏皮、有脾气、护短），能记住你是「杂鱼」
- **附加能力**：简单工作区整理（挑 TODO / 整理 README / 起名字）
- **开源目标**：产出可发布的独立插件，合规署名

---

## 2. 命名与人设（最终定稿 v2）

### 名字
- **社区既定名**：「大肥鱼」（🐋），插件名 `dsh-dafeiyu`，对话框名「鲸鱼娘·大肥鱼」

### 性格脊梁｜「九分娇一分傲」（v2，2026-08 用户调整）
- **底色**：甜、软、黏、容易害羞；像真人在聊天频道里跟熟人回话，**绝对不像客服/念台词**。
- **一分傲**：只有被逗过头或害羞到极点才轻微嘴硬，用**自然完整句子**（禁结巴式「你、你胡说」）；被夸/被哄立刻变软撒娇。绝不尖酸刻薄、不拒人千里。
- **对话尺度**：一句话/一个词直接答，不机械凑字数、不大段；关心要具体走心，不用套话。
- **emo/累**：立刻不闹，软下来认真陪，问一句「怎么了」、提一句「先歇会儿」，不灌鸡汤。
- **称呼**：「杂鱼」＝「我的人」的亲昵（不是看不起），看语境自然切换。

### 腔调（v2）
- 自称「我」或「本鱼」，偶尔带「~」「诶/呜/啦」让话软，但不每句拖尾。
- **不用科幻/深海/数据辞藻**（去掉数据海、海底暖流、涨潮、咕噜咕噜等）。
- 心灵小动作（如「戳了戳屏幕」）克制使用，偶尔点睛。

### 干活腔调
- 认真办，语气还是娇软的（「好啦好啦我帮你看看~ 不跟你闹啦，等我一下嘛」），活要办清爽。

### 开场白（v3，2026-08）
- **现场生成**：每次打开面板，开场白由 LLM 按「当前心情 + 当前工作文件夹」现写，不复用固定模板（离线才 fallback 到一行多变规则文案）。
- 例子（LLM 实机输出）：
```
（探出脑袋）哟，杂鱼，你可算来了~ 我在这儿都快闲出泡泡了。吃午饭没？
```
```
（慢慢从屏幕角冒出来）诶，杂鱼你来啦？我刚才还琢磨你今天会不会来呢……
```

---

## 3. 技术形态与架构

### 3.1 总体：ui-panel 插件（host + client 双半）

参照已装插件 `dsh-ssh` / `dsh-client-ui-aionui-panel` 的成熟骨架：

```
dsh-dafeiyu/
├── package.json          ← dsh.client 声明 + exports(./client)
├── tsconfig.json
├── tsdown.config.ts      ← client bundle (lib/client.js)
├── scripts/build.sh      ← host tsc 编译
├── NOTICE                ← 形象署名（上善 / ZipZipPipe）
├── src/
│   ├── index.ts          ← host 半：webServer 路由 + 记忆服务
│   ├── core/             ← host/client 共享的 wire 类型
│   ├── host/             ← 记忆服务、工作区读取、路由
│   └── client/           ← 侧栏入口 + 对话框 React（tsdown 打包）
└── docs/
```

### 3.2 左侧栏入口（关键实现：DOM 注入）
dsh 侧栏 shell **没有对外暴露可注册的 slot**，所以参照 `dsh-ssh/src/client/sidebar-entry.ts` 的做法——**DOM 级注入 + MutationObserver 自愈**：

- 定位 `[data-pane="sidebar"]` 列的 logoRow 归属根
- 在 ssh 入口**之后**插入大肥鱼条目（`[data-dsh-dafeiyu-entry]`），实现「左侧栏最底部」（用户拍板：B 方案）
- React 重渲染挤掉时，观察器同一帧内重新插入（无闪烁）
- 点击条目标记展开/收起 `sidebar` 面板

### 3.3 对话框（dsh 风，非自创皮肤）
- 展开后是「dsh 自己的聊天气泡样式」，主色换深海蓝、点缀白
- 她的话：冷色偏蓝气泡；你的话：暖色气泡；底部输入条 + 发送
- **UI 完全跟 dsh 看齐**，只换色调 + 加鲸鱼元素，不自创皮肤

### 3.4 对话与机制（定稿清单）

| 项 | 定稿 |
|---|---|
| 唤醒 | 仅用户主动在对话框发消息，她才会被叫醒 |
| 读当前会话 | 唤醒后 host 读**当前工作目录**（`workspaceRegistry`）+ 记忆 json，接住你的话 |
| 冒泡 | 限频轻量冒泡（深夜 / 久不聊 / 刚完工），只看本地不读大量上下文 |
| 干活 | 工作区整理用 host 读工作目录 + 工具，面板内动手 |
| 记忆 | 纯个人小本本 `whale-memory.json`：称呼(杂鱼)、心情、几件事——固定、不跟项目绑 |

### 3.5 回复生成通道（已定稿）
- **主通道**：host route 直接 `ctx.llm.stream({ provider, model, system: 大肥鱼人设, messages, maxTokens })`，累加 `text-delta` 组装回复（真·LLM 人设回复）。provider/model 取自 `ctx.agentDefaultModel.currentSelection()`，次选 `ctx.llm.listProviders()[0]` + `listModels()`。host `inject` 含 `llm` + `agentDefaultModel`。
- **保底**：`rule` 离线网关（`RULE_REPLY_GATEWAY`，开箱即用，零 wiring）——本机已验证的当前默认。
- **坑**：`ctx.llm` 只在 host 进程，browser 半边没有，必须走 host route + fetch。

### 3.5.1 参考口味：梦鲸思客 V4（DS 酒馆预设）提取
用户给的「梦鲸思客 V4」是 Heavy 向的梦境共创酒馆预设（XML 多协议、叙事者人格、DREAM_PLOT 框架），不适合整搬做侧栏揽板。**提取出对大肥鱼聊天陪伴真正有用的点**：
- **实体重命名格局**：把「AI/Assistant」重命名为独立存在（思客）、用户重命名为「梦客」——对应大肥鱼的「本鱼/杂鱼」。
- **System 优先级与「不脱离人设」保护**：核心定义用高优先级块，禁止后续指令覆盖——用于把鲸鱼娘人设钉死。
- **思考落款签名**：「吾有一梦，今方始筑」→ 大肥鱼版「本鱼心里咕噜一声」做心灵签名（已是 persona 的一部分）。
- **反弱化写作规则（最实用）**：禁止「不是X，而是Y」句式、直接给 Y 不先拎 X、禁破折号——**直接解决「表述很怪」的观感**，已并入 persona 【写作规则】。
- **聊天模式分离**：暂停正事→进入正常聊天时去掉文风设定、内容适中（对应大肥鱼的「陪你唠/干活」双态）。
- **禁词清单**：DeepSeek 禁破折号、Glm/Gemini 禁「肉刃/匝道」。

### 3.6 构建与注入（本机已验证）
- 这台机器**没有完整 dsh 源码 checkout + 无法装 tsdown**（沙箱挡 npm）。
- host 编译：junction `node_modules/@deepseek-ai` → harness CLI 的 `@deepseek-ai\dsh\node_modules\@deepseek-ai`（194 个类型包），`node <dsh-harness>/node_modules/typescript/lib/tsc.js -p tsconfig.host.json`。
- 注入：`dev_inject_plugin`（host-only，已 `[active]`）。
- client 注入：已用 tsdown（本机全局安装后可跑）把 `src/client/index.ts` 打包为 `lib/client.js`（含 `inject:['slots']` + `sidebar.footer.action` 槽注册 + 防御性 apply）。宿主热装配已生效；**client 模块需重启 harness 后由 `dsh-client-modules` 在启动时服务**（`dev_install_package` 已把包写进 profile bundles + link，重启即自动装配）。

---

## 4. MVP 边界

### 做
- 左侧栏底部鱼浮条 + dsh 风对话框
- 唤醒读当前工作目录 + 固定记忆 json
- 俏皮人设陪聊
- 限频轻量冒泡

### 不做
- 跟项目切换记忆
- 历史文件记忆
- 跨会话完整状态
- 皮肤 / 情绪温度曲线

---

## 5. 合规与发布

- 形象原作 **「上善」**（Pixiv 62155430）、女仆鲸鱼娘二次设计 **「ZipZipPipe」**（Pixiv 18604994）→ `NOTICE` 署名
- 整体 **CC BY-NC-SA 4.0（非商用）**
- README 标注「个人开源作品，非 DeepSeek / OpenAI 官方项目」（学 `deepseek-whale-pet` 口径）
- 开源 ≠ 商业收费，兼容

---

## 5.5 当前实现状态（已验证）
- ✅ host `/api/dsh-dafeiyu/*` 三接口（bootstrap / chat / bubble）在本机跑通
- ✅ `workspaceRegistry` 读当前工作区（实测返回当前会话工作目录）
- ✅ 记忆 `~/.dsh/whale-memory.json` 持久化 + 心情推断（`累`→blah）+ 固定称呼 `杂鱼`
- ✅ rule 离线回复网关（人设腔调）实机可响应
- ✅ `llm` 通道已实测通过：`replyChannel: 'llm'` 下用本机 `agentDefaultModel`（`opencode-go` / `deepseek-v4-flash`）跑出完整鲸鱼娘人设回复（emo 安慰、整理 README、被吐槽回嘴三场景均保持人设）；心情推断与固定记忆同步生效
- ⏳ GUI 客户端面板：host-only 注入为 `[active]`，但客户端 UI 需 tsdown 构建环境（见 3.6）

## 5.6 记忆 + 点子（v4，2026-08 已实现并实测）

### 记忆（第1层：对话/工作进展摘要）
- 每轮 chat 后，`src/host/memory-log.ts` 用一次 LLM 调用把「用户消息+回复」凝练成 0~2 条 `progressLog`（kind: progress/todo，≤120字），并更新 `currentFocus`。
- `~/.dsh/whale-memory.json` 扩展 `progressLog: MemoryEntry[]`（最多 20 条，最新在前；旧文件自动兼容）。
- 开场白（greeting）带最近 3 条记忆，让她「记得上次」。实测：开场白能自然提到「上次说的插件README」。
- 容错：JSON 三层解析（直接 parse → 平衡括号扫描 → 逐条 sanitize），任何失败返回空摘要，绝不阻塞主回复。

### 点子（读工作区 + 草稿笔记 + 新项目检测）
- `POST /api/dsh-dafeiyu/ideas` → `{ isNewProject, ideas: string[1~3], note? }`
- 读：当前工作区根目录清单 + git status + README 前300字 + `~/Downloads` 草稿（.md/.txt/.json，含关键词或7天内修改，前200字，上限10个）
- 新项目检测：根文件 ≤5 且无 README/package.json 等标志文件
- **严格只读**，绝不写/删；LLM 生成失败回退规则文案
- 实测：当前项目返回 3 条具体建议（基于草稿笔记 + git）

### 触发 UI
- 对话框输入框上方 `💡 给我个点子` 按钮 → 调 /ideas → 气泡展示
- 打开面板若 isNewProject → 追加「新地盘」提示气泡，但不自动塞点子

## 5.7 新建会话护航提示（v5，2026-08 已实现并实测）

- **触发**：在侧栏点「新建会话」时（client 捕获点击，capture 阶段、不拦截流程），大肥鱼面板弹出提示。
- **分支**：
  - 工作区内无旧会话 → 固定「新任务注意事项」清单（命名、目标说清、接着上次、工作目录）。
  - 有旧会话 → `ctx.sessionQuery.listSessions()` 按 `header.cwd` 匹配当前工作区，取最近 3 个会话的 `readTitle` 标题 + `readSession` 最近事件 `extractSessionEventText` 摘要 → LLM（人设）生成接续建议。
- **规则**：每次都弹（用户确认：下载该插件的都是需要陪伴的用户）；只读会话元数据/摘要，绝不写。
- 实测：提示能引用真实旧会话内容（如「上次你还在忙《博客部署踩坑记》呢，要不要接着那个弄？」）。
- 文件：`src/host/session-tip.ts`、`src/client/index.ts`（新建会话监听）、`src/index.ts`（inject + 路由）。

## 5.8 表情系统（v6，2026-08 已实现并实测）

- **消费端（每次对话，零 token）**：`chat` 回复附 `sticker`（host 按对话情绪从本地表情库挑一张，纯本地匹配）。
- **表情库**：`~/.dsh/dafeiyu-stickers/`，放图即入库；**命名前缀=情绪**（开心/难过/生气/无语/加油/通用）。
- **静态路由**：`GET /api/dsh-dafeiyu/stickers/<file>`（prefix 路由 + URL 解码中文文件名，实测 200 image/png）。
- **源方向（用户拍板）**：不抓贴吧（反爬 403）；用户未来自建 **GitHub 表情库**开源分享 → clone 到表情目录即可用。
- **OCR 分类（未来）**：本地 tesseract.js（零 token）可做自动分类，接口已预留。
- **选图判定 v7（2026-08 已实现并实测）**：`inferTone()` 语境识别（tease/praise/emo/happy/neutral）→ `filterStickersForTone()` 按语境裁剪候选（tease 只留态度池、认怂图直接出局；emo 剔除认怂/嘴硬图）→ 结构化目录 + 态度策略喂 LLM 选图 → 没选/无效时 `pickStickerForTone()` 按语境池兜底。实测被吐槽时优先贴「压力/理直气壮/狡黠/生气」类态度图，认怂图零出现。**v7.1 防连发**：去除点名提示词 + 记录最近 6 张全链路排除 + 目录随机序（实测同句 6 连发 6 张不同图）。
- **主动消息自动收起 v8（2026-08 已实现）**：鲸鱼娘主动消息（开场白/点子/护航提示）**生成完再打开对话框**（鱼条显示「正在冒泡泡…」等待），展示 8 秒后整个对话框自动收起（回到侧栏）；用户发出第一条聊天消息后常驻（不再自动收起）。表情与文字同气泡、打开前图片已就绪、打字时顺延。client 侧纯 DOM 实现。
- 文件：`src/host/stickers.ts`、`src/host/routes.ts`、`src/host/service.ts`、`src/client/index.ts`。

## 6. 路线图

### V1（MVP）｜当前
- 侧栏鱼浮条 + dsh 风对话框 + 唤醒读工作目录 + 固定记忆 + 俏皮陪聊 + 轻量冒泡 + 简单工作区整理 + 表情系统

### V2
- 对接皮肤（`dsh-deep-whale` 女仆皮肤联动）
- 情绪温度曲线（随时间轴记录心情）
- 更高级工作区整理
- 任意会话「鲸鲸」点名（若日后需要）

---

## 7. 参考与致谢

- dsh 侧栏注入范式：`@linxin666/dsh-ssh`（sidebar-entry.ts、client/index.ts）
- dsh host 工作区读取范式：`@linxin666/dsh-client-ui-aionui-panel`（gate.ts、workspaceRegistry）
- 人设/梗来源：社区「大肥鱼」「吃白饭」二创生态、dsh-deep-whale 皮肤、萌娘百科 DeepSeek娘条目
- 形象版权：上善（形象原作）、ZipZipPipe（女仆鲸鱼娘二次设计）
