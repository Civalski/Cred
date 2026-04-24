import Link from "next/link";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AppHeader } from "@/components/AppHeader";
import { InlineLoginForm } from "@/components/InlineLoginForm";

function firstName(nome: string) {
  const n = nome.trim();
  if (!n) return null;
  return n.split(/\s+/)[0] ?? n;
}

type PageProps = {
  searchParams: Promise<{ registered?: string; cadastro?: string }>;
};

export default async function Home({ searchParams }: PageProps) {
  const sp = await searchParams;
  const showRegistered = sp.registered === "1";
  const authView = sp.cadastro === "1" ? "register" as const : "login" as const;

  const userId = await getSessionUserId();
  let displayName: string | null = null;
  if (userId) {
    const db = getDb();
    const [u] = await db
      .select({ nome: users.nome, login: users.login })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    displayName = u?.nome ?? u?.login ?? null;
  }

  const greet = displayName ? firstName(displayName) ?? displayName : null;

  if (greet) {
    return (
      <>
        <AppHeader />
        <div className="landing landing--logged">
        <section className="landing-hero landing-hero--logged">
          <p className="landing-kicker">Área do cliente</p>
          <h1 className="landing-title">Bom te ver, {greet}</h1>
          <p className="landing-lead">
            Sua sessão está ativa. Quando houver pedidos e alertas, eles
            aparecerão aqui.
          </p>
          <div className="landing-panel">
            <p className="landing-panel-title">Em breve</p>
            <p className="landing-panel-text">
              Você poderá acompanhar tudo em um só lugar. Use{" "}
              <strong>Sair</strong> no canto superior quando terminar.
            </p>
          </div>
        </section>
      </div>
      </>
    );
  }

  return (
    <div className="split-crm">
      <div className="split-crm__brand">
        <div className="split-crm__brand-glow" aria-hidden="true" />
        <div className="split-crm__brand-mesh" aria-hidden="true" />
        <div className="split-crm__brand-inner">
          <Link href="/" className="split-crm__wordmark">
            Grupo Cred
          </Link>
          <div className="split-crm__body">
            <p className="split-crm__kicker">Conta digital</p>
            <h1 className="split-crm__title">
              Seu acesso,{" "}
              <span className="split-crm__accent">em um só lugar</span>
            </h1>
            <p className="split-crm__lead">
              Entre com seu usuário e senha ao lado. É rápido, seguro e seu
              cadastro leva poucos minutos se você ainda não tiver conta.
            </p>
          </div>
        </div>
      </div>
      <div className="split-crm__login">
        <div className="split-crm__main">
          <InlineLoginForm
            showRegisteredMessage={showRegistered}
            layout="crm"
            initialView={authView}
          />
        </div>
        <div className="split-crm__foot">
          <p className="split-crm__foot-hint">
            Ao acessar, você confirma o uso responsável da plataforma.
          </p>
          <div
            className="split-crm__legalese"
            aria-label="Documentos informativos"
          >
            <a href="#">Termos de uso</a>
            <span className="split-crm__legalese-dot" aria-hidden="true" />
            <a href="#">Política de privacidade</a>
          </div>
        </div>
      </div>
    </div>
  );
}
