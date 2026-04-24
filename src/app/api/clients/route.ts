import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { ZodError } from "zod";
import { getDb } from "@/db";
import { clients } from "@/db/schema";
import { isUniqueViolation, toPublicClient } from "@/lib/clients-shared";
import { createClientSchema } from "@/lib/schemas";
import { getSessionUserId } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const db = await getDb();
  const rows = await db
    .select()
    .from(clients)
    .where(and(eq(clients.userId, userId), isNull(clients.deletedAt)));
  return NextResponse.json(rows.map(toPublicClient));
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const data = createClientSchema.parse(body);
    const db = await getDb();
    const [created] = await db
      .insert(clients)
      .values({
        userId,
        cpf: data.cpf,
        rg: data.rg.trim(),
        nome: data.nome.trim(),
        idade: data.idade,
        email: data.email.trim().toLowerCase(),
      })
      .returning();
    return NextResponse.json(toPublicClient(created), { status: 201 });
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
