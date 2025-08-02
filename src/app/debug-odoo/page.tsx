"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

interface TestResult {
  url: string;
  endpoint: string;
  status: number | null;
  statusText: string;
  success: boolean;
  error?: string;
  responseTime?: number;
  data?: any;
}

export default function DebugOdooPage() {
  const [testing, setTesting] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [results, setResults] = useState<TestResult[]>([]);

  // URLs base para probar
  const baseUrls = [
    'https://ranco35-hotelspatermasllifen4-prueba10-21690156.dev.odoo.com',
    'https://ranco35-hotelspatermasllifen4-staging-productos-api-21685451.dev.odoo.com',
    'https://ranco35-hotelspatermasllifen4-produccion-21690157.dev.odoo.com',
    // Variaciones sin subdominios específicos
    'https://ranco35-hotelspatermasllifen4-21690156.dev.odoo.com',
    'https://ranco35-hotelspatermasllifen4-21685451.dev.odoo.com',
    'https://ranco35-hotelspatermasllifen4-21690157.dev.odoo.com',
  ];

  // Endpoints para probar
  const endpoints = [
    '/api/productos',
    '/api/categorias',
    '/api/product.product',
    '/jsonrpc',
    '/web',
    '/web/database/selector',
    '/',
  ];

  const testUrls = customUrl ? [...baseUrls, customUrl] : baseUrls;

  const testOdooEndpoint = async (baseUrl: string, endpoint: string): Promise<TestResult> => {
    const startTime = Date.now();
    const fullUrl = `${baseUrl}${endpoint}`;
    
    try {
      console.log(`🧪 Probando: ${fullUrl}`);

      const result: TestResult = {
        url: baseUrl,
        endpoint: endpoint,
        status: null,
        statusText: '',
        success: false,
        responseTime: 0
      };

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'User-Agent': 'AdminTermas/1.0 Debug',
          'Accept': 'application/json, text/plain, */*'
        },
        cache: 'no-store',
        mode: 'cors',
      });

      const endTime = Date.now();
      result.responseTime = endTime - startTime;
      result.status = response.status;
      result.statusText = response.statusText;

      if (response.ok) {
        try {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await response.json();
            result.success = true;
            result.data = {
              type: 'json',
              count: Array.isArray(data) ? data.length : 'N/A',
              sample: Array.isArray(data) ? data.slice(0, 1) : data
            };
          } else {
            const text = await response.text();
            result.success = true;
            result.data = {
              type: 'html/text',
              preview: text.substring(0, 200) + (text.length > 200 ? '...' : '')
            };
          }
          console.log(`✅ Éxito: ${fullUrl}`);
        } catch (parseError) {
          result.success = true;
          result.data = { type: 'response', message: 'Respuesta exitosa pero no parseable' };
        }
      } else {
        result.error = `HTTP ${response.status}: ${response.statusText}`;
        console.log(`❌ Error: ${fullUrl} - ${result.error}`);
      }

      return result;
    } catch (error) {
      const endTime = Date.now();
      console.log(`💥 Excepción: ${fullUrl}`, error);
      
      return {
        url: baseUrl,
        endpoint: endpoint,
        status: null,
        statusText: 'Connection Failed',
        success: false,
        responseTime: endTime - startTime,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  };

  const runComprehensiveTest = async () => {
    setTesting(true);
    setResults([]);
    
    console.log('🚀 Iniciando pruebas comprehensivas de Odoo...');
    
    const testResults: TestResult[] = [];
    
    // Probar cada URL con los endpoints principales primero
    for (const baseUrl of testUrls) {
      if (baseUrl.trim()) {
        // Probar primero endpoints principales
        const mainEndpoints = ['/api/productos', '/api/categorias', '/web', '/'];
        
        for (const endpoint of mainEndpoints) {
          const result = await testOdooEndpoint(baseUrl.trim(), endpoint);
          testResults.push(result);
          setResults([...testResults]); // Actualizar en tiempo real
          
          // Si encontramos una conexión exitosa, salir del loop
          if (result.success) {
            console.log(`🎯 Conexión exitosa encontrada: ${baseUrl}${endpoint}`);
            break;
          }
        }
      }
    }
    
    setTesting(false);
    console.log('🏁 Pruebas completadas');
  };

  const testSingleUrl = async (url: string) => {
    setTesting(true);
    
    const result = await testOdooEndpoint(url, '/api/productos');
    setResults([result, ...results]);
    
    setTesting(false);
  };

  const getStatusBadge = (result: TestResult) => {
    if (result.success) {
      return <Badge className="bg-green-500">✅ Conectado</Badge>;
    } else if (result.status === 400) {
      return <Badge variant="destructive">❌ 400 Bad Request</Badge>;
    } else if (result.status === 404) {
      return <Badge variant="destructive">❌ 404 Not Found</Badge>;
    } else if (result.status === 500) {
      return <Badge variant="destructive">❌ 500 Server Error</Badge>;
    } else if (result.error?.includes('fetch') || result.error?.includes('Failed to fetch')) {
      return <Badge variant="destructive">🌐 Error de Red/DNS</Badge>;
    } else if (result.error?.includes('CORS')) {
      return <Badge variant="destructive">🚫 Error CORS</Badge>;
    } else {
      return <Badge variant="destructive">❌ Error</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">🔍 Diagnóstico Avanzado Odoo</h1>
        <p className="text-muted-foreground">
          Herramienta comprehensiva para diagnosticar problemas de conexión con Odoo
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🧪 Pruebas de Conexión</CardTitle>
          <CardDescription>
            Probaremos múltiples URLs y endpoints para encontrar una conexión funcional
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom-url">URL Personalizada (opcional)</Label>
            <Input
              id="custom-url"
              placeholder="https://tu-instancia.odoo.com"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={runComprehensiveTest} 
              disabled={testing}
              className="flex-1"
            >
              {testing ? '🔄 Probando...' : '🚀 Prueba Comprehensiva'}
            </Button>
            
            {customUrl && (
              <Button 
                onClick={() => testSingleUrl(customUrl)} 
                disabled={testing}
                variant="outline"
              >
                🎯 Probar URL Personalizada
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Resultados de las Pruebas</CardTitle>
            <CardDescription>
              {results.filter(r => r.success).length} conexiones exitosas de {results.length} intentos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-mono text-sm break-all">
                      {result.url}<span className="text-blue-600">{result.endpoint}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tiempo: {result.responseTime}ms
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
                      <strong>✅ Conexión exitosa:</strong> 
                      {result.data.type === 'json' && (
                        <span> {result.data.count} elementos encontrados</span>
                      )}
                      {result.data.type === 'html/text' && (
                        <span> Página web cargada</span>
                      )}
                      
                      {result.data.sample && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm font-medium">
                            Ver datos de muestra
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                            {JSON.stringify(result.data.sample, null, 2)}
                          </pre>
                        </details>
                      )}
                      
                      {result.data.preview && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm font-medium">
                            Ver vista previa
                          </summary>
                          <div className="mt-2 text-xs bg-gray-100 p-2 rounded">
                            {result.data.preview}
                          </div>
                        </details>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {index < results.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>🛠️ URLs que se probarán</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {testUrls.map((url, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded font-mono text-sm break-all">
                {url}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ℹ️ Información sobre "Failed to fetch"</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p><strong>"Failed to fetch"</strong> generalmente indica:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>❌ La instancia de Odoo no está activa o no existe</li>
              <li>🌐 Problemas de DNS o conectividad de red</li>
              <li>🛡️ Firewall o antivirus bloqueando la conexión (ya resuelto)</li>
              <li>⏰ La URL ha cambiado o expirado</li>
              <li>🚫 Problemas de CORS en el servidor</li>
            </ul>
            
            <Separator className="my-4" />
            
            <p><strong>✅ Próximos pasos recomendados:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Verificar con el administrador de Odoo las URLs correctas</li>
              <li>Confirmar que las instancias estén activas</li>
              <li>Probar acceso directo desde el navegador</li>
              <li>Verificar configuración de red corporativa</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 