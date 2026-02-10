import { Button, Card, CardHeader, CardTitle, CardContent, Input } from '@calmar/ui'
import Link from 'next/link'
import { createProduct } from '../actions'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function NewProductPage() {
  const supabase = await createClient()
  const { data: allProducts } = await supabase
    .from('products')
    .select('id, name, sku')
    .order('name')

  async function handleCreate(formData: FormData) {
    'use server'
    
    const result = await createProduct(formData)
    
    if (result.error) {
      // En un caso real, podrías usar cookies o searchParams para pasar el error
      throw new Error(result.error)
    }
    
    if (result.product) {
      // Redirigir a la página de edición donde se puede agregar la imagen
      redirect(`/products/${result.product.id}/edit`)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/products">
          <Button variant="ghost" size="sm">← Volver</Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo producto</h1>
      </div>

      <form action={handleCreate} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre del Producto</label>
                <Input name="name" placeholder="Ej: Calmar Hidratante Limón" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">SKU</label>
                <Input name="sku" placeholder="CAL-HID-LIM-500" required />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción Corta</label>
              <Input name="short_description" placeholder="Bebida hidratante con agua de mar..." />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción Completa</label>
              <textarea 
                name="description" 
                className="w-full min-h-[150px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-calmar-ocean/20 transition-all text-sm"
                placeholder="Descripción detallada del producto..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Precio Base (CLP)</label>
                <Input name="base_price" type="number" placeholder="2500" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Precio Costo (CLP)</label>
                <Input name="cost_price" type="number" placeholder="1200" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Peso (gramos)</label>
                <Input name="weight_grams" type="number" placeholder="500" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Alto (cm)</label>
                <Input name="height_cm" type="number" placeholder="10" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ancho (cm)</label>
                <Input name="width_cm" type="number" placeholder="10" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Largo (cm)</label>
                <Input name="length_cm" type="number" placeholder="10" required />
              </div>
              <div className="space-y-2 flex items-end">
                <div className="flex items-center gap-2 pb-2">
                  <input type="checkbox" id="is_active" name="is_active" defaultChecked className="w-4 h-4" />
                  <label htmlFor="is_active" className="text-sm font-medium">Producto Activo</label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración de Pack (Opcional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Producto Unitario Base</label>
                <select 
                  name="unit_product_id" 
                  className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-calmar-ocean/20"
                >
                  <option value="">-- No es un pack --</option>
                  {allProducts?.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">Si este producto es un pack, selecciona el producto unitario del cual descontará stock.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unidades por Pack</label>
                <Input name="units_per_pack" type="number" min="1" defaultValue="1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nota sobre Imágenes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Después de crear el producto, serás redirigido a la página de edición donde podrás agregar imágenes.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/products">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
          <Button type="submit" className="bg-calmar-ocean hover:bg-calmar-ocean-dark text-white px-8">
            Crear Producto
          </Button>
        </div>
      </form>
    </div>
  )
}
