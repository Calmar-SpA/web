import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/navigation";
import { Button } from "@calmar/ui";
import { Waves, Zap, ArrowRight, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProductService } from "@calmar/database";
import { Reveal } from "@/components/ui/reveal";
import { ProductCardWithCart } from "@/components/product/product-card-with-cart";
import { DiscountInitializer } from "@/components/product/discount-initializer";
import { VideoHero } from "@/components/hero/video-hero";

export const revalidate = 60;

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {

  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Index");

  const supabase = await createClient();
  const productService = new ProductService(supabase);
  
  const { data: { user } } = await supabase.auth.getUser();
  console.log('[Home] User from auth:', user?.email || 'NOT LOGGED IN')
  
  const { checkNewsletterDiscount } = await import("./checkout/actions");
  const newsletterDiscount = user ? await checkNewsletterDiscount(user.email!) : null;
  console.log('[Home] Newsletter discount result:', newsletterDiscount)

  // Get active hero video
  const { data: heroVideo } = await supabase
    .from('site_media')
    .select('url')
    .eq('type', 'hero_video')
    .eq('is_active', true)
    .single();
  
  const heroVideoUrl = heroVideo?.url || null;

  let featuredProducts: any[] = [];
  try {
    featuredProducts = await productService.getProducts({ featuredOnly: true, locale, activeOnly: true });
  } catch (error: any) {
    console.error("Error fetching featured products:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      error
    });
  }

  return (
    <main className="flex-1 overflow-x-hidden">
      <DiscountInitializer discount={newsletterDiscount} />
      
      {/* Video Hero Section */}
      <VideoHero 
        videoUrl={heroVideoUrl}
        title={`${t("hero.title")}\n${t("hero.subtitle")}`}
        primaryButtonText={t("hero.cta")}
        primaryButtonHref="/shop"
        secondaryButtonText={locale === 'es' ? 'Nuestro Origen' : 'Our Origin'}
        secondaryButtonHref="/about"
      />

      {/* Brand Benefits */}
      <section className="py-24 bg-white">
        <div className="w-[90%] max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <Reveal delay={0.2} direction="right" className="h-full">
              <div className="group space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-calmar-ocean group-hover:scale-110 transition-transform">
                  <Waves className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-serif font-medium tracking-tight">{t("benefits.marine.title")}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{t("benefits.marine.description")}</p>
              </div>
            </Reveal>

            <Reveal delay={0.4} direction="right" className="h-full">
              <div className="group space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-calmar-ocean group-hover:scale-110 transition-transform">
                  <Zap className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-serif font-medium tracking-tight">{t("benefits.recovery.title")}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{t("benefits.recovery.description")}</p>
              </div>
            </Reveal>

            <Reveal delay={0.6} direction="right" className="h-full">
              <div className="group space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Heart className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-serif font-medium tracking-tight">{t("benefits.purity.title")}</h3>
                <p className="text-foreground/70 text-sm leading-relaxed">{t("benefits.purity.description")}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-24 bg-slate-50 overflow-hidden relative">
          <div className="w-[90%] max-w-7xl mx-auto relative z-10">
            <Reveal>
              <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                <div>
                  <h2 className="text-5xl md:text-7xl font-serif font-medium tracking-tighter leading-[0.8]">
                    {t("featured.title")}
                  </h2>
                  <p className="text-primary font-bold uppercase tracking-[0.2em] text-sm mt-4">
                    {t("featured.subtitle")}
                  </p>
                </div>
                <Link href="/shop" className="group flex items-center gap-2 text-foreground font-black uppercase tracking-tight text-xl">
                  Ver todo <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                </Link>
              </div>
            </Reveal>

            <div className="flex flex-wrap justify-center gap-8">
              {featuredProducts.map((product, index) => (
                <Reveal key={product.id} delay={index * 0.1}>
                  <div className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)] min-w-[280px] max-w-[350px] hover:-translate-y-2 transition-transform duration-500">
                    <ProductCardWithCart 
                      product={product} 
                      priority={index === 0} 
                    />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-32 relative overflow-hidden bg-primary">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-secondary/20 blur-[150px] rounded-full" />
        </div>
        
        <div className="w-[90%] max-w-4xl mx-auto relative z-10 text-center space-y-12">
          <Reveal>
            <div className="space-y-4">
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium tracking-tighter text-primary-foreground leading-[0.8]">
                {t("cta_footer.title")}
              </h2>
              <p className="text-primary-foreground/70 text-lg uppercase tracking-widest">
                {t("cta_footer.subtitle")}
              </p>
            </div>
          </Reveal>
          
          <Reveal delay={0.2}>
            <Link href="/shop">
              <Button size="lg" className="h-20 px-12 bg-primary-foreground text-primary hover:bg-secondary transition-colors font-black text-2xl rounded-none tracking-tight">
                {t("cta_footer.button")}
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
