import { z } from "zod";
import {
  login,
  logout,
  currentUser,
  requireUser,
  changePassword,
} from "@/lib/auth";
import { assertOrigin, json, failure, readJson } from "@/lib/server/http";
export const dynamic = "force-dynamic";
const credentials = z
  .object({
    email: z
      .email()
      .max(254)
      .transform((s) => s.toLowerCase()),
    password: z.string().min(1).max(128),
  })
  .strict();
export async function GET() {
  try {
    return json({ user: await currentUser() });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const body = credentials.parse(await readJson(request, 2048));
    const token = await login(body.email, body.password);
    const response = json({ ok: true });
    response.cookies.set("bhumi_session", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: (process.env.APP_ORIGIN ?? "").startsWith("https://"),
      path: "/",
      maxAge: 28800,
    });
    return response;
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request) {
  try {
    assertOrigin(request);
    await logout();
    const response = json({ ok: true });
    response.cookies.delete("bhumi_session");
    return response;
  } catch (e) {
    return failure(e);
  }
}

export async function PATCH(request: Request) {
  try {
    assertOrigin(request);
    const user = await requireUser();
    const body = z
      .object({
        currentPassword: z.string().min(1).max(128),
        newPassword: z.string().min(12).max(128),
      })
      .strict()
      .parse(await readJson(request, 2048));
    await changePassword(user, body.currentPassword, body.newPassword);
    const response = json({ ok: true });
    response.cookies.delete("bhumi_session");
    return response;
  } catch (e) {
    return failure(e);
  }
}
