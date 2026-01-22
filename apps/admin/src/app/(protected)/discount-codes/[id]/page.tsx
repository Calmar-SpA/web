import { createClient } from '@/lib/supabase/server'
import { DiscountCodeService } from '@calmar/database'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { DiscountCodeForm } from '../discount-code-form'

export default async function DiscountCodeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const isNew = id === 'new'

  const service = new DiscountCodeService(supabase)

  let products: any[] = []
  let users: any[] = []
  let loadError: string | null = null

  try {
    const [{ data: productData }, { data: userData }] = await Promise.all([
      supabase.from('products').select('id, name, sku, is_active').order('name', { ascending: true }),
      supabase.from('users').select('id, email, full_name, role').order('created_at', { ascending: false }),
    ])
    products = productData || []
    users = userData || []
  } catch (error) {
    const message = (error as any)?.message || 'Error al cargar productos o usuarios'
    console.error('Error loading discount code form data:', error)
    loadError = message
  }

  let initialData = null
  let initialProductIds: string[] = []
  let initialUserIds: string[] = []

  if (!isNew) {
    try {
      initialData = await service.getDiscountCodeById(id)
      const { data: productLinks } = await supabase
        .from('discount_code_products')
        .select('product_id')
        .eq('discount_code_id', id)
      const { data: userLinks } = await supabase
        .from('discount_code_users')
        .select('user_id')
        .eq('discount_code_id', id)

      initialProductIds = (productLinks || []).map((p: any) => p.product_id)
      initialUserIds = (userLinks || []).map((u: any) => u.user_id)
    } catch (error) {
      const message = (error as any)?.message || 'Error al cargar el código'
      console.error('Error loading discount code:', error)
      loadError = message
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <Link href="/discount-codes" className="text-slate-500 hover:text-calmar-ocean flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors">
        <ChevronLeft className="w-4 h-4" /> Volver a códigos
      </Link>

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          No se pudo cargar la información. {loadError}
        </div>
      )}

      <DiscountCodeForm
        isNew={isNew}
        codeId={isNew ? null : id}
        initialData={initialData}
        initialProductIds={initialProductIds}
        initialUserIds={initialUserIds}
        products={products}
        users={users}
      />
    </div>
  )
}
