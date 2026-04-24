import { redirect } from "next/navigation";

export default function RegistroPage() {
  redirect("/?cadastro=1#acesso");
}
