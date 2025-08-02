import { verifyClientTables } from '@/actions/clients/verify-tables'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function VerifyClientTablesPage() {
  const result = await verifyClientTables()

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Verificación de Tablas de Clientes</h1>
      {!result?.success ? (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Error en la verificación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 font-mono whitespace-pre-wrap">{result?.error ?? 'Error desconocido'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {result.results?.map((tableResult: any) => (
            <Card key={tableResult.table} className={
              tableResult.status === 'success'
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className={
                    tableResult.status === 'success' ? 'text-green-800' : 'text-red-800'
                  }>
                    {tableResult.table}
                  </CardTitle>
                  <Badge variant={tableResult.status === 'success' ? 'default' : 'destructive'}>
                    {tableResult.status === 'success' ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {tableResult.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className={
                  tableResult.status === 'success' ? 'text-green-700' : 'text-red-700'
                }>
                  {tableResult.message}
                </p>
              </CardContent>
            </Card>
          ))}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-700">
                Se verificaron {result.results ? result.results.length : 0} tablas.
                {result.results ? result.results.filter((r: any) => r.status === 'success').length : 0} exitosas,
                {result.results ? result.results.filter((r: any) => r.status === 'error').length : 0} con errores.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 