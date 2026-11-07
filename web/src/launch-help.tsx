// A scripted chat that walks the person through the launch form: what should the agent do, which
// type fits, a generated number they can change, and a preview before the line goes up. No LLM —
// the hub has no chat door, and guiding an input needs questions, not intelligence.
import { defineComponent, onMounted, ref } from "vue";

export const autoSubject = () => {
  const p = (n: number) => String(n).padStart(2, "0");
  const d = new Date();
  return `#${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
};

const SUBJECT_OK = /^[A-Za-z0-9#._:@/-]*$/;
const TYPE_OK = /^[a-z][a-z0-9._-]*$/;

type Msg = { who: "bot" | "me"; text: string };
type Step = "task" | "type" | "subject" | "preview" | "done";

export const LaunchHelp = defineComponent({
  props: {
    options: { type: Array as () => string[], required: true },
    onLaunch: {
      type: Function as unknown as () => (type: string, subject: string, summary: string) => void,
      required: true,
    },
  },
  setup(props) {
    const messages = ref<Msg[]>([]);
    const choices = ref<{ label: string; pick: () => void }[] | null>(null);
    const step = ref<Step>("task");
    const draft = ref({ type: props.options[0] ?? "manual.task", subject: autoSubject(), summary: "" });
    const typed = ref("");

    const say = (who: "bot" | "me", text: string) => messages.value.push({ who, text });
    const offer = (list: { label: string; pick: () => void }[] | null) => (choices.value = list);
    const askType = () => {
      step.value = "type";
      say("bot", `类型我先用「${draft.value.type}」。要换就点一个，或自己在下面输（小写字母开头，能用 . _ -）。`);
      offer(
        props.options
          .filter((one) => one !== draft.value.type)
          .map((one) => ({ label: one, pick: () => pickType(one) }))
          .concat([{ label: "就用 " + draft.value.type, pick: () => pickType(draft.value.type) }]),
      );
    };
    const askSubject = () => {
      step.value = "subject";
      say("bot", `对象编号生成了「${draft.value.subject}」，就它还是自己改一个？`);
      offer([
        { label: "就用 " + draft.value.subject, pick: () => pickSubject(draft.value.subject) },
        {
          label: "自己改",
          pick: () => {
            offer(null);
            say("bot", "输入新的编号（字母数字和 # . _ : / @ -，也可以留空不填）：");
          },
        },
      ]);
    };
    const pickType = (one: string) => {
      if (!TYPE_OK.test(one)) {
        say("me", one);
        say("bot", "这个类型不合格：小写字母开头，只能字母、数字和 . _ -。再输一个。");
        return;
      }
      draft.value.type = one;
      say("me", one);
      askSubject();
    };
    const pickSubject = (one: string) => {
      if (one && !SUBJECT_OK.test(one)) {
        say("me", one);
        say("bot", "编号只能是字母、数字和 # . _ : / @ -。再输一个，或留空。");
        return;
      }
      draft.value.subject = one;
      if (one) say("me", one);
      step.value = "preview";
      offer(null);
      say(
        "bot",
        `就绪——类型 ${draft.value.type}${draft.value.subject ? `，对象 ${draft.value.subject}` : ""}：\n${draft.value.summary}`,
      );
      offer([
        { label: "发射", pick: () => fire() },
        { label: "重来", pick: () => restart() },
      ]);
    };
    const fire = () => {
      offer(null);
      step.value = "done";
      props.onLaunch(draft.value.type, draft.value.subject, draft.value.summary);
      say("bot", "线放出去了。落没落轨、交给谁，看下面那行提示和谱轨。");
      offer([{ label: "再发一件", pick: () => restart() }]);
    };
    const restart = () => {
      draft.value = { type: props.options[0] ?? "manual.task", subject: autoSubject(), summary: "" };
      messages.value = [];
      step.value = "task";
      say("bot", "想让 Agent 做什么？一句话说清，直接输入发送。");
      offer(null);
    };

    onMounted(() => {
      say("bot", "想让 Agent 做什么？一句话说清，直接输入发送。");
    });

    const submit = () => {
      const text = typed.value.trim();
      if (!text) return;
      typed.value = "";
      if (step.value === "task") {
        draft.value.summary = text;
        say("me", text);
        askType();
      } else if (step.value === "type") {
        pickType(text);
      } else if (step.value === "subject") {
        pickSubject(text === "" ? "" : text);
      } else if (step.value === "preview") {
        draft.value.summary = text;
        say("me", text);
        pickSubject(draft.value.subject);
      }
    };

    return () => (
      <div class="plate chat-plate" style={{ "--pointer": "50%", "--pointer-color": "var(--hair)" } as any}>
        <div class="head">
          <span class="num">怎么填？一步步来</span>
          <span class="sub">照着问，答完就能发射</span>
        </div>
        <div class="chat">
          {messages.value.map((one, index) => (
            <div key={index} class={["line", one.who]}>
              {one.text}
            </div>
          ))}
        </div>
        {choices.value && (
          <div class="row">
            {choices.value.map((one) => (
              <button class="act quiet" onClick={one.pick}>
                {one.label}
              </button>
            ))}
          </div>
        )}
        {step.value !== "done" && (
          <div class="other">
            <input
              class="word"
              placeholder={
                step.value === "task"
                  ? "想让 Agent 做什么？"
                  : step.value === "subject"
                    ? "新编号（可留空）"
                    : "输入内容"
              }
              aria-label="指导输入"
              value={typed.value}
              onInput={(event) => (typed.value = (event.target as HTMLInputElement).value)}
              onKeydown={(event) => event.key === "Enter" && submit()}
            />
            <button class="act" onClick={submit}>
              发送
            </button>
          </div>
        )}
      </div>
    );
  },
});
