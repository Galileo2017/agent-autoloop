// One run's timeline, read from the same raw facts the command line's `why` uses: what set it off, who took it, what it
// asked and what came of it. A lighter telling than the CLI's, for the plate.
import type { Fact } from "./hub";

const pad = (part: number) => String(part).padStart(2, "0");
const time = (value: string | number) => {
  const date = new Date(value);
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};
const eventText = (event: any) => `来源 ${event.source} · 类型 ${event.type} · 对象 ${event.subject || "无"}`;

export function timelineOf(id: number, facts: Fact[]): string[] {
  // Which events are this run's own triggers, which agent took it, and what the rules said at the time.
  const triggers = new Set<number>();
  for (const { changes } of facts)
    for (const { table, row } of changes)
      if (table === "run_events" && row && row.run_id === id) triggers.add(row.event_id);
  const rulesAt = new Map<number, any>();
  for (const fact of facts)
    if (fact.type === "rules") {
      const config = fact.changes.find(({ table, key }) => table === "config" && key === "rules");
      if (config?.row) rulesAt.set(fact.seq, config.row.value);
    }

  const lines: string[] = [];
  const add = (at: string | number, text: string) => lines.push(`${time(at)}  ${text}`);
  const before = new Map<string, any>();
  const started = new Set<string>();

  for (const fact of facts) {
    if (fact.type === "rules" && rulesAt.has(fact.seq)) add(fact.at, `规则版本 #${fact.seq}`);
    const receipt =
      fact.type === "finish" && fact.changes.some(({ table, key }) => table === "runs" && key === String(id));
    for (const { table, key, row } of fact.changes) {
      const was = before.get(`${table}:${key}`);
      if (table === "events" && row && !was) {
        const kind = triggers.has(row.id) ? "触发事件" : "发出事件";
        if (triggers.has(row.id) || receipt) add(row.received_at, `${kind}：${eventText(row)}`);
      }
      if (table === "runs" && row?.id === id) {
        if (row.claimed_at && row.claimed_at !== was?.claimed_at) {
          const agent = rulesAt.get(row.rules_version)?.agents?.[row.agent];
          add(row.claimed_at, agent ? `${agent.worker} 领取（${agent.name}）` : "领取");
        }
        if (fact.type === "started" && row.issued && !started.has(String(row.issued))) {
          started.add(String(row.issued));
          add(fact.at, "开始处理");
        }
        if (row.link && row.link !== was?.link) add(fact.at, `会话：${row.link}`);
        if (row.finished_at && row.finished_at !== was?.finished_at) {
          add(row.finished_at, `结束：${row.summary || (row.state === "cancelled" ? "已停止" : "没有填写结论")}`);
        }
        if (receipt && row.state === "queued" && row.attempts !== was?.attempts) {
          add(fact.at, `本次未完成：${row.error}；重试时间 ${time(row.not_before)}`);
        }
      }
      if (table === "cards" && row) {
        const own = row.run_id === id;
        if (!was && own) add(row.created_at, `${row.kind === "ask" ? "提问" : "通知"}：${row.title}`);
        if (row.decided_at && row.decided_at !== was?.decided_at && (own || triggers.has(row.answer_event))) {
          const options: string[] = row.options ? JSON.parse(row.options) : [];
          add(row.decided_at, `${row.by || "本人"}回答「${row.title}」：${row.answer ?? options[row.choice]}`);
        }
        if (row.state === "closed" && was?.state !== "closed" && own && !row.fyi) {
          add(row.closed_at, `结案：${row.title}；${row.result ?? ""}`);
        }
      }
      if (receipt && table === "timers") {
        add(fact.at, row ? `安排复查：${row.about}；时间 ${time(row.at)}` : `取消复查：${was?.key ?? key}`);
      }
      if (row) before.set(`${table}:${key}`, row);
      else before.delete(`${table}:${key}`);
    }
  }
  return lines;
}
