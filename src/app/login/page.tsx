import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current";
import LoginForm from "./form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Prijava / Login", robots: { index: false } };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");
  return (
    <main className="wrap narrow">
      <h1>Prijava / Login</h1>
      <LoginForm />
    </main>
  );
}
