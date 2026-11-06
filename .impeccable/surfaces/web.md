---
version: 1
slug: "web"
primary_target: "web"
related_targets: []
---

# Surface Brief: web/ — 本人客户端（总览·发射·拍板·大屏）

## Scope & mode

`web/` 内 Vue 3 单页应用，由中台在 `/` 与 `/assets/*` 提供，是「本人」的 HTTP 客户端（`/v1/state`、`/v1/stream`、`/v1/runs/:id/why`、answer/resolve/cancel/emit）。**Operate** 模式。路由：`#/` 总览（含发射与拍板）、`#/board` 独立全屏大屏。登录为统一密钥（owner 密钥，localStorage 持有，Bearer 调用）。

## Audience, job, proof

- 受众：开发者本人，双端并重（电脑重活、手机拇指拍板）；抵达时只问一句：什么在跑？有没有事等我？
- 主任务：① 读轨定况 ② 钠黄线在等时两步拍板 ③ 无事时发射新任务（`POST /v1/emit`，来源 `owner`）。
- 成功证明：全程无装饰性内容；每个像素都在报状态；拍板后虚线在原地接成实线（回执续跑可见）。

## Direction & memorable moment

**发射线谱栏（Emission-line Rail）**，concept-seed 种子 `e304148c`，用户在决策页锁定（challenger-rail）。暗炭程序化条带连续谱底，骨白单字号文字；每轮一根发丝线，**状态写在线形**（实=在跑 / 半高=已成过去 / 虚=待你处理 / 划断=停止），**身份写在波长**（每条规则一个稳定波长）；**加倍钠黄双线=唯一等你拍板的事**。点线绽放图版（时间线/花费/回执/卡片），拍板即「接线」。大屏 `#/board`：同世界零交互、远读加粗、钠黄呼吸。

## Constraints

- 内核不感知界面：界面是 host 服务的静态资产 + 本人客户端；`kernel/` 无 script/cookie；CSP `default-src 'none'` + `script-src 'self'`；无外部字体/请求（系统字栈 + 等宽数字）。
- 中文大白话全部标签；术语沿用仓库口径（轮、卡片、回执、接单程序）。
- 动画只有两种：落位弹簧一次、大屏钠黄呼吸。触控目标 ≥44px；深色唯一模式（大屏挂暗处远读、手机碎片时间瞟一眼的物理场景强制）。
- 反目标：花哨压信息、糙、通用 SaaS 后台（侧边栏/卡片网格/图表库）。

## Unresolved

- 无。框架（Vue 3 + Vite + TSX）与登录方式已确认；构建产物 `web/dist` 入库提交（安装脚本无构建步骤）。
