import type { ReactNode } from 'react'
import { Link } from '@/navigation'
import { getTranslations } from 'next-intl/server'
import { logout } from '../login/actions'

export default async function AccountLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations("Account")

  return (
    <div className="w-[90%] max-w-6xl mx-auto py-10 sm:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        <aside className="space-y-4 lg:sticky lg:top-24 h-max">
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            <Link
              href="/account"
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-medium"
            >
              {t("title")}
            </Link>
            <Link
              href="/account/orders"
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-medium"
            >
              {t("orders")}
            </Link>
            <Link
              href="/account/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-medium"
            >
              {t("settings.navTitle")}
            </Link>
            <form action={logout}>
              <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors text-slate-700 font-medium">
                <span className="text-left">{t("logout")}</span>
              </button>
            </form>
          </div>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  )
}
