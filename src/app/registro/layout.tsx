import { AppHeader } from "@/components/AppHeader";

export default function RegistroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}
