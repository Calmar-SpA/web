import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardFooter } from './ui/card'
import { Button } from './ui/button'
import { cn } from '../lib/utils'
import { Skeleton } from './ui/skeleton'

interface ProductCardProps {
  product?: {
    id: string;
    name: string;
    base_price: number;
    sku: string;
    image_url?: string;
    categories?: Array<{ name: string }>;
    updated_at?: string;
    discount_percentage?: number;
  };
  // Legacy individual props for backward compatibility
  id?: string;
  name?: string;
  price?: number;
  discount_percentage?: number;
  image?: string;
  category?: string;
  className?: string;
  onAdd?: () => void;
  priority?: boolean;
  newsletterDiscount?: number | null;
}

export function ProductCard({ product, id, name, price, discount_percentage, image, category, className, onAdd, priority, newsletterDiscount }: ProductCardProps) {
  // Use product object if provided, otherwise fall back to individual props
  const productId = product?.id || id || '';
  const productName = product?.name || name || '';
  const productPrice = product?.base_price || price || 0;
  const productDiscount = product?.discount_percentage || discount_percentage || 0;
  
  // Priorizar descuento de newsletter si existe, sino usar descuento del producto
  const effectiveDiscount = newsletterDiscount && newsletterDiscount > 0 
    ? newsletterDiscount 
    : productDiscount;
  
  const discountedPrice = effectiveDiscount > 0 
    ? Math.floor(productPrice * (1 - effectiveDiscount / 100))
    : productPrice;
  
  const hasNewsletterDiscount = newsletterDiscount && newsletterDiscount > 0;

  // Handle image URL and cache busting
  let finalProductImage = product?.image_url || image;

  // Handle relative Supabase paths
  if (finalProductImage && !finalProductImage.startsWith('http') && !finalProductImage.startsWith('/')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      finalProductImage = `${supabaseUrl}/storage/v1/object/public/${finalProductImage}`;
    }
  }

  // Cache bust Supabase images using updated_at if available
  if (finalProductImage?.includes('supabase.co')) {
    const timestamp = product?.updated_at ? new Date(product.updated_at).getTime() : 0;
    if (timestamp > 0) {
      finalProductImage = `${finalProductImage}${finalProductImage.includes('?') ? '&' : '?'}v=${timestamp}`;
    }
  }

  const productCategory = product?.categories?.[0]?.name || category;


  return (
    <Card className={cn("group overflow-hidden border-primary/10 bg-background/50 transition-all hover:shadow-xl hover:-translate-y-1 duration-300", className)}>
      <Link href={`/shop/${product?.sku || productId}`} className="block">
        <div 
          className="relative w-full overflow-hidden bg-secondary/10"
          style={{ aspectRatio: '4/5' }}
        >
          {finalProductImage ? (
            <Image 
              src={finalProductImage} 
              alt={productName} 
              fill

              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              priority={priority}
              className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 italic">
              Sin imagen
            </div>
          )}
          {productCategory && (
            <div className="absolute top-4 left-4">
              <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-background/90 backdrop-blur-sm text-primary rounded-sm border border-primary/20">
                {productCategory}
              </span>
            </div>
          )}
          {hasNewsletterDiscount && (
            <div className="absolute top-4 right-4">
              <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-calmar-mint/90 backdrop-blur-sm text-calmar-ocean-dark rounded-sm border border-calmar-mint/30">
                -{effectiveDiscount}% Newsletter
              </span>
            </div>
          )}
        </div>
        <CardContent className="p-4 space-y-1">
          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
            {productName}
          </h3>
          <div className="flex flex-col">
            {effectiveDiscount > 0 && (
              <span className="text-xs text-slate-400 line-through decoration-red-400 font-bold">
                ${productPrice.toLocaleString('es-CL')}
              </span>
            )}
            <p className="text-xl font-black bg-calmar-gradient bg-clip-text text-transparent">
              ${discountedPrice.toLocaleString('es-CL')}
            </p>
          </div>
        </CardContent>
      </Link>
      <CardFooter className="p-4 pt-0">
        <Button 
          onClick={onAdd}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-colors"
        >
          AGREGAR AL CARRO
        </Button>
      </CardFooter>
    </Card>
  )
}

ProductCard.Skeleton = function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden border-slate-100">
      <div className="aspect-[4/5] bg-slate-50 relative overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  )
}
