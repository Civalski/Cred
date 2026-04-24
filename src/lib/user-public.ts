import type { User } from "@/db/schema";

export type PublicUser = Omit<User, "passwordHash">;

export function toPublicUser(row: User): PublicUser {
  return {
    id: row.id,
    cpf: row.cpf,
    rg: row.rg,
    nome: row.nome,
    idade: row.idade,
    email: row.email,
    login: row.login,
    deletedAt: row.deletedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
