import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/navigation";
import { Button } from "@calmar/ui";
import { Heart, Zap, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("About");

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-slate-950">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/3 -left-20 w-[400px] h-[400px] bg-calmar-ocean/30 blur-[100px] rounded-full" />
          <div className="absolute bottom-1/3 -right-20 w-[400px] h-[400px] bg-calmar-mint/20 blur-[100px] rounded-full" />
        </div>

        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center space-y-6">
          <Reveal>
            <h1 className="text-6xl md:text-8xl font-serif font-medium tracking-tighter text-white leading-[0.8]">
              {t("hero.title")}
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-calmar-mint/80 text-xl font-medium tracking-widest uppercase">
              {t("hero.subtitle")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 space-y-12">
          <Reveal>
            <h2 className="text-4xl md:text-5xl font-serif font-medium tracking-tighter text-center">
              {t("story.title")}
            </h2>
          </Reveal>
          <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
            <Reveal delay={0.2}>
              <p>{t("story.p1")}</p>
            </Reveal>
            <Reveal delay={0.4}>
              <p>{t("story.p2")}</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <Reveal>
            <h2 className="text-4xl md:text-5xl font-serif font-medium tracking-tighter">
              {t("mission.title")}
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
              {t("mission.text")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <Reveal>
            <h2 className="text-4xl md:text-5xl font-serif font-medium tracking-tighter text-center mb-16">
              {t("values.title")}
            </h2>
          </Reveal>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <Reveal delay={0.1} direction="up" className="h-full">
              <div className="group text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-calmar-ocean/10 flex items-center justify-center text-calmar-ocean group-hover:scale-110 transition-transform">
                  <Heart className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-serif font-medium tracking-tight">{t("values.purity.title")}</h3>
                <p className="text-slate-500 leading-relaxed">{t("values.purity.description")}</p>
              </div>
            </Reveal>

            <Reveal delay={0.3} direction="up" className="h-full">
              <div className="group text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-calmar-ocean/10 flex items-center justify-center text-calmar-ocean group-hover:scale-110 transition-transform">
                  <Zap className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-serif font-medium tracking-tight">{t("values.performance.title")}</h3>
                <p className="text-slate-500 leading-relaxed">{t("values.performance.description")}</p>
              </div>
            </Reveal>

            <Reveal delay={0.5} direction="up" className="h-full">
              <div className="group text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-calmar-ocean/10 flex items-center justify-center text-calmar-ocean group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-black tracking-tight">{t("values.sustainability.title")}</h3>
                <p className="text-slate-500 leading-relaxed">{t("values.sustainability.description")}</p>
              </div>
            </Reveal>

            <Reveal delay={0.7} direction="up" className="h-full">
              <div className="group text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-calmar-ocean/10 flex items-center justify-center text-calmar-ocean group-hover:scale-110 transition-transform">
                  <Sparkles className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-serif font-medium tracking-tight">{t("values.authenticity.title")}</h3>
                <p className="text-slate-500 leading-relaxed">{t("values.authenticity.description")}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <Reveal>
            <h2 className="text-4xl md:text-6xl font-medium tracking-tighter text-white">
              {locale === 'es' ? '¿Listo para probar la diferencia?' : 'Ready to feel the difference?'}
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <Link href="/shop">
              <Button size="lg" className="h-16 px-10 bg-white text-slate-950 hover:bg-calmar-mint transition-colors font-black text-xl rounded-none tracking-tight">
                {locale === 'es' ? 'Ver productos' : 'View products'} <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
