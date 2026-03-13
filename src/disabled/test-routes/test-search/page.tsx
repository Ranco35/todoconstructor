'use client';

import { useState } from 'react';
import { getProducts } from '@/actions/products/list';

export default function TestSearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testSearches = [
    'LOMO LISO PAR,',     // El caso problemático original
    'producto, con comas',
    'test (con paréntesis)',
    'test "con comillas"',
    'test \'con comillas simples\'',
    'test %con porcentaje%',
    'MASAJE DESCONTRACTURANTE 30M',
    'test normal sin caracteres especiales'
  ];

  const handleSearch = async (term: string) => {
    setLoading(true);
    setError(null);
    setSearchTerm(term);
    
    try {
      console.log('🔍 Probando búsqueda con término:', term);
      const result = await getProducts({ 
        search: term, 
        page: 1, 
        pageSize: 10 
      });
      
      console.log('✅ Resultado de búsqueda:', result);
      setResults(result);
    } catch (err) {
      console.error('❌ Error en búsqueda:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      await handleSearch(searchTerm.trim());
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🧪 Test: Búsqueda con Caracteres Especiales</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Búsqueda Manual</h2>
        
        <form onSubmit={handleManualSearch} className="flex gap-4 mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 flex-1"
            placeholder="Escribe tu término de búsqueda..."
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Tests Automáticos</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {testSearches.map((term, index) => (
            <button
              key={index}
              onClick={() => handleSearch(term)}
              disabled={loading}
              className="text-left p-3 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              <div className="font-mono text-sm text-blue-600">"{term}"</div>
              <div className="text-xs text-gray-500 mt-1">
                {term === 'LOMO LISO PAR,' && '← Caso problemático original'}
                {term.includes(',') && term !== 'LOMO LISO PAR,' && '← Contiene comas'}
                {term.includes('(') && '← Contiene paréntesis'}
                {term.includes('"') && '← Contiene comillas dobles'}
                {term.includes("'") && '← Contiene comillas simples'}
                {term.includes('%') && '← Contiene porcentajes'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">❌ Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {results && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            📊 Resultados para: "{searchTerm}"
          </h3>
          
          <div className="mb-4">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              {results.products?.length || 0} productos encontrados
            </span>
            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm ml-2">
              Total: {results.totalCount || 0}
            </span>
          </div>
          
          {results.products && results.products.length > 0 ? (
            <div className="space-y-2">
              {results.products.slice(0, 5).map((product: any) => (
                <div key={product.id} className="bg-white border rounded p-3">
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-600">
                    ID: {product.id} | SKU: {product.sku || 'N/A'} | Marca: {product.brand || 'N/A'}
                  </div>
                </div>
              ))}
              {results.products.length > 5 && (
                <div className="text-sm text-gray-500 text-center py-2">
                  ... y {results.products.length - 5} productos más
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4">
              No se encontraron productos con este término de búsqueda
            </div>
          )}
          
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              🔍 Ver datos completos (JSON)
            </summary>
            <pre className="bg-white border rounded p-4 text-xs overflow-auto mt-2 max-h-64">
              {JSON.stringify(results, null, 2)}
            </pre>
          </details>
        </div>
      )}
      
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-800 mb-2">💡 Instrucciones:</h3>
        <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
          <li>Usa los botones de "Tests Automáticos" para probar diferentes casos problemáticos</li>
          <li>O escribe tu propio término de búsqueda en el campo manual</li>
          <li>Abre la consola del navegador (F12) para ver logs detallados</li>
          <li>Si algún test falla, verás el error específico</li>
          <li>El término "LOMO LISO PAR," era el caso que causaba problemas originalmente</li>
        </ol>
      </div>
    </div>
  );
} 