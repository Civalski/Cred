import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { patchUserSchema } from "@/lib/schemas";
import { getSessionUserId } from "@/lib/auth";
import { toPublicUser } from "@/lib/user-public";

export const runtime = "nodejs";

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: string }).code === "23505"
  );
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
    const db = getDb();
    const updatePayload: Partial<{
      cpf: string;
      rg: string;
      nome: string;
      idade: number;
      email: string;
      login: string;
      passwordHash: string;
      updatedAt: Date;
    }> = { updatedAt: new Date() };
    if (data.cpf !== undefined) updatePayload.cpf = data.cpf;
    if (data.rg !== undefined) updatePayload.rg = data.rg;
    if (data.nome !== undefined) updatePayload.nome = data.nome;
    if (data.idade !== undefined) updatePayload.idade = data.idade;
    if (data.email !== undefined) updatePayload.email = data.email.toLowerCase();
    if (data.login !== undefined) updatePayload.login = data.login;
    if (data.senha !== undefined) {
      updatePayload.passwordHash = await bcrypt.hash(data.senha, 10);
    }
    const [updated] = await db
      .update(users)
      .set(updatePayload)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .returning();
    if (!updated) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
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
        { error: "CPF, e-mail ou login já cadastrado" },
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
  const db = getDb();
  if (mode === "soft") {
    const [updated] = await db
      .update(users)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .returning({ id: users.id });
    if (!updated) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, mode: "soft" });
  }
  const [deleted] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning({ id: users.id });
  if (!deleted) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, mode: "hard" });
}
