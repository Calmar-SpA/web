import { createClient } from '@/lib/supabase/server'
import { ProductService } from '@calmar/database'
import { ProductWithDetails } from '@calmar/types'
import { getTranslations, setRequestLocale } from 'next-intl/server'

export default async function ShopPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  
  const t = await getTranslations('Shop')
  const supabase = await createClient(true)
  const productService = new ProductService(supabase)
  
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
      <section className="bg-slate-900 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-calmar-gradient opacity-20" />
        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase">{t('title')}</h1>
          <p className="text-calmar-ocean-light font-medium tracking-widest uppercase text-sm">
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Product Grid */}
      <section className="max-w-7xl mx-auto py-12 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h2 className="text-2xl font-bold italic uppercase">{t('allProducts')}</h2>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {categories.map((cat) => (
              <button 
                key={cat.id}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider border rounded-full hover:bg-calmar-ocean hover:text-white transition-colors flex-shrink-0"
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-slate-400 italic">{t('noProducts')}</p>
          </div>
        ) : (
          <ProductList products={products} />
        )}
      </section>
    </main>
  )
}

import { ProductList } from "./product-list"
