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
  let stockTotals: Record<string, number> = {}
  
  try {
    products = await productService.getProducts()
    
    // Obtener stock actual desde inventory (refleja entradas - salidas por movimientos)
    const { data: inventoryData } = await supabase
      .from('inventory')
      .select('product_id, quantity')
    
    if (inventoryData) {
      stockTotals = inventoryData.reduce((acc, entry) => {
        // Sum quantities for products with multiple variants
        acc[entry.product_id] = (acc[entry.product_id] || 0) + (entry.quantity || 0)
        return acc
      }, {} as Record<string, number>)

      // Calculate stock for packs
      products.forEach(product => {
        if (product.unit_product_id && product.units_per_pack) {
           const unitStock = stockTotals[product.unit_product_id] || 0;
           stockTotals[product.id] = Math.floor(unitStock / product.units_per_pack);
        }
      });
    }
  } catch (error) {
    console.error('Error fetching products:', error)
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 uppercase">Productos</h1>
          <p className="text-slate-700 font-medium">Gestiona tu catálogo e inventario</p>
        </div>
        <Link href="/products/new">
          <Button className="bg-[#1d504b] hover:bg-[#153f3b] text-white font-black uppercase text-xs tracking-widest px-6 shadow-lg">
            + Nuevo producto
          </Button>
        </Link>
      </div>

      <Card className="border-calmar-ocean/10 shadow-sm">
        <CardHeader>
          <CardTitle>Inventario Actual</CardTitle>
          <CardDescription>Total: {products.length} productos registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductsTable products={products} stockTotals={stockTotals} />
        </CardContent>
      </Card>
    </div>
  )
}
