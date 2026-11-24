import { supabase } from '../lib/supabase'
import type {
  ActiveOrder,
  CartItem,
  KitchenOrder,
  OrderStatus,
} from '../types/database'

function normalizeOrderItems(order: any) {
  return {
    ...order,
    order_items: Array.isArray(order.order_items)
      ? order.order_items.map((item: any) => ({
          ...item,
          products: Array.isArray(item.products)
            ? item.products[0] ?? null
            : item.products,
        }))
      : [],
  }
}

export async function getKitchenOrders(): Promise<KitchenOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      created_at,
      restaurant_tables (
        table_number
      ),
      order_items (
        id,
        quantity,
        unit_price,
        status,
        notes,
        products (
          name,
          category
        )
      )
    `)
    .in('status', ['pendiente', 'preparando'])
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error cargando pedidos de cocina:', error)
    throw error
  }

  return (data ?? []).map((order: any) => ({
    ...normalizeOrderItems(order),
    restaurant_tables: Array.isArray(order.restaurant_tables)
      ? order.restaurant_tables[0] ?? null
      : order.restaurant_tables,
  }))
}

export async function getActiveOrdersByTable(
  tableId: string
): Promise<ActiveOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      created_at,
      total_amount,
      order_items (
        id,
        quantity,
        unit_price,
        status,
        products (
          name,
          category
        )
      )
    `)
    .eq('table_id', tableId)
    .in('status', [
      'pendiente',
      'preparando',
      'listo',
      'entregado',
    ])
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error cargando pedidos activos:', error)
    throw error
  }

  return (data ?? []).map((order: any) => normalizeOrderItems(order))
}

export async function createOrderWithItems(
  tableId: string,
  cart: CartItem[],
  totalAmount: number
): Promise<void> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      table_id: tableId,
      status: 'pendiente',
      total_amount: totalAmount,
    })
    .select()
    .single()

  if (orderError) {
    console.error('Error creando pedido:', orderError)
    throw orderError
  }

  const itemsToInsert = cart.map((item) => ({
    order_id: order.id,
    product_id: item.product.id,
    quantity: item.quantity,
    unit_price: item.product.price,
    status: 'pendiente',
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(itemsToInsert)

  if (itemsError) {
    console.error('Error agregando productos:', itemsError)
    throw itemsError
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) {
    console.error('Error actualizando pedido:', error)
    throw error
  }
}

export async function markDeliveredOrdersAsPaid(
  orderIds: string[]
): Promise<void> {
  if (orderIds.length === 0) return

  const { error } = await supabase
    .from('orders')
    .update({ status: 'pagado' })
    .in('id', orderIds)

  if (error) {
    console.error('Error marcando pedidos como pagados:', error)
    throw error
  }
}