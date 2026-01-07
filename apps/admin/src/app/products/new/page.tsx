import { Button, Card, CardHeader, CardTitle, CardContent, Input } from '@calmar/ui'
import Link from 'next/link'

export default function NewProductPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/products">
          <Button variant="ghost" size="sm">← Volver</Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">NUEVO PRODUCTO</h1>
      </div>

      <form className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Precio Base (CLP)</label>
                <Input name="base_price" type="number" placeholder="2500" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Precio Costo (CLP)</label>
                <Input name="cost_price" type="number" placeholder="1200" />
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

        <div className="flex justify-end gap-4">
          <Link href="/products">
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button className="bg-calmar-ocean hover:bg-calmar-ocean-dark text-white px-8">
            Guardar Producto
          </Button>
        </div>
      </form>
    </div>
  )
}
