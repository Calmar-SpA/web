"use client"

import { useState, useEffect } from 'react'
import { User, Building2, ShoppingBag } from 'lucide-react'
import { Button } from '@calmar/ui'
import { Link } from '@/navigation'
import { LoyaltyCard } from './loyalty-card'
import { PersonalDataCard } from './personal-data-card'
import { DebtCard, type DebtItem } from './debt-card'
import { useUserMode } from '@/hooks/use-user-mode'
import { formatRut } from '@calmar/utils'

interface B2BProspect {
  id: string
  company_name: string | null
  tax_id: string | null
  credit_limit: number | null
  is_b2b_active: boolean | null
  email: string | null
}

interface AccountTabsProps {
  locale: string
  profile: {
    full_name: string | null
    points_balance: number
    rut: string | null
  } | null
  userEmail: string
  b2bProspect: B2BProspect | null
  pendingDebts: DebtItem[]
  translations: {
    title: string
    greeting: string
    b2bBadge: string
    b2bProfile: string
    companyName: string
    taxId: string
    availableCredit: string
    pendingReview: string
    isBusiness: string
    b2bBenefit: string
    applyNow: string
    rewardsTitle: string
    soon: string
    soonDesc: string
    personalTab: string
    businessTab: string
    companyEmail: string
    active: string
  }
}

export function AccountTabs({
  locale,
  profile,
  userEmail,
  b2bProspect,
  pendingDebts,
  translations
}: AccountTabsProps) {
  const { mode, setMode } = useUserMode()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Show loading skeleton during hydration
  if (!isHydrated) {
    return (
      <div className="space-y-8">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-calmar-ocean/10 via-white to-calmar-mint/10 p-6 sm:p-8 animate-pulse">
          <div className="h-10 bg-slate-200 rounded-lg w-48 mb-2" />
          <div className="h-5 bg-slate-200 rounded-lg w-64" />
        </div>
        <div className="flex justify-center">
          <div className="h-10 bg-slate-100 rounded-full w-64 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-slate-100 rounded-3xl animate-pulse" />
          <div className="h-48 bg-slate-100 rounded-3xl animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-calmar-ocean/10 via-white to-calmar-mint/10 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{translations.title}</h1>
            <p className="text-slate-600 mt-2">{translations.greeting.replace('{name}', profile?.full_name || userEmail)}</p>
          </div>
          {b2bProspect?.is_b2b_active && (
            <div className="bg-calmar-ocean text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-calmar-ocean/20 self-start sm:self-auto">
              {translations.b2bBadge}
            </div>
          )}
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex items-center justify-center">
        <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200">
          <button
            onClick={() => setMode('personal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              mode === 'personal' 
                ? 'bg-white text-calmar-primary shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <User className="w-3 h-3" />
            {translations.personalTab}
          </button>
          <button
            onClick={() => setMode('business')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              mode === 'business' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building2 className="w-3 h-3" />
            {translations.businessTab}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {mode === 'personal' ? (
        <section className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PersonalDataCard
              locale={locale}
              fullName={profile?.full_name || ''}
              email={userEmail}
              rut={profile?.rut || ''}
            />
            <LoyaltyCard balance={profile?.points_balance || 0} />
          </div>

          {/* Centro de Recompensas */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4 uppercase tracking-tight">{translations.rewardsTitle}</h2>
            <div className="bg-calmar-ocean/10 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-calmar-primary-dark">{translations.soon}</p>
                <p className="text-xs text-slate-600">{translations.soonDesc}</p>
              </div>
              <div className="opacity-30">
                <ShoppingBag className="h-8 w-8 text-calmar-ocean" />
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="space-y-6">
          {b2bProspect ? (
            <>
              <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-calmar-ocean/30 via-transparent to-calmar-primary/20 opacity-60"></div>
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Building2 className="h-24 w-24" />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-black uppercase tracking-tight">{translations.b2bProfile}</h3>
                    {b2bProspect.is_b2b_active && (
                      <span className="bg-calmar-mint text-slate-900 text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">{translations.active}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest">{translations.companyName}</label>
                      <p className="font-bold text-lg">{b2bProspect.company_name}</p>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest">{translations.taxId}</label>
                      <p className="font-bold text-lg">{formatRut(b2bProspect.tax_id || '')}</p>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest">{translations.companyEmail}</label>
                      <p className="font-bold">{b2bProspect.email || '—'}</p>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest">{translations.availableCredit}</label>
                      <p className="text-2xl font-black text-calmar-mint">${Number(b2bProspect.credit_limit || 0).toLocaleString('es-CL')}</p>
                    </div>
                  </div>
                  {!b2bProspect.is_b2b_active && (
                    <div className="mt-6 bg-amber-500/20 border border-amber-500/50 rounded-lg p-3 text-amber-200 text-xs font-medium">
                      {translations.pendingReview}
                    </div>
                  )}
                </div>
              </div>

              {/* Deudas/Crédito por Pagar */}
              {b2bProspect.is_b2b_active && pendingDebts.length > 0 && (
                <DebtCard debts={pendingDebts} locale={locale} />
              )}
            </>
          ) : (
            <div className="bg-gradient-to-br from-slate-50 via-white to-calmar-mint/20 rounded-3xl border border-dashed border-slate-200 p-8 text-center group hover:border-calmar-ocean/30 transition-colors flex flex-col items-center justify-center" role="region" aria-label={translations.businessTab}>
              <Building2 className="h-12 w-12 text-slate-300 mb-4 group-hover:text-calmar-ocean/50 transition-colors" aria-hidden="true" />
              <h2 className="text-lg font-bold text-slate-900">{translations.isBusiness}</h2>
              <p className="text-slate-500 text-sm mt-2 mb-6">
                {translations.b2bBenefit}
              </p>
              <Link href="/b2b-apply">
                <Button variant="outline" className="border-slate-300 hover:bg-slate-900 hover:text-white font-bold uppercase text-xs tracking-widest transition-all">
                  {translations.applyNow}
                </Button>
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
