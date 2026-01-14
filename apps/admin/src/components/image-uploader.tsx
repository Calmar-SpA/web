'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { Button } from '@calmar/ui'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface ImageUploaderProps {
  currentImageUrl?: string
  onUpload: (file: File) => Promise<{ error?: string; success?: boolean; imageUrl?: string }>
  onRemove?: () => void
  maxSizeMB?: number
  acceptedTypes?: string[]
  label?: string
  className?: string
}

export function ImageUploader({
  currentImageUrl,
  onUpload,
  onRemove,
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  label = 'Imagen del producto',
  className = ''
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const validateFile = (file: File): string | null => {
    // Validar tipo
    if (!acceptedTypes.includes(file.type)) {
      return `Formato no válido. Use: ${acceptedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`
    }

    // Validar tamaño
    const maxSize = maxSizeMB * 1024 * 1024
    if (file.size > maxSize) {
      return `El archivo es demasiado grande. Máximo ${maxSizeMB}MB`
    }

    return null
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setError(null)

    const file = e.dataTransfer.files[0]
    if (!file) return

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    await processFile(file)
  }

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    await processFile(file)
  }

  const processFile = async (file: File) => {
    // Crear preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Subir archivo
    setUploading(true)
    try {
      const result = await onUpload(file)
      if (result.error) {
        setError(result.error)
        // Revertir preview si falla
        setPreview(currentImageUrl || null)
      } else if (result.imageUrl) {
        setPreview(result.imageUrl)
        setError(null)
      }
    } catch (err: any) {
      setError('Error al subir la imagen: ' + (err.message || 'Error desconocido'))
      setPreview(currentImageUrl || null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    if (onRemove) {
      onRemove()
    }
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>

      {/* Preview de imagen actual o nueva */}
      {preview && (
        <div className="relative w-full max-w-md aspect-square rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-contain p-4"
            sizes="(max-width: 400px) 100vw, 400px"
            unoptimized={preview.startsWith('blob:') || preview.startsWith('data:')}
          />
          {onRemove && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              aria-label="Eliminar imagen"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Área de drag & drop */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging
            ? 'border-primary bg-primary/5'
            : 'border-slate-300 dark:border-slate-600 hover:border-primary/50 bg-slate-50 dark:bg-slate-900'
          }
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Subiendo imagen...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {preview ? (
              <>
                <ImageIcon className="h-12 w-12 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Haz clic o arrastra otra imagen para reemplazar
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Formatos: JPG, PNG, WEBP • Máximo {maxSizeMB}MB
                  </p>
                </div>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Haz clic o arrastra una imagen aquí
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Formatos: JPG, PNG, WEBP • Máximo {maxSizeMB}MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClick()
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar archivo
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
    </div>
  )
}
