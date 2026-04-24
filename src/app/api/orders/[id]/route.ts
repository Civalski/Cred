import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { ZodError } from "zod";
import { getDb } from "@/db";
import { clients, orders } from "@/db/schema";
import { updateOrderSchema } from "@/lib/schemas";
import { getSessionUserId } from "@/lib/auth";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    const body = await request.json();
    const data = updateOrderSchema.parse(body);
    const db = await getDb();
    let clientIdParaPedido: string | null = null;
    if (data.clientId) {
      const [clientRow] = await db
        .select({ id: clients.id })
        .from(clients)
        .where(
          and(
            eq(clients.id, data.clientId),
            eq(clients.userId, sessionUserId),
            isNull(clients.deletedAt),
          ),
        )
        .limit(1);
      if (!clientRow) {
        return NextResponse.json(
          { error: "Cliente não encontrado ou não pertence à sua conta" },
          { status: 404 },
        );
      }
      clientIdParaPedido = data.clientId;
    }
    const [updated] = await db
      .update(orders)
      .set({
        clientId: clientIdParaPedido,
        titulo: data.titulo.trim(),
        descricao: data.descricao,
        preco: data.preco,
        quantidade: data.quantidade,
      })
      .where(and(eq(orders.id, id), eq(orders.userId, sessionUserId)))
      .returning();
    if (!updated) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 },
      );
    }
    return NextResponse.json(updated);
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
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const { id } = await context.params;
  const db = await getDb();
  const [row] = await db
    .delete(orders)
    .where(and(eq(orders.id, id), eq(orders.userId, sessionUserId)))
    .returning({ id: orders.id });
  if (!row) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
