import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

type Role = 'admin' | 'waiter' | 'kitchen' | 'cashier'

type Props = {
  allowedRoles: Role[]
  children: React.ReactNode
}

export default function RoleGuard({ allowedRoles, children }: Props) {
  const { user, loading: authLoading } = useAuth()
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error cargando perfil:', error)
        setRole(null)
      } else {
        setRole(data.role as Role)
      }

      setLoading(false)
    }

    fetchProfile()
  }, [user])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <p className="text-zinc-400">Validando permisos...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (role === 'admin') {
    return children
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />
  }

  return children
}