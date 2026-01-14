'use client'

import { useState } from 'react'
import { Button } from '@calmar/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@calmar/ui'
import { ImageUploader } from '@/components/image-uploader'
import { uploadProductImage } from './actions'
import { X } from 'lucide-react'

interface ImageUploadModalProps {
  productId: string
  productSku: string
  currentImageUrl?: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ImageUploadModal({
  productId,
  productSku,
  currentImageUrl,
  isOpen,
  onClose,
  onSuccess
}: ImageUploadModalProps) {
  const [uploading, setUploading] = useState(false)

  if (!isOpen) return null

  const handleUpload = async (file: File) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('image', file)
    
    const result = await uploadProductImage(productId, formData)
    
    setUploading(false)
    
    if (result.error) {
      return { error: result.error }
    }
    
    if (result.success) {
      onSuccess?.()
      setTimeout(() => {
        onClose()
      }, 1000)
      return { success: true, imageUrl: result.imageUrl }
    }
    
    return { error: 'Error desconocido' }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cambiar Imagen - {productSku}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={uploading}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <ImageUploader
            currentImageUrl={currentImageUrl}
            onUpload={handleUpload}
            label="Nueva imagen del producto"
            maxSizeMB={5}
          />
        </CardContent>
      </Card>
    </div>
  )
}
