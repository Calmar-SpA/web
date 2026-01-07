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
  };
  // Legacy individual props for backward compatibility
  id?: string;
  name?: string;
  price?: number;
  image?: string;
  category?: string;
  className?: string;
  onAdd?: () => void;
  priority?: boolean;
}

export function ProductCard({ product, id, name, price, image, category, className, onAdd, priority }: ProductCardProps) {
  // Use product object if provided, otherwise fall back to individual props
  const productId = product?.id || id || '';
  const productName = product?.name || name || '';
  const productPrice = product?.base_price || price || 0;
  const productImage = product?.image_url || image;
  const productCategory = product?.categories?.[0]?.name || category;

  return (
    <Card className={cn("group overflow-hidden border-calmar-ocean/10 transition-all hover:shadow-xl hover:-translate-y-1 duration-300", className)}>
      <Link href={`/shop/${product?.sku || productId}`} className="block">
        <div className="aspect-[4/5] relative overflow-hidden bg-slate-50">
          {productImage ? (
            <Image 
              src={productImage} 
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
              <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-white/90 backdrop-blur-sm text-calmar-ocean rounded-sm border border-calmar-ocean/20">
                {productCategory}
              </span>
            </div>
          )}
        </div>
        <CardContent className="p-4 space-y-1">
          <h3 className="font-bold text-slate-900 group-hover:text-calmar-ocean transition-colors">
            {productName}
          </h3>
          <p className="text-xl font-black italic bg-calmar-gradient bg-clip-text text-transparent">
            ${productPrice.toLocaleString('es-CL')}
          </p>
        </CardContent>
      </Link>
      <CardFooter className="p-4 pt-0">
        <Button 
          onClick={onAdd}
          className="w-full bg-slate-900 hover:bg-calmar-ocean text-white font-bold transition-colors"
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
