import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import AppLayout from '../../components/layout/AppLayout'

import { supabase } from '../../lib/supabase'

import type { Product } from '../../types/database'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])

  const [name, setName] = useState('')
  const [category, setCategory] = useState('plato')
  const [price, setPrice] = useState('')

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      toast.error('No se pudieron cargar productos')
      return
    }

    setProducts(data ?? [])
  }

  async function createProduct(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!name || !price) {
      toast.error('Completa todos los campos')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('products')
        .insert({
          name,
          category,
          price: Number(price),
        })

      if (error) {
        throw error
      }

      toast.success('Producto creado')

      setName('')
      setCategory('plato')
      setPrice('')

      fetchProducts()
    } catch (error) {
      console.error(error)
      toast.error('No se pudo crear producto')
    } finally {
      setLoading(false)
    }
  }

  async function toggleAvailability(
    productId: string,
    currentValue: boolean
  ) {
    const { error } = await supabase
      .from('products')
      .update({
        is_available: !currentValue,
      })
      .eq('id', productId)

    if (error) {
      console.error(error)
      toast.error('No se pudo actualizar')
      return
    }

    toast.success('Producto actualizado')
    fetchProducts()
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Productos 🍽️
          </h1>

          <p className="text-zinc-400">
            Gestión de platos y bebidas
          </p>
        </div>

        <div className="grid xl:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-5">
              Nuevo producto
            </h2>

            <form
              onSubmit={createProduct}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Nombre
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Lomo saltado"
                  className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Categoría
                </label>

                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                  className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 outline-none focus:border-emerald-500"
                >
                  <option value="plato">Plato</option>
                  <option value="bebida">Bebida</option>
                  <option value="entrada">Entrada</option>
                  <option value="postre">Postre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Precio
                </label>

                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(event) =>
                    setPrice(event.target.value)
                  }
                  placeholder="18.00"
                  className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3 rounded-xl transition"
              >
                {loading
                  ? 'Creando...'
                  : 'Crear producto'}
              </button>
            </form>
          </div>

          <div className="xl:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-5">
              Lista de productos
            </h2>

            <div className="space-y-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <h3 className="text-xl font-bold">
                      {product.name}
                    </h3>

                    <p className="text-zinc-400 capitalize">
                      {product.category}
                    </p>

                    <p className="text-emerald-400 font-bold mt-2">
                      S/ {product.price}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      toggleAvailability(
                        product.id,
                        product.is_available ?? true
                      )
                    }
                    className={`px-4 py-2 rounded-xl font-semibold transition ${
                      product.is_available
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {product.is_available
                      ? 'Disponible'
                      : 'Oculto'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}