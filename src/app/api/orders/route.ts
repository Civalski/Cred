import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { ZodError } from "zod";
import { getDb } from "@/db";
import { clients, orders } from "@/db/schema";
import { createOrderSchema } from "@/lib/schemas";
import { getSessionUserId } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const data = createOrderSchema.parse(body);
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
    const [created] = await db
      .insert(orders)
      .values({
        userId: sessionUserId,
        clientId: clientIdParaPedido,
        titulo: data.titulo.trim(),
        descricao: data.descricao,
        preco: data.preco,
        quantidade: data.quantidade,
      })
      .returning();
    return NextResponse.json(created, { status: 201 });
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

export async function GET() {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const db = await getDb();
  const rows = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      clientId: orders.clientId,
      titulo: orders.titulo,
      descricao: orders.descricao,
      preco: orders.preco,
      quantidade: orders.quantidade,
      createdAt: orders.createdAt,
      clientNome: clients.nome,
    })
    .from(orders)
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .where(eq(orders.userId, sessionUserId))
    .orderBy(desc(orders.createdAt));
  return NextResponse.json(rows);
}
