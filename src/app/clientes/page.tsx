import { redirect } from "next/navigation";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/db";
import { clients } from "@/db/schema";
import { ClientesView, type ClienteRow } from "@/components/ClientesView";

export default async function ClientesPage() {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/");
  }

  const db = await getDb();
  const rows = await db
    .select({
      id: clients.id,
      cpf: clients.cpf,
      rg: clients.rg,
      nome: clients.nome,
      idade: clients.idade,
      email: clients.email,
    })
    .from(clients)
    .where(and(eq(clients.userId, userId), isNull(clients.deletedAt)))
    .orderBy(desc(clients.createdAt));

  const serializable: ClienteRow[] = rows.map((r) => ({
    id: r.id,
    cpf: r.cpf,
    rg: r.rg,
    nome: r.nome,
    idade: r.idade,
    email: r.email,
  }));

  return (
    <div className="clientes-page clientes-page--simple">
      <ClientesView rows={serializable} />
    </div>
  );
}
