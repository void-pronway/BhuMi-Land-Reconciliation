import { NextResponse } from "next/server";
import { passwordMatches, sameOrigin, token } from "@/lib/auth";
const attempts = new Map<string, { count: number; until: number }>();
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const key = "local-demo";
  const prior = attempts.get(key);
  if (prior && prior.until > Date.now() && prior.count >= 10)
    return NextResponse.json(
      { error: "Too many attempts. Retry in one minute." },
      { status: 429 },
    );
  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.password !== "string" ||
    !passwordMatches(body.password)
  ) {
    attempts.set(key, {
      count: prior && prior.until > Date.now() ? prior.count + 1 : 1,
      until: Date.now() + 60000,
    });
    return NextResponse.json(
      {
        error:
          "Reviewer access is not configured or the password is incorrect.",
      },
      { status: 401 },
    );
  }
  attempts.delete(key);
  const response = NextResponse.json({ ok: true });
  response.cookies.set("bhumi_session", token(), {
    httpOnly: true,
    sameSite: "strict",
    secure: new URL(request.url).protocol === "https:",
    path: "/",
    maxAge: 28800,
  });
  return response;
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("bhumi_session");
  return response;
}
