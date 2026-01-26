import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal } from "@/components/ui/reveal";

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Terms");

  const sections = [
    "acceptance",
    "purchases",
    "shipping",
    "returns",
    "loyalty"
  ];

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative min-h-[40vh] flex items-center justify-center overflow-hidden bg-slate-950">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/3 -left-20 w-[400px] h-[400px] bg-calmar-ocean/30 blur-[100px] rounded-full" />
          <div className="absolute bottom-1/3 -right-20 w-[400px] h-[400px] bg-calmar-mint/20 blur-[100px] rounded-full" />
        </div>

        <div className="w-[90%] max-w-5xl mx-auto relative z-10 text-center space-y-6">
          <Reveal>
            <h1 className="text-5xl md:text-7xl font-serif font-medium tracking-tighter text-white leading-[0.8]">
              {t("hero.title")}
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-calmar-mint/80 text-lg font-medium tracking-widest uppercase">
              {t("hero.subtitle")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-20 bg-white">
        <div className="w-[90%] max-w-3xl mx-auto space-y-16">
          {sections.map((section, index) => (
            <Reveal key={section} delay={index * 0.1}>
              <div className="space-y-4">
                <h2 className="text-3xl font-serif font-medium tracking-tighter text-slate-900">
                  {t(`sections.${section}.title`)}
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  {t(`sections.${section}.content`)}
                </p>
              </div>
            </Reveal>
          ))}
          
          <Reveal delay={0.6}>
            <div className="pt-8 border-t border-slate-100">
              <p className="text-sm text-slate-400 font-medium uppercase tracking-widest">
                {t("lastUpdated")}
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
