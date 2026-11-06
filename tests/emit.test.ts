// The owner's own door for starting work by hand. Failure cases: a request without a key, with another kind's key, or a
// made-up one gets in; a body without an id or type, with a subject or type of wrong characters, an unknown field or a
// hops count is refused; the event is recorded under the reserved source "owner" and routed like any event; the same id
// twice is one event; an event no rule takes is still recorded, unrouted.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { setup } from "./helpers.ts";

const home = setup("emit");
const rules = JSON.parse(readFileSync(join(import.meta.dirname, "rules.fixture.json"), "utf8"));
rules.sources.owner = { name: "本人" };
rules.rules.push({
  name: "快评",
  when: { source: "owner", types: ["manual.*"] },
  to: "a1",
  cwd: "~/x",
  prompt: "看一眼。",
});
const rulesFile = join(home, "emit-rules.json");
writeFileSync(rulesFile, JSON.stringify(rules));
process.env.AGENT_AUTOLOOP_RULES = rulesFile;

const { serve } = await import("../host/http.ts");
const { addKey, one } = await import("../host/runtime.ts");

const keys = {
  owner: addKey("owner", "owner"),
  app: addKey("source", "app"),
  w1: addKey("worker", "w1"),
  chat: addKey("channel", "chat"),
};
const server = serve(0, "127.0.0.1");
let base = "";
before(async () => {
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => {
  server.closeAllConnections();
  server.close();
});

async function call(path: string, { key, body, raw }: { key?: string; body?: unknown; raw?: string } = {}) {
  const response = await fetch(base + path, {
    method: "POST",
    headers: { ...(key && { authorization: `Bearer ${key}` }), "content-type": "application/json" },
    body: raw ?? JSON.stringify(body),
  });
  const text = await response.text();
  try {
    return { status: response.status, json: JSON.parse(text) };
  } catch {
    return { status: response.status, json: null };
  }
}

let firstEvent = 0;

test("the owner starts work as the reserved source owner, routed like any event", async () => {
  const sent = await call("/v1/emit", {
    key: keys.owner,
    body: { id: "m:1", type: "manual.tick", subject: "#7", summary: "自己点的" },
  });
  assert.equal(sent.status, 200);
  assert.deepEqual(sent.json.duplicate, false);
  assert.deepEqual(sent.json.routed, ["快评"]);
  firstEvent = sent.json.event;
  const row = one<{ source: string }>("SELECT source FROM events WHERE key = ?", ["m:1"])!;
  assert.equal(row.source, "owner", "the event carries no one else's name");
});

test("only the owner's key starts work", async () => {
  const body = { id: "a", type: "manual.x" };
  assert.equal((await call("/v1/emit", { body })).status, 401);
  assert.equal((await call("/v1/emit", { key: "made-up", body })).status, 401);
  for (const key of [keys.app, keys.w1, keys.chat]) {
    assert.equal((await call("/v1/emit", { key, body })).status, 401, key);
  }
});

test("the same id twice is one event", async () => {
  const again = await call("/v1/emit", {
    key: keys.owner,
    body: { id: "m:1", type: "manual.tick", subject: "#7" },
  });
  assert.deepEqual([again.json.duplicate, again.json.event], [true, firstEvent]);
});

test("a body that isn't a plain event is refused", async () => {
  const emit = (body: unknown) =>
    call("/v1/emit", { key: keys.owner, raw: typeof body === "string" ? body : JSON.stringify(body) });
  assert.equal((await emit("{not json")).status, 400);
  assert.equal((await emit({ type: "manual.x" })).status, 400, "no id");
  assert.equal((await emit({ id: "a" })).status, 400, "no type");
  assert.equal((await emit({ id: "a", type: "Bad Type" })).status, 400);
  assert.equal(
    (await emit({ id: "a", type: "manual.x", subject: "一句中文" })).status,
    400,
    "subject stays an identifier",
  );
  assert.equal((await emit({ id: "a", type: "manual.x", hops: 3 })).status, 400, "emit carries no hops");
  assert.equal((await emit({ id: "a", type: "manual.x", extra: 1 })).status, 400, "no unknown fields");
});

test("an event no rule takes is still recorded, unrouted", async () => {
  const quiet = await call("/v1/emit", { key: keys.owner, body: { id: "m:2", type: "quiet.kind" } });
  assert.deepEqual(quiet.json.routed, []);
  assert.equal(one<{ routed: string }>("SELECT routed FROM events WHERE key = ?", ["m:2"])!.routed, "[]");
});
