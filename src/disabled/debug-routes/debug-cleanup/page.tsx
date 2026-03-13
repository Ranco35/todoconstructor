'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugCleanupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [drafts, setDrafts] = useState<any[]>([]);

  const checkDrafts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/purchases/cleanup-drafts');
      const data = await response.json();
      
      if (data.success) {
        setDrafts(data.drafts || []);
        setResult({
          type: 'info',
          message: `Se encontraron ${data.count} borradores incompletos`
        });
      } else {
        setResult({
          type: 'error',
          message: data.error || 'Error al consultar borradores'
        });
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: 'Error de conexión'
      });
    } finally {
      setLoading(false);
    }
  };

  const cleanupDrafts = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar los borradores incompletos?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/purchases/cleanup-drafts', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setResult({
          type: 'success',
          message: `✅ Limpieza completada: ${data.cleaned} borradores eliminados`,
          details: data.cleanedDrafts
        });
        setDrafts([]);
      } else {
        setResult({
          type: 'error',
          message: data.error || 'Error al limpiar borradores'
        });
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: 'Error de conexión'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">🧹 Limpieza de Borradores Incompletos</CardTitle>
            <p className="text-gray-600">
              Herramienta para limpiar facturas borrador que quedaron incompletas
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={checkDrafts} 
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Consultando...' : '🔍 Consultar Borradores'}
              </Button>
              
              <Button 
                onClick={cleanupDrafts} 
                disabled={loading || drafts.length === 0}
                variant="destructive"
              >
                {loading ? 'Limpiando...' : '🗑️ Limpiar Borradores'}
              </Button>
            </div>

            {result && (
              <div className={`p-4 rounded-lg ${
                result.type === 'success' ? 'bg-green-100 text-green-800' :
                result.type === 'error' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                <p className="font-medium">{result.message}</p>
                {result.details && (
                  <div className="mt-2 text-sm">
                    <p>Borradores eliminados:</p>
                    <ul className="list-disc ml-4">
                      {result.details.map((draft: any, index: number) => (
                        <li key={index}>
                          {draft.number} - {draft.supplier} - ${draft.total}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {drafts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📋 Borradores Encontrados ({drafts.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {drafts.map((draft, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-100 rounded">
                        <div>
                          <span className="font-medium">{draft.number}</span>
                          <span className="mx-2">-</span>
                          <span className="text-gray-600">{draft.supplier}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${draft.total}</div>
                          <div className="text-sm text-gray-500">{draft.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="text-sm text-gray-500 bg-gray-100 p-4 rounded">
              <h4 className="font-medium mb-2">ℹ️ Información:</h4>
              <ul className="space-y-1">
                <li>• Se eliminan borradores con supplier_id nulo o estado "draft"</li>
                <li>• Solo se limpian facturas con montos ≤ $1,000 (probablemente erróneos)</li>
                <li>• Se eliminan tanto las facturas como sus líneas asociadas</li>
                <li>• Esta acción es irreversible</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 