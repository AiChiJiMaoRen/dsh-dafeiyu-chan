# 🐋 dsh-dafeiyu-chan · 大肥鱼（鲸鱼娘）

DeepSeek Harness 里的情绪价值陪伴看板娘：左侧栏最底部一条「大肥鱼」鱼标，输入框上沿常驻桌宠，以气泡呈现大肥鱼的回复，俏皮、有骨头、护短，固定称呼你为「杂鱼」。

社区既定名的二创形象；本项目为「鲸鱼娘·大肥鱼」的开源陪伴插件（非官方项目）。

## 定位

- **形态**：左侧栏底部的鱼标 + 输入框上沿常驻逐帧桌宠；用户继续使用 dsh 主输入框，会话输出在桌宠气泡中显示，不使用悬浮聊天面板
- **工作 AI 联动**：主输入框与 dsh 工作 AI 的正常聊天也会同步触发桌宠气泡，这是刻意保留的产品设定，不视为异常行为。
- **核心**：情绪价值陪伴——俏皮有脾气，真 emo 认真陪，不灌鸡汤
- **附加**：能接住当前工作会话的上下文做简单的代码 / 文件 / 整理类小活
- **记忆**：`~/.dsh/whale-memory.json` 记住你的心情与关注点（`固定称呼`、不跟项目绑）

## 人设一句话

「九分娇一分傲」的日常系小看板娘：自称「本鱼」，叫你「杂鱼」，甜软黏人、容易害羞，被逗才轻轻嘴硬一下，被哄就立刻软——像真人在聊天框里跟熟人回话，不用科幻辞藻。

> 气泡会话迁移规格见 `docs/01-Dialog.md` 与 `docs/04-DeskPet.md`；`docs/02-Dialog-UI.md` 是已废弃的面板交接。
>
> 📌 **接手/开发入口：先读 `docs/0-先读这里.md`**（两条开发线的当前状态入口）。

## 功能

| 能力 | 说明 |
|---|---|
| 左侧栏鱼标 | 左侧栏最底层「大肥鱼」鱼标，self-heal DOM 注入 |
| 气泡会话 | 桌宠气泡先显示偏灰的伪思维，再显示正常回复正文；不展示真实模型推理 |
| 回复通道 | `ctx.llm` 人设补全（`opencode-go` / `deepseek-v4-flash`），rule 兜底 |
| 记忆 | 心情 + 关注点 + 进展摘要（progressLog）存 `~/.dsh/whale-memory.json`；开场白记得上次 |
| 给点子 | 💡 读工作区 + Downloads 草稿 + 新项目检测 → LLM 给 1~3 条建议（只读） |
| 新建会话护航 | 点「新建会话」→ 有旧会话则 LLM 建议接续，无则给新任务注意事项（只读） |
| 表情系统 | **暂时暂停**；当前气泡不加载或展示表情图片 |
| 轻量冒泡 | 深夜等有限主动提醒（host `/bubble`） |

### 表情库规则（已暂停）

表情从本地目录读取：**`~/Pictures/大肥鱼/`**（放图片进去即自动入库，无需重启）。

**命名规则**：`表情-内容文字.jpg` 或 `表情.jpg`（表情词在前，`-` 后是图上的梗/内容，帮助模型理解）：
```
委屈-你这吃白饭的蓝色大肥鱼.jpg
开心.jpg
生气-气死我了.jpg
```

**选图机制**：每次大肥鱼回复时，把表情库文件名列表给 LLM，它**看文件名（含内容文字）选一张最贴合语气**的图随回复展示（零额外 token）；没选到就随机兜底一张。表情图限制 148px、降饱和，不刺眼。

**未来**：想开源分享表情库？按上述命名规则建一个 GitHub 仓库，把图放进去即可。

## 安装

```bash
# 方式1：从 GitHub 安装（推荐）
dsh plugin --profile web add https://github.com/AiChiJiMaoRen/dsh-dafeiyu-chan

# 方式2：本地目录安装
dsh plugin --profile web add <本插件目录>
```

装完**重启 dsh**，左侧栏底部出现「大肥鱼」鱼标，桌宠会锚定在输入区上沿。

### 依赖
- dsh Web GUI（运行在 http://127.0.0.1:3080）
- 一个可用的 LLM 模型（大肥鱼跟随 dsh 的「默认模型」设置，`agentDefaultModel`）

### 开发者构建（改 host/client 后）

```bash
# host 编译
node <dsh-harness>/node_modules/typescript/lib/tsc.js -p tsconfig.host.json
# client 打包（需全局 tsdown）
node <tsdown-global>/dist/run.mjs
```

`lib/client.js` 为无依赖 DOM 模块，走 `dsh.client` 注入；监听 dsh 主输入框并将大肥鱼回复显示到桌宠气泡。

## 配置

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `replyChannel` | `'rule' \| 'llm'` | `'rule'` | `rule` 离线兜底；`llm` 走 `ctx.llm.stream` 人设补全 |
| `announceToAgent` | boolean | `true` | 是否向 agent 广播插件存在 |
| `enabled` | boolean | `true` | 主开关 |

## 目录结构

```
src/
├── core/types.ts      # 宿主/客户端共享 wire 类型
├── core/persona.ts    # 大肥鱼人设（system prompt + 开场白）
├── host/memory.ts     # 固定记忆 ~/.dsh/whale-memory.json
├── host/service.ts    # 业务服务 + LLM 回复网关（fallback rule）
├── host/routes.ts     # /api/dsh-dafeiyu/* 路由（API 路径不变）
└── index.ts           # host apply（webServer/systemPrompt 装配）
lib/client.js          # 无依赖 DOM 客户端（鱼标 + 主输入框桥接 / 桌宠气泡）
```

## 许可与署名

- **署名**：鲸鱼娘形象原作「上善」、女仆鲸鱼娘二次设计「ZipZipPipe」（详见 `NOTICE`，勿删）
- **许可**：CC BY-NC-SA 4.0（非商业）；个人开源作品，非 DeepSeek / OpenAI 官方项目

## 路线图

- **V1（当前）**：鱼标 + 桌宠气泡会话 + 读工作区 + 固定记忆 + 俏皮陪聊 + 轻量冒泡 + 离线兜底回复；表情包暂停
- **V2**：对接 dsh-deep-whale 皮肤、`llm` 人设补全精细调优、情绪温度曲线、任意会话点名

## 桌宠模式（v0.1.0）

桌宠模式默认开启，使用固定视口层锚定 dsh 的主 composer `[data-composer-card]`。左下角大肥鱼 dock 自带输入框（Enter 发送、Shift+Enter 换行），右侧箭头为设置入口，可切换“显示桌宠”。她支持拖拽、坠落和戳击；双击保留为安静交互，不再弹出固定台词；自动趴睡、变暗、旋转躺倒、散步、吐泡泡和自动待机台词均已关闭。

桌宠是会话载体：聊天面板已取消，用户可使用 dsh 外层主输入框或左下角 dock 输入框，记忆、点子和护航等现有能力的可见输出统一进入气泡。主输入框发给工作 AI 的普通聊天消息同样会触发桌宠气泡；这是刻意保留的联动，不应在后续重构中移除。气泡上半为偏灰的伪思维展示，下半是正常正文；伪思维优先由独立人设提示让 LLM 生成短台词，失败时本地回退，绝不展示 LLM 的真实思考过程。表情功能暂时暂停。右侧箭头进入设置，可切换“显示桌宠”，以及选择桌宠位于主输入框上方或左侧栏 dock 输入框上方；选择立即生效并持久化到 `~/.dsh/dafeiyu-deskpet-settings.json`。

桌宠当前使用用户提供的绿幕视频。`scripts/deskpet_chroma.py` 抠像后输出透明 WebP，`scripts/build_sheets.py` 将帧打成二维网格帧图；客户端用 canvas 逐帧绘制 `jump`、`look`、`ice_dance`、`sleep`、`walk`、`wave`，不依赖动画 WebP 或旧 atlas。`stretch/lanyao/feed` 已删除并由资源路由拒绝。资产和 `life.json` 位于 `~/.dsh/dsh-dafeiyu/deskpet-assets/`，由 `/api/dsh-dafeiyu/deskpet/assets/<文件名>` 服务。页面若仍显示旧动作，先按 `docs/05-DeskPet-Import-Workflow.md` 的旧实例排查流程重启 dsh。

> 📌 **桌宠当前进度、实现方式、下一步与红线，见 `docs/04-DeskPet.md`**（新会话一读即懂现在在干嘛）。总入口：`docs/00-READ-FIRST.md`。

开发校验：

```bash
npm run check:deskpet
npm run typecheck
npm run build:client
```
