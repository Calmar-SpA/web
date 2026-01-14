import { createClient } from '@/lib/supabase/server'
import { ProductService } from '@calmar/database'
import { ProductWithDetails } from '@calmar/types'
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@calmar/ui'
import Link from 'next/link'
import { ProductsTable } from './products-table'

export default async function ProductsPage() {
  const supabase = await createClient()
  const productService = new ProductService(supabase)
  
  let products: ProductWithDetails[] = []
  try {
    products = await productService.getProducts()
  } catch (error) {
    console.error('Error fetching products:', error)
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PRODUCTOS</h1>
          <p className="text-slate-500">Gestiona tu catálogo e inventario</p>
        </div>
        <Link href="/products/new">
          <Button className="bg-calmar-ocean hover:bg-calmar-ocean-dark text-white font-bold">
            + NUEVO PRODUCTO
          </Button>
        </Link>
      </div>

      <Card className="border-calmar-ocean/10 shadow-sm">
        <CardHeader>
          <CardTitle>Inventario Actual</CardTitle>
          <CardDescription>Total: {products.length} productos registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductsTable products={products} />
        </CardContent>
      </Card>
    </div>
  )
}
