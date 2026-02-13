import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AccountTabs } from '@/components/account/account-tabs'
import { type DebtItem } from '@/components/account/debt-card'
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
  let b2bProspect = null
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
      console.error('Error fetching user profile:', profileError.message, profileError.code)
    }

    // Fetch prospects (B2B and B2C)
    const { data: prospectsData, error: prospectsError } = await supabase
      .from('prospects')
      .select('id, company_name, tax_id, credit_limit, is_b2b_active, type, contact_name, email')
      .eq('user_id', user.id)

    if (!prospectsError && prospectsData) {
      b2bProspect = prospectsData.find(p => p.type === 'b2b') || null

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
          .in('status', ['delivered', 'partial_paid', 'overdue'])

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

  // Prepare translations as plain object for client component
  const translations = {
    title: t("title"),
    greeting: t("greeting", { name: '{name}' }),
    b2bBadge: t("b2bBadge"),
    b2bProfile: t("b2bProfile"),
    companyName: t("companyName"),
    taxId: t("taxId"),
    availableCredit: t("availableCredit"),
    pendingReview: t("pendingReview"),
    isBusiness: t("isBusiness"),
    b2bBenefit: t("b2bBenefit"),
    applyNow: t("applyNow"),
    rewardsTitle: t("rewardsTitle"),
    soon: t("soon"),
    soonDesc: t("soonDesc"),
    personalTab: t("personalTab"),
    businessTab: t("businessTab"),
    companyEmail: t("companyEmail"),
    active: t("active"),
  }

  return (
    <AccountTabs
      locale={locale}
      profile={profile ? {
        full_name: profile.full_name,
        points_balance: profile.points_balance || 0,
        rut: profile.rut
      } : null}
      userEmail={user.email || ''}
      b2bProspect={b2bProspect}
      pendingDebts={pendingDebts}
      translations={translations}
    />
  )
}
