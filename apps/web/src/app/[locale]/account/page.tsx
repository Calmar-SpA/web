import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LoyaltyCard } from '@/components/account/loyalty-card'
import { PersonalDataCard } from '@/components/account/personal-data-card'
import { DebtCard, type DebtItem } from '@/components/account/debt-card'
import { Link } from '@/navigation'
import { ShoppingBag, Building2, User } from 'lucide-react'
import { Button } from '@calmar/ui'
import { getTranslations } from 'next-intl/server'
import { formatRut } from '@calmar/utils'

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations("Account")
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  let profile = null
  let b2bProspect = null
  let b2cProspect = null
  let pendingDebts: DebtItem[] = []

  try {
    // Fetch points from our users table
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('points_balance, full_name, role, rut')
      .eq('id', user.id)
      .single()
    
    if (!profileError) {
      profile = profileData
    } else if (profileError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (user profile not yet created)
      console.error('Error fetching user profile:', profileError.message, profileError.code)
    }

    // Fetch prospects (B2B and B2C)
    const { data: prospectsData, error: prospectsError } = await supabase
      .from('prospects')
      .select('id, company_name, tax_id, credit_limit, is_b2b_active, type, contact_name, email')
      .eq('user_id', user.id)

    if (!prospectsError && prospectsData) {
      b2bProspect = prospectsData.find(p => p.type === 'b2b')
      b2cProspect = prospectsData.find(p => p.type === 'b2c')

      // Fetch pending debts from product_movements
      const prospectIds = prospectsData.map(p => p.id)
      if (prospectIds.length > 0) {
        const { data: movements, error: movementsError } = await supabase
          .from('product_movements')
          .select(`
            id, 
            movement_number, 
            movement_type, 
            status, 
            total_amount, 
            amount_paid, 
            due_date,
            payments:movement_payments(amount)
          `)
          .in('prospect_id', prospectIds)
          .in('movement_type', ['sale_credit', 'consignment'])
          .in('status', ['delivered', 'sold', 'partial_paid', 'overdue'])

        if (!movementsError && movements) {
          pendingDebts = movements
            .map((m: any) => {
              const totalPaid = m.payments?.reduce(
                (sum: number, p: { amount: number }) => sum + Number(p.amount), 0
              ) || Number(m.amount_paid || 0)
              const remainingBalance = Number(m.total_amount) - totalPaid

              return {
                id: m.id,
                reference_number: m.movement_number,
                total_amount: Number(m.total_amount),
                remaining_balance: remainingBalance,
                due_date: m.due_date,
                movement_type: m.movement_type,
                status: m.status
              }
            })
            .filter((d: DebtItem) => d.remaining_balance > 0)
        }
      }
    } else if (prospectsError && prospectsError.code !== 'PGRST116') {
      console.error('Error fetching prospects:', prospectsError.message, prospectsError.code)
    }
  } catch (error) {
    console.error('Error fetching account data:', error)
  }

  return (
    <div className="space-y-8">
      {/* Header Personalizado */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-calmar-ocean/10 via-white to-calmar-mint/10 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{t("title")}</h1>
            <p className="text-slate-600 mt-2">{t("greeting", { name: profile?.full_name || user.email })}</p>
          </div>
          {(profile?.role === 'b2b' || b2bProspect?.is_b2b_active) && (
            <div className="bg-calmar-ocean text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-calmar-ocean/20 self-start sm:self-auto">
              {t("b2bBadge")}
            </div>
          )}
        </div>
      </div>

      {/* Sección Personal */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-calmar-primary rounded-full"></div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Mi Perfil Personal</h2>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            <User className="w-3 h-3 text-calmar-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Modo Activo</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PersonalDataCard
            locale={locale}
            fullName={profile?.full_name || ''}
            email={user.email || ''}
            rut={profile?.rut || ''}
          />

          <LoyaltyCard balance={profile?.points_balance || 0} />
        </div>

        {/* Sección de Deudas/Crédito por Pagar - Solo para usuarios B2B activos */}
        {b2bProspect?.is_b2b_active && (
          <div className="mt-6">
            <DebtCard debts={pendingDebts} locale={locale} />
          </div>
        )}
      </section>

      {/* Sección Empresa */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-slate-900 rounded-full"></div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Perfil de Empresa</h2>
          </div>
          {b2bProspect?.is_b2b_active && (
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
              <Building2 className="w-3 h-3 text-white" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Modo Activo</span>
            </div>
          )}
        </div>

        {b2bProspect ? (
          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-calmar-ocean/30 via-transparent to-calmar-primary/20 opacity-60"></div>
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Building2 className="h-24 w-24" />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-black uppercase tracking-tight">{t("b2bProfile")}</h3>
                {b2bProspect.is_b2b_active && (
                  <span className="bg-calmar-mint text-slate-900 text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">Activo</span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest">{t("companyName")}</label>
                  <p className="font-bold text-lg">{b2bProspect.company_name}</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest">{t("taxId")}</label>
                  <p className="font-bold text-lg">{formatRut(b2bProspect.tax_id)}</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest">Email de Empresa</label>
                  <p className="font-bold">{b2bProspect.email || '—'}</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest">{t("availableCredit")}</label>
                  <p className="text-2xl font-black text-calmar-mint">${Number(b2bProspect.credit_limit).toLocaleString('es-CL')}</p>
                </div>
              </div>
              {!b2bProspect.is_b2b_active && (
                <div className="mt-6 bg-amber-500/20 border border-amber-500/50 rounded-lg p-3 text-amber-200 text-xs font-medium">
                  {t("pendingReview")}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-50 via-white to-calmar-mint/20 rounded-3xl border border-dashed border-slate-200 p-8 text-center group hover:border-calmar-ocean/30 transition-colors flex flex-col items-center justify-center">
            <Building2 className="h-12 w-12 text-slate-300 mb-4 group-hover:text-calmar-ocean/50 transition-colors" />
            <h2 className="text-lg font-bold text-slate-900">{t("isBusiness")}</h2>
            <p className="text-slate-500 text-sm mt-2 mb-6">
              {t("b2bBenefit")}
            </p>
            <Link href="/b2b-apply">
              <Button variant="outline" className="border-slate-300 hover:bg-slate-900 hover:text-white font-bold uppercase text-xs tracking-widest transition-all">
                {t("applyNow")}
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* Próximamente */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4 uppercase tracking-tight">{t("rewardsTitle")}</h2>
        <div className="bg-calmar-ocean/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-calmar-primary-dark">{t("soon")}</p>
            <p className="text-xs text-slate-600">{t("soonDesc")}</p>
          </div>
          <div className="opacity-30">
            <ShoppingBag className="h-8 w-8 text-calmar-ocean" />
          </div>
        </div>
      </div>
    </div>
  )
}
