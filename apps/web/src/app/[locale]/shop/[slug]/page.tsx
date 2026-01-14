import { createClient } from '@/lib/supabase/server'
import { ProductService } from '@calmar/database'
import { Button } from '@calmar/ui'
import { notFound } from 'next/navigation'
import { AddToCart } from './add-to-cart'
import { Metadata } from 'next'
import { locales } from '@/i18n/config'
import Image from 'next/image'
import { DiscountInitializer } from '@/components/product/discount-initializer'

export const revalidate = 60 // Revalidate once per minute

type Props = {
  params: Promise<{ slug: string; locale: string }>
}

export async function generateStaticParams() {
  const supabase = await createClient(true)
  const { data: products } = await supabase.from('products').select('sku')
  
  if (!products) return []

  const params: { slug: string; locale: string }[] = []
  
  for (const locale of locales) {
    products.forEach((product) => {
      params.push({ slug: product.sku, locale })
    })
  }

  return params
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const supabase = await createClient(true)
  const productService = new ProductService(supabase)
  
  try {
    const product = await productService.getProductBySku(slug) as any
    // Manually handle localization/fallback if productService doesn't return localized fields directly (it likely does if initialized correctly or handled manually)
    // Assuming product has fields populated or we use a helper. 
    // Looking at previous ProductService usage, it takes locale in getProducts but getProductBySku might not have it or returns raw.
    // Let's assume normalized product or raw.
    
    // Actually, looking at Home page, ProductService needs instantiation.
    // If getProductBySku doesn't take locale, we might need to manually pick translation. 
    // But for now let's use name/description.
    
    return {
      title: `${product?.name} | Calmar`,
      description: product?.description || product?.short_description || "Hidratación Premium",
      openGraph: {
        title: product?.name,
        description: product?.description || product?.short_description,
        images: product?.image_url ? [product.image_url] : [],
      }
    }
  } catch (e) {
    return {
      title: 'Producto no encontrado | Calmar'
    }
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient(true)  // Static client for products (cacheable)
  const authSupabase = await createClient()  // Auth client for user detection
  const productService = new ProductService(supabase)
  
  const { data: { user } } = await authSupabase.auth.getUser()
  const { checkNewsletterDiscount } = await import("../../checkout/actions")
  const newsletterDiscount = user ? await checkNewsletterDiscount(user.email!) : null

  let product
  try {
    product = await productService.getProductBySku(slug)
  } catch (error) {
    return notFound()
  }

  if (!product) return notFound()

  const productPrice = product.base_price;
  const discountedPrice = newsletterDiscount 
    ? Math.floor(productPrice * (1 - newsletterDiscount / 100))
    : productPrice;

  // Cache busting usando updated_at del producto
  const timestamp = product?.updated_at ? new Date(product.updated_at).getTime() : 0;
  const productImage = product.image_url?.includes('supabase.co') && timestamp > 0
    ? `${product.image_url}${product.image_url.includes('?') ? '&' : '?'}v=${timestamp}` 
    : (product.image_url || "/placeholder.png");

  return (
    <main className="min-h-screen bg-white">
      <DiscountInitializer discount={newsletterDiscount} />
      <div className="max-w-7xl mx-auto py-12 px-4 grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Product Image */}
        <div className="bg-slate-50 rounded-3xl p-12 flex items-center justify-center">
          <Image 
            src={productImage}

            alt={product.name}
            width={600}
            height={600}
            className="max-h-[600px] object-contain"
            priority
          />
        </div>

        {/* Product Info */}
        <div className="space-y-8 flex flex-col justify-center">
          <div className="space-y-2">
            <span className="text-calmar-ocean font-bold tracking-widest uppercase text-xs">Agua de Mar + Vertiente</span>
            <h1 className="text-5xl font-black tracking-tighter text-slate-900">{product.name}</h1>
            <div className="flex flex-col">
              {newsletterDiscount && (
                <span className="text-sm text-slate-400 line-through decoration-red-400 font-bold">
                  ${productPrice.toLocaleString('es-CL')}
                </span>
              )}
              <p className="text-3xl font-black bg-calmar-gradient bg-clip-text text-transparent">
                ${discountedPrice.toLocaleString('es-CL')}
              </p>
            </div>
            {newsletterDiscount ? (
              <div className="bg-calmar-mint/10 px-4 py-3 rounded-lg border border-calmar-mint/30">
                <p className="text-sm text-calmar-ocean-dark font-bold">
                  ¡Tienes un {newsletterDiscount}% de descuento por estar suscrito a nuestro newsletter!
                </p>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-calmar-mint/20 to-calmar-ocean/10 px-4 py-3 rounded-lg border border-calmar-mint/30">
                <p className="text-sm text-calmar-ocean-dark font-bold">
                  💌 ¡Suscríbete a nuestro newsletter y obtén 10% de descuento en todas tus compras!
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">Descripción</h3>
            <p className="text-slate-600 leading-relaxed text-lg">
              {product.description || product.short_description || "Disfruta de la pureza y vitalidad que solo Calmar puede ofrecer. Un equilibrio perfecto de minerales esenciales para tu hidratación diaria."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-y py-8 border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Formato</p>
              <p className="font-medium">Botella 500ml</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">SKU</p>
              <p className="font-mono text-xs">{product.sku}</p>
            </div>
          </div>

          <AddToCart product={product} />

          <div className="bg-calmar-mint/10 p-4 rounded-xl border border-calmar-mint/20">
            <p className="text-xs text-calmar-ocean-dark leading-relaxed">
              <strong>Tip Saludable:</strong> Bebe Calmar después de realizar actividad física para una recuperación mineral óptima.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
