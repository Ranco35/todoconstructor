import { getOdooProducts } from '@/actions/configuration/odoo-sync';
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function ProductosPage() {
  let productos: any[] = [];
  let error: string | null = null;

  try {
    console.log('🔄 Conectando con Odoo para obtener productos...');
    const response = await getOdooProducts();
    if (response.success) {
      productos = response.data || [];
    } else {
      error = response.error || 'Error al obtener productos';
    }
  } catch (err) {
    console.error('Error obteniendo productos:', err);
    error = err instanceof Error ? err.message : 'Error desconocido';
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📦 Productos desde Odoo</h1>
        <div className="flex gap-3">
          <Link 
            href="/debug-odoo"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            🔍 Diagnóstico Odoo
          </Link>
          <Link 
            href="/dashboard/configuration/products/odoo"
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            ⚙️ Dashboard Completo
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Error de conexión con Odoo
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {error}
              </p>
              <p className="text-sm text-red-600 mt-2">
                💡 <strong>Sugerencia:</strong> Usa el botón "🔍 Diagnóstico Odoo" para probar la conexión
              </p>
            </div>
          </div>
        </div>
      )}

      {!error && productos.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <div className="text-yellow-400 mr-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                No se encontraron productos
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                La conexión fue exitosa pero no hay productos disponibles en Odoo
              </p>
            </div>
          </div>
        </div>
      )}

      {!error && productos.length > 0 && (
        <>
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <div className="text-green-400 mr-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-green-800">
                  ✅ Conexión exitosa con Odoo
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Se encontraron {productos.length} productos
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productos.map((producto: any, index: number) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                {producto.image_1920 && (
                  <img 
                    src={`data:image/jpeg;base64,${producto.image_1920}`}
                    alt={producto.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{producto.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    <strong>Referencia:</strong> {producto.default_code || 'N/A'}
                  </p>
                  <p className="text-gray-600 text-sm mb-2">
                    <strong>Precio:</strong> ${producto.lst_price}
                  </p>
                  <p className="text-gray-600 text-sm mb-2">
                    <strong>Tipo:</strong> {producto.type === 'product' ? 'Almacenable' : producto.type === 'consu' ? 'Consumible' : 'Servicio'}
                  </p>
                  <p className="text-gray-600 text-sm mb-2">
                    <strong>Stock:</strong> {producto.qty_available}
                  </p>
                  <div className="text-xs text-gray-500">
                    ID: {producto.id}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 