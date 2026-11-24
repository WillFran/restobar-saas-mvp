import { supabase } from '../lib/supabase'
import type { Product } from '../types/database'

export async function getAvailableProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_available', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error cargando productos:', error)
    throw error
  }

  return data ?? []
}