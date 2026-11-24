import { supabase } from '../lib/supabase'
import type { RestaurantTable, TableStatus } from '../types/database'

export async function getTables(): Promise<RestaurantTable[]> {
  const { data, error } = await supabase
    .from('restaurant_tables')
    .select('*')
    .order('table_number', { ascending: true })

  if (error) {
    console.error('Error cargando mesas:', error)
    throw error
  }

  return data ?? []
}

export async function updateTableStatus(
  tableId: string,
  status: TableStatus
): Promise<void> {
  const { error } = await supabase
    .from('restaurant_tables')
    .update({ status })
    .eq('id', tableId)

  if (error) {
    console.error('Error actualizando mesa:', error)
    throw error
  }
}