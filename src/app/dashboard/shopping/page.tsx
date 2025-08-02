
// Marcar como página dinámica para evitar errores en build
export const dynamic = 'force-dynamic';
export default function ShoppingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Compras
          </h1>
          <p className="text-gray-600">
            Gestión de compras y proveedores
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">🏪</span>
            <h3 className="text-lg font-semibold text-gray-900">Proveedores</h3>
          </div>
          <p className="text-gray-600 mb-4">Gestión de proveedores y compras</p>
          <span className="text-gray-400">Próximamente</span>
        </div>
      </div>
    </div>
  );
} 