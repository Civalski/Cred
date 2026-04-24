import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Administrador | Grupo Cred",
  description: "Painel administrativo com cadastros de usuários.",
};

export default function AdministradorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
