'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DebugInvoiceDataProps {
  data: any;
  title?: string;
}

export default function DebugInvoiceData({ data, title = "Debug Data" }: DebugInvoiceDataProps) {
  if (!data) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800">❌ No hay datos para mostrar</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-800">🔍 {title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Datos principales */}
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Datos Principales:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>
                <span className="font-medium">ID:</span> {data.id}
              </div>
              <div>
                <span className="font-medium">Número:</span> {data.number}
              </div>
              <div>
                <span className="font-medium">Número Proveedor:</span> {data.supplier_invoice_number || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Estado:</span> 
                <Badge variant="outline" className="ml-1">
                  {data.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Fechas:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div>
                <span className="font-medium">Emisión:</span> {data.issue_date}
              </div>
              <div>
                <span className="font-medium">Vencimiento:</span> {data.due_date || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Creada:</span> {data.created_at}
              </div>
            </div>
          </div>

          {/* Totales */}
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Totales:</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="font-medium">Subtotal:</span> ${data.subtotal?.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">IVA:</span> ${data.tax_amount?.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Total:</span> ${data.total?.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Relaciones */}
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Relaciones:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Proveedor ID:</span> {data.supplier_id || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Bodega ID:</span> {data.warehouse_id || 'N/A'}
              </div>
            </div>
          </div>

          {/* Líneas */}
          {data.purchase_invoice_lines && (
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">
                Líneas ({data.purchase_invoice_lines.length}):
              </h4>
              <div className="space-y-2">
                {data.purchase_invoice_lines.map((line: any, index: number) => (
                  <div key={line.id || index} className="border border-blue-200 rounded p-2 bg-white">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="font-medium">Descripción:</span> {line.description}
                      </div>
                      <div>
                        <span className="font-medium">Cantidad:</span> {line.quantity}
                      </div>
                      <div>
                        <span className="font-medium">Precio:</span> ${line.unit_price}
                      </div>
                      <div>
                        <span className="font-medium">Total:</span> ${line.line_total}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Datos completos */}
          <details className="mt-4">
            <summary className="cursor-pointer font-semibold text-blue-900">
              📋 Datos Completos (JSON)
            </summary>
            <pre className="mt-2 p-2 bg-white border rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      </CardContent>
    </Card>
  );
} 