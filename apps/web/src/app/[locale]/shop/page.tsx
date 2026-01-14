import { createClient } from '@/lib/supabase/server'
import { ProductService } from '@calmar/database'
import { ProductWithDetails } from '@calmar/types'
import { getTranslations, setRequestLocale } from 'next-intl/server'

export const revalidate = 60;

export default async function ShopPage({ params }: { params: Promise<{ locale: string }> }) {

  const { locale } = await params
  setRequestLocale(locale)
  
  const t = await getTranslations('Shop')
  const supabase = await createClient(true)  // Static client for products (cacheable)
  const authSupabase = await createClient()  // Auth client for user detection
  const productService = new ProductService(supabase)
  
  const { data: { user } } = await authSupabase.auth.getUser()
  console.log('[Shop] User from auth:', user?.email || 'NOT LOGGED IN')
  
  const { checkNewsletterDiscount } = await import("../checkout/actions")
  const newsletterDiscount = user ? await checkNewsletterDiscount(user.email!) : null
  console.log('[Shop] Newsletter discount result:', newsletterDiscount)

  let products: ProductWithDetails[] = []
  let categories: any[] = []
  try {
    const [productsData, categoriesData] = await Promise.all([
      productService.getProducts({ activeOnly: true, locale }),
      productService.getCategories(locale)
    ])
    products = productsData
    categories = [
       { id: 'all', name: t('categories.all') },
       ...categoriesData
    ]
  } catch (error) {
    console.error('Error fetching shop data:', error)
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Hero Header */}
      <section className="bg-primary text-primary-foreground py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-light/10 opacity-20" />
        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-serif font-medium tracking-tighter">{t('title')}</h1>
          <p className="text-secondary font-medium tracking-widest uppercase text-sm">
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Product Grid */}
      <section className="max-w-7xl mx-auto py-12 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h2 className="text-2xl font-bold">{t('allProducts')}</h2>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {categories.map((cat) => (
              <button 
                key={cat.id}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider border border-primary/20 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors flex-shrink-0"
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-slate-400">{t('noProducts')}</p>
          </div>
        ) : (
          <ProductList products={products} />
        )}
      </section>
      <DiscountInitializer discount={newsletterDiscount} />
    </main>
  )
}

import { ProductList } from "./product-list"
import { DiscountInitializer } from '@/components/product/discount-initializer'
