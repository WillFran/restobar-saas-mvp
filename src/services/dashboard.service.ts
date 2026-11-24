import { supabase } from '../lib/supabase'

export async function getDashboardStats() {
  const [
    ordersResponse,
    tablesResponse,
    productsResponse,
    paymentsResponse,
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),

    supabase
      .from('restaurant_tables')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ocupada'),

    supabase.from('products').select('*', { count: 'exact', head: true }),

    supabase.from('payments').select('amount'),
  ])

  const totalSales =
    paymentsResponse.data?.reduce(
      (acc, payment) => acc + Number(payment.amount),
      0
    ) || 0

  return {
    activeOrders: ordersResponse.count || 0,
    occupiedTables: tablesResponse.count || 0,
    totalProducts: productsResponse.count || 0,
    totalSales,
  }
}