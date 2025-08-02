'use client';

import { useState, useEffect } from 'react';
import { getPOSSyncStats, syncPOSProducts } from '@/actions/pos/pos-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface POSSyncStats {
  enabledProducts: number;
  posProducts: number;
  syncedProducts: number;
  pendingSync: number;
}

export default function POSSyncManager() {
  const [stats, setStats] = useState<POSSyncStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const loadStats = async () => {
    setLoading(true);
    try {
      const result = await getPOSSyncStats();
      if (result.success && result.data) {
        setStats(result.data);
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al cargar estadísticas",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error interno al cargar estadísticas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncPOSProducts();
      if (result.success) {
        toast({
          title: "Sincronización exitosa",
          description: result.data?.message || "Productos sincronizados correctamente",
        });
        // Recargar estadísticas
        await loadStats();
      } else {
        toast({
          title: "Error en sincronización",
          description: result.error || "Error al sincronizar productos",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error interno al sincronizar",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando estadísticas...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Sincronización de Productos POS</span>
          <Button
            onClick={loadStats}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription>
          Gestiona la sincronización entre productos habilitados para POS y la tabla POSProduct
        </CardDescription>
      </CardHeader>
      <CardContent>
        {stats && (
          <div className="space-y-4">
            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.enabledProducts}
                </div>
                <div className="text-sm text-gray-600">Habilitados para POS</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.syncedProducts}
                </div>
                <div className="text-sm text-gray-600">Sincronizados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.pendingSync}
                </div>
                <div className="text-sm text-gray-600">Pendientes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.posProducts}
                </div>
                <div className="text-sm text-gray-600">Total en POS</div>
              </div>
            </div>

            {/* Estado de sincronización */}
            <div className="flex items-center gap-2">
              {stats.pendingSync === 0 ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Sincronización completa
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {stats.pendingSync} productos pendientes
                </Badge>
              )}
            </div>

            {/* Botón de sincronización */}
            {stats.pendingSync > 0 && (
              <div className="pt-4">
                <Button
                  onClick={handleSync}
                  disabled={syncing}
                  className="w-full"
                >
                  {syncing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sincronizar {stats.pendingSync} productos
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Esto creará registros en POSProduct para productos habilitados que no están sincronizados
                </p>
              </div>
            )}

            {/* Información adicional */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Solo se muestran productos habilitados para POS en el punto de venta</p>
              <p>• Los productos deben estar sincronizados para aparecer en POS</p>
              <p>• Puedes habilitar productos para POS desde el formulario de productos</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 