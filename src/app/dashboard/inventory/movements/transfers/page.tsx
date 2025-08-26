import Link from 'next/link'
import { getGroupedTransfers } from '@/actions/inventory/movements'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function GroupedTransfersPage() {
  const result = await getGroupedTransfers(1, 20)

  return (
    <div className="container mx-auto px-6 py-8">
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Transferencias Agrupadas</CardTitle>
              <CardDescription className="text-blue-100">Operaciones múltiples organizadas por lote</CardDescription>
            </div>
            <Link href="/dashboard/inventory/movements">
              <Button variant="secondary" size="sm">← Volver a Movimientos</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {result.success && result.transfers && result.transfers.length > 0 ? (
              result.transfers.map((t: any) => (
                <div key={t.batch_id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{t.fromWarehouse} → {t.toWarehouse}</div>
                      <div className="text-sm text-gray-600">{new Date(t.createdAt).toLocaleString('es-CL')}</div>
                    </div>
                    <div className="text-sm text-gray-700">
                      {t.productCount} productos, total {t.totalQuantity}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {t.products.map((p: any, idx: number) => (
                      <div key={idx} className="text-sm text-gray-700 flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                        <span>{p.name}</span>
                        <span className="font-medium">{p.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-gray-600">No hay transferencias agrupadas</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


