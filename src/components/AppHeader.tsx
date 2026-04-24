import Link from "next/link";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { LogoutButton } from "@/components/LogoutButton";

export async function AppHeader() {
  const userId = await getSessionUserId();
  let firstName: string | null = null;
  if (userId) {
    const db = getDb();
    const [u] = await db
      .select({ nome: users.nome, login: users.login })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const display = u?.nome?.trim() || u?.login;
    if (display) {
      firstName = display.split(/\s+/)[0] ?? display;
    }
  }

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link href="/" className="app-logo app-logo--text">
          Grupo Cred
        </Link>
        <nav className="app-nav" aria-label="Principal">
          {userId ? (
            <>
              <span className="app-nav-hi">
                Olá, <strong>{firstName ?? "visitante"}</strong>
              </span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/#acesso" className="app-nav-link">
                Entrar
              </Link>
              <Link href="/?cadastro=1#acesso" className="app-nav-cta">
                Criar conta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
