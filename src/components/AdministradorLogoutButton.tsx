"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdministradorLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className="btn btn-nav-ghost"
      onClick={onClick}
      disabled={loading}
    >
      {loading ? "Saindo…" : "Sair do painel admin"}
    </button>
  );
}
