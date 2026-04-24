"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PedidosCadastroForm } from "@/components/PedidosCadastroForm";
import type { PedidoClienteOption, PedidoRow } from "@/lib/pedido-row";

export type { PedidoClienteOption, PedidoRow };

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

type Props = {
  clientes: PedidoClienteOption[];
  pedidos: PedidoRow[];
};

function formatData(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function PedidosView({ clientes, pedidos }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pedidoToEdit, setPedidoToEdit] = useState<PedidoRow | null>(null);
  const [pedidoToDelete, setPedidoToDelete] = useState<PedidoRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const deleteCancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const deleteDialogTitleId = useId();
  const isEditMode = pedidoToEdit != null;

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return pedidos;
    return pedidos.filter((p) => {
      const desc = p.descricao.toLowerCase();
      const tit = (p.titulo ?? "").toLowerCase();
      const nome = (p.clientNome ?? "").toLowerCase();
      const preco = String(p.preco);
      const qtd = String(p.quantidade);
      return (
        tit.includes(q) ||
        desc.includes(q) ||
        nome.includes(q) ||
        preco.includes(q) ||
        qtd.includes(q)
      );
    });
  }, [pedidos, busca]);

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
    if (!pedidoToDelete) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = requestAnimationFrame(() => deleteCancelRef.current?.focus());
    return () => {
      document.body.style.overflow = prev;
      cancelAnimationFrame(t);
    };
  }, [pedidoToDelete]);

  useEffect(() => {
    if (!pedidoToDelete) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !deletingId) {
        e.preventDefault();
        setPedidoToDelete(null);
        setDeleteError(null);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pedidoToDelete, deletingId]);

  function openNovo() {
    setPedidoToEdit(null);
    setOpen(true);
  }

  function openEditar(p: PedidoRow) {
    setPedidoToEdit(p);
    setOpen(true);
  }

  function closeDrawer() {
    setOpen(false);
    setPedidoToEdit(null);
  }

  function handleFormDone() {
    setOpen(false);
    setPedidoToEdit(null);
  }

  function rótuloPedido(p: PedidoRow) {
    const t = p.titulo?.trim();
    return t || "Pedido";
  }

  function openConfirmDelete(p: PedidoRow) {
    setDeleteError(null);
    setPedidoToDelete(p);
  }

  function closeConfirmDelete() {
    if (deletingId) return;
    setPedidoToDelete(null);
    setDeleteError(null);
  }

  async function confirmarExclusao() {
    if (!pedidoToDelete) return;
    setDeletingId(pedidoToDelete.id);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/orders/${pedidoToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setDeleteError(data.error ?? "Não foi possível excluir o pedido");
        return;
      }
      setPedidoToDelete(null);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="clientes-shell">
      <header className="clientes-hero">
        <div className="clientes-hero-text">
          <h1 className="clientes-toolbar-title">Pedidos</h1>
          <p className="clientes-subtitle">
            Registre pedidos; o vínculo com um cliente é opcional
          </p>
        </div>
        <div className="clientes-top-bar">
          <input
            type="search"
            className="clientes-search"
            placeholder="Buscar por título, detalhes, cliente ou valor"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            aria-label="Buscar pedidos"
            disabled={pedidos.length === 0}
            title={
              pedidos.length === 0
                ? "A busca ficará ativa após o primeiro pedido"
                : undefined
            }
          />
          <button
            type="button"
            className="clientes-nuevo-btn"
            onClick={openNovo}
          >
            + Novo pedido
          </button>
        </div>
      </header>

      {pedidos.length === 0 ? (
        <div className="clientes-empty">
          <p className="clientes-empty-line">
            Ainda não há pedidos registrados. Use <strong>+ Novo pedido</strong>{" "}
            e informe título e valores. O vínculo com um cliente e os detalhes
            extras são opcionais
            {clientes.length === 0 ? (
              <>
                ; para vincular alguém, cadastre antes em{" "}
                <Link href="/clientes" className="pedidos-inline-link">
                  Clientes
                </Link>
                .
              </>
            ) : (
              "."
            )}
          </p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="clientes-empty">
          <p className="clientes-empty-line">
            Nenhum pedido encontrado para &quot;{busca.trim()}&quot;. Tente
            outro termo.
          </p>
        </div>
      ) : (
        <div className="clientes-list-section">
          <h2 className="clientes-list-heading">Pedidos registrados</h2>
          <div
            className="clientes-list-table pedidos-table"
            role="region"
            aria-label="Tabela de pedidos"
          >
            <div className="clientes-list-header-row" aria-hidden="true">
              <span className="clientes-hcell pedidos-hcell--data">Data</span>
              <span className="clientes-hcell pedidos-hcell--tit">Título</span>
              <span className="clientes-hcell">Cliente</span>
              <span className="clientes-hcell pedidos-hcell--qtd">Qtd.</span>
              <span className="clientes-hcell pedidos-hcell--preco">Preço (un.)</span>
              <span className="clientes-hcell pedidos-hcell--total">Total</span>
              <span className="clientes-hcell pedidos-hcell--desc">Detalhes</span>
              <span className="clientes-hcell clientes-hcell--acoes">Ações</span>
            </div>
            <ul className="clientes-preview-list">
              {filtrados.map((p) => {
                const total = p.preco * p.quantidade;
                return (
                  <li key={p.id} className="clientes-preview-card pedidos-row">
                    <span className="clientes-row-cell clientes-mono pedidos-cell--data">
                      {formatData(p.createdAt)}
                    </span>
                    <span className="clientes-row-cell pedidos-cell--tit">
                      {p.titulo?.trim() ? p.titulo : "—"}
                    </span>
                    <span className="clientes-preview-nome pedidos-cell--nome">
                      {p.clientNome?.trim() ? p.clientNome : "—"}
                    </span>
                    <span className="clientes-row-cell pedidos-cell--qtd">
                      {p.quantidade}
                    </span>
                    <span className="clientes-row-cell pedidos-cell--preco">
                      {money.format(p.preco)}
                    </span>
                    <span className="clientes-row-cell pedidos-cell--total">
                      {money.format(total)}
                    </span>
                    <span className="clientes-row-cell pedidos-cell--desc">
                      {p.descricao}
                    </span>
                    <div className="clientes-row-actions pedidos-row-actions">
                      <button
                        type="button"
                        className="clientes-icon-btn clientes-icon-btn--edit"
                        onClick={() => openEditar(p)}
                        disabled={deletingId === p.id}
                        aria-label={`Editar ${rótuloPedido(p)}`}
                        title="Editar"
                      >
                        <span
                          className="clientes-icon-btn__inner"
                          aria-hidden="true"
                        >
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
                        onClick={() => openConfirmDelete(p)}
                        disabled={deletingId === p.id}
                        aria-label={
                          deletingId === p.id
                            ? `Excluindo ${rótuloPedido(p)}`
                            : `Excluir ${rótuloPedido(p)}`
                        }
                        title={deletingId === p.id ? "Excluindo…" : "Excluir"}
                        aria-busy={deletingId === p.id}
                      >
                        <span
                          className="clientes-icon-btn__inner"
                          aria-hidden="true"
                        >
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

      {pedidoToDelete && (
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
                Excluir pedido?
              </h2>
            </div>
            <p
              className="clientes-confirm-text"
              id={`${deleteDialogTitleId}-desc`}
            >
              O pedido{" "}
              <strong className="clientes-confirm-name">
                {rótuloPedido(pedidoToDelete)}
              </strong>{" "}
              será removido de forma definitiva. Esta ação não pode ser
              desfeita.
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
                {deletingId !== null ? "Excluindo…" : "Excluir pedido"}
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
                {isEditMode ? "Editar pedido" : "Novo pedido"}
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
              <PedidosCadastroForm
                key={pedidoToEdit?.id ?? "novo"}
                clientes={clientes}
                onAfterSuccess={handleFormDone}
                idPrefix="drawer-ped"
                pedidoToEdit={pedidoToEdit}
              />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
