import { login, signup } from './actions'
import { Button } from '@calmar/ui'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@calmar/ui'
import { Input } from '@calmar/ui'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Login')

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)] relative overflow-hidden">
      {/* Ocean Blur Effect */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-calmar-ocean/20 blur-[120px] rounded-full -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-calmar-mint/20 blur-[120px] rounded-full -ml-48 -mb-48" />

      <Card className="w-full max-w-md backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-calmar-ocean/20 shadow-2xl relative z-10">
        <CardHeader className="space-y-1 text-center flex flex-col items-center">
          <Image 
            src="/logo.png" 
            alt="CALMAR" 
            width={180} 
            height={60} 
            className="h-16 w-auto object-contain mb-2 dark:invert"
          />
          <CardDescription className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('email')}</label>
              <Input id="email" name="email" type="email" placeholder="hola@ejemplo.cl" required />
            </div>
            <div className="grid gap-2">
              <label htmlFor="password" throws-error="true" className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('password')}</label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button formAction={login} className="bg-slate-900 text-white font-bold uppercase text-xs tracking-widest">
                {t('signIn')}
              </Button>
              <Button variant="outline" formAction={signup} className="font-bold uppercase text-xs tracking-widest">
                {t('signUp')}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-[10px] text-center w-full text-slate-400 font-bold uppercase tracking-widest">
            {t('terms')}
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
