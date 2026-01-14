import { createClient } from '@/lib/supabase/server'
import { ProductService } from '@calmar/database'
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@calmar/ui'
import { ChevronLeft, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { updateProduct, deleteProduct } from '../../actions'
import { ImageUploader } from '@/components/image-uploader'
import { uploadProductImage } from '../../actions'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const productService = new ProductService(supabase)
  
  let product
  try {
    product = await productService.getProductBySku(id)
  } catch (error) {
    // Si no se encuentra por SKU, intentar por ID
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
    
    if (!data) {
      return <div className="p-8">Producto no encontrado</div>
    }
    
    product = await productService.getProductBySku(data.sku)
  }

  if (!product) {
    return <div className="p-8">Producto no encontrado</div>
  }

  async function handleUpdate(formData: FormData) {
    'use server'
    
    const updates = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      short_description: formData.get('short_description') as string || undefined,
      base_price: parseFloat(formData.get('base_price') as string),
      cost_price: formData.get('cost_price') ? parseFloat(formData.get('cost_price') as string) : undefined,
      is_active: formData.get('is_active') === 'on',
      is_featured: formData.get('is_featured') === 'on',
      weight_grams: formData.get('weight_grams') ? parseInt(formData.get('weight_grams') as string) : undefined,
      requires_refrigeration: formData.get('requires_refrigeration') === 'on',
      meta_title: formData.get('meta_title') as string || undefined,
      meta_description: formData.get('meta_description') as string || undefined,
    }

    const result = await updateProduct(product.id, updates)
    
    if (result.error) {
      throw new Error(result.error)
    }
    
    redirect('/products')
  }

  async function handleDelete() {
    'use server'
    
    const result = await deleteProduct(product.id)
    
    if (result.error) {
      throw new Error(result.error)
    }
    
    redirect('/products')
  }

  async function handleImageUpload(file: File) {
    'use server'
    
    const formData = new FormData()
    formData.append('image', file)
    
    const result = await uploadProductImage(product.id, formData)
    
    if (result.error) {
      return { error: result.error }
    }
    
    return { success: true, imageUrl: result.imageUrl }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <Link href="/products" className="text-slate-500 hover:text-calmar-ocean flex items-center gap-1 text-xs font-bold uppercase tracking-widest transition-colors">
        <ChevronLeft className="w-4 h-4" /> Volver a productos
      </Link>

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Editar Producto</h1>
          <p className="text-slate-500 mt-2">SKU: <span className="text-slate-900 font-bold font-mono">{product.sku}</span></p>
        </div>
      </div>

      <form action={handleUpdate} className="space-y-6">
        {/* Sección de Imagen */}
        <Card className="border-none shadow-xl">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Imagen del Producto</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <ImageUploader
              currentImageUrl={product.image_url}
              onUpload={handleImageUpload}
              label="Imagen principal"
              maxSizeMB={5}
            />
          </CardContent>
        </Card>

        {/* Información General */}
        <Card className="border-none shadow-xl">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Información General</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nombre del Producto *</label>
                <Input name="name" defaultValue={product.name} required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">SKU</label>
                <Input name="sku" defaultValue={product.sku} disabled className="bg-slate-100" />
                <p className="text-xs text-slate-400">El SKU no se puede modificar</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Descripción Corta</label>
              <Input name="short_description" defaultValue={product.short_description || ''} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Descripción Completa</label>
              <textarea 
                name="description" 
                defaultValue={product.description || ''}
                className="w-full min-h-[150px] p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-calmar-ocean/20 transition-all text-sm"
                placeholder="Descripción detallada del producto..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Precio Base (CLP) *</label>
                <Input name="base_price" type="number" step="0.01" defaultValue={product.base_price} required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Precio Costo (CLP)</label>
                <Input name="cost_price" type="number" step="0.01" defaultValue={product.cost_price || ''} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Peso (gramos)</label>
                <Input name="weight_grams" type="number" defaultValue={product.weight_grams || ''} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="is_active" 
                    name="is_active" 
                    defaultChecked={product.is_active}
                    className="w-5 h-5 rounded border-slate-300 text-calmar-ocean focus:ring-calmar-ocean"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium cursor-pointer">Producto Activo</label>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="is_featured" 
                    name="is_featured" 
                    defaultChecked={product.is_featured}
                    className="w-5 h-5 rounded border-slate-300 text-calmar-ocean focus:ring-calmar-ocean"
                  />
                  <label htmlFor="is_featured" className="text-sm font-medium cursor-pointer">Producto Destacado</label>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="requires_refrigeration" 
                    name="requires_refrigeration" 
                    defaultChecked={product.requires_refrigeration}
                    className="w-5 h-5 rounded border-slate-300 text-calmar-ocean focus:ring-calmar-ocean"
                  />
                  <label htmlFor="requires_refrigeration" className="text-sm font-medium cursor-pointer">Requiere Refrigeración</label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEO */}
        <Card className="border-none shadow-xl">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-sm font-bold uppercase tracking-widest">SEO (Opcional)</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Meta Título</label>
              <Input name="meta_title" defaultValue={product.meta_title || ''} placeholder="Título para motores de búsqueda" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Meta Descripción</label>
              <textarea 
                name="meta_description" 
                defaultValue={product.meta_description || ''}
                className="w-full min-h-[100px] p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-calmar-ocean/20 transition-all text-sm"
                placeholder="Descripción para motores de búsqueda..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="flex justify-between items-center pt-4">
          <form action={handleDelete}>
            <Button 
              type="submit"
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 font-bold uppercase text-xs tracking-widest px-6 h-12 gap-2"
              onClick={(e) => {
                if (!confirm('¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.')) {
                  e.preventDefault()
                }
              }}
            >
              <Trash2 className="h-4 w-4" /> Eliminar Producto
            </Button>
          </form>
          
          <div className="flex gap-4">
            <Link href="/products">
              <Button variant="outline" className="font-bold uppercase text-xs tracking-widest px-8 h-12">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" className="bg-slate-900 hover:bg-calmar-ocean text-white font-bold uppercase text-xs tracking-widest px-8 h-12 gap-2">
              <Save className="h-4 w-4" /> Guardar Cambios
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
