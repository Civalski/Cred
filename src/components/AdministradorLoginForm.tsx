"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function AdministradorLoginForm() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Não foi possível validar a senha");
        return;
      }
      setSenha("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-page admin-page--gate">
      <section
        className="home-login-card home-login-card--crm"
        aria-labelledby="admin-login-title"
      >
        <div className="home-login-card-inner">
          <h1 className="home-login-title" id="admin-login-title">
            Administrador
          </h1>
          <p className="home-login-sub">
            Digite a senha de administrador para ver os cadastros de usuários
            do sistema.
          </p>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <form className="home-form" onSubmit={onSubmit} noValidate>
            <div className="field home-field home-field--password-crm">
              <label htmlFor="admin-senha">Senha de administrador</label>
              <input
                id="admin-senha"
                name="senha"
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                placeholder="••••"
              />
            </div>
            <button
              className="btn home-submit home-submit--crm"
              type="submit"
              disabled={loading}
            >
              {loading ? "Validando…" : "Acessar painel"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
