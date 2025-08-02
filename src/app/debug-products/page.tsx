'use client';

import { useState } from 'react';
import { checkProductDependencies, deleteProduct } from '@/actions/products/list';

export default function DebugProductsPage() {
  const [productId, setProductId] = useState('1165');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkProduct = async () => {
    setLoading(true);
    try {
      const id = parseInt(productId);
      console.log('🔍 Verificando producto ID:', id);
      
      // Verificar dependencias
      const dependencies = await checkProductDependencies(id);
      console.log('📊 Dependencias encontradas:', dependencies);
      
      setResult({ 
        type: 'dependencies', 
        data: dependencies 
      });
    } catch (error) {
      console.error('Error verificando producto:', error);
      setResult({ 
        type: 'error', 
        data: error 
      });
    } finally {
      setLoading(false);
    }
  };

  const checkProductExists = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/products/debug/${productId}`);
      const data = await response.json();
      console.log('🔍 Verificando existencia en DB:', data);
      
      setResult({ 
        type: 'exists', 
        data: data 
      });
    } catch (error) {
      console.error('Error verificando existencia:', error);
      setResult({ 
        type: 'error', 
        data: error 
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteProductTest = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('id', productId);
      
      console.log('🗑️ Intentando eliminar producto ID:', productId);
      const deleteResult = await deleteProduct(formData);
      console.log('📥 Resultado de eliminación:', deleteResult);
      
      // Después de intentar eliminar, verificar si aún existe
      setTimeout(async () => {
        try {
          const response = await fetch(`/api/products/debug/${productId}`);
          const existsAfterDelete = await response.json();
          console.log('🔍 ¿Existe después de eliminar?:', existsAfterDelete);
          
          setResult({ 
            type: 'delete', 
            data: {
              deleteResult,
              existsAfterDelete
            }
          });
        } catch (error) {
          console.error('Error verificando después de eliminar:', error);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error eliminando producto:', error);
      setResult({ 
        type: 'error', 
        data: error 
      });
      setLoading(false);
    }
  };

  const forceDeleteProductTest = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('id', productId);
      formData.append('force', 'true');
      
      console.log('💥 Intentando eliminación FORZADA producto ID:', productId);
      const deleteResult = await deleteProduct(formData);
      console.log('📥 Resultado de eliminación FORZADA:', deleteResult);
      
      // Después de intentar eliminar, verificar si aún existe
      setTimeout(async () => {
        try {
          const response = await fetch(`/api/products/debug/${productId}`);
          const existsAfterDelete = await response.json();
          console.log('🔍 ¿Existe después de eliminar FORZADO?:', existsAfterDelete);
          
          setResult({ 
            type: 'forceDelete', 
            data: {
              deleteResult,
              existsAfterDelete
            }
          });
        } catch (error) {
          console.error('Error verificando después de eliminar:', error);
        } finally {
          setLoading(false);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error en eliminación forzada:', error);
      setResult({ 
        type: 'error', 
        data: error 
      });
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔧 Debug: Eliminación de Productos</h1>
      
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
            onClick={checkProductExists}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Verificando...' : '¿Existe en DB?'}
          </button>
          
          <button
            onClick={checkProduct}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Verificar Dependencias'}
          </button>
          
          <button
            onClick={deleteProductTest}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Eliminando...' : 'Eliminar (Normal)'}
          </button>
          
          <button
            onClick={forceDeleteProductTest}
            disabled={loading}
            className="bg-red-800 text-white px-4 py-2 rounded-md hover:bg-red-900 disabled:opacity-50"
          >
            {loading ? 'Eliminando...' : 'Eliminar (Forzado)'}
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          ⚠️ Abre la consola del navegador (F12) para ver logs detallados
        </div>
      </div>

      {result && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            📊 Resultado ({result.type})
          </h3>
          
          <pre className="bg-white border rounded p-4 text-sm overflow-auto max-h-96">
            {JSON.stringify(result.data, null, 2)}
          </pre>
          
          {result.type === 'dependencies' && result.data && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Resumen de Dependencias:</h4>
              <ul className="list-disc list-inside text-sm text-gray-700">
                <li>Bodegas: {result.data.dependencies.warehouses}</li>
                <li>Ventas: {result.data.dependencies.sales}</li>
                <li>Reservaciones: {result.data.dependencies.reservations}</li>
                <li>Componentes: {result.data.dependencies.components}</li>
                <li>Compras Caja Menor: {result.data.dependencies.pettyCashPurchases}</li>
                <li><strong>Total dependencias: {result.data.total}</strong></li>
                <li><strong>Tiene dependencias: {result.data.hasAny ? 'SÍ' : 'NO'}</strong></li>
              </ul>
            </div>
          )}

          {result.type === 'exists' && result.data && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Estado del Producto:</h4>
              <ul className="list-disc list-inside text-sm text-gray-700">
                <li><strong>Existe en DB: {result.data.exists ? 'SÍ' : 'NO'}</strong></li>
                {result.data.product && (
                  <>
                    <li>Nombre: {result.data.product.name}</li>
                    <li>SKU: {result.data.product.sku}</li>
                    <li>Activo: {result.data.product.active ? 'Sí' : 'No'}</li>
                  </>
                )}
              </ul>
            </div>
          )}

          {(result.type === 'delete' || result.type === 'forceDelete') && result.data && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Análisis de Eliminación:</h4>
              <div className="space-y-2">
                <div className="bg-blue-50 p-3 rounded">
                  <strong>Resultado de eliminación:</strong>
                  <br />
                  ✅ Exitoso: {result.data.deleteResult?.success ? 'SÍ' : 'NO'}
                  <br />
                  📝 Mensaje: {result.data.deleteResult?.message || result.data.deleteResult?.error}
                </div>
                
                <div className="bg-yellow-50 p-3 rounded">
                  <strong>¿Aún existe después de eliminar?</strong>
                  <br />
                  🔍 En DB: {result.data.existsAfterDelete?.exists ? 'SÍ (❌ PROBLEMA!)' : 'NO (✅ CORRECTO)'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-800 mb-2">💡 Proceso de Diagnóstico:</h3>
        <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
          <li><strong>1. Verificar existencia:</strong> ¿Existe el producto en la base de datos?</li>
          <li><strong>2. Verificar dependencias:</strong> ¿Qué está bloqueando la eliminación?</li>
          <li><strong>3. Intentar eliminación:</strong> ¿Se ejecuta correctamente la eliminación?</li>
          <li><strong>4. Verificar resultado:</strong> ¿Desapareció realmente de la DB?</li>
          <li>Los logs detallados aparecen en la consola del navegador (F12)</li>
        </ol>
      </div>
    </div>
  );
} 