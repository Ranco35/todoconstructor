'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface DebugResult {
  searchTerm: string;
  totalActiveSuppliers: number;
  searchResults: number;
  kunstmannResults: number;
  kunstmannByName: number;
  kunstmannByEmail: number;
  allSuppliers: any[];
  searchResults: any[];
  kunstmannResults: any[];
  kunstmannByName: any[];
  kunstmannByEmail: any[];
  debug: {
    searchTerm: string;
    searchLower: string;
    searchLength: number;
  };
}

export default function DebugSuppliersPage() {
  const [searchTerm, setSearchTerm] = useState('ku');
  const [results, setResults] = useState<DebugResult | null>(null);
  const [loading, setLoading] = useState(false);

  const testSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/debug/suppliers?search=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        console.log('[DEBUG] Resultados:', data);
      } else {
        console.error('[DEBUG] Error en la respuesta:', response.status);
      }
    } catch (error) {
      console.error('[DEBUG] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testSearch();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 Debug Proveedores
          </h1>
          <p className="text-gray-600">
            Página de debug para diagnosticar problemas con la búsqueda de proveedores
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controles */}
          <Card>
            <CardHeader>
              <CardTitle>Controles de Prueba</CardTitle>
              <CardDescription>
                Prueba diferentes términos de búsqueda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Término de Búsqueda:</label>
                <div className="flex gap-2">
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Escribe un término de búsqueda"
                  />
                  <Button onClick={testSearch} disabled={loading}>
                    {loading ? 'Buscando...' : 'Buscar'}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Pruebas Rápidas:</h3>
                <div className="flex flex-wrap gap-2">
                  {['ku', 'kun', 'kunstmann', 'jmonsalve', 'molinocollico'].map((term) => (
                    <Button
                      key={term}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm(term);
                        setTimeout(() => testSearch(), 100);
                      }}
                    >
                      {term}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resultados */}
          <Card>
            <CardHeader>
              <CardTitle>Resultados del Debug</CardTitle>
              <CardDescription>
                Información detallada de la búsqueda
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Buscando proveedores...</p>
                </div>
              ) : results ? (
                <div className="space-y-4">
                  {/* Estadísticas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{results.totalActiveSuppliers}</div>
                      <div className="text-sm text-blue-500">Total Activos</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{results.searchResults}</div>
                      <div className="text-sm text-green-500">Resultados Búsqueda</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{results.kunstmannResults}</div>
                      <div className="text-sm text-purple-500">Kunstmann (DB)</div>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{results.kunstmannByName}</div>
                      <div className="text-sm text-yellow-500">Kunstmann (Name)</div>
                    </div>
                  </div>

                  {/* Término de búsqueda */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2">Término de Búsqueda:</h3>
                    <div className="text-sm space-y-1">
                      <div><strong>Original:</strong> "{results.searchTerm}"</div>
                      <div><strong>Lowercase:</strong> "{results.debug.searchLower}"</div>
                      <div><strong>Longitud:</strong> {results.debug.searchLength}</div>
                    </div>
                  </div>

                  {/* Proveedores encontrados */}
                  {results.searchResults.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Proveedores Encontrados:</h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {results.searchResults.map((supplier: any) => (
                          <div key={supplier.id} className="p-2 bg-white border rounded">
                            <div className="font-medium">{supplier.name}</div>
                            <div className="text-sm text-gray-600">
                              {supplier.displayName && `(${supplier.displayName})`}
                              {supplier.email && ` - ${supplier.email}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Kunstmann específico */}
                  {results.kunstmannByName.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2 text-green-700">✅ Kunstmann Encontrado:</h3>
                      <div className="space-y-2">
                        {results.kunstmannByName.map((supplier: any) => (
                          <div key={supplier.id} className="p-3 bg-green-50 border border-green-200 rounded">
                            <div className="font-medium text-green-800">{supplier.name}</div>
                            <div className="text-sm text-green-700">
                              {supplier.displayName && `(${supplier.displayName})`}
                              {supplier.email && ` - ${supplier.email}`}
                            </div>
                            <Badge variant="outline" className="mt-1 text-green-600">
                              ID: {supplier.id}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sin resultados */}
                  {results.searchResults.length === 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded">
                      <h3 className="font-medium text-red-800 mb-2">❌ No se encontraron proveedores</h3>
                      <p className="text-sm text-red-700">
                        El término "{results.searchTerm}" no encontró resultados en la base de datos.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Haz clic en "Buscar" para ver los resultados
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Información adicional */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Información de Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">¿Qué verificar?</h3>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Total Activos:</strong> Debe ser &gt; 0</li>
                  <li>• <strong>Resultados Búsqueda:</strong> Debe coincidir con lo esperado</li>
                  <li>• <strong>Kunstmann (DB):</strong> Debe ser &gt; 0 si existe</li>
                  <li>• <strong>Kunstmann (Name):</strong> Debe ser &gt; 0 si existe</li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Proveedor Esperado:</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• <strong>Nombre:</strong> Sociedad Industrial Kunstmann S.A.</li>
                  <li>• <strong>Email:</strong> jmonsalve@molinocollico.cl</li>
                  <li>• <strong>Estado:</strong> Activo</li>
                  <li>• <strong>Búsqueda "ku":</strong> Debe encontrar este proveedor</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 