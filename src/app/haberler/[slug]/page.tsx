import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";

export default async function HaberDetayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: item } = await supabase.from("news").select("*").eq("slug", slug).single();
  if (!item) notFound();

  return (
    <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-siyah sm:text-3xl">{item.title}</h1>
      {item.published_at && <p className="mt-2 text-siyah/60">{new Date(item.published_at).toLocaleDateString("tr-TR")}</p>}
      {item.image_url && (
        <div className="relative mt-4 aspect-video overflow-hidden rounded-lg">
          <Image src={item.image_url} alt="" fill className="object-cover" unoptimized />
        </div>
      )}
      {item.excerpt && <p className="mt-4 text-lg text-siyah/80">{item.excerpt}</p>}
      {item.body && <div className="mt-6 prose text-siyah" dangerouslySetInnerHTML={{ __html: item.body }} />}
    </article>
  );
}
