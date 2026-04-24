import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { ZodError } from "zod";
import { getDb } from "@/db";
import { clients } from "@/db/schema";
import { isUniqueViolation, toPublicClient } from "@/lib/clients-shared";
import { updateClientSchema } from "@/lib/schemas";
import { getSessionUserId } from "@/lib/auth";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    const body = await request.json();
    const data = updateClientSchema.parse(body);
    const db = await getDb();
    const [updated] = await db
      .update(clients)
      .set({
        cpf: data.cpf,
        rg: data.rg.trim(),
        nome: data.nome.trim(),
        idade: data.idade,
        email: data.email.trim().toLowerCase(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(clients.id, id),
          eq(clients.userId, userId),
          isNull(clients.deletedAt),
        ),
      )
      .returning();
    if (!updated) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 },
      );
    }
    return NextResponse.json(toPublicClient(updated));
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        { error: "Validação falhou", details: e.flatten() },
        { status: 400 },
      );
    }
    if (isUniqueViolation(e)) {
      return NextResponse.json(
        { error: "Já existe um cliente com este CPF na sua conta" },
        { status: 409 },
      );
    }
    throw e;
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const { id } = await context.params;
  const db = await getDb();
  const [row] = await db
    .update(clients)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(clients.id, id),
        eq(clients.userId, userId),
        isNull(clients.deletedAt),
      ),
    )
    .returning({ id: clients.id });
  if (!row) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
