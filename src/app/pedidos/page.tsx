import { redirect } from "next/navigation";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/db";
import { clients, orders } from "@/db/schema";
import { PedidosView } from "@/components/PedidosView";
import type { PedidoClienteOption, PedidoRow } from "@/lib/pedido-row";

export default async function PedidosPage() {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/");
  }

  const db = await getDb();

  const clientRows = await db
    .select({
      id: clients.id,
      nome: clients.nome,
    })
    .from(clients)
    .where(and(eq(clients.userId, userId), isNull(clients.deletedAt)))
    .orderBy(clients.nome);

  const orderRows = await db
    .select({
      id: orders.id,
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
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  const clientes: PedidoClienteOption[] = clientRows.map((r) => ({
    id: r.id,
    nome: r.nome,
  }));

  const pedidos: PedidoRow[] = orderRows.map((r) => ({
    id: r.id,
    clientId: r.clientId,
    titulo: r.titulo,
    descricao: r.descricao,
    preco: r.preco,
    quantidade: r.quantidade,
    createdAt: r.createdAt.toISOString(),
    clientNome: r.clientNome ?? null,
  }));

  return (
    <div className="clientes-page clientes-page--simple pedidos-page">
      <PedidosView clientes={clientes} pedidos={pedidos} />
    </div>
  );
}
