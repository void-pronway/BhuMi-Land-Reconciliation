import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
const origin = "http://localhost:3002";
const env = {
  ...process.env,
  DATABASE_PATH: `.data/restart-${Date.now()}`,
  APP_ORIGIN: origin,
  ADMIN_PASSWORD: randomBytes(24).toString("hex"),
  ADMIN_EMAIL: "restart@bhumi.test",
  DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
  RENDER: "",
};
let server;
async function start() {
  server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "--port", "3002"],
    { env, stdio: "ignore" },
  );
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw new Error("Server exited");
    try {
      const r = await fetch(origin + "/api/health");
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("Readiness timed out");
}
async function stop() {
  if (!server || server.exitCode !== null) return;
  const ended = new Promise((r) => server.once("exit", r));
  server.kill("SIGTERM");
  await ended;
}
try {
  await start();
  const session = await fetch(origin + "/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify({
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
    }),
  });
  assert.equal(session.status, 200);
  const cookie = session.headers.get("set-cookie").split(";")[0];
  const response = await fetch(origin + "/api/workspace", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      Cookie: cookie,
    },
    body: JSON.stringify({ action: "run", parcelId: "DEMO-P4-001" }),
  });
  assert.equal(response.status, 200);
  const { id } = await response.json();
  const before = await (
    await fetch(origin + "/api/workspace?parcel=DEMO-P4-001", {
      headers: { Cookie: cookie },
    })
  ).json();
  await stop();
  await start();
  const after = await (
    await fetch(origin + "/api/workspace?parcel=DEMO-P4-001", {
      headers: { Cookie: cookie },
    })
  ).json();
  assert.deepEqual(after.runs, before.runs);
  assert.deepEqual(after.audit, before.audit);
  assert.equal(after.runs[0].id, id);
  assert.equal(after.runs[0].status, "CONFLICT");
  assert.equal(after.total, 11);
  console.log(
    "PASS: saved run, input packet and audit persist across server restart; seed remains idempotent.",
  );
} finally {
  await stop();
}
