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

  // Obtener todos los usuarios
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
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

export async function getUserStats(): Promise<{
  total: number
  admins: number
  customers: number
  b2b: number
}> {
  const supabase = await createClient()
  
  const { data: users } = await supabase
    .from('users')
    .select('role')

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
