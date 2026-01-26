
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@calmar/ui'
import { getTranslations } from 'next-intl/server'
import { User, Shield, Bell, Save } from 'lucide-react'
import { updateProfile, updatePassword, updateNewsletterPreference } from './actions'
import { ProfileForm } from '@/components/account/profile-form'
import { PasswordForm } from '@/components/account/password-form'
import { logout } from '../../login/actions'

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams?: { error?: string }
}) {
  const { locale } = await params
  const t = await getTranslations("Account.settings")
  const errorMessage = searchParams?.error
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email, rut')
    .eq('id', user.id)
    .single()

  const { data: newsletterSubscription } = await supabase
    .from('newsletter_subscribers')
    .select('is_active')
    .eq('email', user.email)
    .maybeSingle()

  const isNewsletterActive = Boolean(newsletterSubscription?.is_active)

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-calmar-ocean/10 via-white to-calmar-mint/10 p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{t("title")}</h1>
        <p className="text-slate-500 text-sm mt-2">{t("subtitle")}</p>
      </div>

      <div className="space-y-8">
        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
        {/* Profile Section */}
        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-calmar-ocean/10 flex items-center justify-center">
              <User className="w-5 h-5 text-calmar-ocean" />
            </div>
            <h2 className="text-lg font-bold uppercase tracking-tight">{t("profile")}</h2>
          </div>

          <ProfileForm
            locale={locale}
            fullName={profile?.full_name || ''}
            email={profile?.email || user.email || ''}
            rut={profile?.rut || ''}
            action={updateProfile}
          />
        </section>

        {/* Security Section */}
        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-slate-500" />
            </div>
            <h2 className="text-lg font-bold uppercase tracking-tight">{t("security")}</h2>
          </div>
          
          <div className="space-y-4">
            <PasswordForm 
              locale={locale}
              action={updatePassword}
            />

            <form action={logout}>
              <Button type="submit" variant="destructive" className="w-full font-bold text-xs uppercase tracking-widest bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-none">
                {t("logout")}
              </Button>
            </form>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-slate-500" />
            </div>
            <h2 className="text-lg font-bold uppercase tracking-tight">{t("notifications")}</h2>
          </div>
          
          <form action={updateNewsletterPreference} className="space-y-4">
            <input type="hidden" name="locale" value={locale} />
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
              <div>
                <span className="text-sm font-medium text-slate-700">{t("marketing")}</span>
                <p className="text-xs text-slate-500 mt-1">
                  Si desactivas el newsletter, pierdes el descuento de suscripción.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="newsletter_active"
                  defaultChecked={isNewsletterActive}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:bg-calmar-ocean transition-colors relative">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4"></div>
                </div>
              </label>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl opacity-60">
              <span className="text-sm font-medium text-slate-700">{t("transactional")}</span>
               <div className="w-10 h-6 bg-slate-200 rounded-full relative cursor-not-allowed">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="bg-slate-900 hover:bg-calmar-ocean text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                <Save className="w-4 h-4" />
                {t("save")}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
