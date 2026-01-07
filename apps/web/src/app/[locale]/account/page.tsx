import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LoyaltyCard } from '@/components/account/loyalty-card'
import { Link } from '@/navigation'
import { ShoppingBag, Settings, LogOut, Building2 } from 'lucide-react'
import { Button } from '@calmar/ui'
import { ApiKeyManager } from '@/components/account/api-key-manager'
import { getTranslations } from 'next-intl/server'

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations("Account")
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  // Fetch points from our users table
  const { data: profile } = await supabase
    .from('users')
    .select('points_balance, full_name, role')
    .eq('id', user.id)
    .single()

  const { B2BService } = await import('@calmar/database')
  const b2bService = new B2BService(supabase)
  const b2bClient = await b2bService.getClientByUserId(user.id)

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-0 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t("title")}</h1>
          <p className="text-slate-500 mt-2">{t("greeting", { name: profile?.full_name || user.email })}</p>
        </div>
        {profile?.role === 'b2b' && (
          <div className="bg-calmar-ocean text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest italic shadow-lg shadow-calmar-ocean/20">
            {t("b2bBadge")}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        <div className="md:col-span-1 space-y-6">
          <LoyaltyCard balance={profile?.points_balance || 0} />
          
          <nav className="space-y-1">
            <Link href="/account/orders" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100 transition-colors text-slate-700 font-medium group">
              <ShoppingBag className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              {t("orders")}
            </Link>
            <Link href="/account/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100 transition-colors text-slate-700 font-medium group">
              <Settings className="h-5 w-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
              {t("settings.navTitle")}
            </Link>
            <form action="/auth/signout" method="post">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors text-slate-700 font-medium group">
                <LogOut className="h-5 w-5 text-slate-400 group-hover:text-red-500 transition-colors" />
                <span className="group-hover:text-red-600 transition-colors">{t("logout")}</span>
              </button>
            </form>
          </nav>
        </div>

        <div className="md:col-span-2 space-y-6">
          {b2bClient ? (
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Building2 className="h-24 w-24" />
              </div>
              <div className="relative z-10">
                <h2 className="text-xl font-black italic uppercase tracking-tight mb-4">{t("b2bProfile")}</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{t("companyName")}</label>
                    <p className="font-bold">{b2bClient.company_name}</p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{t("taxId")}</label>
                    <p className="font-bold">{b2bClient.tax_id}</p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{t("discount")}</label>
                    <p className="text-2xl font-black text-calmar-mint">{b2bClient.discount_percentage}%</p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{t("availableCredit")}</label>
                    <p className="text-2xl font-black text-white">${Number(b2bClient.credit_limit).toLocaleString('es-CL')}</p>
                  </div>
                </div>
                {!b2bClient.is_active && (
                  <div className="mt-6 bg-amber-500/20 border border-amber-500/50 rounded-lg p-3 text-amber-200 text-xs font-medium">
                    {t("pendingReview")}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center group hover:border-calmar-ocean/30 transition-colors">
              <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4 group-hover:text-calmar-ocean/50 transition-colors" />
              <h2 className="text-lg font-bold text-slate-900">{t("isBusiness")}</h2>
              <p className="text-slate-500 text-sm mt-2 mb-6">
                {t("b2bBenefit")}
              </p>
              <Link href="/b2b-apply">
                <Button variant="outline" className="border-slate-300 hover:border-slate-900 font-bold uppercase text-xs tracking-widest">
                  {t("applyNow")}
                </Button>
              </Link>
            </div>
          )}

          {b2bClient?.is_active && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <ApiKeyManager 
                clientId={b2bClient.id} 
                existingKeys={await b2bService.getApiKeys(b2bClient.id)} 
              />
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4 italic uppercase tracking-tight">{t("rewardsTitle")}</h2>
            <div className="bg-indigo-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-indigo-900">{t("soon")}</p>
                <p className="text-xs text-indigo-700">{t("soonDesc")}</p>
              </div>
              <div className="opacity-30">
                <ShoppingBag className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
