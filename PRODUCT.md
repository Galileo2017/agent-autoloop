# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

主要用户：在本机跑命令行 Agent（Claude Code、Codex、ACP、DeepSeek Harness 等）的个人开发者。单机、单人使用；拍板走本人的通知通道（飞书私聊、桌面通知），没有多租户概念。

成功标准（2026-11-06 确认）：**自己用得顺手** —— 自己的日常任务真的交给它跑，不被打扰就是赢。开源社区用户是加分项，不是门槛。

## Product Purpose

让命令行 Agent 在后台自己接活、自己跟进到底。事件（定时任务、GitHub Issue、业务告警）按规则派给本机 Agent；Agent 干完一轮进程就退出；碰到删数据、重启、花钱、对外发消息这类拿不准的事，发一张卡片请人拍板——等待期间零进程、零 Token，回答后接上原会话把活干完。

## Positioning

极轻量（内核约 1800 行、零运行时依赖）、一台电脑一条命令就能跑的自动化中台。四个机制组合是同类产品没有的：挂起零消耗（等拍板时进程退出，状态在库里）、事件溯源（一切状态来自只追加日志，强杀不丢已确认事实）、指令数据分离（外部文字只作资料，不进提示词、不影响路由和权限）、跳数熔断（Agent 交回事件再派发的层数像 TTL，超 8 层只记录不派活）。

## Operating Context

- 环境：macOS / Linux；Windows 版进行中（issue #17，README 说 2026-11-07/08 周末发布）。依赖 Node 24、Git、curl 和本机已登录好的 CLI Agent，不需要 GitHub 账号。
- 入口：CLI（`agent-autoloop` 各命令）、`~/.agent-autoloop/rules.json` 规则文件、卡片链接页（手机/电脑浏览器打开）、MCP、`/v1/stream` HTTP 接口。
- 通道：桌面通知（默认开启）、飞书、钉钉/企微/Slack/Discord webhook。`hub.publicUrl` 必须配成本人设备能打开的地址——卡片页的主要打开场景是手机浏览器。
- 部署形态：不买云服务器、不开公网端口；插件主动连进来，凭据留在各自插件里。

## Capabilities and Constraints

能力：定时与外部事件来源（GitHub/GitLab webhook、HTTP、轮询脚本）；内置 Claude Code、Codex、ACP、DSH、通用 command 五种 Agent 接入；ask / notice / resolve / later / events 五种回执动作；交付流水线（`deliver` 标签 → 审查、等 CI、合并、等发布、健康核实）；`why` 全程溯源；用量统计。

硬约束（AGENTS.md，动任何东西前必读）：

- 内核只收、只分、只派、只记；零运行时依赖（Node 24 自带够用）；`tests/purity.test.ts` 守着这条。
- 协议是产品；文字是资料，规则才是指令；一轮不等人（不加任何让 Agent 阻塞等待人的机制）。
- 面向用户的字用中文大白话；代码注释用英文。术语沿用仓库口径：中台、内核、接单程序、通道、卡片、轮、回执、事实日志。
- 测试写在实现之前；`npm test`、`npm run typecheck`、`npm run format:check` 必须过。

**已确认的方向变更（2026-11-06 用户拍板）：Web 界面进本仓库，修订「没有界面」约定。** 范围：卡片页交互之外，还要任务启动、任务状态显示、聊天式任务交互、总览页/大屏；命令行里有的功能都要能在 Web 页面完成。这与 AGENTS.md 现行的「没有界面……总览页不进这个仓库」「唯一的页面是卡片链接」冲突——动工时需同步修订 AGENTS.md、docs/protocol.md、架构图和相关行为测试，不能只加代码不改约定。

技术栈（2026-11-06 确认）：Web 界面引入前端框架，加构建步骤和 devDependencies，修订「零运行时依赖」约定的适用范围（仍只约束内核与交付进程）；具体框架选型动工时定。进门方式（2026-11-06 确认）：统一密钥登录——不分本机远程，都先验一把 owner 密钥。第一版范围（2026-11-06 确认）：总览、任务启动、卡片处理三件先做，其余日常命令下一批补，机器级生命周期命令留 CLI；另含独立全屏监控画面（大屏）。

## Brand Commitments

- 名称：Agent Autoloop（npm `agent-autoloop`，GitHub `KKKKhazix/agent-autoloop`）。版本号只写在 Release tag 上，不进任何文件。
- 语言：中文为主（README、协议、界面文案），配英文版 README 和架构图。
- 声音：不装、直接；防护要有真实事故依据才加。AGENTS.md 的行文本身就是声音基准。

## Evidence on Hand

- 实测过的：Claude Code、Codex、ACP 跑通多轮问答和跨进程会话续接；飞书跑通发送、按钮回调、卡片更新；性能数字（README 表格）来自 Apple M5 Pro 实测，`npm run benchmark` 可复跑。
- 只模拟验证过的（未来工作不得当成已验证、更不得宣称实测）：四种 webhook 通道模板只在本地假 HTTP 服务上验证；GitLab webhook 按官方文档格式测试，没连过真实 GitLab；场景模板的样例数据都是虚构；脚本和回执只用本地 HTTP 与假飞书 CLI 验证，没在真实账号跑过完整业务；其他 CLI Agent 的接入命令整理自各家文档，未逐个跑过。
- 没有用户证言、案例、评测、媒体报道——不许编造。

## Product Principles

1. 内核只收、只分、只派、只记——判断和提交同事务，视图随时从日志重建。
2. 一轮不等人——要问人就结束这一轮，挂起零消耗。
3. 文字是资料，规则才是指令——不可信文本永远进不了提示词、路由和权限。
4. 协议是产品——改约定先核对协议文档和行为测试，说清兼容。
5. 有真实事故依据才加防护——代码只写现在需要的。

## Accessibility & Inclusion

卡片链接页的现状基线（新界面不得倒退）：无 JS 也能用、44px 触控目标、aria-label、light/dark 自适应、严格 CSP、所有外部文字转义。没有其他已确认的无障碍标准要求。
