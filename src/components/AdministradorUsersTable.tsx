"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import type { PublicUser } from "@/lib/user-public";

type Props = {
  rows: PublicUser[];
};

function formatPt(iso: Date | string | null): string {
  if (iso == null) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function AdministradorUsersTable({ rows }: Props) {
  const router = useRouter();
  const [pwdFor, setPwdFor] = useState<PublicUser | null>(null);
  const [deleteFor, setDeleteFor] = useState<PublicUser | null>(null);
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [loadingPwd, setLoadingPwd] = useState(false);
  const [loadingDel, setLoadingDel] = useState(false);
  const pwdDialogTitleId = useId();
  const delDialogTitleId = useId();
  const delDescId = useId();
  const firstPwdInputRef = useRef<HTMLInputElement>(null);
  const deleteCancelRef = useRef<HTMLButtonElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);
  const [actionsMenu, setActionsMenu] = useState<{
    user: PublicUser;
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    if (!pwdFor) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = requestAnimationFrame(() => firstPwdInputRef.current?.focus());
    return () => {
      document.body.style.overflow = prev;
      cancelAnimationFrame(t);
    };
  }, [pwdFor]);

  useEffect(() => {
    if (!deleteFor) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = requestAnimationFrame(() => deleteCancelRef.current?.focus());
    return () => {
      document.body.style.overflow = prev;
      cancelAnimationFrame(t);
    };
  }, [deleteFor]);

  useEffect(() => {
    if (!pwdFor) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loadingPwd) {
        e.preventDefault();
        closePwd();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pwdFor, loadingPwd]);

  useEffect(() => {
    if (!deleteFor) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loadingDel) {
        e.preventDefault();
        setDeleteFor(null);
        setDeleteError(null);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [deleteFor, loadingDel]);

  useEffect(() => {
    if (!actionsMenu) return;
    function onPointerDown(e: PointerEvent) {
      const t = e.target as HTMLElement;
      if (actionsMenuRef.current?.contains(t)) return;
      if (t.closest?.(".admin-user-actions__trigger")) return;
      setActionsMenu(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActionsMenu(null);
    }
    function dismissOnViewportChange() {
      setActionsMenu(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", dismissOnViewportChange, true);
    window.addEventListener("resize", dismissOnViewportChange);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", dismissOnViewportChange, true);
      window.removeEventListener("resize", dismissOnViewportChange);
    };
  }, [actionsMenu]);

  function toggleUserActionsMenu(u: PublicUser, trigger: HTMLButtonElement) {
    setActionsMenu((prev) => {
      if (prev?.user.id === u.id) return null;
      const r = trigger.getBoundingClientRect();
      const menuWidth = 176;
      const margin = 8;
      const left = Math.min(
        Math.max(margin, r.right - menuWidth),
        window.innerWidth - menuWidth - margin,
      );
      return { user: u, top: r.bottom + 4, left };
    });
  }

  function openPwd(u: PublicUser) {
    setError(null);
    setSenha("");
    setSenha2("");
    setPwdFor(u);
  }

  function closePwd() {
    if (loadingPwd) return;
    setPwdFor(null);
    setError(null);
    setSenha("");
    setSenha2("");
  }

  async function onSubmitPwd(e: FormEvent) {
    e.preventDefault();
    if (!pwdFor) return;
    setError(null);
    setLoadingPwd(true);
    try {
      const res = await fetch(`/api/admin/users/${pwdFor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          senha,
          senhaConfirmacao: senha2,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        details?: { fieldErrors?: Record<string, string[]> };
      };
      if (!res.ok) {
        const first =
          data.details?.fieldErrors &&
          Object.values(data.details.fieldErrors).flat()[0];
        setError(first ?? data.error ?? "Não foi possível alterar a senha");
        return;
      }
      closePwd();
      router.refresh();
    } finally {
      setLoadingPwd(false);
    }
  }

  async function confirmDelete() {
    if (!deleteFor) return;
    setDeleteError(null);
    setLoadingDel(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteFor.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setDeleteError(data.error ?? "Não foi possível excluir");
        return;
      }
      setDeleteFor(null);
      router.refresh();
    } finally {
      setLoadingDel(false);
    }
  }

  if (rows.length === 0) {
    return (
      <p className="clientes-subtitle" role="status">
        Não há usuários ativos cadastrados no sistema.
      </p>
    );
  }

  return (
    <>
      <div
        className="admin-users-wrap"
        role="region"
        aria-label="Usuários cadastrados"
      >
        <table className="admin-users-table">
          <thead>
            <tr>
              <th scope="col">Login</th>
              <th scope="col">Cadastro</th>
              <th scope="col">Atualizado</th>
              <th scope="col">ID</th>
              <th scope="col" className="admin-users-col-acoes">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>
                  <strong>{u.login}</strong>
                </td>
                <td>{formatPt(u.createdAt)}</td>
                <td>{formatPt(u.updatedAt)}</td>
                <td>
                  <code className="admin-user-id">{u.id}</code>
                </td>
                <td className="admin-users-acoes">
                  <button
                    type="button"
                    className="admin-user-actions__trigger"
                    aria-label={`Ações: ${u.login}`}
                    aria-haspopup="menu"
                    aria-expanded={actionsMenu?.user.id === u.id}
                    onClick={(e) => toggleUserActionsMenu(u, e.currentTarget)}
                  >
                    <svg
                      className="admin-user-actions__icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {actionsMenu ? (
        <div
          ref={actionsMenuRef}
          className="admin-user-actions__menu"
          style={{
            top: actionsMenu.top,
            left: actionsMenu.left,
          }}
          role="menu"
          aria-label={`Opções para ${actionsMenu.user.login}`}
        >
          <button
            type="button"
            className="admin-user-actions__item"
            role="menuitem"
            onClick={() => {
              const u = actionsMenu.user;
              setActionsMenu(null);
              openPwd(u);
            }}
          >
            Alterar senha
          </button>
          <button
            type="button"
            className="admin-user-actions__item admin-user-actions__item--danger"
            role="menuitem"
            onClick={() => {
              const u = actionsMenu.user;
              setActionsMenu(null);
              setDeleteError(null);
              setDeleteFor(u);
            }}
          >
            Excluir
          </button>
        </div>
      ) : null}

      {pwdFor && (
        <div className="clientes-confirm-root">
          <button
            type="button"
            className="clientes-confirm-backdrop"
            aria-label="Fechar"
            onClick={closePwd}
            disabled={loadingPwd}
          />
          <div
            className="clientes-confirm-panel admin-confirm--wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby={pwdDialogTitleId}
          >
            <div className="clientes-confirm-head">
              <h2
                className="clientes-confirm-title"
                id={pwdDialogTitleId}
                style={{ margin: 0 }}
              >
                Definir nova senha
              </h2>
            </div>
            <p className="clientes-confirm-text" style={{ marginTop: 0 }}>
              Usuário: <strong className="clientes-confirm-name">{pwdFor.login}</strong>
              . A senha deve ter ao menos 8 caracteres, com maiúscula, minúscula,
              número e caractere especial.
            </p>
            {error && (
              <p className="form-error clientes-confirm-error" role="alert">
                {error}
              </p>
            )}
            <form
              className="home-form"
              onSubmit={onSubmitPwd}
              noValidate
              style={{ marginBottom: 0 }}
            >
              <div className="field home-field">
                <label htmlFor="admin-nova-senha">Nova senha</label>
                <input
                  ref={firstPwdInputRef}
                  id="admin-nova-senha"
                  type="password"
                  autoComplete="new-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
              </div>
              <div className="field home-field">
                <label htmlFor="admin-nova-senha-2">Confirmar senha</label>
                <input
                  id="admin-nova-senha-2"
                  type="password"
                  autoComplete="new-password"
                  value={senha2}
                  onChange={(e) => setSenha2(e.target.value)}
                  required
                />
              </div>
              <div className="clientes-confirm-actions" style={{ marginTop: "1rem" }}>
                <button
                  type="button"
                  className="clientes-confirm-btn clientes-confirm-btn--secondary"
                  onClick={closePwd}
                  disabled={loadingPwd}
                >
                  Cancelar
                </button>
                <button
                  className="clientes-confirm-btn"
                  type="submit"
                  disabled={loadingPwd}
                >
                  {loadingPwd ? "Salvando…" : "Salvar senha"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteFor && (
        <div className="clientes-confirm-root">
          <button
            type="button"
            className="clientes-confirm-backdrop"
            aria-label="Fechar"
            onClick={() => {
              if (loadingDel) return;
              setDeleteFor(null);
              setDeleteError(null);
            }}
            disabled={loadingDel}
          />
          <div
            className="clientes-confirm-panel"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={delDialogTitleId}
            aria-describedby={delDescId}
          >
            <div className="clientes-confirm-head">
              <span className="clientes-confirm-badge" aria-hidden="true">
                <svg
                  className="clientes-confirm-badge__icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </span>
              <h2 className="clientes-confirm-title" id={delDialogTitleId}>
                Excluir usuário?
              </h2>
            </div>
            <p className="clientes-confirm-text" id={delDescId}>
              A conta{" "}
              <strong className="clientes-confirm-name">
                {deleteFor.login}
              </strong>{" "}
              será desativada (exclusão lógica) e deixará de aparecer na lista.
            </p>
            {deleteError ? (
              <p className="form-error clientes-confirm-error" role="alert">
                {deleteError}
              </p>
            ) : null}
            <div className="clientes-confirm-actions">
              <button
                ref={deleteCancelRef}
                type="button"
                className="clientes-confirm-btn clientes-confirm-btn--secondary"
                onClick={() => {
                  if (loadingDel) return;
                  setDeleteFor(null);
                  setDeleteError(null);
                }}
                disabled={loadingDel}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="clientes-confirm-btn clientes-confirm-btn--danger"
                onClick={() => void confirmDelete()}
                disabled={loadingDel}
                aria-busy={loadingDel}
              >
                {loadingDel ? "Excluindo…" : "Excluir usuário"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
