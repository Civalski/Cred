import { NextResponse } from "next/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { adminSetUserPasswordSchema } from "@/lib/schemas";
import { getAdminSession } from "@/lib/auth";
import { toPublicUser } from "@/lib/user-public";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    const body = await request.json();
    const data = adminSetUserPasswordSchema.parse(body);
    const db = await getDb();
    const passwordHash = await bcrypt.hash(data.senha, 10);
    const [updated] = await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
        sessionVersion: sql`${users.sessionVersion} + 1`,
      })
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .returning();
    if (!updated) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }
    return NextResponse.json(toPublicUser(updated));
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

export async function DELETE(_request: Request, context: RouteContext) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await context.params;
  const db = await getDb();
  const [updated] = await db
    .update(users)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .returning({ id: users.id });
  if (!updated) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true, mode: "soft" as const });
}
