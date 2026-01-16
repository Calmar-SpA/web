"use client"

import { Button } from "@calmar/ui"
import { Trash2 } from "lucide-react"

interface DeleteProductButtonProps {
  action: () => void | Promise<void>
}

export function DeleteProductButton({ action }: DeleteProductButtonProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.")) {
      event.preventDefault()
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit}>
      <Button
        type="submit"
        variant="outline"
        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 font-bold uppercase text-xs tracking-widest px-6 h-12 gap-2"
      >
        <Trash2 className="h-4 w-4" /> Eliminar Producto
      </Button>
    </form>
  )
}
