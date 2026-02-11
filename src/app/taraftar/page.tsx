import { redirect } from "next/navigation";

/** Eski "Taraftar" linki ve giriş sonrası yönlendirme: tek panel "Benim Köşem". */
export default function TaraftarPage() {
  redirect("/benim-kosem");
}
