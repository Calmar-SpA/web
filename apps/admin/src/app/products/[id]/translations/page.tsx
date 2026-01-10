
import { createClient } from '@/lib/supabase/server'
import { ProductService } from '@calmar/database'
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@calmar/ui'
import { ChevronLeft, Languages, Save } from 'lucide-react'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'

export default async function ProductTranslationsPage({ params }: { params: { id: string } }) {
  const { id } = params
  const supabase = await createClient()
  
  // Fetch product directly to get name and current translations
  const { data: product } = await supabase
    .from('products')
    .select('name, translations')
    .eq('id', id)
    .single()

  if (!product) return <div>Producto no encontrado</div>

  const enTranslation = (product.translations as any)?.en || {}

  async function updateTranslations(formData: FormData) {
    'use server'
    const name = formData.get('name_en') as string
    const description = formData.get('description_en') as string

    const sb = await createClient()
    const { data: current } = await sb.from('products').select('translations').eq('id', id).single()
    
    const updatedTranslations = {
      ...(current?.translations as any || {}),
      en: { name, description }
    }

    const { error } = await sb
      .from('products')
      .update({ translations: updatedTranslations })
      .eq('id', id)

    if (error) throw error
    revalidatePath('/products')
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <Link href="/products" className="text-slate-500 hover:text-calmar-ocean flex items-center gap-1 text-xs font-bold uppercase tracking-widest transition-colors">
        <ChevronLeft className="w-4 h-4" /> Volver a productos
      </Link>

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Traducciones</h1>
          <p className="text-slate-500 mt-2">Gestionando contenido para: <span className="text-slate-900 font-bold">{product.name}</span></p>
        </div>
      </div>

      <Card className="border-none shadow-xl">
        <CardHeader className="bg-slate-50 border-b">
          <div className="flex items-center gap-3">
            <Languages className="h-5 w-5 text-calmar-ocean" />
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Inglés (English)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <form action={updateTranslations} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Product Name (EN)</label>
              <Input name="name_en" defaultValue={enTranslation.name} placeholder="e.g. Marine Deep Hydration" />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Description (EN)</label>
              <textarea 
                name="description_en" 
                defaultValue={enTranslation.description}
                className="w-full min-h-[150px] p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-calmar-ocean/20 transition-all text-sm"
                placeholder="Describe the product in English..."
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" className="bg-slate-900 hover:bg-calmar-ocean text-white font-bold uppercase text-xs tracking-widest px-8 h-12 gap-2">
                <Save className="h-4 w-4" /> Guardar Traducción
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
