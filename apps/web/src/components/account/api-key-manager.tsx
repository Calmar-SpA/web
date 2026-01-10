
'use client'

import { useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@calmar/ui'
import { Key, Copy, CheckCircle2, AlertCircle } from 'lucide-react'
import { createB2BApiKey } from '@/app/[locale]/account/b2b-actions'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface ApiKeyManagerProps {
  clientId: string
  existingKeys: any[]
}

export function ApiKeyManager({ clientId, existingKeys }: ApiKeyManagerProps) {
  const t = useTranslations("Account.apiKeys")
  const [isCreating, setIsCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCreate = async () => {
    if (!newKeyName) return
    setIsCreating(true)
    
    const result = await createB2BApiKey(clientId, newKeyName)
    
    if (result.success) {
      setRevealedKey(result.key || null)
      setNewKeyName('')
      toast.success(t('success'))
    } else {
      toast.error(result.error || t('error'))
    }
    setIsCreating(false)
  }

  const copyToClipboard = () => {
    if (revealedKey) {
      navigator.clipboard.writeText(revealedKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success(t('copy'))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold uppercase tracking-tight">{t("title")}</h2>
        {!revealedKey && (
          <div className="flex gap-2">
            <Input 
              placeholder={t("placeholder")}
              value={newKeyName} 
              onChange={(e) => setNewKeyName(e.target.value)}
              className="w-64 h-9 text-xs"
            />
            <Button 
              onClick={handleCreate} 
              disabled={isCreating || !newKeyName}
              className="bg-slate-900 text-white h-9 px-4 text-xs font-bold uppercase"
            >
              {isCreating ? t("generating") : t("newKey")}
            </Button>
          </div>
        )}
      </div>

      {revealedKey && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 space-y-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-900">{t("warningTitle")}</p>
                <p className="text-xs text-amber-700">{t("warningDesc")}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1 bg-white border border-amber-300 rounded-lg px-4 py-3 font-mono text-sm break-all">
                {revealedKey}
              </div>
              <Button onClick={copyToClipboard} variant="outline" className="h-auto border-amber-300 bg-white">
                {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            
            <Button onClick={() => setRevealedKey(null)} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-10">
              {t("understood")}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {existingKeys.map((key) => (
          <div key={key.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                <Key className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="font-bold text-sm">{key.name}</p>
                <p className="text-[10px] font-mono text-slate-400">{key.key_prefix}••••••••••••</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400">{t("lastUsed")}</p>
              <p className="text-xs text-slate-600">{key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : t("never")}</p>
            </div>
          </div>
        ))}

        {existingKeys.length === 0 && !revealedKey && (
          <div className="py-12 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 text-center">
             <Key className="h-8 w-8 text-slate-200 mx-auto mb-2" />
             <p className="text-slate-400 text-xs font-bold uppercase">{t("empty")}</p>
          </div>
        )}
      </div>
    </div>
  )
}
