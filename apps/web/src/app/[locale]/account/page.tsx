import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LoyaltyCard } from '@/components/account/loyalty-card'
import { Link } from '@/navigation'
import { ShoppingBag, Building2 } from 'lucide-react'
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

  let profile = null
  let b2bClient = null
  let apiKeys: any[] = []

  try {
    // Fetch points from our users table
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('points_balance, full_name, role')
      .eq('id', user.id)
      .single()
    
    if (!profileError) {
      profile = profileData
    } else {
      console.error('Error fetching user profile:', profileError)
    }

    try {
      const { B2BService } = await import('@calmar/database')
      const b2bService = new B2BService(supabase)
      b2bClient = await b2bService.getClientByUserId(user.id)
      
      if (b2bClient?.is_active) {
        try {
          apiKeys = await b2bService.getApiKeys(b2bClient.id)
        } catch (apiKeyError) {
          console.error('Error fetching API keys:', apiKeyError)
          apiKeys = [] // Ensure apiKeys is an empty array on error
        }
      }
    } catch (b2bError) {
      console.error('Error fetching B2B data:', b2bError)
    }
  } catch (error) {
    console.error('Error fetching account data:', error)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-calmar-ocean/10 via-white to-calmar-mint/10 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{t("title")}</h1>
            <p className="text-slate-600 mt-2">{t("greeting", { name: profile?.full_name || user.email })}</p>
          </div>
          {profile?.role === 'b2b' && (
            <div className="bg-calmar-ocean text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-calmar-ocean/20 self-start sm:self-auto">
              {t("b2bBadge")}
            </div>
          )}
        </div>
      </div>

      <LoyaltyCard balance={profile?.points_balance || 0} />

      {b2bClient ? (
        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-calmar-ocean/30 via-transparent to-calmar-primary/20 opacity-60"></div>
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Building2 className="h-24 w-24" />
          </div>
          <div className="relative z-10">
            <h2 className="text-xl font-black uppercase tracking-tight mb-4">{t("b2bProfile")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest">{t("companyName")}</label>
                <p className="font-bold">{b2bClient.company_name}</p>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest">{t("taxId")}</label>
                <p className="font-bold">{b2bClient.tax_id}</p>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest">{t("b2bPricing")}</label>
                <p className="text-sm font-black text-calmar-mint uppercase tracking-wide">{t("b2bPricingValue")}</p>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest">{t("availableCredit")}</label>
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
        <div className="bg-gradient-to-br from-slate-50 via-white to-calmar-mint/20 rounded-3xl border border-dashed border-slate-200 p-8 text-center group hover:border-calmar-ocean/30 transition-colors">
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
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <ApiKeyManager 
            clientId={b2bClient.id} 
            existingKeys={apiKeys} 
          />
        </div>
      )}

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
