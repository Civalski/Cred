import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";

const COOKIE_NAME = "session";
const ADMIN_SESSION_COOKIE = "admin_session";

/** Só com `next dev` (NODE_ENV=development). Nunca use em produção. */
const DEV_JWT_INSECURE_FALLBACK =
  "local-dev-insecure-jwt-secret-do-not-use-in-production";

function getSecret() {
  const fromEnv = process.env.AUTH_SECRET;
  if (fromEnv) {
    if (fromEnv.length < 16) {
      throw new Error("AUTH_SECRET must be at least 16 characters when set");
    }
    return new TextEncoder().encode(fromEnv);
  }
  if (process.env.NODE_ENV === "development") {
    return new TextEncoder().encode(DEV_JWT_INSECURE_FALLBACK);
  }
  throw new Error(
    "Set AUTH_SECRET to at least 16 characters in production (e.g. Vercel project settings).",
  );
}

export async function signSessionToken(
  userId: string,
  sessionVersion: number,
): Promise<string> {
  return new SignJWT({ sub: userId, sv: sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

type SessionTokenPayload = { userId: string; sessionVersion: number };

async function verifySessionToken(
  token: string,
): Promise<SessionTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  const sub = payload.sub;
  if (!sub || typeof sub !== "string") {
    throw new Error("Invalid token payload");
  }
  let sessionVersion = 0;
  const sv = payload.sv;
  if (typeof sv === "number" && Number.isInteger(sv) && sv >= 0) {
    sessionVersion = sv;
  }
  return { userId: sub, sessionVersion };
}

async function clearSessionCookieSafe(): Promise<void> {
  try {
    await clearSessionCookie();
  } catch {
    /* cookies só são graváveis em Route Handlers / Server Actions */
  }
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  let payload: SessionTokenPayload;
  try {
    payload = await verifySessionToken(token);
  } catch {
    await clearSessionCookieSafe();
    return null;
  }
  const db = await getDb();
  const [row] = await db
    .select({
      sessionVersion: users.sessionVersion,
    })
    .from(users)
    .where(and(eq(users.id, payload.userId), isNull(users.deletedAt)))
    .limit(1);
  if (!row || row.sessionVersion !== payload.sessionVersion) {
    await clearSessionCookieSafe();
    return null;
  }
  return payload.userId;
}

export async function requireUserId(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) {
    throw new AuthError("Não autenticado", 401);
  }
  return userId;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/** Senha do painel administrativo. Pode ser sobrescrita por `ADMIN_PASSWORD` no ambiente. */
function getAdminPasswordPlain(): string {
  return process.env.ADMIN_PASSWORD ?? "1234";
}

export function verifyAdminPassword(plain: string): boolean {
  const expected = Buffer.from(getAdminPasswordPlain(), "utf8");
  const got = Buffer.from(plain, "utf8");
  if (expected.length !== got.length) {
    return false;
  }
  return timingSafeEqual(expected, got);
}

export async function signAdminSessionToken(): Promise<string> {
  return new SignJWT({ sub: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
}

export async function getAdminSession(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.sub === "admin";
  } catch {
    return false;
  }
}

export async function setAdminSessionCookie(token: string) {
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminSessionCookie() {
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
