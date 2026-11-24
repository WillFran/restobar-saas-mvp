import { useEffect, useState } from 'react'

import AppLayout from '../components/layout/AppLayout'

import { getDashboardStats } from '../services/dashboard.service'

type DashboardStats = {
  activeOrders: number
  occupiedTables: number
  totalProducts: number
  totalSales: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    activeOrders: 0,
    occupiedTables: 0,
    totalProducts: 0,
    totalSales: 0,
  })

  async function fetchDashboard() {
    const data = await getDashboardStats()
    setStats(data)
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  return (
    <AppLayout>
      <div className="space-y-8 p-6">
        <div>
          <h1 className="text-5xl font-black">
            Dashboard Admin 📊
          </h1>

          <p className="mt-2 text-zinc-400">
            Resumen general del restaurante
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-zinc-400">
              Ventas totales
            </p>

            <h2 className="mt-3 text-4xl font-black text-emerald-400">
              S/ {stats.totalSales.toFixed(2)}
            </h2>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-zinc-400">
              Pedidos activos
            </p>

            <h2 className="mt-3 text-4xl font-black text-blue-400">
              {stats.activeOrders}
            </h2>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-zinc-400">
              Mesas ocupadas
            </p>

            <h2 className="mt-3 text-4xl font-black text-yellow-400">
              {stats.occupiedTables}
            </h2>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-zinc-400">
              Productos registrados
            </p>

            <h2 className="mt-3 text-4xl font-black text-pink-400">
              {stats.totalProducts}
            </h2>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}