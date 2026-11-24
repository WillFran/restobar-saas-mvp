import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import AppLayout from '../components/layout/AppLayout'

import { supabase } from '../lib/supabase'
import type { KitchenOrder } from '../types/database'
import {
  getKitchenOrders,
  updateOrderStatus,
} from '../services/orders.service'

export default function KitchenPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  const reloadTimer = useRef<number | null>(null)
  const pollingRef = useRef<number | null>(null)

  useEffect(() => {
    fetchOrders()

    const reloadKitchen = () => {
      if (reloadTimer.current) {
        window.clearTimeout(reloadTimer.current)
      }

      reloadTimer.current = window.setTimeout(() => {
        fetchOrders()
      }, 500)
    }

    const channel = supabase
      .channel('kitchen-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        reloadKitchen
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
        },
        reloadKitchen
      )
      .subscribe((status) => {
        console.log('Realtime cocina:', status)
        setIsRealtimeConnected(status === 'SUBSCRIBED')
      })

    pollingRef.current = window.setInterval(() => {
      fetchOrders()
    }, 2000)

    return () => {
      if (reloadTimer.current) {
        window.clearTimeout(reloadTimer.current)
      }

      if (pollingRef.current) {
        window.clearInterval(pollingRef.current)
      }

      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchOrders() {
    try {
      const kitchenOrders = await getKitchenOrders()
      setOrders(kitchenOrders)
    } catch (error) {
      console.error(error)
      toast.error('No se pudieron cargar los pedidos')
    }
  }

  async function handleUpdateOrderStatus(
    orderId: string,
    status: 'preparando' | 'listo'
  ) {
    if (updatingOrderId) return

    setUpdatingOrderId(orderId)

    try {
      await updateOrderStatus(orderId, status)

      fetchOrders()

      if (status === 'preparando') {
        toast.success('Pedido en preparación')
      }

      if (status === 'listo') {
        toast.success('Pedido listo para entregar')
      }
    } catch (error) {
      console.error(error)
      toast.error('No se pudo actualizar el pedido')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Pantalla de Cocina 👨‍🍳
            </h1>

            <p className="text-zinc-400">
              Pedidos entrantes en tiempo real
            </p>
          </div>

          <div
            className={`rounded-full px-4 py-2 text-sm font-semibold ${isRealtimeConnected
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-red-500/20 text-red-300'
              }`}
          >
            {isRealtimeConnected ? 'Realtime activo' : 'Realtime desconectado'}
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <p className="text-zinc-400">
              No hay pedidos pendientes por ahora.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">
                      Mesa {order.restaurant_tables?.table_number ?? 'Sin mesa'}
                    </h2>

                    <p className="text-sm text-zinc-400">
                      Estado: {order.status}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${order.status === 'pendiente'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'bg-blue-500/20 text-blue-300'
                      }`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  {order.order_items.length === 0 ? (
                    <div className="bg-zinc-800 rounded-xl p-4 text-zinc-400">
                      Cargando productos del pedido...
                    </div>
                  ) : (
                    order.order_items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-zinc-800 rounded-xl p-4"
                      >
                        <p className="font-semibold">
                          {item.quantity} x {item.products?.name ?? 'Producto'}
                        </p>

                        <p className="text-sm text-zinc-400 capitalize">
                          {item.products?.category ?? 'Sin categoría'}
                        </p>

                        {item.notes && (
                          <p className="text-sm text-yellow-300 mt-2">
                            Nota: {item.notes}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      handleUpdateOrderStatus(order.id, 'preparando')
                    }
                    disabled={order.status !== 'pendiente' || updatingOrderId === order.id}
                    className={`flex-1 font-bold py-3 rounded-xl transition ${order.status === 'pendiente'
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                      }`}
                  >
                    Preparando
                  </button>

                  <button
                    onClick={() =>
                      handleUpdateOrderStatus(order.id, 'listo')
                    }
                    disabled={order.status !== 'preparando' || updatingOrderId === order.id}
                    className={`flex-1 font-bold py-3 rounded-xl transition ${order.status === 'preparando'
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                      }`}
                  >
                    Listo
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}