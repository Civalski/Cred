import { asc, isNull } from "drizzle-orm";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { toPublicUser } from "@/lib/user-public";
import { AdministradorLoginForm } from "@/components/AdministradorLoginForm";
import { AdministradorLogoutButton } from "@/components/AdministradorLogoutButton";
import { AdministradorUsersTable } from "@/components/AdministradorUsersTable";

export default async function AdministradorPage() {
  const isAdmin = await getAdminSession();

  if (!isAdmin) {
    return <AdministradorLoginForm />;
  }

  const db = await getDb();
  const raw = await db
    .select()
    .from(users)
    .where(isNull(users.deletedAt))
    .orderBy(asc(users.createdAt));
  const list = raw.map(toPublicUser);

  return (
    <div className="admin-page clientes-page clientes-page--simple">
      <header className="clientes-hero admin-hero">
        <div className="clientes-hero-text">
          <h1 className="clientes-toolbar-title">Administrador</h1>
          <p className="clientes-subtitle">
            Usuários cadastrados (contas ativas) no sistema
          </p>
        </div>
        <div className="admin-hero-actions">
          <AdministradorLogoutButton />
        </div>
      </header>
      <AdministradorUsersTable rows={list} />
    </div>
  );
}
