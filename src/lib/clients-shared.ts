import { clients } from "@/db/schema";

export type PublicClientRow = {
  id: string;
  cpf: string;
  rg: string;
  nome: string;
  idade: number;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

export function toPublicClient(
  row: typeof clients.$inferSelect,
): PublicClientRow {
  return {
    id: row.id,
    cpf: row.cpf,
    rg: row.rg,
    nome: row.nome,
    idade: row.idade,
    email: row.email,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: string }).code === "23505"
  );
}
