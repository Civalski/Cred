import { AppShell } from "@/components/AppShell";

export default function PedidosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
