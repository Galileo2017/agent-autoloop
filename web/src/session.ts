// The one session the app runs: state in hand, the log streaming beside it, and a refresh whenever a fact lands.
import { ref } from "vue";
import { connected, fetchState, key, openStream, type State } from "./hub";

export { connected };

export const state = ref<State | null>(null);
export const loadError = ref("");

let stopStream: (() => void) | null = null;
let pending = false;
let timer: ReturnType<typeof setTimeout> | null = null;

/** Facts arrive faster than they matter: one refetch covers a burst. */
function scheduleRefresh() {
  if (pending) return;
  pending = true;
  timer = setTimeout(async () => {
    pending = false;
    await refresh();
  }, 350);
}

export async function refresh() {
  if (!key.value) return;
  try {
    state.value = await fetchState();
    loadError.value = "";
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : String(error);
    if (!connected.value) scheduleRefresh();
  }
}

export function startSession() {
  stopSession();
  let cursor = state.value?.seq ?? 0;
  const wire = () => {
    stopStream = openStream(
      cursor,
      (fact) => {
        cursor = Math.max(cursor, fact.seq);
        scheduleRefresh();
      },
      (up) => {
        connected.value = up;
        if (up) void refresh();
      },
    );
  };
  void refresh().then(wire);
}

export function stopSession() {
  stopStream?.();
  stopStream = null;
  if (timer) clearTimeout(timer);
  timer = null;
  pending = false;
  state.value = null;
  loadError.value = "";
  connected.value = true;
}
