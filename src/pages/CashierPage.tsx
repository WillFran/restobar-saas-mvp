import AppLayout from '../components/layout/AppLayout'

export default function CashierPage() {
  return (
    <AppLayout>
      <div className="p-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <h1 className="text-4xl font-bold mb-3">
            Caja 💳
          </h1>

          <p className="text-zinc-400">
            Próximamente:
          </p>

          <ul className="mt-6 space-y-3 text-zinc-300">
            <li>• Cobro centralizado</li>
            <li>• Historial de pagos</li>
            <li>• Métodos de pago</li>
            <li>• Tickets</li>
            <li>• Apertura y cierre de caja</li>
            <li>• Arqueo diario</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  )
}