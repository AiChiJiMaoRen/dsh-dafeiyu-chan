# dsh-dafeiyu · 记忆 + 点子功能 接口契约 v1

> 供两个并行子 agent 实现时共同遵守的唯一契约。宿主版本（已注入）：`@dsh-external/dsh-dafeiyu`。
> 源码在本插件目录，host 用 TypeScript 编译到 `lib/`，client 用 tsdown 打包。

## 总则
- 所有功能都是 host 侧能力，browser 通过 `/api/dsh-dafeiyu/*` HTTP route 调。
- 回复生成走现有 `gateway`（`ctx.llm.stream` + 大肥鱼 persona，失败 fallback rule）。
- **任何文件读/写都必须遵守安全规矩**：点子只读；整理必须用户主动发起+逐条授权。
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
  progressLog: MemoryEntry[] // 新增：最近进展摘要（倒序，最多20条）
}
interface MemoryEntry {
  at: number          // epoch ms
  text: string        // 一条凝练的进展/待办摘要（≤120字）
  kind: 'progress' | 'todo'   // progress=已完成/进展；todo=待办/说到一半
}
```

### 行为
1. `chat()` 每轮结束后：把「用户消息 + 大肥鱼回复」交给 LLM，让它凝练出 **0~2 条** `MemoryEntry`（有值得记的进展/待办才记，没有就空）。凝练 prompt 要带人设风格但输出纯 JSON。
2. `bootstrap()` 开场白生成时：把 `progressLog` 最近 3 条作为上下文给 LLM，让它"记得上次"。
3. `currentFocus` 在每轮 chat 后由 LLM 顺手更新（一句话概括用户当前在做啥）。
4. 保留上限 20 条（超了丢最旧的）。

### 接口
- 复用现有 `POST /api/dsh-dafeiyu/chat`（内部自动做记忆，无需新 route）。
- 可选新增 `GET /api/dsh-dafeiyu/memory` 返回 `{ memory }`（调试用，不强求）。

## B. 点子：读工作区 + 草稿笔记 + 新项目检测 → LLM 生成

### 读取范围（只读，绝不写）
1. **当前工作区**（`ctx.workspaceRegistry.list()[0].path`）：
   - 根目录文件清单（名字+类型，不深读全文，最多看 2 层）
   - `git status`（若 git 仓库）——看有没有未提交/新文件
   - 项目根 README 的标题/前几行（若有）
2. **草稿笔记**（新授权范围）：
   - `~/Downloads` 下「看起来像草稿/笔记」的文件：`.md`/`.txt`/`.json` 且名称含 草稿/draft/note/笔记/idea/想法 等，或近期（7天内）修改的文本文件
   - **只读文件名+大小+最近修改时间+开头 200 字**，不深读全文
   - 上限 10 个文件，避免扫描全盘

### 新项目检测
- 工作区根文件数 ≤ 5 且无 `README/package.json/pyproject.toml/Cargo.toml/go.mod` 等标志文件 → 判定「新/空项目」。

### 行为
- `POST /api/dsh-dafeiyu/ideas` body `{}` → 返回：
```ts
interface IdeasReply {
  isNewProject: boolean
  ideas: string[]   // 1~3 条，每条 ≤80字，具体可做
  note?: string     // 说明信息来源（如「基于你的草稿笔记」）
}
```
- 新项目时：起步建议（建README/骨架/第一个功能）+ 若草稿有相关素材给关联点子。
- 主动问时：基于当前工作区事实给 1~3 条具体建议，不空泛。
- 生成走 `gateway`（LLM persona），失败 fallback 到几条规则文案。

### 安全
- 点子 route **只读**（读文件清单/头部），绝不写、绝不删。
- 用户明确要求整理时才走整理流程（本契约不含整理实现，留 V1.1）。

## C. 触发 UI（client）
- 对话框输入框上方/附近加两个轻入口：
  - 「💡 给我个点子」按钮 → 调 `/ideas`，把结果作为 whale 气泡展示。
  - 新项目检测由 client 在打开时调一次 `/ideas`（或 bootstrap 里带 `isNewProject`），若新项目则自动在开场后追加一条「诶，这像是个新地盘诶~ 要我给个起步点子吗？」——**点「要」才调 /ideas**（不主动塞点子）。
- 全部沿用现有 dsh 风 DOM 气泡，UI 美化留待 GPT。

## 构建
- host：`node <dsh-harness>/node_modules/typescript/lib/tsc.js -p tsconfig.host.json`
- client：`node <tsdown-global>/dist/run.mjs`（全局 npm 包 tsdown 的入口）
- 注入：`dev_reload_package @dsh-external/dsh-dafeiyu`
