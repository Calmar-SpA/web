import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/navigation";
import { Button, ProductCard } from "@calmar/ui";
import { Waves, Zap, ArrowRight, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProductService } from "@calmar/database";
import { Reveal } from "@/components/ui/reveal";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Index");

  const supabase = await createClient();
  const productService = new ProductService(supabase);
  
  let featuredProducts: any[] = [];
  try {
    featuredProducts = await productService.getProducts({ featuredOnly: true, locale, activeOnly: true });
  } catch (error) {
    console.error("Error fetching featured products:", error);
  }

  return (
    <main className="flex-1 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-slate-950">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-calmar-ocean/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-calmar-mint/20 blur-[120px] rounded-full" />
          <div className="absolute inset-0 bg-[url('/ocean-texture.jpg')] opacity-10 mix-blend-overlay bg-cover bg-center" />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center space-y-8">
          <Reveal direction="down" delay={0.1}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-calmar-mint text-xs font-black tracking-[0.2em] uppercase italic mx-auto">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-calmar-mint opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-calmar-mint"></span>
              </span>
              Nueva Era de Hidratación
            </div>
          </Reveal>
          
          <Reveal delay={0.2}>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black italic tracking-tighter text-white leading-[0.8] uppercase">
              {t("hero.title")}
            </h1>
          </Reveal>
          
          <Reveal delay={0.4}>
            <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium tracking-wide uppercase leading-relaxed">
              {t("hero.subtitle")}
            </p>
          </Reveal>

          <Reveal delay={0.6}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/shop">
                <Button size="lg" className="h-16 px-8 bg-calmar-gradient hover:scale-105 transition-transform text-slate-950 font-black italic text-xl rounded-none tracking-tight">
                  {t("hero.cta")} <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="h-16 px-8 border-white/20 text-white hover:bg-white/5 font-bold tracking-widest text-xs uppercase rounded-none">
                  Nuestro Origen
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-px h-12 bg-gradient-to-b from-white to-transparent" />
        </div>
      </section>

      {/* Brand Benefits */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <Reveal delay={0.2} direction="right" className="h-full">
              <div className="group space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-calmar-ocean group-hover:scale-110 transition-transform">
                  <Waves className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-black italic uppercase tracking-tight">{t("benefits.marine.title")}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{t("benefits.marine.description")}</p>
              </div>
            </Reveal>

            <Reveal delay={0.4} direction="right" className="h-full">
              <div className="group space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-calmar-ocean group-hover:scale-110 transition-transform">
                  <Zap className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-black italic uppercase tracking-tight">{t("benefits.recovery.title")}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{t("benefits.recovery.description")}</p>
              </div>
            </Reveal>

            <Reveal delay={0.6} direction="right" className="h-full">
              <div className="group space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-calmar-ocean group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-black italic uppercase tracking-tight">{t("benefits.purity.title")}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{t("benefits.purity.description")}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-24 bg-slate-50 overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <Reveal>
              <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                <div>
                  <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.8]">
                    {t("featured.title")}
                  </h2>
                  <p className="text-calmar-ocean font-bold uppercase tracking-[0.2em] text-sm mt-4">
                    {t("featured.subtitle")}
                  </p>
                </div>
                <Link href="/shop" className="group flex items-center gap-2 text-slate-950 font-black italic uppercase tracking-tight text-xl">
                  Ver todo <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                </Link>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product, index) => (
                <Reveal key={product.id} delay={index * 0.1}>
                  <div className="hover:-translate-y-2 transition-transform duration-500">
                    <ProductCard product={product} />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-32 relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-calmar-ocean/20 blur-[150px] rounded-full" />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center space-y-12">
          <Reveal>
            <div className="space-y-4">
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-black italic tracking-tighter text-white leading-[0.8] uppercase">
                {t("cta_footer.title")}
              </h2>
              <p className="text-slate-400 text-lg uppercase tracking-widest">
                {t("cta_footer.subtitle")}
              </p>
            </div>
          </Reveal>
          
          <Reveal delay={0.2}>
            <Link href="/shop">
              <Button size="lg" className="h-20 px-12 bg-white text-slate-950 hover:bg-calmar-mint transition-colors font-black italic text-2xl rounded-none tracking-tight">
                {t("cta_footer.button")}
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
