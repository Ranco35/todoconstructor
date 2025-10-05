import React from 'react';
import AdminSKUChanger from '@/components/products/AdminSKUChanger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, Settings } from 'lucide-react';

export default function SKUManagementPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              🔒 Gestión de SKUs - Solo Administradores
            </h1>
          </div>
          <p className="text-gray-600">
            Herramienta especial para modificar SKUs de productos existentes. 
            <strong className="text-orange-600"> Usar solo en casos excepcionales.</strong>
          </p>
        </div>

        {/* Información importante */}
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              ⚠️ Información Importante
            </CardTitle>
          </CardHeader>
          <CardContent className="text-orange-700">
            <div className="space-y-3">
              <p><strong>¿Por qué está restringido el cambio de SKUs?</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Los SKUs son identificadores únicos críticos del sistema</li>
                <li>Cambiar SKUs puede causar errores en importaciones</li>
                <li>Puede afectar integraciones con sistemas externos</li>
                <li>Puede romper la trazabilidad de productos</li>
              </ul>
              
              <p className="mt-4"><strong>¿Cuándo usar esta herramienta?</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Corregir SKUs incorrectos creados por error</li>
                <li>Unificar SKUs duplicados</li>
                <li>Cambios requeridos por estándares de negocio</li>
                <li>Migración de sistemas legacy</li>
              </ul>

              <p className="mt-4"><strong>⚠️ Antes de cambiar un SKU:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Verificar que no se use en importaciones activas</li>
                <li>Notificar al equipo de desarrollo</li>
                <li>Documentar la razón del cambio</li>
                <li>Verificar que el nuevo SKU no exista</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Herramienta principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Cambiar SKU de Producto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdminSKUChanger />
          </CardContent>
        </Card>

        {/* Procedimiento paso a paso */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>📋 Procedimiento Paso a Paso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold">Buscar el Producto</h3>
                  <p className="text-gray-600">Ingresa el ID del producto que quieres modificar. Puedes encontrar el ID en la lista de productos del dashboard.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold">Ingresar Nuevo SKU</h3>
                  <p className="text-gray-600">Escribe el nuevo SKU que quieres asignar al producto. Asegúrate de que sea único.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold">Código de Confirmación</h3>
                  <p className="text-gray-600">Ingresa el código de confirmación: <code className="bg-gray-100 px-2 py-1 rounded">ADMIN-SKU-CHANGE</code></p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold">Confirmar Cambio</h3>
                  <p className="text-gray-600">Presiona el botón rojo "Cambiar SKU (PELIGROSO)" para ejecutar el cambio.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
