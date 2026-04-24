import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { loginSchema } from "@/lib/schemas";
import { setSessionCookie, signSessionToken } from "@/lib/auth";
import {
  getClientIp,
  rateLimitedResponse,
  RATE_AUTH_LOGIN,
  takeRateLimit,
} from "@/lib/rate-limit";
import { toPublicUser } from "@/lib/user-public";
import { isTurnstileEnforced, verifyTurnstileResponse } from "@/lib/turnstile";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = takeRateLimit(
    `auth:login:${ip}`,
    RATE_AUTH_LOGIN.max,
    RATE_AUTH_LOGIN.windowMs,
  );
  if (!limited.ok) {
    return rateLimitedResponse(limited.retryAfterSec);
  }
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);
    if (isTurnstileEnforced()) {
      const ok = await verifyTurnstileResponse(data.turnstileToken, ip);
      if (!ok) {
        return NextResponse.json(
          { error: "Verificação de segurança inválida ou expirada. Tente de novo." },
          { status: 400 },
        );
      }
    }
    const db = await getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.login, data.login), isNull(users.deletedAt)))
      .limit(1);
    if (!user) {
      return NextResponse.json(
        { error: "Login ou senha inválidos" },
        { status: 401 },
      );
    }
    const ok = await bcrypt.compare(data.senha, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Login ou senha inválidos" },
        { status: 401 },
      );
    }
    const token = await signSessionToken(user.id, user.sessionVersion);
    await setSessionCookie(token);
    return NextResponse.json({ user: toPublicUser(user) });
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        { error: "Validação falhou", details: e.flatten() },
        { status: 400 },
      );
    }
    throw e;
  }
}
