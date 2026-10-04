# 已废弃 · 聊天面板前端 UI 交接

> 2026-08-21 起，用户已取消面板内聊天，所有会话输出迁移到桌宠气泡。本文保留旧面板实现背景，**不得以它作为 UI 改造任务或恢复面板的依据**。新规格见 `01-Dialog.md` §3 与 `04-DeskPet.md`。

## 历史背景（不再实施）

- dsh（运行在 http://127.0.0.1:3080）的陪伴看板娘插件「大肥鱼」。
- 左侧栏底部「大肥鱼」鱼标 → 点击展开聊天对话框（右下角悬浮，当前是临时样式）。
- 以「九分娇一分傲」人设陪聊、记得用户（记忆）、能给建议（点子）、新建会话给护航提示。
- **目标：UI 做到 dsh 原生质感**（当前是内联样式硬写的临时版，需重做成跟 dsh 视觉一致、好看的界面）。

## 旧面板相关文件

| 文件 | 作用 |
|---|---|
| `src/client/index.ts` | **你要重写的唯一文件**（整个前端都在这里，单文件 DOM 实现） |
| `src/core/types.ts` | API 类型契约（读它了解数据结构） |
| `src/host/*.ts` | 宿主逻辑（**别动**，可读来理解数据流） |
| `lib/client.js` | 构建产物（`npm run build:client` 生成，别手改） |

## 旧面板现状（迁移时移除/停用）

`src/client/index.ts` 是**单文件 vanilla DOM 实现**，包含：
1. **侧栏鱼标**：`buildUi()` 的 button，`data-dsh-dafeiyu-entry`，插左侧栏底部（DOM 注入 + MutationObserver 自愈）。
2. **聊天面板**：`position:fixed; right:24px; bottom:24px` 悬浮框：头部（🐋 大肥鱼 + 状态）、气泡区、输入行。
3. **💡 给我个点子按钮**：输入框上方一行，调 `/ideas`。
4. **新建会话监听**：document click 捕获 `button[aria-label="新建会话"]` 或 `button[aria-label^="在“"]`，调 `/new-session-tip`。
5. **槽位占位**：`ctx.slots.register` 注册 `sidebar.footer.action`（仅契约不渲染——**注入器要求必须有，别删**）。

## 可用的 API（host 已就绪，前端直接 fetch）

全部 `POST`，同源，`content-type: application/json`，响应 `{ok,value}`：

| 接口 | 请求 | 响应 value | 用途 |
|---|---|---|---|
| `/api/dsh-dafeiyu/bootstrap` | `{}` | `{ greeting, memory, workspace }` | 打开面板开场白（LLM 现写）+记忆+工作区 |
| `/api/dsh-dafeiyu/chat` | `{text}` | `{ text, memory }` | 发消息返回回复（LLM 人设） |
| `/api/dsh-dafeiyu/ideas` | `{}` | `{ isNewProject, ideas[], note? }` | 工作建议（只读） |
| `/api/dsh-dafeiyu/new-session-tip` | `{}` | `{ hasSessions, text, sessions[] }` | 新建会话护航 |
| `/api/dsh-dafeiyu/bubble` | `{}` | `{text}\|null` | 主动冒泡（限频） |

`memory`：`{ nickname:'杂鱼', mood:'blah'|'okay'|'up', currentFocus?, lastSeenAt, interactionCount, progressLog:[{at,text,kind:'progress'|'todo'}] }`

## 必须遵守（注入器/运行约束）

1. **`exports.inject=['slots']` 和 `ctx.slots.register`（sidebar.footer.action 占位）不能删**——注入器预检要求，删了装不上。
2. **apply 必须防御**：所有 DOM 挂载包 try/catch，失败 `console.warn` 降级，**绝不 throw 拖垮 GUI 启动**。
3. **`window.__ModuleLoader__.load` 包装由 tsdown 自动生成**，你写 `src/client/index.ts` 时别手写 ModuleLoader——正常 export apply/inject 即可。
4. **别引入 React/新依赖——保持零依赖**（当前 tsdown 只 externalize react；用 vanilla DOM 最稳；用 React 需同步改 `tsdown.config.ts` externals，风险自担）。
5. 构建：`node <tsdown-global>\dist\run.mjs`（项目根跑，产物 lib/client.js）。
6. 重载生效：`dev_reload_package @dsh-external/dsh-dafeiyu`（或让用户重启 dsh）。

## 已废弃的设计方向

- **人设**：九分娇一分傲、日常系、不用科幻辞藻。UI 可深海蓝+白点缀，文案要日常自然。
- **对话框**：现在钉在右下角 fixed。用户觉得「鱼标在左、框在右」割裂——可贴着鱼标弹出，或侧栏内嵌，或任何协调方式。
- **dsh 原生质感**：参考 dsh 暗色主题（#0b1622 背景、#1f3a4f 边框），做精致；气泡/输入框/动效打磨。
- **展示记忆**：memory.progressLog / currentFocus 做成「她记得你」小卡片/标签，增强陪伴感。
- **尺寸**：当前 330px 宽、max-height 70vh，可调。

## 迁移时仍须保留的约束

- `src/host/*`、`src/core/*`、`src/index.ts`（宿主，除非加路由）、`lib/`（产物）、`cordis.patch.yml`/`package.json`（除非改依赖）。

## 构建产物校验

改完跑 `node <tsdown-global>\dist\run.mjs`；
成功标志：`lib\client.js` 更新且头仍是 `window.__ModuleLoader__.load({ id: "@dsh-external/dsh-dafeiyu", ... })`。
