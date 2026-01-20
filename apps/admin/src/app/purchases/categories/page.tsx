import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@calmar/ui'
import { createCategory, deleteCategory, updateCategory } from '../actions'
import { CategoryBadge } from '../category-badge'

export default async function PurchaseCategoriesPage() {
  const supabase = await createClient()
  const { data: categories = [], error } = await supabase
    .from('purchase_categories')
    .select('*')
    .order('created_at', { ascending: false })

  const errorMessage = error?.message || null
  const isMissingTable = error?.code === '42P01'

  return (
    <div className="p-6 md:p-8 space-y-8">
      <Link href="/purchases" className="text-slate-500 hover:text-calmar-ocean flex items-center gap-1 text-xs font-bold uppercase tracking-widest transition-colors">
        Volver a compras
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-950 uppercase">Categorías de compras</h1>
        <p className="text-slate-700 font-medium">
          Define las categorías para clasificar los gastos internos.
        </p>
      </div>

      <Card className="border-calmar-ocean/10 shadow-sm">
        <CardHeader>
          <CardTitle>Nueva categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCategory} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nombre *</label>
              <Input name="name" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Color (hex)</label>
              <Input name="color" placeholder="#1d504b" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Descripción</label>
              <textarea
                name="description"
                className="w-full min-h-[90px] p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
              <input name="is_active" type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300" />
              Categoría activa
            </label>
            <div className="md:col-span-2 flex justify-end">
              <Button className="bg-[#1d504b] hover:bg-[#153f3b] text-white font-black uppercase text-xs tracking-widest px-8 h-11">
                Guardar categoría
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-calmar-ocean/10 shadow-sm">
        <CardHeader>
          <CardTitle>Listado de categorías</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {isMissingTable
                ? 'Falta aplicar la migración de base de datos de compras.'
                : `No se pudieron cargar las categorías. ${errorMessage}`}
            </div>
          )}
          {categories.length === 0 ? (
            <div className="py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
              Aún no hay categorías registradas.
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((category: any) => (
                <div key={category.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <CategoryBadge name={category.name} color={category.color} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${category.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {category.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  <form action={updateCategory.bind(null, category.id)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nombre *</label>
                      <Input name="name" defaultValue={category.name} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Color (hex)</label>
                      <Input name="color" defaultValue={category.color ?? ''} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Descripción</label>
                      <textarea
                        name="description"
                        defaultValue={category.description ?? ''}
                        className="w-full min-h-[90px] p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
                      <input name="is_active" type="checkbox" defaultChecked={category.is_active} className="h-4 w-4 rounded border-slate-300" />
                      Categoría activa
                    </label>
                    <div className="md:col-span-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <Button variant="outline" className="uppercase text-[10px] tracking-widest">
                        Guardar cambios
                      </Button>
                    </div>
                  </form>

                  <form action={deleteCategory.bind(null, category.id)}>
                    <Button className="bg-red-600 hover:bg-red-700 text-white uppercase text-[10px] tracking-widest w-full">
                      Eliminar categoría
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
