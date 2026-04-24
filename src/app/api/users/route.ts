import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { registerUserSchema } from "@/lib/schemas";
import { getSessionUserId, setSessionCookie, signSessionToken } from "@/lib/auth";
import {
  getClientIp,
  rateLimitedResponse,
  RATE_USER_REGISTER,
  takeRateLimit,
} from "@/lib/rate-limit";
import { toPublicUser } from "@/lib/user-public";
import { isTurnstileEnforced, verifyTurnstileResponse } from "@/lib/turnstile";

export const runtime = "nodejs";

function isUniqueViolation(e: unknown): boolean {
  let current: unknown = e;
  for (let i = 0; i < 6 && current; i++) {
    if (
      typeof current === "object" &&
      current !== null &&
      "code" in current &&
      (current as { code: string }).code === "23505"
    ) {
      return true;
    }
    if (
      typeof current === "object" &&
      current !== null &&
      "cause" in current &&
      (current as { cause: unknown }).cause !== undefined
    ) {
      current = (current as { cause: unknown }).cause;
    } else {
      break;
    }
  }
  return false;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = takeRateLimit(
    `users:register:${ip}`,
    RATE_USER_REGISTER.max,
    RATE_USER_REGISTER.windowMs,
  );
  if (!limited.ok) {
    return rateLimitedResponse(limited.retryAfterSec);
  }
  try {
    const body = await request.json();
    const data = registerUserSchema.parse(body);
    if (isTurnstileEnforced()) {
      const ok = await verifyTurnstileResponse(data.turnstileToken, ip);
      if (!ok) {
        return NextResponse.json(
          { error: "Verificação de segurança inválida ou expirada. Tente de novo." },
          { status: 400 },
        );
      }
    }
    const passwordHash = await bcrypt.hash(data.senha, 10);
    const db = await getDb();
    const [created] = await db
      .insert(users)
      .values({
        login: data.login,
        passwordHash,
      })
      .returning();
    const token = await signSessionToken(created.id, created.sessionVersion);
    await setSessionCookie(token);
    return NextResponse.json(toPublicUser(created), { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        { error: "Validação falhou", details: e.flatten() },
        { status: 400 },
      );
    }
    if (isUniqueViolation(e)) {
      return NextResponse.json(
        { error: "Este login já está em uso" },
        { status: 409 },
      );
    }
    throw e;
  }
}

export async function GET() {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const db = await getDb();
  const [row] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionUserId), isNull(users.deletedAt)))
    .limit(1);
  if (!row) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }
  return NextResponse.json(toPublicUser(row));
}
