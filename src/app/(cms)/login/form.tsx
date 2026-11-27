"use client";
import { useActionState } from "react";
import { loginAction } from "./actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="form">
      <label>Email<input name="email" type="email" autoComplete="username" required /></label>
      <label>Lozinka / Password<input name="password" type="password" autoComplete="current-password" required /></label>
      {state?.error && <p role="alert" className="error">{state.error}</p>}
      <button disabled={pending}>Prijava / Sign in</button>
    </form>
  );
}
