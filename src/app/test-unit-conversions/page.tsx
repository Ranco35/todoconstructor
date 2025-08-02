import UnitConversionDemo from '@/components/products/UnitConversionDemo';

export default function TestUnitConversionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧮 Sistema de Conversiones de Unidades de Medida
          </h1>
          <p className="text-gray-600">
            Demostración del sistema de conversiones automáticas para cálculos de precios y cantidades
          </p>
        </div>

        <UnitConversionDemo />

        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">📋 Información del Sistema</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-800 mb-3">✅ Beneficios</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• <strong>Cálculos automáticos:</strong> El sistema convierte automáticamente entre unidades</li>
                <li>• <strong>Precios consistentes:</strong> Mantiene precios por unidad individual</li>
                <li>• <strong>Flexibilidad:</strong> Permite vender en diferentes unidades (docena, par, etc.)</li>
                <li>• <strong>Precisión:</strong> Evita errores de cálculo manual</li>
                <li>• <strong>Escalabilidad:</strong> Fácil agregar nuevas unidades de medida</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-800 mb-3">🔧 Características Técnicas</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• <strong>20 unidades predefinidas</strong> con factores de conversión</li>
                <li>• <strong>Sistema de unidades base</strong> para conversiones compatibles</li>
                <li>• <strong>Funciones de conversión</strong> para cálculos automáticos</li>
                <li>• <strong>Validación de compatibilidad</strong> entre unidades</li>
                <li>• <strong>Integración completa</strong> con el formulario de productos</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">🎯 Casos de Uso</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Panadería:</strong> Vender pan por docena ($1,200) pero calcular precio por unidad ($100)</p>
              <p><strong>Huevos:</strong> Vender por media docena ($600) con conversión automática a unidades</p>
              <p><strong>Bebidas:</strong> Vender por par ($200) manteniendo precio por unidad consistente</p>
              <p><strong>Productos al por mayor:</strong> Vender por centena o millar con cálculos automáticos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 