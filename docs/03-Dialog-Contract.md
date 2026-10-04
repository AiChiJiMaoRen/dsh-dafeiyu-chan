# Bubble Chat 线 · 记忆 + 点子 + 气泡会话契约 v2（host/client）

> 供并行子 agent / 接手者共同遵守的唯一契约。宿主版本（已注入）：`@dsh-external/dsh-dafeiyu-chan`。
> host 用 TypeScript 编译到 `lib/`，client 用 tsdown 打包。
> 相关：气泡会话状态见 `01-Dialog.md`，桌宠气泡视觉见 `04-DeskPet.md`。

## 总则

- 所有功能都是 host 侧能力，browser 通过 `/api/dsh-dafeiyu/*` HTTP route 调。
- 回复生成走现有 `gateway`（`ctx.llm.stream` + 大肥鱼 persona，失败 fallback rule）。
- **任何文件读/写都遵守安全规矩**：点子只读；整理必须用户主动发起+逐条授权。
- 所有新 route 走 loopback 信任围栏（参照 `src/host/routes.ts` 现有写法）。

## A. 记忆：对话/工作进展摘要（第1层）

### 数据
`~/.dsh/whale-memory.json`（现有文件）扩展：
```ts
interface WhaleMemory {
  nickname: string          // 固定 '杂鱼'
  mood: 'blah' | 'okay' | 'up'
  lastSeenAt: number
  interactionCount: number
  currentFocus?: string     // 当前在做的事（一句话）
  progressLog: MemoryEntry[] // 最近进展摘要（倒序，最多20条）
}
interface MemoryEntry {
  at: number          // epoch ms
  text: string        // 一条凝练摘要（≤120字）
  kind: 'progress' | 'todo'
}
```

### 行为
1. `chat()` 每轮结束后：把「用户消息+大肥鱼回复」交给 LLM 凝练出 **0~2 条** `MemoryEntry`（值得记才记）。prompt 带人设但输出纯 JSON。
2. `bootstrap()` 开场白：把 `progressLog` 最近 3 条作上下文给 LLM，「记得上次」。
3. `currentFocus` 每轮由 LLM 顺手更新。
4. 上限 20 条（超了丢最旧）。

### 接口
- 复用现有 `POST /api/dsh-dafeiyu/chat`（内部自动记忆，无需新 route）。
- 可选新增 `GET /api/dsh-dafeiyu/memory` 返回 `{memory}`（调试用）。

## B. 点子：读工作区 + 草稿笔记 + 新项目检测 → LLM 生成

### 读取范围（只读，绝不写）
1. **当前工作区**（`ctx.workspaceRegistry.list()[0].path`）：根目录文件清单（名字+类型，最多 2 层）、`git status`、根 README 标题/前几行。
2. **草稿笔记**：`~/Downloads` 下「像草稿/笔记」的文件（`.md/.txt/.json` 且名含 草稿/draft/note/笔记/idea/想法，或 7 天内改的文本）；**只读文件名+大小+改时间+开头 200 字**；上限 10 个。

### 新项目检测
- 工作区根文件数 ≤5 且无 `README/package.json/pyproject.toml/Cargo.toml/go.mod` 等 → 判定新/空项目。

### 行为
- `POST /api/dsh-dafeiyu/ideas` body `{}` → 返回：
```ts
interface IdeasReply {
  isNewProject: boolean
  ideas: string[]   // 1~3 条，每条 ≤80字，具体可做
  note?: string     // 信息来源（如「基于你的草稿笔记」）
}
```
- 新项目：起步建议（README/骨架/第一个功能）+ 草稿相关素材关联点子。
- 主动问：基于当前工作区给 1~3 条具体建议，不空泛。
- 生成走 `gateway`（LLM persona），失败 fallback 规则文案。

### 安全
- 点子 route **只读**，绝不写/删。
- 整理流程留 V1.1（用户明确要求才走）。

## C. 触发与气泡会话 UI（client）

- 聊天面板、面板输入框、记忆卡片和面板内“给点子”按钮不再是目标 UI；所有已有 route 的可见输出都迁移到桌宠气泡。
- **输入来源（已拍板）**：用户继续使用 dsh 外层主输入框或左侧栏 dock 输入框，不创建聊天面板输入框。client 需要从输入框与其发送/回复生命周期发出 `typing-start`、`typing-stop`、`message-sent`、`reply-start`、`reply-done` / `reply-error` 事件；桌宠气泡消费这些事件。桌宠锚点在设置中二选一，默认主输入框上方。
- **工作 AI 联动（正式行为）**：主输入框提交给 dsh 工作 AI 的普通消息也进入桌宠气泡链路。工作 AI 原有发送与回复不得被桌宠拦截；桌宠只旁路监听并追加自己的伪思维/正文展示。该联动当前表现虽像“意外触发”，但按产品约定保留，不得作为 bug 删除。
- 气泡由两段组成：上方 `thought`（伪思维展示）和下方 `answer`（正常正文）。它们必须作为结构化 DOM 分别渲染，不能只拼成一整段字符串，以便独立设置灰色思维字和正常正文。
- `thought` 格式：`已思考（用时 N 秒）` + 一条简短角色化心里活动。N 是前端测得的请求展示时长，向上取整；优先由 host 使用独立的伪思维人设提示让 LLM 生成，再由长度/禁词规则校验；失败时从 `copy.json` 的受控人设池按用户可见语境分类并做短窗口去重。
- 角色台词可以明显吐槽，例如 `很难想象用户是人类`、`文件夹里的 dsh 是大烧货吗`；明确成人语境才可使用 `哇哦，用户切到了劲爆的 R18 模式`，不能无条件插入。
- 台词句法优先采用旁观式第三人称，明确写出“用户 / 这位杂鱼 / 这个人类”，例如 `用户又在这自我麻痹呢，真是杂鱼`；不要把每条都写成“本鱼正在思考”。
- `thought` **不是模型真实思考过程**：不得索取、回传、记录或渲染 LLM chain-of-thought、推理 token、工具调用细节、隐藏消息或系统提示。伪思维生成器只拿到用户可见输入和已完成正文，并且只允许返回一条虚构角色台词。
- `answer` 是对用户的正常回复，内容、字色和排版优先级均高于 `thought`。思维区偏灰、弱对比，正文正常可读；两者清楚分隔。
- 表情包功能暂停：client 不调用 sticker 路由，不预加载图集；host 可暂留兼容实现，后续再决定是否删除。
- 新项目检测的自动提示、点子结果和新建会话护航也遵循同一气泡格式。自由聊天同样从 dsh 外层主输入框进入，不另做输入入口；主输入框与工作 AI 的普通聊天也保留桌宠旁路气泡。

## 构建
- host：`node <dsh-harness>/node_modules/typescript/lib/tsc.js -p tsconfig.host.json`
- client：`node <tsdown-global>/dist/run.mjs`（全局 npm tsdown 入口）
- 注入：`dev_reload_package @dsh-external/dsh-dafeiyu-chan`
