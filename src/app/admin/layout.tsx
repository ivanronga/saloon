import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/current";
import { logoutAction } from "../login/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin – Saloon", robots: { index: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return (
    <main className="wrap">
      <header className="top">
        <strong>Saloon admin</strong>
        <span>
          {user.email} ({user.role})
          <form action={logoutAction} style={{ display: "inline", marginLeft: ".75rem" }}>
            <button>Odjava / Sign out</button>
          </form>
        </span>
      </header>
      {children}
    </main>
  );
}
