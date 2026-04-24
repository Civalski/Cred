"use client";

import { FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PedidoClienteOption, PedidoRow } from "@/lib/pedido-row";

type Props = {
  clientes: PedidoClienteOption[];
  onAfterSuccess?: () => void;
  idPrefix?: string;
  /** Se definido, envia PATCH em vez de POST */
  pedidoToEdit?: PedidoRow | null;
};

function precoInicial(preco: number) {
  return String(preco).replace(".", ",");
}

export function PedidosCadastroForm({
  clientes,
  onAfterSuccess,
  idPrefix = "ped",
  pedidoToEdit = null,
}: Props) {
  const router = useRouter();
  const pf = (s: string) => `${idPrefix}-${s}`;
  const listId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [clientId, setClientId] = useState(
    () => pedidoToEdit?.clientId ?? "",
  );
  const [clienteBusca, setClienteBusca] = useState("");
  const [listaAberta, setListaAberta] = useState(false);
  const [titulo, setTitulo] = useState(() => pedidoToEdit?.titulo ?? "");
  const [preco, setPreco] = useState(() =>
    pedidoToEdit != null ? precoInicial(pedidoToEdit.preco) : "",
  );
  const [quantidade, setQuantidade] = useState(() =>
    pedidoToEdit != null ? String(pedidoToEdit.quantidade) : "1",
  );
  const [descricao, setDescricao] = useState(
    () => pedidoToEdit?.descricao ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isEdit = pedidoToEdit != null;

  const filtrados = useMemo(() => {
    const q = clienteBusca.trim().toLowerCase();
    if (!q) return [];
    return clientes.filter((c) => c.nome.toLowerCase().includes(q));
  }, [clientes, clienteBusca]);

  const buscaClienteTemTexto = clienteBusca.trim().length > 0;

  const selecionado = useMemo(
    () => clientes.find((c) => c.id === clientId) ?? null,
    [clientes, clientId],
  );

  useEffect(() => {
    if (!listaAberta) return;
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      if (
        listRef.current?.contains(t) ||
        searchRef.current?.contains(t)
      ) {
        return;
      }
      setListaAberta(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [listaAberta]);

  function escolherCliente(c: PedidoClienteOption) {
    setClientId(c.id);
    setClienteBusca("");
    setListaAberta(false);
  }

  function desvincularCliente() {
    setClientId("");
    setClienteBusca("");
    setListaAberta(false);
    searchRef.current?.focus();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (clientId) {
      const valido = clientes.some((c) => c.id === clientId);
      if (!valido) {
        setError("Cliente inválido. Escolha novamente na lista.");
        return;
      }
    }
    const t = titulo.trim();
    if (!t) {
      setError("Informe o título do pedido.");
      return;
    }
    const precoNum = Number(String(preco).replace(",", "."));
    if (Number.isNaN(precoNum) || precoNum < 0) {
      setError("Informe um preço válido.");
      return;
    }
    const q = Number.parseInt(quantidade, 10);
    if (Number.isNaN(q) || q < 1) {
      setError("A quantidade mínima é 1.");
      return;
    }
    setLoading(true);
    try {
      const url = isEdit
        ? `/api/orders/${pedidoToEdit.id}`
        : "/api/orders";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(clientId ? { clientId } : { clientId: null }),
          titulo: t,
          preco: precoNum,
          quantidade: q,
          descricao: descricao.trim(),
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
        setError(
          first ??
            data.error ??
            (isEdit
              ? "Não foi possível atualizar o pedido."
              : "Não foi possível criar o pedido."),
        );
        return;
      }
      if (!isEdit) {
        setTitulo("");
        setPreco("");
        setQuantidade("1");
        setDescricao("");
        setClientId("");
        setClienteBusca("");
      }
      onAfterSuccess?.();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="home-form clientes-form pedidos-form"
      onSubmit={onSubmit}
      noValidate
    >
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="field home-field pedidos-field-cliente">
        <label id={`${listId}-label`} htmlFor={clientes.length > 0 ? pf("cliente-busca") : undefined}>
          Cliente
        </label>
        {clientes.length === 0 ? (
          <p className="pedidos-field-hint" id={`${listId}-hint`}>
            Nenhum cliente cadastrado. Você pode salvar o pedido sem vínculo.{" "}
            <Link href="/clientes" className="pedidos-inline-link">
              Cadastre clientes
            </Link>{" "}
            quando quiser associar depois.
          </p>
        ) : (
          <>
        <p className="pedidos-field-hint" id={`${listId}-hint`}>
          Opcional: busque pelo nome e clique no cliente para vincular ao pedido
        </p>
        {selecionado && (
          <div className="pedidos-cliente-atual" aria-live="polite">
            <p className="pedidos-cliente-atual-text">
              <span className="pedidos-cliente-atual-label">Vinculado:</span>{" "}
              <strong>{selecionado.nome}</strong>
            </p>
            <button
              type="button"
              className="pedidos-cliente-desvincular"
              onClick={desvincularCliente}
            >
              Desvincular
            </button>
          </div>
        )}
        <input
          ref={searchRef}
          id={pf("cliente-busca")}
          type="search"
          className="pedidos-control"
          role="combobox"
          value={clienteBusca}
          onChange={(e) => {
            setClienteBusca(e.target.value);
            setListaAberta(true);
          }}
          onFocus={() => setListaAberta(true)}
          placeholder="Digite o nome do cliente…"
          autoComplete="off"
          spellCheck={false}
          aria-controls={listId}
          aria-expanded={listaAberta && buscaClienteTemTexto}
          aria-autocomplete="list"
          aria-describedby={`${listId}-hint`}
        />
        {listaAberta && buscaClienteTemTexto && (
          <ul
            ref={listRef}
            id={listId}
            className="pedidos-cliente-lista"
            role="listbox"
            aria-label="Clientes para vincular"
            aria-labelledby={`${listId}-label`}
          >
            {filtrados.length === 0 ? (
              <li className="pedidos-cliente-vazio" role="presentation">
                Nenhum cliente encontrado. Tente outro termo.
              </li>
            ) : (
              filtrados.map((c) => (
                <li key={c.id} role="option" aria-selected={c.id === clientId}>
                  <button
                    type="button"
                    className={
                      c.id === clientId
                        ? "pedidos-cliente-op is-active"
                        : "pedidos-cliente-op"
                    }
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => escolherCliente(c)}
                  >
                    {c.nome}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
          </>
        )}
      </div>

      <div className="field home-field">
        <label htmlFor={pf("titulo")}>Título do pedido</label>
        <input
          id={pf("titulo")}
          className="pedidos-control"
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex.: Instalação, conserto, orçamento nº 12"
          required
          maxLength={200}
          autoComplete="off"
        />
      </div>

      <div className="field home-field pedidos-form-row-2">
        <div>
          <label htmlFor={pf("preco")}>Preço unitário (R$)</label>
          <input
            id={pf("preco")}
            className="pedidos-control"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            required
            placeholder="0,00"
          />
        </div>
        <div>
          <label htmlFor={pf("qtd")}>Quantidade</label>
          <input
            id={pf("qtd")}
            className="pedidos-control"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="field home-field">
        <label htmlFor={pf("desc")}>Detalhes e observações (opcional)</label>
        <textarea
          id={pf("desc")}
          className="pedidos-control pedidos-textarea"
          rows={4}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Mais informações: prazo, endereço de entrega, anotações…"
          autoComplete="off"
        />
      </div>
      <button
        className="btn home-submit clientes-form-submit"
        type="submit"
        disabled={loading}
      >
        {loading
          ? "Salvando…"
          : isEdit
            ? "Salvar alterações"
            : "Salvar pedido"}
      </button>
    </form>
  );
}
