"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ApiTestResult {
  endpoint: string;
  success: boolean;
  data?: any;
  error?: string;
  responseTime: number;
}

export default function TestOdooApiPage() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<ApiTestResult[]>([]);

  const odooBaseUrl = 'https://ranco35-hotelspatermasllifen4-prueba10-21690156.dev.odoo.com';

  const testEndpoint = async (endpoint: string): Promise<ApiTestResult> => {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 Probando endpoint: ${odooBaseUrl}${endpoint}`);

      const response = await fetch(`${odooBaseUrl}${endpoint}`, {
        method: 'POST', // Cambiar a POST porque el controlador especifica type='json'
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({}), // Enviar JSON vacío
        cache: 'no-store',
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Éxito en ${endpoint}:`, data);
        
        return {
          endpoint,
          success: true,
          data,
          responseTime
        };
      } else {
        const errorText = await response.text();
        console.log(`❌ Error en ${endpoint}: ${response.status} - ${errorText}`);
        
        return {
          endpoint,
          success: false,
          error: `HTTP ${response.status}: ${response.statusText} - ${errorText}`,
          responseTime
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.log(`💥 Excepción en ${endpoint}:`, error);
      
      return {
        endpoint,
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        responseTime
      };
    }
  };

  const runApiTests = async () => {
    setTesting(true);
    setResults([]);

    const endpoints = [
      '/api/productos',
      '/api/categorias', // Verificar si existe
      '/api/product.product', // Endpoint alternativo
    ];

    const testResults: ApiTestResult[] = [];

    for (const endpoint of endpoints) {
      const result = await testEndpoint(endpoint);
      testResults.push(result);
      setResults([...testResults]);
    }

    setTesting(false);
  };

  const getStatusBadge = (result: ApiTestResult) => {
    if (result.success) {
      return <Badge className="bg-green-500">✅ Funciona</Badge>;
    } else if (result.error?.includes('404')) {
      return <Badge variant="secondary">❓ No existe</Badge>;
    } else {
      return <Badge variant="destructive">❌ Error</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">🧪 Prueba API Real de Odoo</h1>
        <p className="text-muted-foreground">
          Prueba la API personalizada del Hotel Spa Termas LLifén
        </p>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <AlertDescription>
          <strong>🏨 Instancia detectada:</strong> Hotel Spa Termas LLifén
          <br />
          <strong>URL:</strong> <code>{odooBaseUrl}</code>
          <br />
          <strong>Método API:</strong> POST con Content-Type: application/json
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>🚀 Probar Endpoints de la API</CardTitle>
          <CardDescription>
            Verificar qué endpoints están disponibles y su formato de respuesta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runApiTests} 
            disabled={testing}
            className="w-full"
          >
            {testing ? '🔄 Probando APIs...' : '🧪 Ejecutar Pruebas de API'}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Resultados de las Pruebas de API</CardTitle>
            <CardDescription>
              {results.filter(r => r.success).length} endpoints funcionando de {results.length} probados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {results.map((result, index) => (
              <div key={index} className="space-y-3 border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-mono text-sm">
                      POST {odooBaseUrl}<span className="text-blue-600">{result.endpoint}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tiempo de respuesta: {result.responseTime}ms
                    </p>
                  </div>
                  <div>{getStatusBadge(result)}</div>
                </div>

                {result.error && (
                  <Alert>
                    <AlertDescription>
                      <strong>Error:</strong> {result.error}
                    </AlertDescription>
                  </Alert>
                )}

                {result.success && result.data && (
                  <Alert className="bg-green-50 border-green-200">
                    <AlertDescription>
                      <strong>✅ Respuesta exitosa</strong>
                      
                      {/* Mostrar estructura de datos */}
                      {result.data.productos && (
                        <div className="mt-2">
                          <p>📦 <strong>Productos encontrados:</strong> {result.data.productos.length}</p>
                          {result.data.productos.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium">Estructura del primer producto:</p>
                              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                                {JSON.stringify(result.data.productos[0], null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Mostrar otros tipos de datos */}
                      {!result.data.productos && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm font-medium">
                            Ver respuesta completa
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>📝 Estructura Esperada de la API</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium">Basado en el controlador Python:</p>
              <pre className="bg-gray-100 p-3 rounded mt-2 text-xs">
{`@http.route('/api/productos', auth='public', type='json', csrf=False)
def get_productos(self):
    # ...
    return {'productos': data}`}
              </pre>
            </div>
            
            <div>
              <p className="font-medium">Formato esperado de respuesta:</p>
              <pre className="bg-gray-100 p-3 rounded mt-2 text-xs">
{`{
  "productos": [
    {
      "id": 1,
      "nombre": "Producto ejemplo",
      "precio": 25000,
      "imagen": "data:image/jpeg;base64,..."
    }
  ]
}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 