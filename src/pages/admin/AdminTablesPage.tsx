import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import AppLayout from '../../components/layout/AppLayout'
import { supabase } from '../../lib/supabase'
import type { RestaurantTable } from '../../types/database'

export default function AdminTablesPage() {
    const [tables, setTables] = useState<RestaurantTable[]>([])
    const [tableNumber, setTableNumber] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchTables()
    }, [])

    async function fetchTables() {
        const { data, error } = await supabase
            .from('restaurant_tables')
            .select('*')
            .order('table_number', { ascending: true })

        if (error) {
            console.error(error)
            if (
                typeof error === 'object' &&
                error !== null &&
                'code' in error &&
                error.code === '23505'
            ) {
                toast.error('Ya existe una mesa con ese número')
                return
            }

            toast.error('No se pudo crear la mesa')
            return
        }

        setTables(data ?? [])
    }

    async function createTable(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!tableNumber) {
            toast.error('Ingresa el número de mesa')
            return
        }

        setLoading(true)

        try {
            const { error } = await supabase
                .from('restaurant_tables')
                .insert({
                    table_number: Number(tableNumber),
                    status: 'libre',
                })

            if (error) throw error

            toast.success('Mesa creada')
            setTableNumber('')
            fetchTables()
        } catch (error) {
            console.error(error)
            toast.error('No se pudo crear la mesa')
        } finally {
            setLoading(false)
        }
    }

    async function deleteTable(tableId: string, status: string) {
        if (status !== 'libre') {
            toast.error('Solo puedes eliminar mesas libres')
            return
        }

        const confirmed = window.confirm(
            '¿Seguro que deseas eliminar esta mesa?'
        )

        if (!confirmed) return

        const { error } = await supabase
            .from('restaurant_tables')
            .delete()
            .eq('id', tableId)

        if (error) {
            console.error(error)
            toast.error('No se pudo eliminar la mesa')
            return
        }

        toast.success('Mesa eliminada')
        fetchTables()
    }

    return (
        <AppLayout>
            <div className="p-6">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">
                        Mesas 🪑
                    </h1>

                    <p className="text-zinc-400">
                        Gestión de mesas del restaurante
                    </p>
                </div>

                <div className="grid xl:grid-cols-3 gap-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                        <h2 className="text-2xl font-bold mb-5">
                            Nueva mesa
                        </h2>

                        <form onSubmit={createTable} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    Número de mesa
                                </label>

                                <input
                                    type="number"
                                    min="1"
                                    value={tableNumber}
                                    onChange={(event) =>
                                        setTableNumber(event.target.value)
                                    }
                                    placeholder="Ej. 6"
                                    className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 outline-none focus:border-emerald-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-zinc-950 font-bold py-3 rounded-xl transition"
                            >
                                {loading ? 'Creando...' : 'Crear mesa'}
                            </button>
                        </form>
                    </div>

                    <div className="xl:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                        <h2 className="text-2xl font-bold mb-5">
                            Lista de mesas
                        </h2>

                        <div className="grid md:grid-cols-2 gap-4">
                            {tables.map((table) => (
                                <div
                                    key={table.id}
                                    className="bg-zinc-800 border border-zinc-700 rounded-xl p-5"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="text-2xl font-bold">
                                                Mesa {table.table_number}
                                            </h3>

                                            <p className="text-zinc-400 mt-1">
                                                Estado: {table.status}
                                            </p>
                                        </div>

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-bold ${table.status === 'libre'
                                                    ? 'bg-emerald-500/20 text-emerald-300'
                                                    : table.status === 'ocupada'
                                                        ? 'bg-yellow-500/20 text-yellow-300'
                                                        : 'bg-purple-500/20 text-purple-300'
                                                }`}
                                        >
                                            {table.status}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() =>
                                            deleteTable(table.id, table.status)
                                        }
                                        disabled={table.status !== 'libre'}
                                        className="mt-5 w-full rounded-xl bg-red-500/20 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Eliminar mesa
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