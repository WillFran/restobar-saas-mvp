import { useEffect, useState, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import {
  NavLink,
  useNavigate,
} from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

type Props = {
  children: ReactNode
}

type Role =
  | 'admin'
  | 'waiter'
  | 'kitchen'
  | 'cashier'

type NavItem = {
  label: string
  path: string
}

export default function AppLayout({
  children,
}: Props) {
  const navigate = useNavigate()

  const { signOut, user } = useAuth()

  const [role, setRole] = useState<Role | null>(
    null
  )

  useEffect(() => {
    async function fetchRole() {
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error(error)
        return
      }

      setRole(data.role as Role)
    }

    fetchRole()
  }, [user])

  async function handleLogout() {
    try {
      await signOut()

      toast.success('Sesión cerrada')

      navigate('/login')
    } catch (error) {
      console.error(error)

      toast.error(
        'No se pudo cerrar sesión'
      )
    }
  }

  const navItems: NavItem[] = []

  if (role === 'admin') {
    navItems.push(
      {
        label: 'Mozo',
        path: '/waiter',
      },
      {
        label: 'Cocina',
        path: '/kitchen',
      },
      {
        label: 'Caja',
        path: '/cashier',
      },
      {
        label: 'Admin',
        path: '/admin',
      },
      {
        label: 'Productos',
        path: '/admin/products',
      },
      {
        label: 'Mesas',
        path: '/admin/tables',
      },
    )
  }

  if (role === 'waiter') {
    navItems.push({
      label: 'Mozo',
      path: '/waiter',
    })
  }

  if (role === 'kitchen') {
    navItems.push({
      label: 'Cocina',
      path: '/kitchen',
    })
  }

  if (role === 'cashier') {
    navItems.push({
      label: 'Caja',
      path: '/cashier',
    })
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-black tracking-wide">
              RESTOBAR SaaS
            </h1>

            <p className="text-sm text-zinc-400">
              Sistema profesional de gestión
            </p>
          </div>

          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-2 text-sm font-semibold transition ${isActive
                      ? 'bg-emerald-500 text-zinc-950'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <button
              onClick={handleLogout}
              className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/30"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl">
        {children}
      </main>
    </div>
  )
}