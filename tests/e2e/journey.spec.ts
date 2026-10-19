import { test, expect, type APIRequestContext } from "@playwright/test";
import { randomBytes } from "node:crypto";
const origin = "http://localhost:3001";
const headers = { Origin: origin };
async function login(
  request: APIRequestContext,
  email = process.env.ADMIN_EMAIL!,
  password = process.env.ADMIN_PASSWORD!,
) {
  const r = await request.post("/api/session", {
    headers,
    data: { email, password },
  });
  expect(r.status()).toBe(200);
  return r;
}

test("public Bangla/English guided demo works in both themes without private APIs", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api/**", (route) => route.abort());
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "bn");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "মালিকানার",
  );
  await page.screenshot({
    path: "docs/screenshots/home-bn-light.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("button", { name: "Change theme", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({
    path: "docs/screenshots/home-en-dark.png",
    fullPage: true,
  });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("button", { name: "Change theme", exact: true }).click();
  await page.screenshot({
    path: "docs/screenshots/dashboard.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "See how it works", exact: true })
    .click();
  await page.getByRole("button", { name: /Find the difference/ }).click();
  await expect(
    page.getByRole("cell", { name: "-15", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "+15", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Check a correction/ }).click();
  await page
    .getByRole("button", { name: "Use the corrected sample", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "The supplied records reconcile." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "বাংলা", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "দেওয়া রেকর্ডগুলোর হিসাব মিলেছে।" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "docs/screenshots/mobile-demo-bn.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("reviewer detects, reviews, corrects and retains original evidence", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?view=login");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page
    .getByLabel("Email address", { exact: true })
    .fill(process.env.ADMIN_EMAIL!);
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.ADMIN_PASSWORD!);
  await page
    .getByRole("button", { name: "Sign in securely", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Review queue", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".record-card")).toHaveCount(6);
  await page.locator(".record-card").filter({ hasText: "DEMO-P4-001" }).click();
  await page
    .getByRole("button", { name: "Run reconciliation", exact: true })
    .click();
  await expect(
    page.getByRole("cell", { name: "-15", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "+15", exact: true }),
  ).toBeVisible();
  const before = await (
    await page.request.get("/api/workspace?parcel=DEMO-P4-001")
  ).json();
  const original = before.runs[0];
  const originalResult = await (
    await page.request.get(`/api/workspace?run=${original.id}`)
  ).json();
  await page.screenshot({
    path: "docs/screenshots/reconciliation.png",
    fullPage: true,
  });
  await page
    .getByLabel("Reason for opening this review")
    .fill("Compare co-owner allocation against the registered deed.");
  await page
    .getByRole("button", { name: "Create review case", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Saved.");
  await page.getByRole("button", { name: "Review queue", exact: true }).click();
  await page
    .getByLabel("Reviewer note")
    .fill("Checked the source deed and the previous allocation.");
  await page.getByRole("button", { name: "Record review action" }).click();
  await expect(page.locator(".review-title .badge")).toHaveText("Under review");
  await page.getByLabel("Next action").selectOption("NEEDS_EVIDENCE");
  await page
    .getByLabel("Reviewer note")
    .fill("Request corrected mutation allocation.");
  await page.getByRole("button", { name: "Record review action" }).click();
  await expect(page.locator(".review-title .badge")).toHaveText(
    "Needs evidence",
  );
  await page
    .getByRole("button", { name: "Assigned parcels", exact: true })
    .click();
  await page.locator(".record-card").filter({ hasText: "DEMO-P4-001" }).click();
  await page
    .getByRole("button", { name: "Add a revised snapshot", exact: true })
    .click();
  await page.getByLabel("Owner B Share", { exact: true }).fill("১/৩");
  await page.getByLabel("Buyer D Share", { exact: true }).fill("1/4");
  await page
    .getByLabel("Evidence / reason")
    .fill("New evidence supports the corrected fictional allocation.");
  await page.getByRole("button", { name: "Save new snapshot" }).click();
  await expect(page.locator(".snapshot-editor")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Run reconciliation", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "The supplied records reconcile." }),
  ).toBeVisible();
  const after = await (
    await page.request.get("/api/workspace?parcel=DEMO-P4-001")
  ).json();
  expect(after.runs).toHaveLength(2);
  expect(after.parcel.snapshots).toHaveLength(2);
  expect(
    (await (await page.request.get(`/api/workspace?run=${original.id}`)).json())
      .run.result,
  ).toEqual(originalResult.run.result);
  await page.goto(`/report/${original.id}`);
  await expect(
    page.getByRole("heading", {
      name: "The ownership allocation does not reconcile.",
    }),
  ).toBeVisible();
  await expect(
    page
      .getByText("Request corrected mutation allocation.", { exact: true })
      .first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "বাংলা", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "মালিকানার হিসাব মিলানোর প্রতিবেদন" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("anonymous records are protected; authenticated writes validate origin and input", async ({
  request,
}) => {
  expect((await request.get("/api/workspace")).status()).toBe(401);
  const report = await request.get(
    "/report/00000000-0000-4000-8000-000000000001",
    { maxRedirects: 0 },
  );
  expect([303, 307]).toContain(report.status());
  expect(
    (
      await request.post("/api/session", {
        headers: { Origin: "https://untrusted.example" },
        data: {
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD,
        },
      })
    ).status(),
  ).toBe(403);
  await login(request);
  const list = await request.get("/api/workspace");
  expect(list.headers()["cache-control"]).toContain("no-store");
  const body = await list.json();
  expect(body.parcels).toHaveLength(6);
  expect(body.total).toBe(11);
  expect(body.parcel).toBeNull();
  expect(body.parcels[0]).not.toHaveProperty("baseline");
  expect((await request.get("/api/workspace?offset=-1")).status()).toBe(400);
  const base = {
    action: "snapshot",
    parcelId: "DEMO-P4-003",
    holdings: [{ party: "A", share: "1/0" }],
    note: "Invalid test input",
    effectiveDate: "2026-04-01",
    previousSnapshotId: null,
  };
  for (const share of ["1/0", "-1/3", "0.5", "2"])
    expect(
      (
        await request.post("/api/workspace", {
          headers,
          data: { ...base, holdings: [{ party: "A", share }] },
        })
      ).status(),
    ).toBe(400);
  expect(
    (
      await request.post("/api/workspace", {
        headers,
        data: { ...base, holdings: [{ party: "UNKNOWN", share: "1" }] },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/workspace", {
        headers,
        data: {
          ...base,
          holdings: [
            { party: "A", share: "1/2" },
            { party: "A", share: "1/2" },
          ],
        },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/workspace", {
        headers,
        data: {
          ...base,
          holdings: [{ party: "A", share: "1" }],
          effectiveDate: "2025-01-01",
        },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/workspace", {
        headers,
        data: { action: "run", parcelId: "DEMO-P4-003", role: "ADMIN" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/workspace", {
        headers,
        data: { ...base, note: "x".repeat(25000) },
      })
    ).status(),
  ).toBe(413);
});

test("individual reviewer grants and revocation protect other parcels and accounts", async ({
  request,
  playwright,
}) => {
  await login(request);
  const email = `reviewer-${randomBytes(4).toString("hex")}@bhumi.test`,
    password = randomBytes(20).toString("hex");
  expect(
    (
      await request.post("/api/accounts", {
        headers,
        data: {
          action: "create",
          name: "Scoped reviewer",
          email,
          password,
          parcelIds: ["DEMO-P4-002"],
        },
      })
    ).status(),
  ).toBe(200);
  const reviewer = await playwright.request.newContext({ baseURL: origin });
  await login(reviewer, email, password);
  const own = await (await reviewer.get("/api/workspace")).json();
  expect(own.total).toBe(1);
  expect(own.parcels[0].id).toBe("DEMO-P4-002");
  expect(
    (await reviewer.get("/api/workspace?parcel=DEMO-P4-001")).status(),
  ).toBe(403);
  expect((await reviewer.get("/api/accounts")).status()).toBe(403);
  expect(
    (
      await reviewer.post("/api/workspace", {
        headers,
        data: { action: "run", parcelId: "DEMO-P4-001" },
      })
    ).status(),
  ).toBe(403);
  const made = await request.post("/api/workspace", {
    headers,
    data: { action: "run", parcelId: "DEMO-P4-003" },
  });
  const { id } = await made.json();
  expect((await reviewer.get(`/api/workspace?run=${id}`)).status()).toBe(403);
  expect((await reviewer.get(`/report/${id}`)).status()).toBe(404);
  const accounts = await (await request.get("/api/accounts")).json();
  const account = accounts.accounts.find(
    (a: { email: string }) => a.email === email,
  );
  expect(account).not.toHaveProperty("password_hash");
  expect(
    (
      await request.post("/api/accounts", {
        headers,
        data: { action: "disable", id: account.id },
      })
    ).status(),
  ).toBe(200);
  expect((await reviewer.get("/api/workspace")).status()).toBe(401);
  await reviewer.dispose();
});

test("concurrent snapshot and stale review edits fail without overwriting history", async ({
  request,
}) => {
  await login(request);
  const before = await (
    await request.get("/api/workspace?parcel=DEMO-P4-002")
  ).json();
  const p = before.parcel;
  const payload = {
    action: "snapshot",
    parcelId: p.id,
    holdings: p.snapshots.at(-1).holdings,
    note: "Reviewed synthetic allocation",
    effectiveDate: "2026-04-01",
    previousSnapshotId: p.snapshots.at(-1).id,
  };
  const responses = await Promise.all([
    request.post("/api/workspace", { headers, data: payload }),
    request.post("/api/workspace", { headers, data: payload }),
  ]);
  expect(responses.map((r) => r.status()).sort()).toEqual([200, 409]);
  const after = await (
    await request.get("/api/workspace?parcel=DEMO-P4-002")
  ).json();
  expect(after.parcel.snapshots).toHaveLength(p.snapshots.length + 1);
  const { id } = await (
    await request.post("/api/workspace", {
      headers,
      data: { action: "run", parcelId: "DEMO-P4-005" },
    })
  ).json();
  await request.post("/api/workspace", {
    headers,
    data: {
      action: "createReview",
      runId: id,
      note: "Check wrong recipient evidence",
    },
  });
  const cases = await (await request.get("/api/workspace")).json();
  const review = cases.reviews.find((r: { run_id: string }) => r.run_id === id);
  const edit = {
    action: "review",
    id: review.id,
    status: "UNDER_REVIEW",
    note: "Checking the source records",
    version: review.version,
  };
  expect(
    (await request.post("/api/workspace", { headers, data: edit })).status(),
  ).toBe(200);
  expect(
    (await request.post("/api/workspace", { headers, data: edit })).status(),
  ).toBe(409);
});

test("backend failure offers a localized retry without claiming missing credentials", async ({
  page,
}) => {
  await page.route("**/api/session", (r) =>
    r.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "SERVICE_UNAVAILABLE" }),
    }),
  );
  await page.goto("/?view=login");
  await expect(page.locator(".notice[role=alert]")).toContainText("ডেটাবেসে");
  await expect(page.getByText("Reviewer access is not configured")).toHaveCount(
    0,
  );
  await page.unroute("**/api/session");
  await page.getByRole("button", { name: "আবার চেষ্টা করুন" }).click();
  await expect(page.locator(".notice[role=alert]")).toHaveCount(0);
  await expect(page.getByLabel("ইমেইল ঠিকানা")).toBeVisible();
});

test("login throttling returns a safe error without revealing account existence", async ({
  request,
}) => {
  const data = {
    email: "does-not-exist@bhumi.test",
    password: "incorrect-password",
  };
  for (let i = 0; i < 8; i++)
    expect(
      (await request.post("/api/session", { headers, data })).status(),
    ).toBe(401);
  const response = await request.post("/api/session", { headers, data });
  expect(response.status()).toBe(429);
  expect(await response.json()).toEqual({ error: "RATE_LIMIT" });
});

test("password changes revoke existing sessions and reject the old password", async ({
  request,
  playwright,
}) => {
  await login(request);
  const email = `password-${randomBytes(4).toString("hex")}@bhumi.test`,
    password = randomBytes(20).toString("hex"),
    next = randomBytes(20).toString("hex");
  await request.post("/api/accounts", {
    headers,
    data: {
      action: "create",
      name: "Password reviewer",
      email,
      password,
      parcelIds: ["DEMO-P4-001"],
    },
  });
  const account = await playwright.request.newContext({ baseURL: origin });
  await login(account, email, password);
  expect(
    (
      await account.patch("/api/session", {
        headers,
        data: { currentPassword: password, newPassword: next },
      })
    ).status(),
  ).toBe(200);
  expect((await account.get("/api/workspace")).status()).toBe(401);
  expect(
    (
      await account.post("/api/session", { headers, data: { email, password } })
    ).status(),
  ).toBe(401);
  await login(account, email, next);
  expect((await account.get("/api/workspace")).status()).toBe(200);
  await account.dispose();
});
