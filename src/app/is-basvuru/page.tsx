import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getJobFormSettings } from "@/app/actions/job-applications";
import { JobApplicationForm } from "@/components/JobApplicationForm";

export const metadata: Metadata = {
  title: "İş Başvurusu | Güngören FK",
  description: "Güngören FK kulübünde açık pozisyonlara taraftar üye olarak başvurun.",
};

export default async function IsBasvuruPage() {
  const settings = await getJobFormSettings();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasProfile = false;
  let prefill: { fullName: string; email: string; birthYear: string } | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("fan_profiles")
      .select("first_name, last_name, email, birth_year")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profile) {
      hasProfile = true;
      prefill = {
        fullName: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim(),
        email: profile.email ?? user.email ?? "",
        birthYear: profile.birth_year != null ? String(profile.birth_year) : "",
      };
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="border-b border-siyah/10 bg-beyaz">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
          <nav className="flex flex-wrap items-center gap-2 text-sm text-siyah/60">
            <Link href="/" className="inline-flex min-h-[44px] items-center hover:text-bordo">
              Anasayfa
            </Link>
            <span>/</span>
            <span className="text-siyah font-medium">İş Başvurusu</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <JobApplicationForm
          settings={settings}
          signedIn={!!user}
          hasProfile={hasProfile}
          prefill={prefill}
        />
      </div>
    </div>
  );
}
