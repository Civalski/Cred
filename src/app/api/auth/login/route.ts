import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { loginSchema } from "@/lib/schemas";
import { setSessionCookie, signSessionToken } from "@/lib/auth";
import { toPublicUser } from "@/lib/user-public";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);
    const db = getDb();
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
    const token = await signSessionToken(user.id);
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
