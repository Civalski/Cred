import type { User } from "@/db/schema";

export type PublicUser = Pick<
  User,
  "id" | "login" | "deletedAt" | "createdAt" | "updatedAt"
>;

export function toPublicUser(row: User): PublicUser {
  return {
    id: row.id,
    login: row.login,
    deletedAt: row.deletedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
