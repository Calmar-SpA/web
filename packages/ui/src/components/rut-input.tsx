'use client'

import * as React from 'react'
import { Input } from './ui/input'
import { formatRut, isValidRut } from '@calmar/utils'

type RutInputProps = Omit<React.ComponentProps<'input'>, 'onChange'> & {
  onChange?: React.ChangeEventHandler<HTMLInputElement>
}

export function RutInput({ value, defaultValue, onChange, ...props }: RutInputProps) {
  const [internalValue, setInternalValue] = React.useState(() =>
    formatRut(String(value ?? defaultValue ?? ''))
  )

  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(formatRut(String(value)))
    }
  }, [value])

  const currentValue = value !== undefined ? String(value) : internalValue
  const shouldValidate = currentValue.length >= 3
  const isValid = currentValue ? (shouldValidate ? isValidRut(currentValue) : true) : true

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRut(e.target.value)
    if (value === undefined) {
      setInternalValue(formatted)
    }

    if (onChange) {
      const event = {
        ...e,
        target: { ...e.target, name: e.target.name, value: formatted },
      } as React.ChangeEvent<HTMLInputElement>
      onChange(event)
    }
  }

  return (
    <Input
      {...props}
      value={currentValue}
      onChange={handleChange}
      inputMode="text"
      autoComplete="off"
      aria-invalid={!isValid}
    />
  )
}
