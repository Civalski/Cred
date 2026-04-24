import Link from "next/link";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { LogoutButton } from "@/components/LogoutButton";
import { SidebarNavLink } from "@/components/SidebarNavLink";

export async function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getSessionUserId();
  let firstName: string | null = null;
  if (userId) {
    const db = await getDb();
    const [u] = await db
      .select({ login: users.login })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);
    const display = u?.login?.trim() || null;
    if (display) {
      firstName = display.split(/\s+/)[0] ?? display;
    }
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar" aria-label="Navegação principal">
        <div className="app-sidebar-inner">
          <Link
            href={userId ? "/clientes" : "/"}
            className="app-logo app-logo--text app-sidebar-brand"
          >
            Grupo Cred
          </Link>
          <nav className="app-sidebar-nav" aria-label="Seções">
            {userId ? (
              <>
                <SidebarNavLink href="/clientes">Clientes</SidebarNavLink>
                <SidebarNavLink href="/pedidos">Pedidos</SidebarNavLink>
              </>
            ) : (
              <>
                <Link href="/#acesso" className="app-sidebar-link">
                  Entrar
                </Link>
                <Link href="/?cadastro=1#acesso" className="app-sidebar-cta">
                  Criar conta
                </Link>
              </>
            )}
          </nav>
          <div className="app-sidebar-footer">
            {userId ? (
              <>
                <p className="app-sidebar-hi">
                  Olá, <strong>{firstName ?? "visitante"}</strong>
                </p>
                <LogoutButton />
              </>
            ) : null}
          </div>
        </div>
      </aside>
      <div className="app-shell-main" id="conteudo-principal">
        {children}
      </div>
    </div>
  );
}
