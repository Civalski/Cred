import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ registered?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const s = await searchParams;
  if (s.registered === "1") {
    redirect("/?registered=1");
  }
  redirect("/#acesso");
}
