'use client'

import { useState, useEffect, useRef } from 'react'
import { Button, Input } from '@calmar/ui'
import { Upload, Trash2, Check, X, Film, Loader2 } from 'lucide-react'
import { setActiveVideo, deactivateVideo, deleteVideo, getVideos } from './actions'

interface VideoMedia {
  id: string
  type: string
  url: string
  name: string | null
  is_active: boolean
  created_at: string
}

export default function MediaPage() {
  const [videos, setVideos] = useState<VideoMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const loadVideos = async () => {
    setLoading(true)
    const data = await getVideos()
    setVideos(data)
    setLoading(false)
  }

  useEffect(() => {
    loadVideos()
  }, [])

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUploading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)

    try {
      const response = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      
      if (!response.ok || result.error) {
        setError(result.error || 'Error al subir el video')
      } else {
        setSuccess('Video subido correctamente')
        formRef.current?.reset()
        loadVideos()
      }
    } catch (err: any) {
      setError('Error de conexión: ' + err.message)
    }
    
    setUploading(false)
  }

  const handleActivate = async (videoId: string) => {
    setActionLoading(videoId)
    setError(null)
    
    const result = await setActiveVideo(videoId)
    
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Video activado como hero')
      loadVideos()
    }
    
    setActionLoading(null)
  }

  const handleDeactivate = async (videoId: string) => {
    setActionLoading(videoId)
    setError(null)
    
    const result = await deactivateVideo(videoId)
    
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Video desactivado')
      loadVideos()
    }
    
    setActionLoading(null)
  }

  const handleDelete = async (videoId: string) => {
    if (!confirm('¿Estás seguro de eliminar este video?')) return
    
    setActionLoading(videoId)
    setError(null)
    
    const result = await deleteVideo(videoId)
    
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Video eliminado')
      loadVideos()
    }
    
    setActionLoading(null)
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-calmar-text">
          Gestión de <span className="text-calmar-accent">Media</span>
        </h1>
        <p className="text-slate-500 text-sm mt-2">
          Sube y gestiona los videos del sitio web
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border-2 border-green-200 text-green-700 rounded-xl">
          {success}
        </div>
      )}

      {/* Upload Form */}
      <div className="bg-white p-6 rounded-xl border-2 border-slate-100 shadow-sm">
        <h3 className="font-bold mb-4 flex items-center gap-2 text-calmar-text">
          <Upload className="h-5 w-5 text-calmar-accent" />
          Subir Video para Hero
        </h3>
        <form ref={formRef} onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-calmar-text">Nombre del video</label>
            <Input 
              name="name" 
              placeholder="Ej: Video Hero Principal"
              className="max-w-md border-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-calmar-text">Archivo de video</label>
            <input 
              type="file" 
              name="video" 
              accept="video/mp4,video/webm,video/ogg"
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-calmar-primary/10 file:text-calmar-primary
                hover:file:bg-calmar-primary/20"
              required
            />
            <p className="text-xs text-slate-400 mt-2">
              Formatos: MP4, WebM, OGG. Máximo recomendado: 50MB
            </p>
          </div>
          <Button 
            type="submit" 
            disabled={uploading}
            className="bg-calmar-primary hover:bg-calmar-primary-dark text-white font-bold"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Subir Video
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Videos List */}
      <div className="bg-white p-6 rounded-xl border-2 border-slate-100 shadow-sm">
        <h3 className="font-bold mb-4 flex items-center gap-2 text-calmar-text">
          <Film className="h-5 w-5 text-calmar-accent" />
          Videos del Hero
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-calmar-primary" />
          </div>
        ) : videos.length === 0 ? (
          <p className="text-slate-500 text-center py-12">
            No hay videos subidos. Sube el primer video para el hero.
          </p>
        ) : (
          <div className="space-y-4">
            {videos.map((video) => (
              <div 
                key={video.id} 
                className={`flex flex-col md:flex-row gap-4 p-4 rounded-xl border-2 ${
                  video.is_active 
                    ? 'border-calmar-mint bg-calmar-mint/10' 
                    : 'border-slate-200'
                }`}
              >
                {/* Video Preview */}
                <div className="w-full md:w-64 flex-shrink-0">
                  <video 
                    src={video.url}
                    className="w-full h-36 object-cover rounded-lg bg-black"
                    muted
                    playsInline
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause()
                      e.currentTarget.currentTime = 0
                    }}
                  />
                </div>

                {/* Video Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-calmar-text truncate">
                      {video.name || 'Sin nombre'}
                    </h4>
                    {video.is_active && (
                      <span className="px-2 py-0.5 bg-calmar-mint text-calmar-primary-dark text-xs font-bold rounded-full uppercase tracking-wider">
                        Activo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    Subido: {new Date(video.created_at).toLocaleDateString('es-CL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  
                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {video.is_active ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeactivate(video.id)}
                        disabled={actionLoading === video.id}
                        className="border-2"
                      >
                        {actionLoading === video.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-1" />
                            Desactivar
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleActivate(video.id)}
                        disabled={actionLoading === video.id}
                        className="bg-calmar-primary hover:bg-calmar-primary-dark text-white font-bold"
                      >
                        {actionLoading === video.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Activar como Hero
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-2 border-red-200"
                      onClick={() => handleDelete(video.id)}
                      disabled={actionLoading === video.id}
                    >
                      {actionLoading === video.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
