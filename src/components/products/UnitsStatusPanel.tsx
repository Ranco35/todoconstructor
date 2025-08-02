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
  Check,
  X,
  Settings
} from 'lucide-react';

interface UnitsStatus {
  totalProducts: number;
  productsWithUnit: number;
  productsWithoutUnit: number;
  productsWithUND: number;
  productsWithOtherUnits: number;
  percentageWithUnit: number;
  percentageWithUND: number;
  uniqueUnits: Array<{
    unit: string;
    count: number;
  }>;
  productsWithoutUnitList: Array<{
    id: number;
    name: string;
    unit: string | null;
  }>;
  productsWithUNDList: Array<{
    id: number;
    name: string;
    unit: string;
  }>;
  productsWithOtherUnitsList: Array<{
    id: number;
    name: string;
    unit: string;
  }>;
  allProductsHaveUnit: boolean;
  allProductsHaveUND: boolean;
}

export default function UnitsStatusPanel() {
  const [status, setStatus] = useState<UnitsStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products/check-units-status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error cargando estado:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Verificando estado de unidades...
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No se pudo cargar el estado de las unidades de medida.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Panel Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Estado de Unidades de Medida
          </CardTitle>
          <CardDescription>
            Verificación del estado actual de las unidades de medida de todos los productos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estadísticas Generales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{status.totalProducts}</div>
              <div className="text-sm text-blue-500">Total Productos</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{status.productsWithUnit}</div>
              <div className="text-sm text-green-500">Con Unidad</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{status.productsWithoutUnit}</div>
              <div className="text-sm text-yellow-500">Sin Unidad</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{status.productsWithUND}</div>
              <div className="text-sm text-purple-500">Con UND</div>
            </div>
          </div>

          {/* Barras de Progreso */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Productos con unidad</span>
                <span>{status.percentageWithUnit}%</span>
              </div>
              <Progress value={status.percentageWithUnit} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Productos con UND</span>
                <span>{status.percentageWithUND}%</span>
              </div>
              <Progress value={status.percentageWithUND} className="h-2" />
            </div>
          </div>

          {/* Estado General */}
          <div className="flex items-center gap-2">
            {status.allProductsHaveUnit ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <X className="h-5 w-5 text-red-500" />
            )}
            <span className="font-medium">
              {status.allProductsHaveUnit 
                ? '✅ Todos los productos tienen unidad asignada'
                : '❌ Hay productos sin unidad asignada'
              }
            </span>
          </div>

          {/* Alertas */}
          {status.productsWithoutUnit > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{status.productsWithoutUnit} productos</strong> no tienen unidad de medida asignada.
                Se recomienda asignar "UND" a estos productos.
              </AlertDescription>
            </Alert>
          )}

          {status.productsWithOtherUnits > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>{status.productsWithOtherUnits} productos</strong> tienen unidades diferentes a "UND".
                Esto es normal si los productos requieren unidades específicas (KG, LT, etc.).
              </AlertDescription>
            </Alert>
          )}

          {/* Botones de Acción */}
          <div className="flex gap-2">
            <Button 
              onClick={loadStatus}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar Estado
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
                {status.uniqueUnits.map((item) => (
                  <Badge key={item.unit} variant="secondary" className="justify-between">
                    <span>{item.unit}</span>
                    <span className="ml-2">{item.count}</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Productos Sin Unidad */}
          {status.productsWithoutUnitList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-red-600">Productos Sin Unidad</CardTitle>
                <CardDescription>
                  Estos productos necesitan una unidad de medida asignada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {status.productsWithoutUnitList.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-red-600">Sin unidad asignada</div>
                      </div>
                      <Badge variant="destructive">SIN UNIDAD</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Productos Con UND */}
          {status.productsWithUNDList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-green-600">Productos Con UND</CardTitle>
                <CardDescription>
                  Muestra de productos con unidad "UND" (primeros 10)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {status.productsWithUNDList.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-green-600">Unidad: {product.unit}</div>
                      </div>
                      <Badge variant="outline" className="text-green-600">UND</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Productos Con Otras Unidades */}
          {status.productsWithOtherUnitsList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-blue-600">Productos Con Otras Unidades</CardTitle>
                <CardDescription>
                  Productos con unidades específicas (KG, LT, etc.) - primeros 10
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {status.productsWithOtherUnitsList.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-blue-600">Unidad: {product.unit}</div>
                      </div>
                      <Badge variant="outline" className="text-blue-600">{product.unit}</Badge>
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