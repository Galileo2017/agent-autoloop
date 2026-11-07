// The board: the same rail at full commitment, read from across the room. Nothing here takes a click; the sodium doublet
// breathes, everything else holds still. It is the overview's answer to "put it on the second screen".
import { computed, defineComponent } from "vue";
import { connected, state } from "./session";
import { marksOf } from "./rail";
import { openMarkPlate } from "./overview";

const marks = computed(() => (state.value ? marksOf(state.value) : []));
const money = (value: number) => `$${value.toFixed(2)}`;

export const Board = defineComponent({
  setup() {
    return () => {
      const all = state.value;
      const waiting = all?.cards.filter((card) => card.kind === "ask").length ?? 0;
      return (
        <div class={["shell", "board", !connected.value && "lost"]}>
          <header class="bar">
            <span class="name">Agent Autoloop</span>
            <div class="facts">
              <span>{connected.value ? "在线" : "连不上，重试中"}</span>
              <span>
                等你 <b>{waiting}</b>
              </span>
              {all && (
                <span>
                  今日 <b>{money(all.spending.today.cost)}</b> · {all.totals.doneToday} 轮
                </span>
              )}
              <a href="#/" style={{ color: "var(--ink-mid)" }}>
                返回
              </a>
            </div>
          </header>
          {!connected.value && <div class="banner">中台连不上了，正在重试。</div>}
          <main class="stage">
            {all && marks.value.length === 0 && (
              <div class="empty-hint">安静。什么在跑，什么在等，都会出现在这根轨上。</div>
            )}
            {/* Nothing burning: say so at reading distance instead of showing a bare void. */}
            {all && marks.value.length > 0 && !marks.value.some((mark) => mark.form !== "stub") && (
              <div class="board-quiet">今天 {all.totals.doneToday} 轮全部完成 · 等你 0</div>
            )}
            <div class="rail-wrap">
              <div class="rail">
                {marks.value.map((mark) => (
                  <button
                    key={mark.key}
                    class="rail-line"
                    data-key={mark.key}
                    title={`${mark.title} · 点开看详情`}
                    aria-label={`${mark.rule} ${mark.label}`}
                    onClick={() => openMarkPlate(mark.key)}
                  >
                    <span class="stem-slot">
                      <span class={["stem", mark.form]} style={{ "--wl": mark.wl } as any} />
                      {mark.form === "waiting" && <span class="stem waiting" aria-hidden="true" />}
                    </span>
                    <span class="rail-tag">{mark.label}</span>
                  </button>
                ))}
              </div>
              <div class="baseline" />
            </div>
          </main>
          <footer class="legend">
            <div class="key">
              {[...new Map(marks.value.filter((mark) => mark.rule).map((mark) => [mark.rule, mark.wl])).entries()].map(
                ([name, wl]) => (
                  <span class="tick">
                    <span class="swatch" style={{ background: wl }} />
                    {name}
                  </span>
                ),
              )}
            </div>
            {all && (
              <>
                {all.unrouted.length > 0 && <span>{all.unrouted.length} 条事件没被接走</span>}
                <span class="gap">|</span>
                {[...new Set(all.agents.map((agent) => agent.worker))].map((worker) => (
                  <span class="tick">
                    <span class={["dot", all.agents.find((agent) => agent.worker === worker)!.online ? "on" : "off"]} />
                    {worker}
                  </span>
                ))}
                <span class="gap">|</span>
                <span>
                  7 天 <b>{money(all.spending.week.cost)}</b>
                </span>
              </>
            )}
          </footer>
        </div>
      );
    };
  },
});
