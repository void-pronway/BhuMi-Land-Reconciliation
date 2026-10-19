import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../src/lib/server/password";
import { postgresOptions } from "../src/lib/db/connection";
import { readJson, ApiError } from "../src/lib/server/http";
import { copy, asciiDigits, digits, partyName } from "../src/lib/i18n";
describe("security primitives", () => {
  it("salts passwords and verifies without storing plaintext", async () => {
    const password = "test-only-long-password";
    const a = await hashPassword(password),
      b = await hashPassword(password);
    expect(a).not.toBe(b);
    expect(a).not.toContain(password);
    expect(await verifyPassword(password, a)).toBe(true);
    expect(await verifyPassword("wrong", a)).toBe(false);
  });
  it("requires verified TLS for remote PostgreSQL and bounds the pool", () => {
    const options = postgresOptions(
      "postgres://user:password@example.test/db?sslmode=disable",
    );
    expect(options.ssl).toEqual({ rejectUnauthorized: true });
    expect(options.max).toBe(3);
    expect(options.statement_timeout).toBe(15000);
    expect(postgresOptions("postgres://user:password@localhost/test").ssl).toBe(
      false,
    );
    expect(() => postgresOptions("http://example.test")).toThrow();
  });
  it("rejects oversized streamed requests without content-length", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: "x".repeat(500) }),
    });
    await expect(readJson(req, 100)).rejects.toBeInstanceOf(ApiError);
  });
  it("has equal translation keys and normalizes Bangla numerical input", () => {
    expect(Object.keys(copy.bn).sort()).toEqual(Object.keys(copy.en).sort());
    expect(asciiDigits("১/৩")).toBe("1/3");
    expect(digits("-15", "bn")).toBe("-১৫");
    expect(partyName("Owner B", "bn")).toBe("মালিক খ");
  });
});
