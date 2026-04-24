import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { getTurnstileSiteKeyForClient } from "@/lib/turnstile";
import { InlineLoginForm } from "@/components/InlineLoginForm";

type PageProps = {
  searchParams: Promise<{ registered?: string; cadastro?: string }>;
};

export default async function Home({ searchParams }: PageProps) {
  const sp = await searchParams;
  const showRegistered = sp.registered === "1";
  const authView = sp.cadastro === "1" ? "register" as const : "login" as const;

  const userId = await getSessionUserId();
  if (userId) {
    redirect("/clientes");
  }

  const turnstileSiteKey = getTurnstileSiteKeyForClient();

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
            turnstileSiteKey={turnstileSiteKey}
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
