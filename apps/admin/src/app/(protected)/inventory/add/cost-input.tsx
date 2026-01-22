'use client'

import { useMemo, useState } from 'react'
import { Input } from '@calmar/ui'
import { formatClp, getGrossFromNet } from '@calmar/utils'

interface CostInputProps {
  name: string
  label: string
  required?: boolean
  defaultValue?: number | string | null
}

export function CostInput({ name, label, required, defaultValue }: CostInputProps) {
  const [value, setValue] = useState(
    defaultValue === null || defaultValue === undefined ? '' : String(defaultValue)
  )

  const breakdown = useMemo(() => {
    const net = Number(value)
    if (!Number.isFinite(net) || net <= 0) {
      return null
    }

    const gross = getGrossFromNet(net)
    const iva = Math.max(0, gross - net)
    return { net, iva, gross }
  }, [value])

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label} {required ? '*' : ''}
      </label>
      <Input
        name={name}
        type="number"
        step="0.01"
        min="0"
        required={required}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <p className="text-[11px] text-slate-500">
        {breakdown
          ? `Neto: $${formatClp(breakdown.net)} · IVA (19%): $${formatClp(breakdown.iva)} · Total: $${formatClp(breakdown.gross)}`
          : 'Ingresa un neto para ver IVA y total.'}
      </p>
    </div>
  )
}
