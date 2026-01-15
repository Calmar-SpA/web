'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadProductImage(productId: string, formData: FormData) {
  const supabase = await createClient()
  
  // Verificar autenticación y permisos admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'No autorizado' }
  }

  // Verificar que el usuario es admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'No tienes permisos para realizar esta acción' }
  }

  const file = formData.get('image') as File
  if (!file || file.size === 0) {
    return { error: 'No se seleccionó ningún archivo' }
  }

  // Validar tipo de archivo
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Formato de imagen no válido. Use JPG, PNG o WEBP.' }
  }

  // Validar tamaño (máximo 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return { error: 'La imagen es demasiado grande. Máximo 5MB.' }
  }

  // Obtener información del producto actual para backup
  const { data: product } = await supabase
    .from('products')
    .select('sku, image_url')
    .eq('id', productId)
    .single()

  if (!product) {
    return { error: 'Producto no encontrado' }
  }

  // Generar nombre único para el archivo
  const fileExt = file.name.split('.').pop()
  const timestamp = Date.now()
  const fileName = `${product.sku}-${timestamp}.${fileExt}`
  const filePath = `products/${fileName}`

  // Subir a Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('products')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return { error: 'Error al subir la imagen: ' + uploadError.message }
  }

  // Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('products')
    .getPublicUrl(filePath)

  // Actualizar producto en la base de datos
  // El trigger actualizará automáticamente updated_at
  const { error: dbError } = await supabase
    .from('products')
    .update({ image_url: publicUrl })
    .eq('id', productId)

  if (dbError) {
    console.error('Database error:', dbError)
    // Intentar eliminar el archivo subido si falla la actualización
    await supabase.storage.from('products').remove([filePath])
    return { error: 'Error al actualizar el producto: ' + dbError.message }
  }

  // Opcional: Eliminar imagen anterior si existe y es diferente
  if (product.image_url && product.image_url !== publicUrl) {
    try {
      // Extraer el path del bucket de la URL anterior
      const oldPath = product.image_url.split('/storage/v1/object/public/products/')[1]
      if (oldPath) {
        await supabase.storage.from('products').remove([oldPath])
      }
    } catch (error) {
      // No crítico si falla la eliminación de la imagen anterior
      console.warn('No se pudo eliminar la imagen anterior:', error)
    }
  }

  revalidatePath('/products')
  revalidatePath('/dashboard')
  return { success: true, imageUrl: publicUrl }
}

export async function updateProduct(productId: string, updates: {
  name?: string
  description?: string
  short_description?: string
  base_price?: number
  cost_price?: number
  is_active?: boolean
  is_featured?: boolean
  weight_grams: number
  requires_refrigeration?: boolean
  meta_title?: string
  meta_description?: string
}) {
  const supabase = await createClient()
  
  // Verificar autenticación y permisos admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'No autorizado' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'No tienes permisos para realizar esta acción' }
  }

  // El trigger actualizará automáticamente updated_at
  const { error, data } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select()
    .single()

  if (error) {
    console.error('Update error:', error)
    return { error: 'Error al actualizar el producto: ' + error.message }
  }

  revalidatePath('/products')
  revalidatePath(`/products/${productId}/edit`)
  return { success: true, product: data }
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient()
  
  // Verificar autenticación y permisos admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'No autorizado' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'No tienes permisos para realizar esta acción' }
  }

  // Obtener información del producto para eliminar imagen
  const { data: product } = await supabase
    .from('products')
    .select('image_url')
    .eq('id', productId)
    .single()

  // Eliminar producto (las relaciones se eliminan en cascada)
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  if (error) {
    console.error('Delete error:', error)
    return { error: 'Error al eliminar el producto: ' + error.message }
  }

  // Eliminar imagen del storage si existe
  if (product?.image_url) {
    try {
      const oldPath = product.image_url.split('/storage/v1/object/public/products/')[1]
      if (oldPath) {
        await supabase.storage.from('products').remove([oldPath])
      }
    } catch (error) {
      console.warn('No se pudo eliminar la imagen:', error)
    }
  }

  revalidatePath('/products')
  return { success: true }
}
