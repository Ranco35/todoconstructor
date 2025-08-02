import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Página de Pruebas</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>🧪 Test Environment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Esta es una página de pruebas para desarrollo.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 