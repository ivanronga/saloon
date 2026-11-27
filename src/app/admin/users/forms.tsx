"use client";
import { useActionState, useEffect, useRef } from "react";
import {
  changeOwnPasswordAction, createUserAction, resetPasswordAction, setActiveAction, setRoleAction, type State,
} from "./actions";

function Status({ state, okText }: { state: State; okText: string }) {
  return (
    <span role="status">
      {state?.ok ? <span className="ok">✓ {okText}</span> : null}
      {state?.error ? <span className="error">{state.error}</span> : null}
    </span>
  );
}

/** Clears the form (notably password fields) after a successful submit. */
function useResetOnSuccess(state: State) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return ref;
}

export function CreateUser() {
  const [state, action, pending] = useActionState(createUserAction, undefined);
  const ref = useResetOnSuccess(state);
  return (
    <form ref={ref} action={action} className="user-form new-group">
      <strong>+ Novi korisnik / New user</strong>
      <label>Email<input name="email" type="email" required maxLength={254} autoComplete="off" /></label>
      <label>Ime / Name<input name="name" maxLength={120} autoComplete="off" /></label>
      <label>Uloga / Role
        <select name="role" defaultValue="editor">
          <option value="editor">editor</option>
          <option value="admin">admin</option>
        </select>
      </label>
      <label>Lozinka / Password (min 12)<input name="password" type="password" required minLength={12} maxLength={200} autoComplete="new-password" /></label>
      <button disabled={pending}>Dodaj / Add</button>
      <Status state={state} okText="Dodano / Added" />
    </form>
  );
}

export function RoleForm({ id, role }: { id: number; role: "admin" | "editor" }) {
  const [state, action, pending] = useActionState(setRoleAction, undefined);
  return (
    <form action={action} className="inline-form">
      <input type="hidden" name="id" value={id} />
      <select name="role" defaultValue={role} aria-label="Uloga / Role">
        <option value="editor">editor</option>
        <option value="admin">admin</option>
      </select>
      <button className="btn-small" disabled={pending}>Spremi ulogu / Save role</button>
      <Status state={state} okText="OK" />
    </form>
  );
}

export function ActiveForm({ id, active }: { id: number; active: boolean }) {
  const [state, action, pending] = useActionState(setActiveAction, undefined);
  return (
    <form action={action} className="inline-form">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="active" value={active ? "0" : "1"} />
      <button className={`btn-small${active ? " btn-danger" : ""}`} disabled={pending}>
        {active ? "Onemogući / Disable" : "Omogući / Enable"}
      </button>
      <Status state={state} okText="OK" />
    </form>
  );
}

export function ResetPassword({ id }: { id: number }) {
  const [state, action, pending] = useActionState(resetPasswordAction, undefined);
  const ref = useResetOnSuccess(state);
  return (
    <form ref={ref} action={action} className="inline-form">
      <input type="hidden" name="id" value={id} />
      <input name="password" type="password" required minLength={12} maxLength={200} autoComplete="new-password" placeholder="Nova lozinka / New password" aria-label="Nova lozinka / New password" />
      <button className="btn-small" disabled={pending}>Postavi lozinku / Set password</button>
      <Status state={state} okText="Lozinka postavljena / Password set" />
    </form>
  );
}

export function ChangeOwnPassword() {
  const [state, action, pending] = useActionState(changeOwnPasswordAction, undefined);
  const ref = useResetOnSuccess(state);
  return (
    <form ref={ref} action={action} className="form narrow">
      <label>Trenutna lozinka / Current password<input name="current" type="password" required autoComplete="current-password" maxLength={200} /></label>
      <label>Nova lozinka / New password (min 12)<input name="next" type="password" required minLength={12} maxLength={200} autoComplete="new-password" /></label>
      <label>Ponovite novu lozinku / Repeat new password<input name="confirm" type="password" required minLength={12} maxLength={200} autoComplete="new-password" /></label>
      <div className="item-actions">
        <button disabled={pending}>Promijeni lozinku / Change password</button>
        <Status state={state} okText="Lozinka promijenjena / Password changed" />
      </div>
    </form>
  );
}
