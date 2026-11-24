import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import AppLayout from '../components/layout/AppLayout'

import { supabase } from '../lib/supabase'
import type {
  ActiveOrder,
  CartItem,
  Product,
  RestaurantTable,
} from '../types/database'

import {
  createOrderWithItems,
  getActiveOrdersByTable,
  markDeliveredOrdersAsPaid,
  updateOrderStatus,
} from '../services/orders.service'

import {
  getTables,
  updateTableStatus,
} from '../services/tables.service'

import { getAvailableProducts } from '../services/products.service'

export default function WaiterPage() {
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([])
  const [loading, setLoading] = useState(false)

  const selectedTableRef = useRef<RestaurantTable | null>(null)
  const reloadTimer = useRef<number | null>(null)
  const pollingRef = useRef<number | null>(null)

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  const deliveredTotal = activeOrders
    .filter((order) => order.status === 'entregado')
    .reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0)

  const finalTotal = deliveredTotal + cartTotal

  const canCloseTable =
    activeOrders.length > 0 &&
    activeOrders.every((order) => order.status === 'entregado') &&
    cart.length === 0

  useEffect(() => {
    fetchTables()
    fetchProducts()

    const channel = supabase
      .channel('waiter-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurant_tables',
        },
        () => {
          fetchTables()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          reloadSelectedTableOrders()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
        },
        () => {
          reloadSelectedTableOrders()
        }
      )
      .subscribe()

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

  useEffect(() => {
    if (!selectedTable) return

    selectedTableRef.current = selectedTable
    fetchActiveOrders(selectedTable.id)

    if (pollingRef.current) {
      window.clearInterval(pollingRef.current)
    }

    pollingRef.current = window.setInterval(() => {
      fetchActiveOrders(selectedTable.id)
    }, 2000)

    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current)
      }
    }
  }, [selectedTable])

  function reloadSelectedTableOrders() {
    const currentTable = selectedTableRef.current

    if (!currentTable) return

    if (reloadTimer.current) {
      window.clearTimeout(reloadTimer.current)
    }

    reloadTimer.current = window.setTimeout(() => {
      fetchActiveOrders(currentTable.id)
    }, 500)
  }

  async function fetchTables() {
    try {
      const tablesData = await getTables()
      setTables(tablesData)
    } catch (error) {
      console.error(error)
      toast.error('No se pudieron cargar las mesas')
    }
  }

  async function fetchProducts() {
    try {
      const productsData = await getAvailableProducts()
      setProducts(productsData)
    } catch (error) {
      console.error(error)
      toast.error('No se pudieron cargar los productos')
    }
  }

  async function fetchActiveOrders(tableId: string) {
    try {
      const orders = await getActiveOrdersByTable(tableId)
      setActiveOrders(orders)
    } catch (error) {
      console.error(error)
      toast.error('No se pudieron cargar los pedidos de la mesa')
    }
  }

  function selectTable(table: RestaurantTable) {
    selectedTableRef.current = table
    setSelectedTable(table)
    setCart([])
    setActiveOrders([])
    fetchActiveOrders(table.id)
  }

  function addToCart(product: Product) {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.product.id === product.id
      )

      if (existingItem) {
        return currentCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [...currentCart, { product, quantity: 1 }]
    })
  }

  function removeFromCart(productId: string) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  async function sendOrderToKitchen() {
    if (!selectedTable || cart.length === 0 || loading) return

    const cartSnapshot = [...cart]
    const totalSnapshot = cartTotal
    const tableId = selectedTable.id

    setLoading(true)
    setCart([])

    try {
      await createOrderWithItems(
        tableId,
        cartSnapshot,
        totalSnapshot
      )

      await updateTableStatus(tableId, 'ocupada')

      fetchTables()
      fetchActiveOrders(tableId)

      toast.success('Pedido enviado a cocina')
    } catch (error) {
      console.error(error)

      setCart(cartSnapshot)

      toast.error('No se pudo enviar el pedido')
    } finally {
      setLoading(false)
    }
  }

  async function cancelOrder(orderId: string) {
    try {
      await updateOrderStatus(orderId, 'cancelado')

      toast.success('Pedido cancelado')
      reloadSelectedTableOrders()
    } catch (error) {
      console.error(error)
      toast.error('No se pudo cancelar')
    }
  }

  async function markOrderAsDelivered(orderId: string) {
    try {
      await updateOrderStatus(orderId, 'entregado')

      toast.success('Pedido entregado')
      reloadSelectedTableOrders()
    } catch (error) {
      console.error(error)
      toast.error('No se pudo entregar')
    }
  }

  async function payAndReleaseTable() {
    if (!selectedTable || !canCloseTable) {
      toast.error('Todavía hay pedidos pendientes')
      return
    }

    const deliveredOrderIds = activeOrders
      .filter((order) => order.status === 'entregado')
      .map((order) => order.id)

    try {
      await markDeliveredOrdersAsPaid(deliveredOrderIds)
      await updateTableStatus(selectedTable.id, 'libre')

      toast.success('Cuenta pagada y mesa liberada')

      setCart([])
      setActiveOrders([])
      setSelectedTable(null)
      selectedTableRef.current = null

      fetchTables()
    } catch (error) {
      console.error(error)
      toast.error('No se pudo cerrar la cuenta')
    }
  }

  function getStatusStyle(status: string) {
    if (status === 'pendiente') return 'bg-yellow-500/20 text-yellow-300'
    if (status === 'preparando') return 'bg-blue-500/20 text-blue-300'
    if (status === 'listo') return 'bg-emerald-500/20 text-emerald-300'
    if (status === 'entregado') return 'bg-purple-500/20 text-purple-300'
    if (status === 'cancelado') return 'bg-red-500/20 text-red-300'
    return 'bg-zinc-500/20 text-zinc-300'
  }

  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-4xl font-bold mb-2">
          RestoBar MVP
        </h1>

        <p className="text-zinc-400 mb-8">
          Selecciona una mesa
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {tables.map((table) => (
            <button
              key={table.id}
              onClick={() => selectTable(table)}
              className={`border rounded-2xl p-6 text-left transition-all ${selectedTable?.id === table.id
                ? 'bg-emerald-700 border-emerald-400'
                : 'bg-zinc-800 border-zinc-700 hover:border-emerald-500'
                }`}
            >
              <h2 className="text-2xl font-bold">
                Mesa {table.table_number}
              </h2>

              <p className="mt-2 text-sm text-zinc-300">
                Estado: {table.status}
              </p>
            </button>
          ))}
        </div>

        {selectedTable && (
          <div className="grid lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-4">
                Productos
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl p-4 text-left transition"
                  >
                    <h3 className="text-xl font-semibold">
                      {product.name}
                    </h3>

                    <p className="text-zinc-400">
                      {product.category}
                    </p>

                    <p className="text-emerald-400 font-bold mt-2">
                      S/ {product.price}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            <aside className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-4">
                Mesa {selectedTable.table_number}
              </h2>

              <div className="space-y-4 mb-6">
                {activeOrders.length === 0 ? (
                  <p className="text-sm text-zinc-500">
                    Esta mesa aún no tiene pedidos activos.
                  </p>
                ) : (
                  activeOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-zinc-800 rounded-xl p-4 border border-zinc-700"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(order.status)}`}
                        >
                          {order.status}
                        </span>

                        <span className="font-bold text-emerald-400">
                          S/ {Number(order.total_amount).toFixed(2)}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {order.order_items.map((item) => (
                          <div
                            key={item.id}
                            className="text-sm text-zinc-300"
                          >
                            {item.quantity} x {item.products?.name}
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 mt-4">
                        {order.status === 'pendiente' && (
                          <button
                            onClick={() => cancelOrder(order.id)}
                            className="flex-1 bg-red-600 hover:bg-red-500 py-2 rounded-xl text-sm font-bold"
                          >
                            Cancelar
                          </button>
                        )}

                        {order.status === 'listo' && (
                          <button
                            onClick={() => markOrderAsDelivered(order.id)}
                            className="flex-1 bg-purple-600 hover:bg-purple-500 py-2 rounded-xl text-sm font-bold"
                          >
                            Entregado
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-zinc-800 pt-5">
                <h3 className="font-bold mb-3">
                  Nuevo pedido
                </h3>

                {cart.length === 0 ? (
                  <p className="text-zinc-500 text-sm">
                    Aún no hay productos agregados.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center justify-between bg-zinc-800 rounded-xl p-3"
                      >
                        <div>
                          <p className="font-semibold">
                            {item.product.name}
                          </p>

                          <p className="text-sm text-zinc-400">
                            {item.quantity} x S/ {item.product.price}
                          </p>

                          <p className="text-sm text-emerald-400 font-semibold">
                            Subtotal: S/ {(item.product.price * item.quantity).toFixed(2)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded-lg"
                          >
                            -
                          </button>

                          <span className="w-6 text-center">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() => addToCart(item.product)}
                            className="bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded-lg"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-700 pt-4 mt-5 space-y-2">
                <div className="flex justify-between text-zinc-300">
                  <span>Total entregado</span>
                  <span>S/ {deliveredTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-zinc-300">
                  <span>Nuevo pedido</span>
                  <span>S/ {cartTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-xl font-bold pt-2">
                  <span>Total mesa</span>

                  <span className="text-emerald-400">
                    S/ {finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={sendOrderToKitchen}
                  disabled={loading || cart.length === 0}
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed py-3 rounded-xl font-bold"
                >
                  {loading ? 'Enviando...' : 'Enviar a cocina'}
                </button>
              )}

              {activeOrders.length > 0 && !canCloseTable && cart.length === 0 && (
                <p className="mt-4 text-sm text-yellow-300">
                  Para cobrar, todos los pedidos deben estar entregados o cancelados.
                </p>
              )}

              {canCloseTable && (
                <button
                  onClick={payAndReleaseTable}
                  className="w-full mt-4 bg-purple-600 hover:bg-purple-500 py-3 rounded-xl font-bold"
                >
                  Cobrar y liberar mesa
                </button>
              )}
            </aside>
          </div>
        )}
      </div>
    </AppLayout>
  )
}