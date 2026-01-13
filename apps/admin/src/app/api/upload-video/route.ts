import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('video') as File
    const name = formData.get('name') as string
    
    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No se seleccionó ningún archivo' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Formato de video no válido. Use MP4, WebM o OGG.' 
      }, { status: 400 })
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
      return NextResponse.json({ 
        error: 'Error al subir el video: ' + uploadError.message 
      }, { status: 500 })
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
      return NextResponse.json({ 
        error: 'Error al guardar referencia: ' + dbError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Error inesperado: ' + error.message 
    }, { status: 500 })
  }
}
