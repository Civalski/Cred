"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { TurnstileField } from "@/components/TurnstileField";

type View = "login" | "register";

type Props = {
  showRegisteredMessage?: boolean;
  /** estilo tela de login 50/50 (referência CRM) */
  layout?: "default" | "crm";
  /** Definido pela URL `?cadastro=1` na home */
  initialView?: View;
  /** Só preenchido em produção (Vercel) quando Turnstile está ativo. */
  turnstileSiteKey?: string | null;
};

export function InlineLoginForm({
  showRegisteredMessage = false,
  layout = "default",
  initialView = "login",
  turnstileSiteKey = null,
}: Props) {
  const router = useRouter();
  const [view, setView] = useState<View>(initialView);
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [regLogin, setRegLogin] = useState("");
  const [regSenha, setRegSenha] = useState("");
  const [regSenhaConfirm, setRegSenhaConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const onTurnstileToken = useCallback((t: string | null) => {
    setTurnstileToken(t);
  }, []);
  const crm = layout === "crm";
  const needTurnstile = Boolean(turnstileSiteKey);
  const turnstileOk = !needTurnstile || Boolean(turnstileToken);

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  useEffect(() => {
    if (showRegisteredMessage) {
      setView("login");
    }
  }, [showRegisteredMessage]);

  async function onLoginSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (needTurnstile && !turnstileToken) {
      setError("Complete a verificação de segurança abaixo.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login,
          senha,
          ...(needTurnstile && turnstileToken
            ? { turnstileToken }
            : {}),
        }),
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Não foi possível entrar");
        return;
      }
      router.replace("/clientes");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function onRegisterSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (needTurnstile && !turnstileToken) {
      setError("Complete a verificação de segurança abaixo.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: regLogin,
          senha: regSenha,
          senhaConfirmacao: regSenhaConfirm,
          ...(needTurnstile && turnstileToken
            ? { turnstileToken }
            : {}),
        }),
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        details?: { fieldErrors?: Record<string, string[]> };
      };
      if (!res.ok) {
        const first =
          data.details?.fieldErrors &&
          Object.values(data.details.fieldErrors).flat()[0];
        setError(first ?? data.error ?? "Não foi possível cadastrar");
        return;
      }
      setRegLogin("");
      setRegSenha("");
      setRegSenhaConfirm("");
      router.replace("/clientes?conta=nova");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function goToRegister() {
    setError(null);
    setRegSenhaConfirm("");
    setView("register");
  }

  function goToLogin() {
    setError(null);
    setRegSenha("");
    setRegSenhaConfirm("");
    setView("login");
    router.replace("/#acesso");
  }

  const title = view === "login" ? "Acessar conta" : "Criar conta";
  const sub =
    view === "login"
      ? crm
        ? "Informe seu login e senha de acesso."
        : "Use seu login e senha. Novo por aqui? Crie seu cadastro em instantes."
      : null;

  return (
    <section
      className={
        crm
          ? "home-login-card home-login-card--crm"
          : "home-login-card"
      }
      id="acesso"
      aria-labelledby="home-login-title"
    >
      <div className="home-login-card-inner">
        <h2
          className={
            "home-login-title" +
            (view === "register" ? " home-login-title--no-sub" : "")
          }
          id="home-login-title"
        >
          {title}
        </h2>
        {sub && <p className="home-login-sub">{sub}</p>}
        {showRegisteredMessage && view === "login" && (
          <p className="form-success" role="status">
            Cadastro concluído! Entre com sua nova conta.
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {view === "login" ? (
          <form className="home-form" onSubmit={onLoginSubmit} noValidate>
            <div className="field home-field">
              <label htmlFor="home-login">Login</label>
              <input
                id="home-login"
                name="login"
                type="text"
                autoComplete="username"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                placeholder="Seu nome de usuário"
              />
            </div>
            {crm ? (
              <div className="field home-field home-field--password-crm">
                <label htmlFor="home-senha">Senha</label>
                <input
                  id="home-senha"
                  name="senha"
                  type="password"
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  placeholder="••••••••"
                />
                <div className="home-forgot-wrap">
                  <a
                    href="#"
                    className="home-forgot"
                    onClick={(e) => e.preventDefault()}
                  >
                    Redefinir senha
                  </a>
                </div>
              </div>
            ) : (
              <div className="field home-field">
                <label htmlFor="home-senha">Senha</label>
                <input
                  id="home-senha"
                  name="senha"
                  type="password"
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
            )}
            {turnstileSiteKey && (
              <div
                className="field home-field home-field--turnstile"
                aria-label="Verificação de segurança"
              >
                <TurnstileField
                  key={`login-${view}`}
                  siteKey={turnstileSiteKey}
                  onToken={onTurnstileToken}
                />
              </div>
            )}
            <button
              className={
                crm
                  ? "btn home-submit home-submit--crm"
                  : "btn home-submit"
              }
              type="submit"
              disabled={loading || !turnstileOk}
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
        ) : (
          <form className="home-form" onSubmit={onRegisterSubmit} noValidate>
            <div className="field home-field">
              <label htmlFor="home-reg-login">Login</label>
              <input
                id="home-reg-login"
                name="regLogin"
                type="text"
                autoComplete="username"
                value={regLogin}
                onChange={(e) => setRegLogin(e.target.value)}
                required
                placeholder="Escolha um nome de usuário"
              />
            </div>
            <div
              className={
                crm
                  ? "field home-field home-field--password-crm"
                  : "field home-field"
              }
            >
              <label htmlFor="home-reg-senha">Senha</label>
              <input
                id="home-reg-senha"
                name="regSenha"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={regSenha}
                onChange={(e) => setRegSenha(e.target.value)}
                required
                placeholder="Ex.: Aa!12345"
              />
            </div>
            <div className="field home-field">
              <label htmlFor="home-reg-senha-2">Confirmar senha</label>
              <input
                id="home-reg-senha-2"
                name="regSenhaConfirm"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={regSenhaConfirm}
                onChange={(e) => setRegSenhaConfirm(e.target.value)}
                required
                placeholder="Repita a senha"
                aria-describedby="home-reg-senha-hint"
              />
              <p className="home-password-hint" id="home-reg-senha-hint">
                Mínimo 8 caracteres, com maiúscula, minúscula, número e
                caractere especial.
              </p>
            </div>
            {turnstileSiteKey && (
              <div
                className="field home-field home-field--turnstile"
                aria-label="Verificação de segurança"
              >
                <TurnstileField
                  key={`register-${view}`}
                  siteKey={turnstileSiteKey}
                  onToken={onTurnstileToken}
                />
              </div>
            )}
            <button
              className={
                crm
                  ? "btn home-submit home-submit--crm"
                  : "btn home-submit"
              }
              type="submit"
              disabled={loading || !turnstileOk}
            >
              {loading ? "Cadastrando…" : "Criar conta"}
            </button>
          </form>
        )}

        {crm && view === "login" && (
          <p className="home-login-signup home-login-signup--crm">
            <span className="home-login-signup-label">Não tem uma conta ainda? </span>
            <button
              type="button"
              className="home-login-signup-link"
              onClick={goToRegister}
            >
              Criar conta
            </button>
          </p>
        )}

        {crm && view === "register" && (
          <p className="home-login-signup home-login-signup--crm">
            <span className="home-login-signup-label">Já tem uma conta? </span>
            <button
              type="button"
              className="home-login-signup-link"
              onClick={goToLogin}
            >
              Entrar
            </button>
          </p>
        )}

        {!crm && view === "login" && (
          <p className="home-login-footer">
            Ainda não tem cadastro?{" "}
            <button
              type="button"
              className="home-login-signup-link home-login-inline-btn"
              onClick={goToRegister}
            >
              Criar conta grátis
            </button>
          </p>
        )}

        {!crm && view === "register" && (
          <p className="home-login-footer">
            Já tem conta?{" "}
            <button
              type="button"
              className="home-login-signup-link home-login-inline-btn"
              onClick={goToLogin}
            >
              Entrar
            </button>
          </p>
        )}
      </div>
    </section>
  );
}
