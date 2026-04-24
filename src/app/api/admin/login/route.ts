import { NextResponse } from "next/server";
import {
  setAdminSessionCookie,
  signAdminSessionToken,
  verifyAdminPassword,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }
  const senha =
    typeof body === "object" &&
    body !== null &&
    "senha" in body &&
    typeof (body as { senha: unknown }).senha === "string"
      ? (body as { senha: string }).senha
      : "";

  if (!verifyAdminPassword(senha)) {
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  }

  const token = await signAdminSessionToken();
  await setAdminSessionCookie(token);
  return NextResponse.json({ ok: true });
}
