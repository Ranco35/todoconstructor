'use client';

import { useState, useEffect } from 'react';
import { deleteProduct } from '@/actions/products/list';
import { getProducts } from '@/actions/products/list';

interface Product {
  id: number;
  name: string;
  sku?: string;
}

export default function TestDeletePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { products: productList } = await getProducts({ page: '1', pageSize: '10' });
        setProducts(productList);
        if (productList.length > 0) {
          setSelectedProductId(productList[0].id.toString());
        }
      } catch (error) {
        console.error('Error cargando productos:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  const testDelete = async () => {
    if (!selectedProductId) {
      alert('Por favor selecciona un producto');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log('🧪 TestDeletePage: Iniciando prueba de eliminación para ID:', selectedProductId);
      
      const formData = new FormData();
      formData.append('id', selectedProductId);

      const deleteResult = await deleteProduct(formData);
      console.log('🧪 TestDeletePage: Resultado de eliminación:', deleteResult);
      setResult(deleteResult);
    } catch (error) {
      console.error('🧪 TestDeletePage: Error en prueba:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setLoading(false);
    }
  };

  const testForceDelete = async () => {
    if (!selectedProductId) {
      alert('Por favor selecciona un producto');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log('🧪 TestDeletePage: Iniciando prueba de eliminación FORZADA para ID:', selectedProductId);
      
      const formData = new FormData();
      formData.append('id', selectedProductId);
      formData.append('force', 'true');

      const deleteResult = await deleteProduct(formData);
      console.log('🧪 TestDeletePage: Resultado de eliminación forzada:', deleteResult);
      setResult(deleteResult);
    } catch (error) {
      console.error('🧪 TestDeletePage: Error en prueba forzada:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingProducts) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🧪 Prueba del Sistema de Eliminación</h1>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Cargando productos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🧪 Prueba del Sistema de Eliminación</h1>
      
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">
            Instrucciones
          </h2>
          <p className="text-blue-700 text-sm">
            Esta página prueba el sistema de eliminación de productos. Selecciona un producto de la lista
            y usa los botones para probar la eliminación normal o forzada.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              ⚠️ No hay productos disponibles para probar la eliminación.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar producto para eliminar:
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    ID: {product.id} - {product.name} {product.sku ? `(${product.sku})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-4">
              <button
                onClick={testDelete}
                disabled={loading || !selectedProductId}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Probando...' : '🗑️ Probar Eliminación Normal'}
              </button>

              <button
                onClick={testForceDelete}
                disabled={loading || !selectedProductId}
                className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 disabled:opacity-50"
              >
                {loading ? 'Probando...' : '💥 Probar Eliminación Forzada'}
              </button>
            </div>
          </>
        )}

        {result && (
          <div className={`border rounded-lg p-4 ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-2 ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.success ? '✅ Éxito' : '❌ Error'}
            </h3>
            
            {result.success && (
              <p className="text-green-700">
                <strong>Mensaje:</strong> {result.message}
              </p>
            )}

            {!result.success && (
              <>
                <p className="text-red-700 mb-2">
                  <strong>Error:</strong> {result.error}
                </p>
                
                {result.dependencies && (
                  <div className="bg-red-100 border border-red-300 rounded p-3 mt-3">
                    <h4 className="text-red-800 font-semibold mb-2">Dependencias encontradas:</h4>
                    <ul className="text-red-700 text-sm space-y-1">
                      {result.dependencies.warehouses > 0 && (
                        <li>• {result.dependencies.warehouses} asignación(es) a bodega(s)</li>
                      )}
                      {result.dependencies.sales > 0 && (
                        <li>• {result.dependencies.sales} venta(s)</li>
                      )}
                      {result.dependencies.reservations > 0 && (
                        <li>• {result.dependencies.reservations} reservación(es)</li>
                      )}
                      {result.dependencies.components > 0 && (
                        <li>• {result.dependencies.components} componente(s) de producto</li>
                      )}
                      {result.dependencies.pettyCashPurchases > 0 && (
                        <li>• {result.dependencies.pettyCashPurchases} compra(s) de caja menor</li>
                      )}
                    </ul>
                  </div>
                )}

                {result.canForceDelete && (
                  <div className="bg-yellow-100 border border-yellow-300 rounded p-3 mt-3">
                    <p className="text-yellow-800 text-sm">
                      💡 Se puede usar eliminación forzada para eliminar el producto y todas sus dependencias.
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="mt-4 bg-gray-100 border border-gray-200 rounded p-3">
              <h4 className="text-gray-800 font-semibold mb-1">Respuesta completa:</h4>
              <pre className="text-xs text-gray-600 overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            📊 Console Logs
          </h3>
          <p className="text-gray-600 text-sm">
            Abre la consola del navegador (F12) para ver los logs detallados del proceso de eliminación.
            Busca los emojis: 🧪 (página de prueba), 🗑️ (componente), 🔧 (función de eliminación)
          </p>
        </div>
      </div>
    </div>
  );
} 