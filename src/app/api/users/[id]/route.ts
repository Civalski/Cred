import { NextResponse } from "next/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { patchUserSchema } from "@/lib/schemas";
import {
  getSessionUserId,
  setSessionCookie,
  signSessionToken,
  clearSessionCookie,
} from "@/lib/auth";
import { toPublicUser } from "@/lib/user-public";

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

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const { id } = await context.params;
  if (id !== sessionUserId) {
    return NextResponse.json({ error: "Proibido" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const data = patchUserSchema.parse(body);
    const db = await getDb();
    const updatePayload: Partial<{
      login: string;
      passwordHash: string;
      updatedAt: Date;
      sessionVersion: SQL;
    }> = { updatedAt: new Date() };
    if (data.login !== undefined) updatePayload.login = data.login;
    if (data.senha !== undefined) {
      updatePayload.passwordHash = await bcrypt.hash(data.senha, 10);
      updatePayload.sessionVersion = sql`${users.sessionVersion} + 1`;
    }
    const [updated] = await db
      .update(users)
      .set(updatePayload)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .returning();
    if (!updated) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }
    if (data.senha !== undefined) {
      const token = await signSessionToken(updated.id, updated.sessionVersion);
      await setSessionCookie(token);
    }
    return NextResponse.json(toPublicUser(updated));
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

export async function DELETE(request: Request, context: RouteContext) {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const { id } = await context.params;
  if (id !== sessionUserId) {
    return NextResponse.json({ error: "Proibido" }, { status: 403 });
  }
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") ?? "soft";
  if (mode !== "soft" && mode !== "hard") {
    return NextResponse.json(
      { error: "mode deve ser soft ou hard" },
      { status: 400 },
    );
  }
  const db = await getDb();
    if (mode === "soft") {
    const [updated] = await db
      .update(users)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .returning({ id: users.id });
    if (!updated) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }
    await clearSessionCookie();
    return NextResponse.json({ ok: true, mode: "soft" });
  }
  const [deleted] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning({ id: users.id });
  if (!deleted) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true, mode: "hard" });
}
