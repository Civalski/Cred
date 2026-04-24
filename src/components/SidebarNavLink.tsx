"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  children: React.ReactNode;
};

export function SidebarNavLink({ href, children }: Props) {
  const pathname = usePathname();
  const active =
    pathname === href ||
    (href !== "/" && (pathname.startsWith(`${href}/`) || pathname === href));

  return (
    <Link
      href={href}
      className={`app-sidebar-link${active ? " is-active" : ""}`}
    >
      {children}
    </Link>
  );
}
