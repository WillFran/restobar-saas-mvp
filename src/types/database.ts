export type OrderStatus =
  | 'pendiente'
  | 'preparando'
  | 'listo'
  | 'entregado'
  | 'pagado'
  | 'cancelado'

export type TableStatus = 'libre' | 'ocupada' | 'por_cobrar'

export type RestaurantTable = {
  id: string
  table_number: number
  status: TableStatus
}

export type Product = {
  id: string
  name: string
  category: string
  price: number
  is_available?: boolean
}

export type CartItem = {
  product: Product
  quantity: number
}

export type OrderItem = {
  id: string
  quantity: number
  unit_price: number
  status: OrderStatus | string
  notes?: string | null
  products: {
    name: string
    category: string
  } | null
}

export type ActiveOrder = {
  id: string
  status: OrderStatus
  created_at: string
  total_amount: number
  order_items: OrderItem[]
}

export type KitchenOrder = {
  id: string
  status: OrderStatus
  created_at: string
  restaurant_tables: {
    table_number: number
  } | null
  order_items: OrderItem[]
}