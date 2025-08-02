'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  RefreshCw, 
  Database,
  Calculator,
  Settings
} from 'lucide-react';

interface UnitStats {
  totalProducts: number;
  productsWithUnit: number;
  productsWithoutUnit: number;
  uniqueUnits: Array<{
    unit: string;
    count: number;
  }>;
  needsNormalization: Array<{
    oldUnit: string;
    newUnit: string;
    count: number;
  }>;
}

interface ProductUnit {
  id: number;
  name: string;
  unit: string;
  normalizedUnit: string;
}

export default function UnitNormalizationPanel() {
  const [stats, setStats] = useState<UnitStats | null>(null);
  const [products, setProducts] = useState<ProductUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [normalizing, setNormalizing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Cargar estadísticas
  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products/unit-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar productos que necesitan normalización
  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products/unit-normalization');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };

  // Normalizar unidades
  const normalizeUnits = async () => {
    setNormalizing(true);
    try {
      const response = await fetch('/api/products/normalize-units', {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`✅ Normalización completada: ${result.updated} productos actualizados`);
        loadStats();
        loadProducts();
      } else {
        alert('❌ Error en la normalización');
      }
    } catch (error) {
      console.error('Error normalizando unidades:', error);
      alert('❌ Error en la normalización');
    } finally {
      setNormalizing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Cargando estadísticas de unidades...
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No se pudieron cargar las estadísticas de unidades de medida.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const needsNormalization = stats.needsNormalization.length > 0;
  const progressPercentage = (stats.productsWithUnit / stats.totalProducts) * 100;

  return (
    <div className="space-y-6">
      {/* Panel Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Normalización de Unidades de Medida
          </CardTitle>
          <CardDescription>
            Sistema para corregir y estandarizar las unidades de medida de productos existentes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estadísticas Generales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalProducts}</div>
              <div className="text-sm text-blue-500">Total Productos</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.productsWithUnit}</div>
              <div className="text-sm text-green-500">Con Unidad</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.productsWithoutUnit}</div>
              <div className="text-sm text-yellow-500">Sin Unidad</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.uniqueUnits.length}</div>
              <div className="text-sm text-purple-500">Unidades Únicas</div>
            </div>
          </div>

          {/* Barra de Progreso */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso de normalización</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Alertas */}
          {stats.productsWithoutUnit > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{stats.productsWithoutUnit} productos</strong> no tienen unidad de medida asignada.
                Se asignará "UND" por defecto.
              </AlertDescription>
            </Alert>
          )}

          {needsNormalization && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>{stats.needsNormalization.length} tipos de unidades</strong> necesitan normalización.
                Ejemplo: "Pieza" → "UND", "Kg" → "KG"
              </AlertDescription>
            </Alert>
          )}

          {/* Botones de Acción */}
          <div className="flex gap-2">
            <Button 
              onClick={normalizeUnits}
              disabled={normalizing}
              className="flex items-center gap-2"
            >
              {normalizing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Calculator className="h-4 w-4" />
              )}
              {normalizing ? 'Normalizando...' : 'Normalizar Unidades'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Settings className="h-4 w-4 mr-2" />
              {showDetails ? 'Ocultar Detalles' : 'Ver Detalles'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detalles */}
      {showDetails && (
        <div className="space-y-4">
          {/* Unidades Únicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Unidades Únicas Encontradas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {stats.uniqueUnits.map((item) => (
                  <Badge key={item.unit} variant="secondary" className="justify-between">
                    <span>{item.unit}</span>
                    <span className="ml-2">{item.count}</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cambios Propuestos */}
          {needsNormalization && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cambios Propuestos</CardTitle>
                <CardDescription>
                  Unidades que serán normalizadas al sistema estandarizado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.needsNormalization.map((item) => (
                    <div key={item.oldUnit} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.oldUnit}</span>
                        <span className="text-gray-400">→</span>
                        <Badge variant="outline">{item.newUnit}</Badge>
                      </div>
                      <span className="text-sm text-gray-600">{item.count} productos</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Productos que Necesitan Atención */}
          {products.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Productos que Necesitan Atención</CardTitle>
                <CardDescription>
                  Productos con unidades no estándar que requieren revisión manual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-600">
                          Unidad actual: <span className="font-mono">{product.unit}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {product.normalizedUnit}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
} 