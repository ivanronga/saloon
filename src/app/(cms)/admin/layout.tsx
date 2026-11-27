import type { ReactNode } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/current";
import { logoutAction } from "../login/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin – Saloon", robots: { index: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return (
    <main className="wrap">
      <header className="top">
        <span className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Saloon Caffe Bar" width={470} height={254} />
          <span className="brand-title">Admin</span>
        </span>
        <span>
          {user.email} ({user.role})
          <form action={logoutAction} style={{ display: "inline", marginLeft: ".75rem" }}>
            <button>Odjava / Sign out</button>
          </form>
        </span>
      </header>
      <nav className="admin-nav" aria-label="Admin">
        <Link href="/admin">Cjenik / Price list</Link>
        {user.role === "admin" && <Link href="/admin/users">Korisnici / Users</Link>}
        <Link href="/admin/account">Moj račun / My account</Link>
      </nav>
      {children}
    </main>
  );
}
