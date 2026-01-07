
'use client'

import { useState } from 'react'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@calmar/ui'
import { Building2, Mail, Phone, User, Fingerprint, CheckCircle2 } from 'lucide-react'
import { submitB2BApplication } from './actions'
import { toast } from 'sonner'
import Link from 'next/link'

export default function B2BApplyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    company_name: '',
    tax_id: '',
    contact_name: '',
    contact_email: '',
    contact_phone: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const result = await submitB2BApplication(formData)

    if (result.success) {
      setIsSuccess(true)
      toast.success('Postulación enviada con éxito')
    } else {
      toast.error(result.error || 'Error al enviar la postulación')
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-black italic uppercase tracking-tight mb-4">Postulación Recibida</h1>
        <p className="text-slate-600 text-lg mb-8">
          Hemos recibido los datos de **{formData.company_name}**. Nuestro equipo revisará la información y te contactaremos en un plazo de 24-48 horas hábiles.
        </p>
        <Link href="/shop">
          <Button className="bg-slate-900 text-white font-bold px-8">VOLVER A LA TIENDA</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-5xl font-black italic italic-bold tracking-tighter uppercase mb-6 leading-tight">
            POTENCIA TU NEGOCIO CON <span className="text-calmar-ocean">CALMAR B2B</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            Accede a precios mayoristas, líneas de crédito personalizadas y herramientas exclusivas para distribuidores y empresas del rubro.
          </p>
          
          <ul className="space-y-4 mb-8">
            {[
              'Descuentos exclusivos por volumen',
              'Línea de crédito para compras a 30 días',
              'Soporte prioritario y ejecutivo de cuentas',
              'Acceso a nuestra API de inventario'
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 font-bold text-slate-800">
                <div className="w-6 h-6 rounded-full bg-calmar-mint flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-calmar-ocean-dark" />
                </div>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <Card className="border-none shadow-2xl bg-white">
          <CardHeader className="bg-slate-900 text-white rounded-t-xl py-8">
            <CardTitle className="text-2xl italic uppercase text-center tracking-tight">Formulario de Postulación</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Razón Social</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    name="company_name" 
                    placeholder="Ej: Calmar SpA" 
                    className="pl-10" 
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">RUT Empresa</label>
                <div className="relative">
                  <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    name="tax_id" 
                    placeholder="76.000.000-0" 
                    className="pl-10" 
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Contacto</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      name="contact_name" 
                      placeholder="Nombre" 
                      className="pl-10" 
                      onChange={handleChange}
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      name="contact_phone" 
                      placeholder="+569..." 
                      className="pl-10" 
                      onChange={handleChange}
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Email Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    name="contact_email" 
                    type="email" 
                    placeholder="admin@empresa.cl" 
                    className="pl-10" 
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-slate-900 hover:bg-calmar-ocean text-white h-14 text-lg font-black italic uppercase mt-6 shadow-xl"
              >
                {isSubmitting ? 'ENVIANDO...' : 'POSTULAR AHORA'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
