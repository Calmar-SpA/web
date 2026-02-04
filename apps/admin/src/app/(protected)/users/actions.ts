'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type UserRole = 'customer' | 'admin' | 'b2b'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: UserRole
  points_balance: number
  shipping_fee_exempt: boolean
  created_at: string
  updated_at: string
}

export async function getUsers(): Promise<{ users: UserProfile[]; error?: string }> {
  const supabase = await createClient()
  
  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { users: [], error: 'No autorizado' }
  }

  // Verificar rol admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { users: [], error: 'No tienes permisos para ver usuarios' }
  }

  // Obtener todos los usuarios activos (excluir eliminados)
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    return { users: [], error: 'Error al obtener usuarios' }
  }

  return { users: users as UserProfile[] }
}

export async function updateUserRole(
  userId: string, 
  newRole: UserRole
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  // Verificar rol admin del usuario actual
  const { data: currentUserProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentUserProfile?.role !== 'admin') {
    return { success: false, error: 'No tienes permisos para cambiar roles' }
  }

  // Validar que el rol sea válido
  const validRoles: UserRole[] = ['customer', 'admin', 'b2b']
  if (!validRoles.includes(newRole)) {
    return { success: false, error: 'Rol no válido' }
  }

  // Prevenir que un admin se quite el rol a sí mismo
  if (userId === user.id && newRole !== 'admin') {
    return { success: false, error: 'No puedes quitarte el rol de administrador a ti mismo' }
  }

  // Actualizar el rol
  const { error } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user role:', error)
    return { success: false, error: 'Error al actualizar el rol: ' + error.message }
  }

  revalidatePath('/users')
  return { success: true }
}

export async function updateUserShippingFeeExempt(
  userId: string,
  shippingFeeExempt: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  // Verificar rol admin del usuario actual
  const { data: currentUserProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentUserProfile?.role !== 'admin') {
    return { success: false, error: 'No tienes permisos para cambiar esta configuración' }
  }

  const { error } = await supabase
    .from('users')
    .update({ shipping_fee_exempt: shippingFeeExempt })
    .eq('id', userId)

  if (error) {
    console.error('Error updating shipping fee exempt:', error)
    return { success: false, error: 'Error al actualizar la exención de envío: ' + error.message }
  }

  revalidatePath('/users')
  return { success: true }
}

export async function deleteUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  // Verificar rol admin del usuario actual
  const { data: currentUserProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentUserProfile?.role !== 'admin') {
    return { success: false, error: 'No tienes permisos para eliminar usuarios' }
  }

  // Prevenir que un admin se elimine a sí mismo
  if (userId === user.id) {
    return { success: false, error: 'No puedes eliminarte a ti mismo' }
  }

  // Obtener el usuario a eliminar
  const { data: userToDelete } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single()

  if (!userToDelete) {
    return { success: false, error: 'Usuario no encontrado' }
  }

  try {
    // Importar el cliente admin para eliminar de auth
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    console.log(`Intentando eliminar usuario ${userId} (${userToDelete.email})`)

    // Verificar si el usuario existe en auth antes de intentar eliminarlo
    const { data: authUser, error: getUserError } = await adminClient.auth.admin.getUserById(userId)
    
    if (getUserError) {
      console.log(`Usuario no encontrado en auth.users:`, getUserError)
      console.log(`Continuando solo con soft delete en la tabla users`)
    } else if (authUser) {
      console.log(`Usuario encontrado en auth.users, procediendo a eliminar`)
      // Eliminar de auth.users (elimina el acceso de login)
      const { error: authError } = await adminClient.auth.admin.deleteUser(userId)
      
      if (authError) {
        console.error('Error deleting from auth:', authError)
        return { success: false, error: 'Error al eliminar usuario de autenticación: ' + authError.message }
      }
      console.log(`Usuario eliminado exitosamente de auth.users`)
    }

    // Marcar como eliminado en la tabla users (soft delete)
    const { error: dbError } = await supabase
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', userId)

    if (dbError) {
      console.error('Error marking user as deleted:', dbError)
      return { success: false, error: 'Error al marcar usuario como eliminado: ' + dbError.message }
    }

    console.log(`Usuario marcado como eliminado en tabla users`)
    revalidatePath('/users')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return { success: false, error: 'Error al eliminar usuario: ' + error.message }
  }
}

export async function getUserStats(): Promise<{
  total: number
  admins: number
  customers: number
  b2b: number
}> {
  const supabase = await createClient()
  
  // Obtener solo usuarios activos (no eliminados)
  const { data: users } = await supabase
    .from('users')
    .select('role')
    .is('deleted_at', null)

  if (!users) {
    return { total: 0, admins: 0, customers: 0, b2b: 0 }
  }

  return {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    customers: users.filter(u => u.role === 'customer').length,
    b2b: users.filter(u => u.role === 'b2b').length,
  }
}
