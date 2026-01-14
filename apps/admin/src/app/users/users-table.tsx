'use client'

import { useState } from 'react'
import { UserProfile, UserRole, updateUserRole } from './actions'
import { Shield, ShoppingBag, Building2, Loader2, Check } from 'lucide-react'

interface UsersTableProps {
  users: UserProfile[]
  currentUserId: string
}

const roleConfig: Record<UserRole, { label: string; icon: typeof Shield; color: string; bg: string }> = {
  admin: { 
    label: 'Administrador', 
    icon: Shield, 
    color: 'text-green-700', 
    bg: 'bg-green-100' 
  },
  customer: { 
    label: 'Cliente', 
    icon: ShoppingBag, 
    color: 'text-blue-700', 
    bg: 'bg-blue-100' 
  },
  b2b: { 
    label: 'Mayorista (B2B)', 
    icon: Building2, 
    color: 'text-purple-700', 
    bg: 'bg-purple-100' 
  },
}

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)
  const [successUser, setSuccessUser] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingUser(userId)
    setError(null)
    
    const result = await updateUserRole(userId, newRole)
    
    setUpdatingUser(null)
    
    if (result.error) {
      setError(result.error)
      setTimeout(() => setError(null), 3000)
    } else {
      setSuccessUser(userId)
      setTimeout(() => setSuccessUser(null), 2000)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (users.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400">
        No hay usuarios registrados
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b text-sm font-medium text-slate-500">
              <th className="py-4 px-4">Usuario</th>
              <th className="py-4 px-4">Rol</th>
              <th className="py-4 px-4">Puntos</th>
              <th className="py-4 px-4">Registrado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => {
              const isCurrentUser = user.id === currentUserId
              const isUpdating = updatingUser === user.id
              const showSuccess = successUser === user.id
              
              return (
                <tr key={user.id} className="text-sm hover:bg-slate-50/50">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-bold text-slate-900">
                        {user.full_name || 'Sin nombre'}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs font-normal text-calmar-ocean">(Tú)</span>
                        )}
                      </p>
                      <p className="text-slate-500 text-xs">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="relative">
                      {isUpdating ? (
                        <div className="flex items-center gap-2 text-slate-400">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-xs">Guardando...</span>
                        </div>
                      ) : showSuccess ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <Check className="h-4 w-4" />
                          <span className="text-xs font-medium">Guardado</span>
                        </div>
                      ) : (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          disabled={isCurrentUser}
                          className={`
                            px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider
                            border-0 cursor-pointer transition-colors
                            ${roleConfig[user.role].bg} ${roleConfig[user.role].color}
                            ${isCurrentUser ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}
                            focus:outline-none focus:ring-2 focus:ring-calmar-ocean/30
                          `}
                          title={isCurrentUser ? 'No puedes cambiar tu propio rol' : 'Haz clic para cambiar el rol'}
                        >
                          <option value="customer">Cliente</option>
                          <option value="admin">Administrador</option>
                          <option value="b2b">Mayorista (B2B)</option>
                        </select>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-mono text-slate-600">
                      {user.points_balance.toLocaleString('es-CL')}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-500">
                    {formatDate(user.created_at)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
