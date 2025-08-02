import UnitsStatusPanel from '@/components/products/UnitsStatusPanel';

export default function UnitsStatusPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 Estado de Unidades de Medida
          </h1>
          <p className="text-gray-600">
            Verificación del estado actual de las unidades de medida de todos los productos
          </p>
        </div>

        <UnitsStatusPanel />

        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">📋 Información del Sistema</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">✅ Estado Ideal</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>100% de productos</strong> con unidad asignada</li>
                <li>• <strong>Productos básicos</strong> con "UND"</li>
                <li>• <strong>Productos específicos</strong> con unidades apropiadas (KG, LT, etc.)</li>
                <li>• <strong>Ningún producto</strong> sin unidad</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">🔧 Acciones Recomendadas</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Asignar UND</strong> a productos sin unidad</li>
                <li>• <strong>Verificar</strong> unidades específicas (KG, LT, etc.)</li>
                <li>• <strong>Normalizar</strong> unidades inconsistentes</li>
                <li>• <strong>Revisar</strong> productos con unidades especiales</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">💡 Beneficios de Tener Todas las Unidades Asignadas</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Cálculos automáticos</strong> en facturas y POS</li>
              <li>• <strong>Reportes precisos</strong> de inventario y ventas</li>
              <li>• <strong>Conversiones automáticas</strong> entre unidades</li>
              <li>• <strong>Integridad de datos</strong> en toda la aplicación</li>
              <li>• <strong>Escalabilidad</strong> para futuras funcionalidades</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 