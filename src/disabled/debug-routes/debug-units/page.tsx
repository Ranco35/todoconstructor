'use client';

import { useState } from 'react';
import { getUnitMeasures } from '@/actions/configuration/unit-measure-actions';

export default function DebugUnitsPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchId, setSearchId] = useState('1');

  const loadUnits = async () => {
    setLoading(true);
    try {
      console.log('🔍 Cargando unidades de medida...');
      
      const units = await getUnitMeasures({ 
        pageSize: 1000, // Obtener todas las unidades
        includeInactive: true 
      });
      
      console.log('📊 Unidades cargadas:', units);
      setResult(units);
    } catch (error) {
      console.error('Error cargando unidades:', error);
      setResult({ error: error instanceof Error ? error.message : 'Error desconocido' });
    } finally {
      setLoading(false);
    }
  };

  const findUnitById = (id: number) => {
    if (!result?.data) return null;
    return result.data.find((unit: any) => unit.id === id);
  };

  const searchIdNumber = parseInt(searchId);
  const foundUnit = !isNaN(searchIdNumber) ? findUnitById(searchIdNumber) : null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔧 Debug: Unidades de Medida</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex gap-4 items-end mb-4">
          <button
            onClick={loadUnits}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Cargar Unidades'}
          </button>

          <div className="flex gap-2 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar ID específico:
              </label>
              <input
                type="number"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 w-20"
                placeholder="1"
              />
            </div>
            {foundUnit && (
              <div className="bg-green-100 border border-green-300 rounded px-3 py-2 text-sm">
                <strong>✅ Encontrado:</strong> {foundUnit.name} ({foundUnit.abbreviation})
              </div>
            )}
            {result?.data && !foundUnit && !isNaN(searchIdNumber) && (
              <div className="bg-red-100 border border-red-300 rounded px-3 py-2 text-sm">
                <strong>❌ No encontrado:</strong> ID {searchId}
              </div>
            )}
          </div>
        </div>
      </div>

      {result && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            📊 Unidades de Medida Disponibles
          </h3>
          
          {result.error ? (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <h4 className="font-medium text-red-800 mb-2">❌ Error</h4>
              <p className="text-red-700">{result.error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumen */}
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <h4 className="font-medium mb-3 text-blue-800">📈 Resumen</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div><strong>Total unidades:</strong> {result.totalCount}</div>
                  <div><strong>Páginas:</strong> {result.totalPages}</div>
                  <div><strong>En resultado:</strong> {result.data?.length || 0}</div>
                </div>
              </div>

              {/* Verificar IDs específicos */}
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <h4 className="font-medium mb-3 text-yellow-800">🎯 Verificación de IDs Específicos</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>ID 1 (salesUnitId):</strong> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${findUnitById(1) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {findUnitById(1) ? `${findUnitById(1).name} (${findUnitById(1).abbreviation})` : 'No existe'}
                    </span>
                  </div>
                  <div>
                    <strong>ID 1 (purchaseUnitId):</strong> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${findUnitById(1) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {findUnitById(1) ? `${findUnitById(1).name} (${findUnitById(1).abbreviation})` : 'No existe'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lista de unidades */}
              {result.data && result.data.length > 0 ? (
                <div className="bg-white border rounded">
                  <div className="px-4 py-3 border-b bg-gray-50">
                    <h4 className="font-medium text-gray-800">📋 Lista Completa de Unidades</h4>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left">ID</th>
                          <th className="px-4 py-2 text-left">Nombre</th>
                          <th className="px-4 py-2 text-left">Abreviación</th>
                          <th className="px-4 py-2 text-left">Categoría</th>
                          <th className="px-4 py-2 text-left">Activo</th>
                          <th className="px-4 py-2 text-left">Por Defecto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.data.map((unit: any) => (
                          <tr 
                            key={unit.id} 
                            className={`border-b hover:bg-gray-50 ${unit.id === searchIdNumber ? 'bg-yellow-100' : ''}`}
                          >
                            <td className="px-4 py-2 font-mono">{unit.id}</td>
                            <td className="px-4 py-2">{unit.name}</td>
                            <td className="px-4 py-2 font-mono">{unit.abbreviation}</td>
                            <td className="px-4 py-2">{unit.category || '-'}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded text-xs ${unit.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {unit.isActive ? 'Sí' : 'No'}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded text-xs ${unit.isDefault ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                                {unit.isDefault ? 'Sí' : 'No'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay unidades de medida disponibles
                </div>
              )}

              {/* Datos completos para debug */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 font-medium">
                  🔍 Ver datos completos (JSON)
                </summary>
                <pre className="bg-white border rounded p-4 text-xs overflow-auto mt-2 max-h-64">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-800 mb-2">💡 Diagnóstico:</h3>
        <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
          <li>Carga las unidades para ver si la tabla tiene datos</li>
          <li>Verifica si el ID 1 realmente existe en la tabla UnitMeasure</li>
          <li>Si no existe ID 1, ese es el problema del selector</li>
          <li>Si existe pero no se muestra, el problema está en el componente UnitMeasureSelector</li>
        </ol>
      </div>
    </div>
  );
} 