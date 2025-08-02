'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PurchasesReportsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Reportes de Compras</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>📊 Reportes en Desarrollo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Esta página de reportes estará disponible en futuras versiones.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 