import { NextResponse } from "next/server";
import { isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { registerUserSchema } from "@/lib/schemas";
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = registerUserSchema.parse(body);
    const passwordHash = await bcrypt.hash(data.senha, 10);
    const db = getDb();
    const [created] = await db
      .insert(users)
      .values({
        login: data.login,
        passwordHash,
      })
      .returning();
    return NextResponse.json(toPublicUser(created), { status: 201 });
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

export async function GET() {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const db = getDb();
  const rows = await db
    .select()
    .from(users)
    .where(isNull(users.deletedAt));
  return NextResponse.json(rows.map(toPublicUser));
}
