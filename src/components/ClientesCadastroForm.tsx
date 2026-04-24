"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { ClienteRow } from "@/lib/cliente-row";

type Props = {
  /** Chamado após salvar (ex.: fechar o painel) */
  onAfterSuccess?: () => void;
  /** Prefixo dos ids dos campos (evita conflito com outros formulários) */
  idPrefix?: string;
  /** Se definido, o formulário envia PATCH em vez de POST */
  clientToEdit?: ClienteRow | null;
};

export function ClientesCadastroForm({
  onAfterSuccess,
  idPrefix = "cli",
  clientToEdit = null,
}: Props) {
  const router = useRouter();
  const pf = (s: string) => `${idPrefix}-${s}`;
  const [cpf, setCpf] = useState(() => clientToEdit?.cpf ?? "");
  const [rg, setRg] = useState(() => clientToEdit?.rg ?? "");
  const [nome, setNome] = useState(() => clientToEdit?.nome ?? "");
  const [idade, setIdade] = useState(
    () => (clientToEdit != null ? String(clientToEdit.idade) : ""),
  );
  const [email, setEmail] = useState(() => clientToEdit?.email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isEdit = clientToEdit != null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const url = isEdit
        ? `/api/clients/${clientToEdit.id}`
        : "/api/clients";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf, rg, nome, idade, email }),
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
        setError(first ?? data.error ?? "Não foi possível salvar");
        return;
      }
      if (!isEdit) {
        setCpf("");
        setRg("");
        setNome("");
        setIdade("");
        setEmail("");
      }
      onAfterSuccess?.();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="home-form clientes-form"
      onSubmit={onSubmit}
      noValidate
    >
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
        <div className="field home-field">
          <label htmlFor={pf("cpf")}>CPF</label>
          <input
            id={pf("cpf")}
            name="cpf"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            required
            placeholder="Somente números ou com pontuação"
          />
        </div>
        <div className="field home-field">
          <label htmlFor={pf("rg")}>RG</label>
          <input
            id={pf("rg")}
            name="rg"
            type="text"
            autoComplete="off"
            value={rg}
            onChange={(e) => setRg(e.target.value)}
            required
            placeholder="Número do RG"
          />
        </div>
        <div className="field home-field">
          <label htmlFor={pf("nome")}>Nome completo</label>
          <input
            id={pf("nome")}
            name="nome"
            type="text"
            autoComplete="name"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            placeholder="Nome do cliente"
          />
        </div>
        <div className="field home-field">
          <label htmlFor={pf("idade")}>Idade</label>
          <input
            id={pf("idade")}
            name="idade"
            type="number"
            min={0}
            max={130}
            inputMode="numeric"
            value={idade}
            onChange={(e) => setIdade(e.target.value)}
            required
            placeholder="Ex.: 35"
          />
        </div>
        <div className="field home-field">
          <label htmlFor={pf("email")}>E-mail</label>
          <input
            id={pf("email")}
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="email@exemplo.com"
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
              : "Salvar"}
        </button>
    </form>
  );
}
