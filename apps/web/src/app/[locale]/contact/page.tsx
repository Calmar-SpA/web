"use client";

import { useTranslations } from "next-intl";
import { Button, Input, Card, CardContent } from "@calmar/ui";
import { Mail, Phone, Clock, Send, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { submitContactForm } from "./actions";
import { Reveal } from "@/components/ui/reveal";

export default function ContactPage() {
  const t = useTranslations("Contact");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setStatus('idle');
    
    try {
      await submitContactForm(formData);
      setStatus('success');
    } catch (error) {
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
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
              {t("hero.title")}
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-slate-400 text-lg font-medium tracking-widest uppercase">
              {t("hero.subtitle")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-24 bg-white">
        <div className="w-[90%] max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <Reveal className="lg:col-span-2">
              <Card className="border-slate-200 shadow-xl h-full">
                <CardContent className="p-8">
                  {status === 'success' ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <p className="text-lg font-bold text-slate-900">{t("form.success")}</p>
                    </div>
                  ) : (
                    <form action={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                            {t("form.name")}
                          </label>
                          <Input name="name" required className="h-12" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                            {t("form.email")}
                          </label>
                          <Input name="email" type="email" required className="h-12" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                          {t("form.subject")}
                        </label>
                        <Input name="subject" required className="h-12" />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                          {t("form.message")}
                        </label>
                        <textarea 
                          name="message" 
                          required
                          rows={6}
                          className="w-full p-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-calmar-ocean/20 transition-all resize-none"
                        />
                      </div>

                      {status === 'error' && (
                        <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                          <AlertCircle className="h-4 w-4" />
                          {t("form.error")}
                        </div>
                      )}

                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full h-14 bg-slate-900 hover:bg-calmar-ocean text-white font-black text-lg transition-colors"
                      >
                        {isSubmitting ? t("form.sending") : t("form.send")}
                        <Send className="ml-2 h-5 w-5" />
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </Reveal>

            {/* Contact Info */}
            <div className="space-y-8">
              <Reveal>
                <h2 className="text-2xl font-serif font-medium tracking-tight">
                  {t("info.title")}
                </h2>
              </Reveal>

              <div className="space-y-6">
                <Reveal delay={0.1} direction="right">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-calmar-ocean/10 flex items-center justify-center text-calmar-ocean flex-shrink-0">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Email</p>
                      <p className="text-slate-900 font-medium">{t("info.email")}</p>
                    </div>
                  </div>
                </Reveal>

                <Reveal delay={0.2} direction="right">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-calmar-ocean/10 flex items-center justify-center text-calmar-ocean flex-shrink-0">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Teléfono</p>
                      <a 
                        href="https://wa.me/56929763779" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-slate-900 font-medium hover:text-calmar-ocean transition-colors"
                      >
                        {t("info.phone")}
                      </a>
                    </div>
                  </div>
                </Reveal>

                <Reveal delay={0.3} direction="right">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-calmar-ocean/10 flex items-center justify-center text-calmar-ocean flex-shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Horario</p>
                      <p className="text-slate-900 font-medium">{t("info.hours")}</p>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
