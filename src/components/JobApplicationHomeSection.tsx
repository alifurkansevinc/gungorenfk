import { createClient } from "@/lib/supabase/server";
import { getJobFormSettings } from "@/app/actions/job-applications";
import { JobApplicationForm } from "@/components/JobApplicationForm";

/** Anasayfada gösterilen iş başvuru bölümü (ayarlar açıkken). */
export async function JobApplicationHomeSection() {
  const settings = await getJobFormSettings();
  if (!settings.is_active || !settings.show_on_homepage) return null;

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
    <section className="border-b border-siyah/10 bg-gradient-to-b from-[#faf7f8] to-[#f8f8f8] py-10 sm:py-14">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-6 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-bordo">Kariyer</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-siyah sm:text-3xl">{settings.title}</h2>
          {settings.subtitle ? <p className="mt-2 text-sm font-medium text-siyah/70">{settings.subtitle}</p> : null}
          {settings.description ? (
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-siyah/60 whitespace-pre-line">
              {settings.description}
            </p>
          ) : null}
        </div>
        <JobApplicationForm
          settings={settings}
          signedIn={!!user}
          hasProfile={hasProfile}
          prefill={prefill}
          compact
        />
      </div>
    </section>
  );
}
