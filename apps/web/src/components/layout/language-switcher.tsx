
'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/navigation'
import { locales } from '@/i18n/config'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button
} from '@calmar/ui'
import { Globe, Check } from 'lucide-react'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const handleLanguageChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale })
  }

  const languageNames: Record<string, string> = {
    es: 'Español',
    en: 'English'
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-500 hover:text-slate-900 transition-colors">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Cambiar idioma</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-slate-100 p-2">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => handleLanguageChange(l)}
            className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <span className={`text-sm font-medium ${locale === l ? 'text-calmar-ocean' : 'text-slate-600'}`}>
              {languageNames[l]}
            </span>
            {locale === l && <Check className="h-3 w-3 text-calmar-ocean" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
