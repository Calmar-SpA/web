
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button, Input } from '@calmar/ui'
import { getTranslations } from 'next-intl/server'
import { User, Shield, Bell, Save } from 'lucide-react'

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations("Account.settings")
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-black italic tracking-tighter uppercase">{t("title")}</h1>
        <p className="text-slate-500 text-sm">{t("subtitle")}</p>
      </div>

      <div className="space-y-8">
        {/* Profile Section */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <User className="w-5 h-5 text-slate-500" />
            </div>
            <h2 className="text-lg font-bold uppercase tracking-tight">{t("profile")}</h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">{t("fullName")}</label>
              <Input defaultValue={profile?.full_name || ''} className="bg-slate-50" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">{t("email")}</label>
              <Input defaultValue={user.email || ''} disabled className="bg-slate-100 text-slate-500" />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button className="bg-slate-900 hover:bg-calmar-ocean text-white font-bold text-xs uppercase tracking-widest">
              {t("update")}
            </Button>
          </div>
        </section>

        {/* Security Section */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-slate-500" />
            </div>
            <h2 className="text-lg font-bold uppercase tracking-tight">{t("security")}</h2>
          </div>
          
          <div className="space-y-4">
            <Button variant="outline" className="w-full justify-between group">
              <span className="font-medium text-slate-700">{t("changePassword")}</span>
              <Shield className="w-4 h-4 text-slate-400 group-hover:text-calmar-ocean" />
            </Button>
            
            <form action="/auth/signout" method="post">
              <Button variant="destructive" className="w-full font-bold text-xs uppercase tracking-widest bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-none">
                {t("logout")}
              </Button>
            </form>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-slate-500" />
            </div>
            <h2 className="text-lg font-bold uppercase tracking-tight">{t("notifications")}</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
              <span className="text-sm font-medium text-slate-700">{t("marketing")}</span>
              <div className="w-10 h-6 bg-calmar-ocean rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg opacity-60">
              <span className="text-sm font-medium text-slate-700">{t("transactional")}</span>
               <div className="w-10 h-6 bg-slate-200 rounded-full relative cursor-not-allowed">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </div>
            </div>
          </div>
           <div className="mt-6 flex justify-end">
            <Button className="bg-slate-900 hover:bg-calmar-ocean text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              <Save className="w-4 h-4" />
              {t("save")}
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
