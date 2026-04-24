import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";
import { z } from "zod";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { createOrderSchema } from "@/lib/schemas";
import { getSessionUserId } from "@/lib/auth";

export const runtime = "nodejs";

const listQuerySchema = z.object({
  userId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const data = createOrderSchema.parse(body);
    const db = getDb();
    const [created] = await db
      .insert(orders)
      .values({
        userId: sessionUserId,
        descricao: data.descricao,
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

export async function GET(request: Request) {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const url = new URL(request.url);
  let userIdFilter: string | undefined;
  try {
    const q = listQuerySchema.parse({
      userId: url.searchParams.get("userId") ?? undefined,
    });
    userIdFilter = q.userId;
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        { error: "Query inválida", details: e.flatten() },
        { status: 400 },
      );
    }
    throw e;
  }
  const db = getDb();
  const rows = userIdFilter
    ? await db.select().from(orders).where(eq(orders.userId, userIdFilter))
    : await db.select().from(orders);
  return NextResponse.json(rows);
}
