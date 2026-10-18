import { test, expect } from "@playwright/test";
test("signature scenario: detect, review, correct, preserve history and print", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto("/");
  await expect(
    page.getByText("Fictional parcels", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/dashboard.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Reviewer sign in" }).click();
  await page
    .getByLabel("Reviewer password")
    .fill(process.env.REVIEWER_PASSWORD!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Review officer", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Explore the discrepancy" }).click();
  await page
    .getByRole("button", { name: "Run reconciliation", exact: true })
    .click();
  await expect(
    page.getByRole("cell", { name: "-15", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "+15", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Totals balance", exact: true }),
  ).toBeVisible();
  await page.locator(".event summary").click();
  await expect(page.getByText("Before:", { exact: false })).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/reconciliation.png",
    fullPage: true,
  });
  const before = await (await page.request.get("/api/workspace")).json();
  const original = before.runs[0];
  expect(original.result.status).toBe("CONFLICT");
  await page
    .getByRole("button", { name: "Create review case", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Review case created" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Review queue/ }).click();
  await page
    .getByLabel("Reviewer note")
    .fill("Opened source deed and co-owner record for comparison.");
  await page.getByRole("button", { name: "Record review action" }).click();
  await expect(page.locator(".review-card .badge")).toHaveText("under review");
  await page.getByLabel("Next action").selectOption("NEEDS_EVIDENCE");
  await page
    .getByLabel("Reviewer note")
    .fill("Request the corrected fictional mutation allocation.");
  await page.getByRole("button", { name: "Record review action" }).click();
  await expect(page.locator(".review-card .badge")).toHaveText(
    "needs evidence",
  );
  await page.getByRole("button", { name: "DEMO-P4-001", exact: true }).click();
  await page.getByRole("button", { name: "Append revised snapshot" }).click();
  await page.getByLabel("Owner B share").fill("1/3");
  await page.getByLabel("Buyer D share").fill("1/4");
  await page
    .getByLabel("Evidence / reason")
    .fill("New synthetic corrected mutation supports the original deed.");
  await page
    .getByRole("button", { name: "Save new snapshot", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Run reconciliation", exact: true })
    .click();
  await expect(
    page.getByText("The supplied ownership records reconcile.", {
      exact: true,
    }),
  ).toBeVisible();
  const after = await (await page.request.get("/api/workspace")).json();
  expect(after.runs).toHaveLength(2);
  expect(
    after.runs.find((r: { id: string }) => r.id === original.id).result,
  ).toEqual(original.result);
  expect(after.parcels[0].snapshots).toHaveLength(2);
  expect(
    after.audit.filter((a: { action: string }) => a.action === "REVIEW_ACTION"),
  ).toHaveLength(2);
  await page.goto(`/report/${original.id}`);
  await expect(
    page.getByRole("heading", {
      name: "The records tell different ownership stories.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "NEEDS_EVIDENCE — Request the corrected fictional mutation allocation.",
    ),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("server enforces authorization, origin and input validation", async ({
  request,
}) => {
  const action = { action: "run", parcelId: "DEMO-P4-001" };
  expect(
    (
      await request.post("/api/workspace", {
        data: action,
        headers: { Origin: "http://localhost:3001" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/session", {
        data: { password: process.env.REVIEWER_PASSWORD },
        headers: { Origin: "https://untrusted.example" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/session", {
        data: { password: process.env.REVIEWER_PASSWORD },
        headers: { Origin: "http://localhost:3001" },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.post("/api/workspace", {
        data: {
          action: "snapshot",
          parcelId: "DEMO-P4-001",
          holdings: [{ party: "A", share: "1/0" }],
          note: "Invalid denominator",
        },
        headers: { Origin: "http://localhost:3001" },
      })
    ).status(),
  ).toBe(400);
});
test("mobile layout remains usable without horizontal page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Explore the discrepancy" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/mobile-dashboard.png",
    fullPage: true,
  });
});
