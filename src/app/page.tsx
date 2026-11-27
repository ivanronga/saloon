import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const al = (await headers()).get("accept-language") ?? "";
  redirect(/^\s*en/i.test(al) ? "/en" : "/hr");
}
