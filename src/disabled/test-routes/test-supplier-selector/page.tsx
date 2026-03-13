'use client';

import { useState } from 'react';
import SupplierSearchSelector from '@/components/suppliers/shared/SupplierSearchSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TestSupplierSelectorPage() {
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('kun');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Test Selector de Proveedores
          </h1>
          <p className="text-gray-600">
            Página de prueba para verificar el funcionamiento del selector de proveedores
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Selector de Proveedores */}
          <Card>
            <CardHeader>
              <CardTitle>Selector de Proveedores</CardTitle>
              <CardDescription>
                Prueba el nuevo selector con búsqueda avanzada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SupplierSearchSelector
                value={selectedSupplierId}
                onValueChange={setSelectedSupplierId}
                placeholder="Buscar proveedor por nombre, email, ciudad..."
                label="Proveedor"
                showCreateOption={true}
                onCreateNew={() => {
                  window.open('/dashboard/suppliers/create', '_blank');
                }}
              />
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Proveedor Seleccionado:</h3>
                <p className="text-blue-800">
                  {selectedSupplierId ? `ID: ${selectedSupplierId}` : 'Ninguno seleccionado'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Información de Prueba */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Prueba</CardTitle>
              <CardDescription>
                Datos para verificar el funcionamiento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Término de Búsqueda de Prueba:</h3>
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Término de búsqueda"
                />
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-medium text-yellow-900 mb-2">Instrucciones:</h3>
                <ul className="text-yellow-800 text-sm space-y-1">
                  <li>• Escribe "kun" para buscar Kunstmann</li>
                  <li>• Escribe "kunstmann" para búsqueda completa</li>
                  <li>• Escribe "jmonsalve" para buscar por email</li>
                  <li>• Revisa la consola del navegador para logs</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">Proveedor Esperado:</h3>
                <ul className="text-green-800 text-sm space-y-1">
                  <li>• Nombre: Sociedad Industrial Kunstmann S.A.</li>
                  <li>• Email: jmonsalve@molinocollico.cl</li>
                  <li>• Estado: Activo</li>
                  <li>• Debe aparecer con búsqueda "kun"</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Debug Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
            <CardDescription>
              Información de depuración para verificar el funcionamiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Pasos para Verificar:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Abre la consola del navegador (F12)</li>
                  <li>Escribe "kun" en el selector</li>
                  <li>Verifica que aparezcan logs de depuración</li>
                  <li>Confirma que el proveedor Kunstmann aparece</li>
                  <li>Selecciona el proveedor y verifica el ID</li>
                </ol>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Logs Esperados en Consola:</h3>
                <pre className="text-xs bg-gray-100 p-2 rounded">
{`[SupplierSearchSelector] Cargando proveedores...
[SupplierSearchSelector] Proveedores cargados: [...]
[SupplierSearchSelector] Filtrando proveedores con término: kun
[SupplierSearchSelector] Proveedor encontrado: Sociedad Industrial Kunstmann S.A.
[SupplierSearchSelector] Proveedores filtrados: 1`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 