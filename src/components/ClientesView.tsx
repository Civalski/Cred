"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ClientesCadastroForm } from "@/components/ClientesCadastroForm";
import type { ClienteRow } from "@/lib/cliente-row";

export type { ClienteRow };

function formatCpf(digits: string) {
  const d = digits.replace(/\D/g, "");
  if (d.length !== 11) return digits;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function iniciais(nome: string) {
  const t = nome.trim();
  if (!t) return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0].slice(0, 1) + parts[parts.length - 1].slice(0, 1))
      .toUpperCase()
      .slice(0, 2);
  }
  return t.slice(0, 2).toUpperCase();
}

function previewRg(rg: string) {
  const s = rg.trim();
  if (s.length <= 12) return s;
  return `…${s.slice(-4)}`;
}

type Props = {
  rows: ClienteRow[];
};

export function ClientesView({ rows }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<ClienteRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<ClienteRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const deleteCancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const deleteDialogTitleId = useId();
  const isEditMode = clientToEdit != null;

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const email = r.email.toLowerCase();
      const nome = r.nome.toLowerCase();
      const cpf = r.cpf.replace(/\D/g, "");
      const rg = r.rg.toLowerCase();
      return (
        nome.includes(q) ||
        email.includes(q) ||
        cpf.includes(q.replace(/\D/g, "")) ||
        rg.includes(q)
      );
    });
  }, [rows, busca]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = requestAnimationFrame(() => closeBtnRef.current?.focus());
    return () => {
      document.body.style.overflow = prev;
      cancelAnimationFrame(t);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!clientToDelete) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = requestAnimationFrame(() => deleteCancelRef.current?.focus());
    return () => {
      document.body.style.overflow = prev;
      cancelAnimationFrame(t);
    };
  }, [clientToDelete]);

  useEffect(() => {
    if (!clientToDelete) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !deletingId) {
        e.preventDefault();
        setClientToDelete(null);
        setDeleteError(null);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [clientToDelete, deletingId]);

  function handleFormDone() {
    setOpen(false);
    setClientToEdit(null);
  }

  function openNovo() {
    setClientToEdit(null);
    setOpen(true);
  }

  function openEditar(row: ClienteRow) {
    setClientToEdit(row);
    setOpen(true);
  }

  function closeDrawer() {
    setOpen(false);
    setClientToEdit(null);
  }

  function openConfirmDelete(row: ClienteRow) {
    setDeleteError(null);
    setClientToDelete(row);
  }

  function closeConfirmDelete() {
    if (deletingId) return;
    setClientToDelete(null);
    setDeleteError(null);
  }

  async function confirmarExclusao() {
    if (!clientToDelete) return;
    setDeletingId(clientToDelete.id);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/clients/${clientToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setDeleteError(
          data.error ?? "Não foi possível excluir o cliente",
        );
        return;
      }
      setClientToDelete(null);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="clientes-shell">
      <header className="clientes-hero">
        <div className="clientes-hero-text">
          <h1 className="clientes-toolbar-title">Clientes</h1>
          <p className="clientes-subtitle">
            Gerencie seus clientes e contatos
          </p>
        </div>
        <div className="clientes-top-bar">
          <input
            type="search"
            className="clientes-search"
            placeholder="Buscar por nome, e-mail, CPF ou RG"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            aria-label="Buscar clientes"
          />
          <button
            type="button"
            className="clientes-nuevo-btn"
            onClick={openNovo}
          >
            + Novo cliente
          </button>
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="clientes-empty">
          <p className="clientes-empty-line">
            Ainda não há clientes cadastrados. Para começar, clique em{" "}
            <strong>+ Novo cliente</strong> e preencha os dados do primeiro
            contato.
          </p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="clientes-empty">
          <p className="clientes-empty-line">
            Nenhum cliente encontrado para &quot;{busca.trim()}&quot;. Tente
            outro termo.
          </p>
        </div>
      ) : (
        <div className="clientes-list-section">
          <h2 className="clientes-list-heading">Clientes cadastrados</h2>
          <div
            className="clientes-list-table"
            role="region"
            aria-label="Tabela de clientes"
          >
            <div className="clientes-list-header-row" aria-hidden="true">
              <span className="clientes-hcell clientes-hcell--nome">
                Cliente
              </span>
              <span className="clientes-hcell">CPF</span>
              <span className="clientes-hcell">RG</span>
              <span className="clientes-hcell clientes-hcell--idade">Idade</span>
              <span className="clientes-hcell">E-mail</span>
              <span className="clientes-hcell clientes-hcell--acoes">Ações</span>
            </div>
            <ul className="clientes-preview-list">
              {filtrados.map((r) => {
                const rgLabel = previewRg(r.rg);
                const showRgTitle = r.rg.trim() !== rgLabel;
                return (
                  <li key={r.id} className="clientes-preview-card">
                    <div className="clientes-row-identity">
                      <div
                        className="clientes-preview-avatar"
                        aria-hidden="true"
                      >
                        {iniciais(r.nome)}
                      </div>
                      <p className="clientes-preview-nome">{r.nome}</p>
                    </div>
                    <span className="clientes-row-cell clientes-mono">
                      {formatCpf(r.cpf)}
                    </span>
                    <span
                      className="clientes-row-cell clientes-mono"
                      title={showRgTitle ? r.rg : undefined}
                    >
                      {rgLabel.trim() ? rgLabel : "—"}
                    </span>
                    <span className="clientes-row-cell clientes-row-cell--idade">
                      {r.idade} {r.idade === 1 ? "ano" : "anos"}
                    </span>
                    <span className="clientes-row-cell clientes-row-cell--mail">
                      <a
                        className="clientes-mail-link"
                        href={`mailto:${r.email}`}
                        title={r.email}
                      >
                        {r.email}
                      </a>
                    </span>
                    <div className="clientes-row-actions">
                      <button
                        type="button"
                        className="clientes-icon-btn clientes-icon-btn--edit"
                        onClick={() => openEditar(r)}
                        disabled={deletingId === r.id}
                        aria-label={`Editar ${r.nome}`}
                        title="Editar"
                      >
                        <span className="clientes-icon-btn__inner" aria-hidden="true">
                          <svg
                            className="clientes-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                        </span>
                      </button>
                      <button
                        type="button"
                        className="clientes-icon-btn clientes-icon-btn--danger"
                        onClick={() => openConfirmDelete(r)}
                        disabled={deletingId === r.id}
                        aria-label={
                          deletingId === r.id
                            ? `Excluindo ${r.nome}`
                            : `Excluir ${r.nome}`
                        }
                        title={
                          deletingId === r.id ? "Excluindo…" : "Excluir"
                        }
                        aria-busy={deletingId === r.id}
                      >
                        <span className="clientes-icon-btn__inner" aria-hidden="true">
                          <span className="clientes-x">×</span>
                        </span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {clientToDelete && (
        <div className="clientes-confirm-root">
          <button
            type="button"
            className="clientes-confirm-backdrop"
            aria-label="Fechar"
            onClick={closeConfirmDelete}
            disabled={deletingId !== null}
          />
          <div
            className="clientes-confirm-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={deleteDialogTitleId}
            aria-describedby={`${deleteDialogTitleId}-desc`}
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
              <h2 className="clientes-confirm-title" id={deleteDialogTitleId}>
                Excluir cliente?
              </h2>
            </div>
            <p
              className="clientes-confirm-text"
              id={`${deleteDialogTitleId}-desc`}
            >
              <strong className="clientes-confirm-name">
                {clientToDelete.nome}
              </strong>{" "}
              deixará de aparecer na lista (exclusão lógica).
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
                onClick={closeConfirmDelete}
                disabled={deletingId !== null}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="clientes-confirm-btn clientes-confirm-btn--danger"
                onClick={() => void confirmarExclusao()}
                disabled={deletingId !== null}
                aria-busy={deletingId !== null}
              >
                {deletingId !== null ? "Excluindo…" : "Excluir cliente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div className="clientes-drawer-root">
          <button
            type="button"
            className="clientes-drawer-backdrop"
            aria-label="Fechar painel"
            onClick={closeDrawer}
          />
          <aside
            className="clientes-drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className="clientes-drawer-head">
              <h2 className="clientes-drawer-title" id={titleId}>
                {isEditMode ? "Editar cliente" : "Novo cliente"}
              </h2>
              <button
                ref={closeBtnRef}
                type="button"
                className="clientes-drawer-close"
                onClick={closeDrawer}
                aria-label="Fechar"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="clientes-drawer-body">
              <ClientesCadastroForm
                key={clientToEdit?.id ?? "novo"}
                onAfterSuccess={handleFormDone}
                idPrefix="drawer"
                clientToEdit={clientToEdit}
              />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
