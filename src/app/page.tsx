import { redirect } from "next/navigation";

// Croatian is the default language; English is reachable via the language switch (/en).
export default function Home() {
  redirect("/hr");
}
