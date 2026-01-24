'use client'

import { useState } from 'react'
import { Button, Input } from '@calmar/ui'
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { submitTransferPayment } from './actions'
import { formatClp } from '@calmar/utils'
import { toast } from 'sonner'

interface TransferPaymentFormProps {
  movementId: string
  amount: number
  locale: string
  onSuccess?: () => void
}

export function TransferPaymentForm({ movementId, amount, locale, onSuccess }: TransferPaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error(locale === 'es' ? 'El archivo es muy grande (máx 5MB)' : 'File too large (max 5MB)')
        return
      }
      setFile(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error(locale === 'es' ? 'Por favor selecciona un comprobante' : 'Please select a proof of payment')
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('amount', amount.toString())
    formData.append('reference', reference)
    formData.append('notes', notes)

    try {
      const result = await submitTransferPayment(movementId, formData)
      if (result.success) {
        setIsSubmitted(true)
        toast.success(locale === 'es' ? 'Comprobante enviado con éxito' : 'Proof submitted successfully')
        if (onSuccess) onSuccess()
      } else {
        toast.error(result.error || (locale === 'es' ? 'Error al enviar' : 'Error submitting'))
      }
    } catch (err) {
      toast.error(locale === 'es' ? 'Error inesperado' : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-2 border-emerald-500/20 rounded-3xl p-8 text-center space-y-4 animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto animate-bounce">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <div className="space-y-2">
          <h3 className="font-black text-white text-sm uppercase tracking-[0.2em]">
            {locale === 'es' ? '¡Comprobante Recibido!' : 'Receipt Received!'}
          </h3>
          <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
            {locale === 'es' 
              ? 'Tu pago está siendo verificado. Te notificaremos por email.' 
              : 'Your payment is being verified. We will notify you by email.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-2">
        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
          {locale === 'es' ? 'Monto a Informar' : 'Amount to Report'}
        </label>
        <div className="text-4xl font-black text-white tracking-tighter">
          ${formatClp(amount)}
        </div>
      </div>

      <div className="space-y-3">
        <label htmlFor="proof" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          {locale === 'es' ? 'Comprobante de Pago' : 'Proof of Payment'}
        </label>
        <div className="relative">
          <input
            type="file"
            id="proof"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="proof"
            className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-3xl cursor-pointer transition-all relative overflow-hidden group ${
              file 
                ? 'border-calmar-mint/30 bg-calmar-mint/5' 
                : 'border-white/10 bg-white/5 hover:border-calmar-mint/40 hover:bg-calmar-mint/5'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-calmar-mint/0 via-calmar-mint/5 to-calmar-ocean/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            {file ? (
              <div className="flex flex-col items-center gap-3 text-calmar-mint font-bold animate-in zoom-in-95 duration-200 relative z-10">
                <div className="w-14 h-14 bg-calmar-mint/10 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <span className="text-sm truncate max-w-[200px] font-black uppercase tracking-wider">{file.name}</span>
                <span className="text-[9px] text-slate-400 uppercase tracking-widest">Toca para cambiar</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-500 group-hover:text-slate-300 transition-colors relative z-10">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                  {locale === 'es' ? 'Subir Imagen o PDF' : 'Upload Image or PDF'}
                </span>
                <span className="text-[8px] text-slate-600 uppercase tracking-widest">Máx. 5MB</span>
              </div>
            )}
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <label htmlFor="reference" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          {locale === 'es' ? 'Nº de Operación' : 'Operation Number'} <span className="text-slate-600 font-normal">(Opcional)</span>
        </label>
        <input
          id="reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Ej: 123456789"
          className="w-full h-14 bg-white/5 border-2 border-white/10 rounded-2xl px-5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-calmar-mint/30 focus:border-calmar-mint/30 transition-all font-medium"
        />
      </div>

      <Button
        type="submit"
        disabled={loading || !file}
        className="w-full bg-gradient-to-r from-calmar-mint to-calmar-mint/90 hover:from-calmar-mint/90 hover:to-calmar-mint text-slate-900 font-black h-14 rounded-2xl shadow-xl shadow-calmar-mint/20 transition-all hover:shadow-2xl hover:shadow-calmar-mint/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-[0.15em]"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            {locale === 'es' ? 'Enviando...' : 'Sending...'}
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5 mr-2" />
            {locale === 'es' ? 'Informar Pago' : 'Report Payment'}
          </>
        )}
      </Button>

      <div className="flex items-start gap-3 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
        <div className="w-6 h-6 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
        </div>
        <p className="text-[10px] text-amber-300/90 leading-relaxed font-bold tracking-wide">
          {locale === 'es' 
            ? 'Tu pago quedará pendiente de verificación por nuestro equipo.' 
            : 'Your payment will be pending verification by our team.'}
        </p>
      </div>
    </form>
  )
}
