'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadVideo(formData: FormData) {
  const supabase = await createClient()
  
  const file = formData.get('video') as File
  const name = formData.get('name') as string
  
  if (!file || file.size === 0) {
    return { error: 'No se seleccionó ningún archivo' }
  }

  // Validate file type
  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg']
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Formato de video no válido. Use MP4, WebM o OGG.' }
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `hero-${Date.now()}.${fileExt}`
  const filePath = `hero/${fileName}`

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('videos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return { error: 'Error al subir el video: ' + uploadError.message }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('videos')
    .getPublicUrl(filePath)

  // Save reference in database
  const { error: dbError } = await supabase
    .from('site_media')
    .insert({
      type: 'hero_video',
      url: publicUrl,
      name: name || file.name,
      is_active: false
    })

  if (dbError) {
    console.error('Database error:', dbError)
    // Try to delete the uploaded file
    await supabase.storage.from('videos').remove([filePath])
    return { error: 'Error al guardar referencia: ' + dbError.message }
  }

  revalidatePath('/dashboard/media')
  return { success: true }
}

export async function setActiveVideo(videoId: string) {
  const supabase = await createClient()

  // The trigger will automatically deactivate other videos
  const { error } = await supabase
    .from('site_media')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', videoId)

  if (error) {
    console.error('Error activating video:', error)
    return { error: 'Error al activar el video' }
  }

  revalidatePath('/dashboard/media')
  revalidatePath('/') // Revalidate home page
  return { success: true }
}

export async function deactivateVideo(videoId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('site_media')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', videoId)

  if (error) {
    console.error('Error deactivating video:', error)
    return { error: 'Error al desactivar el video' }
  }

  revalidatePath('/dashboard/media')
  revalidatePath('/')
  return { success: true }
}

export async function deleteVideo(videoId: string) {
  const supabase = await createClient()

  // First get the video info
  const { data: video, error: fetchError } = await supabase
    .from('site_media')
    .select('url')
    .eq('id', videoId)
    .single()

  if (fetchError || !video) {
    return { error: 'Video no encontrado' }
  }

  // Extract file path from URL
  const url = new URL(video.url)
  const pathParts = url.pathname.split('/storage/v1/object/public/videos/')
  const filePath = pathParts[1]

  if (filePath) {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('videos')
      .remove([filePath])

    if (storageError) {
      console.error('Storage delete error:', storageError)
    }
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('site_media')
    .delete()
    .eq('id', videoId)

  if (dbError) {
    console.error('Database delete error:', dbError)
    return { error: 'Error al eliminar el video' }
  }

  revalidatePath('/dashboard/media')
  revalidatePath('/')
  return { success: true }
}

export async function getVideos() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('site_media')
    .select('*')
    .eq('type', 'hero_video')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching videos:', error)
    return []
  }

  return data || []
}
