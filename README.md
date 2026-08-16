# 🐋 dsh-dafeiyu · 大肥鱼（鲸鱼娘）

DeepSeek Harness 里的情绪价值陪伴看板娘：左侧栏最底部一条「大肥鱼」鱼标，点击展开一个 **dsh 风的聊天对话框**，以大肥鱼（鲸鱼娘）人设陪你唠嗑——俏皮、有骨头、护短，固定称呼你为「杂鱼」。

社区既定名的二创形象；本项目为「鲸鱼娘·大肥鱼」的开源陪伴插件（非官方项目）。

## 定位

- **形态**：左侧栏底部的鱼标 + 悬浮聊天对话框（非桌宠、非浮窗、非独立窗口），UI 贴近 dsh 自身风格
- **核心**：情绪价值陪伴——俏皮有脾气，真 emo 认真陪，不灌鸡汤
- **附加**：能接住当前工作会话的上下文做简单的代码 / 文件 / 整理类小活
- **记忆**：`~/.dsh/whale-memory.json` 记住你的心情与关注点（`固定称呼`、不跟项目绑）

## 人设一句话

「九分娇一分傲」的日常系小看板娘：自称「本鱼」，叫你「杂鱼」，甜软黏人、容易害羞，被逗才轻轻嘴硬一下，被哄就立刻软——像真人在聊天框里跟熟人回话，不用科幻辞藻。

> 前端 UI 交给视觉模型重构，见 `docs/UI-HANDOFF.md`（给 GPT 的完整交接说明）。

## 功能

| 能力 | 说明 |
|---|---|
| 左侧栏鱼标 | 左侧栏最底层「大肥鱼」鱼标，self-heal DOM 注入 |
| 聊天对话框 | dsh 风气泡 + 输入条 + 记忆卡片（UI 由视觉模型重构，见 UI-HANDOFF） |
| 回复通道 | `ctx.llm` 人设补全（`opencode-go` / `deepseek-v4-flash`），rule 兜底 |
| 记忆 | 心情 + 关注点 + 进展摘要（progressLog）存 `~/.dsh/whale-memory.json`；开场白记得上次 |
| 给点子 | 💡 读工作区 + Downloads 草稿 + 新项目检测 → LLM 给 1~3 条建议（只读） |
| 新建会话护航 | 点「新建会话」→ 有旧会话则 LLM 建议接续，无则给新任务注意事项（只读） |
| **表情系统** | **每次回复自动带一张表情图**（本地匹配情绪，零 token）；表情库 = `~/.dsh/dafeiyu-stickers/` |
| 轻量冒泡 | 深夜等有限主动提醒（host `/bubble`） |

### 表情库规则（重要）

表情从本地目录读取：**`~/.dsh/dafeiyu-stickers/`**（放图片进去即自动入库，无需重启）。

**命名规则（决定情绪分类）**：
```
开心_xxx.png   难过_xxx.png   生气_xxx.png
无语_xxx.png   加油_xxx.png   通用_xxx.png
```
文件名前缀 = 情绪，后缀随便。没有前缀的图默认归「通用」。每次大肥鱼回复时按对话情绪从库里挑一张（纯本地匹配，零 token）。

**未来**：想开源分享表情库？把表情图放到一个 GitHub 仓库（建议也按上述命名规则组织），用户 clone 到 `~/.dsh/dafeiyu-stickers/` 即可用；也可考虑在插件里加「从 GitHub 拉取表情库」的更新器。

## 安装 / 注入

```bash
# 1. 构建 host（junction 到 harness CLI 类型源 + harness tsc）
node <dsh-harness>/node_modules/typescript/lib/tsc.js -p tsconfig.host.json

# 2. 注入（dev_inject_plugin 本目录）——junction + loader.create，免重启
dev_inject_plugin <本插件目录>
```

`lib/client.js` 为手写无依赖 DOM 模块（无需 tsdown），走 `dsh.client` 注入。

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
├── host/routes.ts     # /api/dsh-dafeiyu/* 路由
└── index.ts           # host apply（webServer/systemPrompt 装配）
lib/client.js          # 手写无依赖 DOM 客户端（鱼标 + 对话框）
```

## 许可与署名

- **署名**：鲸鱼娘形象原作「上善」、女仆鲸鱼娘二次设计「ZipZipPipe」（详见 `NOTICE`，勿删）
- **许可**：CC BY-NC-SA 4.0（非商业）；个人开源作品，非 DeepSeek / OpenAI 官方项目

## 路线图

- **V1（当前）**：鱼标 + 对话框 + 读工作区 + 固定记忆 + 俏皮陪聊 + 轻量冒泡 + 离线兜底回复
- **V2**：对接 dsh-deep-whale 皮肤、`llm` 人设补全精细调优、情绪温度曲线、任意会话点名
