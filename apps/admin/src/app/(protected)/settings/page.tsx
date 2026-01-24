'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@calmar/ui'
import { Building2, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { updateBankSettings } from './actions'

interface BankAccountData {
  bank_name: string
  account_type: string
  account_number: string
  account_holder: string
  rut: string
  email: string
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [bankData, setBankData] = useState<BankAccountData>({
    bank_name: '',
    account_type: '',
    account_number: '',
    account_holder: '',
    rut: '',
    email: ''
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'bank_account_for_transfers')
        .single()

      if (error) throw error
      
      if (data?.setting_value) {
        setBankData(data.setting_value as BankAccountData)
      }
    } catch (error: any) {
      console.error('Error loading settings:', error)
      toast.error('Error al cargar configuración')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      await updateBankSettings(bankData)
      toast.success('Configuración actualizada')
    } catch (error: any) {
      console.error('Error saving settings:', error)
      toast.error('Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-calmar-ocean" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando configuración...</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-calmar-text">
          Configuración del Sistema
        </h1>
        <p className="text-slate-500 text-sm mt-2">Administra los parámetros generales de la plataforma</p>
      </div>

      <Card className="border-2 border-slate-100 shadow-sm overflow-hidden rounded-2xl">
        <div className="h-1 bg-gradient-to-r from-calmar-ocean via-calmar-mint to-calmar-ocean" />
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="flex items-center gap-3 text-lg uppercase tracking-tight">
            <div className="p-2 bg-calmar-ocean/10 rounded-xl">
              <Building2 className="w-5 h-5 text-calmar-ocean" />
            </div>
            Datos Bancarios para Transferencias
          </CardTitle>
          <p className="text-xs text-slate-500 mt-2 ml-11">
            Esta información se mostrará a los clientes cuando seleccionen pagar mediante transferencia
          </p>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-700">
                  Nombre del Banco *
                </label>
                <Input
                  value={bankData.bank_name}
                  onChange={(e) => setBankData({ ...bankData, bank_name: e.target.value })}
                  placeholder="Ej: Banco Santander"
                  required
                  className="h-12 bg-white border-2 border-slate-200 focus:border-calmar-ocean"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-700">
                  Tipo de Cuenta *
                </label>
                <Input
                  value={bankData.account_type}
                  onChange={(e) => setBankData({ ...bankData, account_type: e.target.value })}
                  placeholder="Ej: Cuenta Corriente"
                  required
                  className="h-12 bg-white border-2 border-slate-200 focus:border-calmar-ocean"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-700">
                  Número de Cuenta *
                </label>
                <Input
                  value={bankData.account_number}
                  onChange={(e) => setBankData({ ...bankData, account_number: e.target.value })}
                  placeholder="Ej: 770286824"
                  required
                  className="h-12 bg-white border-2 border-slate-200 focus:border-calmar-ocean font-mono text-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-700">
                  Titular de la Cuenta *
                </label>
                <Input
                  value={bankData.account_holder}
                  onChange={(e) => setBankData({ ...bankData, account_holder: e.target.value })}
                  placeholder="Ej: Tu Patrimonio SpA"
                  required
                  className="h-12 bg-white border-2 border-slate-200 focus:border-calmar-ocean"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-700">
                  RUT *
                </label>
                <Input
                  value={bankData.rut}
                  onChange={(e) => setBankData({ ...bankData, rut: e.target.value })}
                  placeholder="Ej: 77.028.682-4"
                  required
                  className="h-12 bg-white border-2 border-slate-200 focus:border-calmar-ocean"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-700">
                  Email de Contacto
                </label>
                <Input
                  type="email"
                  value={bankData.email}
                  onChange={(e) => setBankData({ ...bankData, email: e.target.value })}
                  placeholder="Ej: contacto@empresa.cl"
                  className="h-12 bg-white border-2 border-slate-200 focus:border-calmar-ocean"
                />
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900">Importante</p>
                <p className="text-xs text-amber-700">
                  Estos datos se mostrarán públicamente a los clientes que deseen pagar mediante transferencia. Asegúrate de que sean correctos.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={loadSettings}
                disabled={isSaving}
                className="uppercase font-black tracking-wider h-12 px-8"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-calmar-ocean hover:bg-calmar-ocean/90 uppercase font-black tracking-wider h-12 px-8"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card className="border-2 border-slate-100 shadow-sm overflow-hidden rounded-2xl bg-slate-900 text-white">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-calmar-mint">
            <CheckCircle2 className="w-5 h-5" />
            Vista Previa (Cómo lo verá el cliente)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
            <p className="font-black text-calmar-mint text-[10px] uppercase tracking-[0.2em] border-b border-white/10 pb-3">
              Datos para Transferencia
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-slate-400 text-[9px] uppercase font-black tracking-[0.2em]">Banco</span>
                <p className="font-bold text-sm text-white">{bankData.bank_name || '-'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 text-[9px] uppercase font-black tracking-[0.2em]">Tipo</span>
                <p className="font-bold text-sm text-white">{bankData.account_type || '-'}</p>
              </div>
              <div className="col-span-2 bg-slate-800/50 p-5 rounded-2xl border-2 border-calmar-mint/30 space-y-2">
                <span className="text-slate-400 text-[8px] uppercase font-black tracking-[0.2em]">Nº de Cuenta</span>
                <p className="font-mono font-black text-2xl text-calmar-mint tracking-wider">{bankData.account_number || '-'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 text-[9px] uppercase font-black tracking-[0.2em]">RUT</span>
                <p className="font-bold text-sm text-white">{bankData.rut || '-'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 text-[9px] uppercase font-black tracking-[0.2em]">Titular</span>
                <p className="font-bold text-xs text-white uppercase">{bankData.account_holder || '-'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
