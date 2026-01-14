'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@calmar/ui'
import { X, Key, Trash2, Plus, Copy, Check, AlertCircle } from 'lucide-react'
import { getB2BApiKeys, createB2BApiKey, revokeB2BApiKey } from './actions'
import { toast } from 'sonner'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  last_used_at: string | null
  is_active: boolean
  created_at: string
}

interface ApiKeysModalProps {
  clientId: string
  companyName: string
  isOpen: boolean
  onClose: () => void
}

export function ApiKeysModal({
  clientId,
  companyName,
  isOpen,
  onClose
}: ApiKeysModalProps) {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadKeys()
    } else {
      setNewlyCreatedKey(null)
      setNewKeyName('')
    }
  }, [isOpen, clientId])

  const loadKeys = async () => {
    setIsLoading(true)
    try {
      const data = await getB2BApiKeys(clientId)
      setKeys(data as unknown as ApiKey[])
    } catch (error) {
      toast.error('Error al cargar las API keys')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName) return
    
    setIsCreating(true)
    try {
      const result = await createB2BApiKey(clientId, newKeyName)
      if (result.success && result.key) {
        setNewlyCreatedKey(result.key)
        setNewKeyName('')
        loadKeys()
        toast.success('API Key creada')
      }
    } catch (error) {
      toast.error('Error al crear la API Key')
    } finally {
      setIsCreating(false)
    }
  }

  const handleRevoke = async (keyId: string) => {
    if (!confirm('¿Estás seguro de que quieres revocar esta API Key? Esta acción no se puede deshacer.')) return

    try {
      const result = await revokeB2BApiKey(keyId)
      if (result.success) {
        loadKeys()
        toast.success('API Key revocada')
      }
    } catch (error) {
      toast.error('Error al revocar la API Key')
    }
  }

  const copyToClipboard = () => {
    if (newlyCreatedKey) {
      navigator.clipboard.writeText(newlyCreatedKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-none max-h-[90vh] flex flex-col">
        <CardHeader className="bg-slate-900 text-white rounded-t-xl flex flex-row items-center justify-between py-6 shrink-0">
          <div className="flex items-center gap-3">
            <Key className="h-6 w-6 text-calmar-mint" />
            <CardTitle className="text-xl uppercase tracking-tight">Api Keys - {companyName}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6 overflow-y-auto">
          {newlyCreatedKey ? (
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 mb-8 animate-in fade-in zoom-in duration-300">
              <div className="flex items-center gap-3 text-emerald-800 mb-4">
                <AlertCircle className="h-5 w-5" />
                <p className="font-bold text-sm uppercase tracking-tight">Guarda esta llave ahora</p>
              </div>
              <p className="text-xs text-emerald-700 mb-4">
                Por seguridad, no podrás volver a ver esta llave completa una vez que cierres esta ventana o crees otra.
              </p>
              <div className="flex gap-2">
                <div className="flex-1 bg-white border border-emerald-200 rounded-lg p-3 font-mono text-sm break-all select-all">
                  {newlyCreatedKey}
                </div>
                <Button 
                  onClick={copyToClipboard}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button 
                variant="outline" 
                className="mt-6 w-full border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold text-xs uppercase"
                onClick={() => setNewlyCreatedKey(null)}
              >
                Entendido, continuar
              </Button>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="flex gap-2 mb-8">
              <Input 
                placeholder="Nombre de la llave (ej: Integración ERP)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1"
                required
              />
              <Button 
                type="submit" 
                disabled={isCreating}
                className="bg-slate-900 text-white gap-2 font-bold uppercase text-xs px-6"
              >
                <Plus className="h-4 w-4" /> {isCreating ? 'Creando...' : 'Nueva Llave'}
              </Button>
            </form>
          )}

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Llaves Activas</h3>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : keys.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">No hay llaves activas</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {keys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 text-sm">{key.name}</p>
                      <div className="flex items-center gap-3">
                        <code className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-500">
                          {key.key_prefix}...
                        </code>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">
                          Uso: {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Nunca'}
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRevoke(key.id)}
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
