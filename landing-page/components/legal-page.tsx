import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type LegalSection = {
  title: string;
  paragraphs: readonly string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: readonly LegalSection[];
};

export function LegalPage({
  eyebrow,
  title,
  subtitle,
  lastUpdated,
  sections,
}: LegalPageProps) {
  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-x-hidden bg-background text-white selection:bg-accent selection:text-background"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="page-glow absolute inset-0" />
        <div className="grain-overlay" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-10 md:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm text-white/78 transition hover:border-accent/50 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 text-accent-light" />
          العودة إلى الصفحة الرئيسية
        </Link>

        <section className="shadow-accent-md mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8">
          <p className="section-label">{eyebrow}</p>
          <h1 className="mt-4 font-arabic text-3xl font-semibold text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-base leading-8 text-white/68 sm:text-lg">{subtitle}</p>
          <p className="mt-4 text-sm text-white/45">{lastUpdated}</p>

          <div className="mt-10 space-y-5">
            {sections.map((section) => (
              <article
                key={section.title}
                className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5 md:p-6"
              >
                <h2 className="font-arabic text-2xl font-semibold text-white">{section.title}</h2>
                <div className="mt-4 space-y-3">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-base leading-8 text-white/70">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
