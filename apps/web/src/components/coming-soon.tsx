'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { NewsletterForm } from '@/components/newsletter-form'
import Image from 'next/image'
import { Button, Input } from '@calmar/ui'
import { Loader2, Lock, KeyRound } from 'lucide-react'
import { validateAccessCode } from '@/actions/access-code'
import { useRouter } from '@/navigation'
import { toast } from 'sonner'

export function ComingSoonPage() {
  const t = useTranslations('ComingSoon')
  const router = useRouter()
  const [code, setCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsValidating(true)

    try {
      const formData = new FormData()
      formData.append('code', code)
      const result = await validateAccessCode(null, formData)

      if (result.success) {
        toast.success(t('codeSuccess'))
        router.refresh()
      } else {
        toast.error(t('codeError'))
        setCode('')
      }
    } catch (error) {
      toast.error(t('codeError'))
      setCode('')
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-calmar-background via-white to-calmar-primary-light/20 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-calmar-primary/20 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] bg-calmar-accent/15 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-calmar-primary/10 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12 relative z-10 text-center space-y-10">
        {/* Logo */}
        <div className="flex justify-center opacity-0 animate-[fadeIn_0.8s_ease-out_0s_forwards]">
          <Image 
            src="https://zyqkuhzsnomufwmfoily.supabase.co/storage/v1/object/public/products/logo-calmar.png" 
            alt="CALMAR" 
            width={600} 
            height={180}
            className="w-full max-w-3xl h-auto object-contain drop-shadow-lg"
            priority
          />
        </div>

        {/* Coming Soon Badge */}
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-calmar-primary/20 to-calmar-accent/20 border-2 border-calmar-primary/30 text-calmar-primary-dark text-base font-black tracking-[0.2em] uppercase shadow-lg opacity-0 animate-[fadeIn_0.8s_ease-out_0.2s_forwards]">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-calmar-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-calmar-accent"></span>
          </span>
          {t('badge')}
        </div>

        {/* Main Message */}
        <div className="space-y-6 opacity-0 animate-[fadeIn_0.8s_ease-out_0.4s_forwards]">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] bg-gradient-to-r from-calmar-primary-dark via-calmar-primary to-calmar-accent bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-lg md:text-xl text-calmar-text/80 font-medium tracking-wide max-w-xl mx-auto leading-relaxed">
            {t('description')}
          </p>
        </div>

        {/* Newsletter Section */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 md:p-10 border-2 border-calmar-primary/20 shadow-xl space-y-6 opacity-0 animate-[fadeIn_0.8s_ease-out_0.6s_forwards]">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-calmar-primary-dark">
              <div className="w-1 h-8 bg-gradient-to-b from-calmar-primary to-calmar-accent rounded-full"></div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
                {t('newsletter.title')}
              </h2>
            </div>
            <p className="text-sm md:text-base text-calmar-text/70 leading-relaxed font-medium">
              {t('newsletter.description')}
            </p>
          </div>
          <div className="flex justify-center">
            <NewsletterForm />
          </div>
        </div>

        {/* Access Code Section - Always Visible */}
        <div className="bg-gradient-to-br from-calmar-primary/10 via-calmar-accent/5 to-calmar-primary/10 backdrop-blur-sm rounded-3xl p-6 md:p-8 border-2 border-dashed border-calmar-primary/30 shadow-lg opacity-0 animate-[fadeIn_0.8s_ease-out_0.8s_forwards]">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <KeyRound className="w-5 h-5 text-calmar-primary-dark" />
              <h3 className="text-lg font-black uppercase tracking-wide text-calmar-primary-dark">
                {t('accessTitle')}
              </h3>
            </div>
            <p className="text-xs md:text-sm text-calmar-text/60 mb-4">
              {t('accessDescription')}
            </p>
            <form onSubmit={handleCodeSubmit} className="flex flex-col items-center gap-3 max-w-sm mx-auto">
              <div className="w-full relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-calmar-primary/60" />
                <Input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t('codePlaceholder')}
                  className="w-full pl-12 pr-4 py-3 text-center uppercase tracking-widest font-bold text-calmar-primary-dark border-2 border-calmar-primary/30 focus:border-calmar-primary focus:ring-2 focus:ring-calmar-primary/20 bg-white/90"
                  disabled={isValidating}
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                disabled={isValidating || !code.trim()}
                size="lg"
                className="w-full bg-gradient-to-r from-calmar-primary to-calmar-primary-dark hover:from-calmar-primary-dark hover:to-calmar-primary text-white font-black text-sm uppercase tracking-wider shadow-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    {t('validating')}
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 mr-2" />
                    {t('submitCode')}
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

    </main>
  )
}
