import { requireUser } from "@/lib/auth/current";
import { getDb } from "@/lib/db";
import { listUsers } from "@/lib/cms/users";
import { ActiveForm, CreateUser, ResetPassword, RoleForm } from "./forms";

export const metadata = { title: "Korisnici – Saloon admin", robots: { index: false } };

export default async function UsersPage() {
  const me = await requireUser("admin"); // editors are redirected to /admin
  const list = await listUsers(await getDb());
  return (
    <>
      <h2>Korisnici / Users</h2>
      <p className="muted">
        Administrator upravlja korisnicima i cijenama; urednik (editor) samo uređuje cjenik. / Admins manage users and prices; editors only edit the price list.
      </p>
      {list.map((u) => (
        <article key={u.id} className={`user-card${u.active ? "" : " is-hidden"}`}>
          <header>
            <strong>{u.email}</strong>
            {u.name && <span className="muted"> · {u.name}</span>}
            {u.id === me.id && <span className="badge">vi / you</span>}
            <span className="badge">{u.role}</span>
            {!u.active && <span className="badge">onemogućen / disabled</span>}
          </header>
          <div className="user-actions">
            <RoleForm id={u.id} role={u.role} />
            <ActiveForm id={u.id} active={u.active} />
            <ResetPassword id={u.id} />
          </div>
        </article>
      ))}
      <CreateUser />
    </>
  );
}
