import UnitNormalizationPanel from '@/components/products/UnitNormalizationPanel';

export default function UnitNormalizationPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧮 Normalización de Unidades de Medida
          </h1>
          <p className="text-gray-600">
            Sistema para corregir y estandarizar las unidades de medida de productos existentes
          </p>
        </div>

        <UnitNormalizationPanel />

        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">📋 Información del Sistema</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">✅ Unidades Estandarizadas</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><strong>UND</strong> - Unidad individual</li>
                <li><strong>KG</strong> - Kilogramo</li>
                <li><strong>GR</strong> - Gramo</li>
                <li><strong>LT</strong> - Litro</li>
                <li><strong>MT</strong> - Metro</li>
                <li><strong>CAJ</strong> - Caja</li>
                <li><strong>PAQ</strong> - Paquete</li>
                <li><strong>DOC</strong> - Docena (12 unidades)</li>
                <li><strong>PAR</strong> - Par (2 unidades)</li>
                <li><strong>HRA</strong> - Hora</li>
                <li><strong>DIA</strong> - Día</li>
                <li><strong>NOC</strong> - Noche</li>
                <li><strong>SER</strong> - Servicio</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">🔄 Conversiones Automáticas</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><strong>Pieza</strong> → UND</li>
                <li><strong>Unidad</strong> → UND</li>
                <li><strong>Kg</strong> → KG</li>
                <li><strong>Kilogramo</strong> → KG</li>
                <li><strong>Litro</strong> → LT</li>
                <li><strong>Metro</strong> → MT</li>
                <li><strong>Caja</strong> → CAJ</li>
                <li><strong>Paquete</strong> → PAQ</li>
                <li><strong>Docena</strong> → DOC</li>
                <li><strong>Par</strong> → PAR</li>
                <li><strong>Hora</strong> → HRA</li>
                <li><strong>Día</strong> → DIA</li>
                <li><strong>Noche</strong> → NOC</li>
                <li><strong>Servicio</strong> → SER</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">💡 Beneficios</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Cálculos automáticos</strong> entre diferentes unidades</li>
              <li>• <strong>Consistencia</strong> en toda la base de datos</li>
              <li>• <strong>Reportes precisos</strong> de inventario y ventas</li>
              <li>• <strong>Integración</strong> con facturas y POS</li>
              <li>• <strong>Escalabilidad</strong> para futuras expansiones</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 