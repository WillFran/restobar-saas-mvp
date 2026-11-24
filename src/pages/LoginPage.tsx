import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

type Role =
  | 'admin'
  | 'waiter'
  | 'kitchen'
  | 'cashier'

export default function LoginPage() {
  const navigate = useNavigate()

  const { signIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!email || !password) {
      toast.error('Ingresa correo y contraseña')
      return
    }

    setLoading(true)

    try {
      await signIn(email, password)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('No se encontró usuario')
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error || !profile) {
        throw new Error('Perfil no encontrado')
      }

      const role = profile.role as Role

      toast.success('Sesión iniciada')

      if (role === 'admin') {
        navigate('/admin')
        return
      }

      if (role === 'waiter') {
        navigate('/waiter')
        return
      }

      if (role === 'kitchen') {
        navigate('/kitchen')
        return
      }

      if (role === 'cashier') {
        navigate('/cashier')
        return
      }

      navigate('/login')
    } catch (error) {
      console.error(error)
      toast.error('Correo o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black tracking-wide">
            RESTOBAR SaaS
          </h1>

          <p className="mt-2 text-zinc-400">
            Inicia sesión para continuar
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">
              Correo
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="admin@restobar.com"
              className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">
              Contraseña
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="••••••••"
              className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? 'Ingresando...'
              : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}