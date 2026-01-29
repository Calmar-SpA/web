'use client'

import { useState } from 'react'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@calmar/ui'
import { 
  Users, 
  Mail, 
  Phone, 
  User, 
  CheckCircle2, 
  Instagram,
  Youtube,
  Trophy,
  Building2,
  Sparkles,
  MessageSquare
} from 'lucide-react'
import { submitSponsorshipApplication } from './actions'
import { toast } from 'sonner'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Reveal } from '@/components/ui/reveal'

const APPLICANT_TYPES = [
  { id: 'evento', label: 'Evento', icon: Users },
  { id: 'deportista', label: 'Deportista', icon: Trophy },
  { id: 'organizacion', label: 'Organización', icon: Building2 },
  { id: 'influencer', label: 'Influencer', icon: Sparkles },
  { id: 'otro', label: 'Otro', icon: MessageSquare },
]

const SPONSORSHIP_TYPES = [
  { id: 'canje', label: 'Canje de productos' },
  { id: 'monetario', label: 'Apoyo monetario' },
  { id: 'mixto', label: 'Mixto (canje + monetario)' },
  { id: 'otro', label: 'Otro' },
]

export default function SponsorshipPage() {
  const t = useTranslations('Sponsorship')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    applicant_type: 'evento',
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    social_instagram: '',
    social_tiktok: '',
    social_youtube: '',
    social_other: '',
    audience_size: '',
    proposal: '',
    sponsorship_type: 'canje',
    budget_requested: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const result = await submitSponsorshipApplication({
      ...formData,
      budget_requested: formData.budget_requested ? parseFloat(formData.budget_requested) : undefined,
    })

    if (result.success) {
      setIsSuccess(true)
      toast.success(t('form.success'))
    } else {
      toast.error(result.error || t('form.error'))
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="w-[90%] max-w-2xl mx-auto py-20 text-center">
        <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-4">{t('success.title')}</h1>
        <p className="text-slate-600 text-lg mb-8">
          {t('success.description')}
        </p>
        <Link href="/shop">
          <Button className="bg-slate-900 text-white font-bold px-8">
            {t('success.button')}
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative py-24 flex items-center justify-center overflow-hidden bg-slate-950">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-calmar-ocean/20 blur-[150px] rounded-full" />
        </div>

        <div className="w-[90%] max-w-4xl mx-auto relative z-10 text-center space-y-4">
          <Reveal>
            <h1 className="text-5xl md:text-7xl font-serif font-medium tracking-tighter text-white leading-[0.8]">
              {t('hero.title')}
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-slate-400 text-lg font-medium tracking-widest uppercase">
              {t('hero.subtitle')}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-24 bg-white">
        <div className="w-[90%] max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Info Side */}
            <div>
              <Reveal>
                <h2 className="text-4xl font-medium tracking-tighter mb-6 leading-tight">
                  {t('info.title')}
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                  {t('info.description')}
                </p>
              </Reveal>
              
              <ul className="space-y-4 mb-8">
                {[
                  t('info.benefit1'),
                  t('info.benefit2'),
                  t('info.benefit3'),
                  t('info.benefit4'),
                ].map((benefit, i) => (
                  <Reveal key={i} delay={0.2 + i * 0.1} direction="right">
                    <li className="flex items-center gap-3 font-bold text-slate-800">
                      <div className="w-6 h-6 rounded-full bg-calmar-mint flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-calmar-ocean-dark" />
                      </div>
                      {benefit}
                    </li>
                  </Reveal>
                ))}
              </ul>
            </div>

            {/* Form Side */}
            <Reveal className="lg:col-span-1">
              <Card className="border-none shadow-2xl bg-white">
                <CardHeader className="bg-slate-900 text-white rounded-t-xl py-8">
                  <CardTitle className="text-2xl uppercase text-center tracking-tight">
                    {t('form.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Applicant Type */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        {t('form.applicantType')}
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {APPLICANT_TYPES.map((type) => {
                          const Icon = type.icon
                          return (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, applicant_type: type.id }))}
                              className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                formData.applicant_type === type.id
                                  ? 'border-calmar-ocean bg-calmar-ocean/5'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <Icon className={`h-5 w-5 ${
                                formData.applicant_type === type.id ? 'text-calmar-ocean' : 'text-slate-400'
                              }`} />
                              <span className="text-xs font-bold">{type.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        {t('form.name')}
                      </label>
                      <Input 
                        name="name" 
                        placeholder={t('form.namePlaceholder')}
                        value={formData.name}
                        onChange={handleChange}
                        required 
                      />
                    </div>

                    {/* Contact Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                          {t('form.contactName')}
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input 
                            name="contact_name" 
                            placeholder={t('form.contactNamePlaceholder')}
                            className="pl-10"
                            value={formData.contact_name}
                            onChange={handleChange}
                            required 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                          {t('form.phone')}
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input 
                            name="phone" 
                            placeholder="+569..."
                            className="pl-10"
                            value={formData.phone}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        {t('form.email')}
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                          name="email" 
                          type="email" 
                          placeholder="tu@email.com"
                          className="pl-10"
                          value={formData.email}
                          onChange={handleChange}
                          required 
                        />
                      </div>
                    </div>

                    {/* Social Media */}
                    <div className="space-y-4">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        {t('form.socialMedia')}
                      </label>
                      <div className="space-y-3">
                        <div className="relative">
                          <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input 
                            name="social_instagram" 
                            placeholder="@usuario"
                            className="pl-10"
                            value={formData.social_instagram}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="relative">
                          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                          </svg>
                          <Input 
                            name="social_tiktok" 
                            placeholder="@usuario"
                            className="pl-10"
                            value={formData.social_tiktok}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="relative">
                          <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input 
                            name="social_youtube" 
                            placeholder="Canal de YouTube"
                            className="pl-10"
                            value={formData.social_youtube}
                            onChange={handleChange}
                          />
                        </div>
                        <Input 
                          name="social_other" 
                          placeholder={t('form.socialOther')}
                          value={formData.social_other}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    {/* Audience Size */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        {t('form.audienceSize')}
                      </label>
                      <Input 
                        name="audience_size" 
                        placeholder={t('form.audienceSizePlaceholder')}
                        value={formData.audience_size}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Proposal */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        {t('form.proposal')}
                      </label>
                      <textarea 
                        name="proposal" 
                        required
                        rows={5}
                        placeholder={t('form.proposalPlaceholder')}
                        value={formData.proposal}
                        onChange={handleChange}
                        className="w-full p-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-calmar-ocean/20 transition-all resize-none"
                      />
                    </div>

                    {/* Sponsorship Type */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        {t('form.sponsorshipType')}
                      </label>
                      <select
                        name="sponsorship_type"
                        value={formData.sponsorship_type}
                        onChange={handleChange}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-calmar-ocean/20 transition-all font-medium"
                        required
                      >
                        {SPONSORSHIP_TYPES.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Budget (optional) */}
                    {(formData.sponsorship_type === 'monetario' || formData.sponsorship_type === 'mixto') && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                          {t('form.budget')}
                        </label>
                        <Input 
                          name="budget_requested" 
                          type="number"
                          placeholder="0"
                          value={formData.budget_requested}
                          onChange={handleChange}
                        />
                        <p className="text-xs text-slate-500">{t('form.budgetHint')}</p>
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-slate-900 hover:bg-calmar-ocean text-white h-14 text-lg font-black uppercase mt-6 shadow-xl"
                    >
                      {isSubmitting ? t('form.sending') : t('form.submit')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  )
}
