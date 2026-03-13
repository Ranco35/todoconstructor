'use client';

import { useState } from 'react';
import { getProductById } from '@/actions/products/get';

export default function DebugProductUnitsPage() {
  const [productId, setProductId] = useState('1165');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkProductUnits = async () => {
    setLoading(true);
    try {
      const id = parseInt(productId);
      console.log('🔍 Cargando producto ID:', id);
      
      const product = await getProductById(id);
      console.log('📊 Producto cargado:', product);
      
      setResult(product);
    } catch (error) {
      console.error('Error cargando producto:', error);
      setResult({ error: error instanceof Error ? error.message : 'Error desconocido' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔧 Debug: Unidades de Medida en Productos</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Producto para probar</h2>
        
        <div className="flex gap-4 items-end mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID del Producto
            </label>
            <input
              type="number"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-32"
              placeholder="1165"
            />
          </div>
          
          <button
            onClick={checkProductUnits}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Cargar Producto'}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            📊 Datos del Producto
          </h3>
          
          {result.error ? (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <h4 className="font-medium text-red-800 mb-2">❌ Error</h4>
              <p className="text-red-700">{result.error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Información básica */}
              <div className="bg-white border rounded p-4">
                <h4 className="font-medium mb-3 text-gray-800">📋 Información Básica</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>ID:</strong> {result.id}</div>
                  <div><strong>Nombre:</strong> {result.name}</div>
                  <div><strong>SKU:</strong> {result.sku || 'N/A'}</div>
                  <div><strong>Tipo:</strong> {result.type || 'N/A'}</div>
                </div>
              </div>

              {/* Información de unidades */}
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <h4 className="font-medium mb-3 text-blue-800">🔢 Unidades de Medida</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Unidad de Venta (salesUnitId):</strong> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${result.salesUnitId ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {result.salesUnitId || 'No definida'}
                    </span>
                  </div>
                  <div>
                    <strong>Unidad de Compra (purchaseUnitId):</strong> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${result.purchaseUnitId ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {result.purchaseUnitId || 'No definida'}
                    </span>
                  </div>
                  <div>
                    <strong>Unidad legacy (unit):</strong> 
                    <span className="ml-2 text-gray-600">{result.unit || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Información del proveedor */}
              {result.Supplier && (
                <div className="bg-green-50 border border-green-200 rounded p-4">
                  <h4 className="font-medium mb-3 text-green-800">🏢 Proveedor</h4>
                  <div className="text-sm">
                    <div><strong>ID:</strong> {result.Supplier.id}</div>
                    <div><strong>Nombre:</strong> {result.Supplier.name}</div>
                    <div><strong>Código Proveedor:</strong> {result.supplierCode || 'N/A'}</div>
                  </div>
                </div>
              )}

              {/* Datos completos (para debug) */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 font-medium">
                  🔍 Ver todos los datos (JSON completo)
                </summary>
                <pre className="bg-white border rounded p-4 text-xs overflow-auto mt-2 max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-800 mb-2">💡 Qué verificar:</h3>
        <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
          <li>Que salesUnitId y purchaseUnitId tengan valores (no sean null/undefined)</li>
          <li>Que los valores correspondan a IDs válidos de unidades de medida</li>
          <li>Que el proveedor esté correctamente asociado</li>
          <li>Abre la consola del navegador (F12) para ver logs detallados</li>
        </ol>
      </div>
    </div>
  );
} 