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
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-sm font-medium text-slate-500">
                  <th className="py-4 px-4">SKU</th>
                  <th className="py-4 px-4">Producto</th>
                  <th className="py-4 px-4">Precio Base</th>
                  <th className="py-4 px-4">Stock</th>
                  <th className="py-4 px-4">Estado</th>
                  <th className="py-4 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No hay productos registrados
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="text-sm hover:bg-slate-50/50">
                      <td className="py-4 px-4 font-mono">{product.sku}</td>
                      <td className="py-4 px-4 font-bold">{product.name}</td>
                      <td className="py-4 px-4">${product.base_price.toLocaleString('es-CL')}</td>
                      <td className="py-4 px-4">
                        <span className={`font-bold ${(product.inventory?.[0]?.quantity ?? 0) < 10 ? 'text-orange-500' : 'text-slate-900'}`}>
                          {product.inventory?.[0]?.quantity ?? 0}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {product.is_active ? (
                          <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold uppercase">Activo</span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-slate-100 text-slate-500 text-xs font-bold uppercase">Inactivo</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right flex gap-2 justify-end">
                        <Link href={`/products/${product.id}/translations`}>
                          <Button variant="outline" size="sm" className="h-8 gap-1 p-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest">Traducciones</span>
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="h-8">Editar</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
