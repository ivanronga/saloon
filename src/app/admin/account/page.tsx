import { requireUser } from "@/lib/auth/current";
import { ChangeOwnPassword } from "../users/forms";

export const metadata = { title: "Račun – Saloon admin", robots: { index: false } };

export default async function AccountPage() {
  const me = await requireUser();
  return (
    <>
      <h2>Moj račun / My account</h2>
      <p className="muted">{me.email} · {me.role}</p>
      <h3>Promjena lozinke / Change password</h3>
      <p className="muted">Nakon promjene odjavljeni ste na svim ostalim uređajima. / You will be signed out on all other devices.</p>
      <ChangeOwnPassword />
    </>
  );
}
