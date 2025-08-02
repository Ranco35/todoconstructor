'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  Wrench, 
  Warehouse, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Info
} from 'lucide-react';

interface WarehouseValidationInfoProps {
  needsWarehouse: boolean;
  hasPhysicalProducts: boolean;
  hasServices: boolean;
  productTypes: string[];
  warehouseId?: number | null;
  warehouseName?: string;
  canBeApproved: boolean;
  approvalRequirements: string[];
}

export default function WarehouseValidationInfo({
  needsWarehouse,
  hasPhysicalProducts,
  hasServices,
  productTypes,
  warehouseId,
  warehouseName,
  canBeApproved,
  approvalRequirements
}: WarehouseValidationInfoProps) {
  
  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case 'SERVICIO':
        return <Wrench className="w-4 h-4" />;
      case 'ALMACENABLE':
      case 'CONSUMIBLE':
      case 'INVENTARIO':
        return <Package className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getProductTypeLabel = (type: string) => {
    switch (type) {
      case 'SERVICIO':
        return 'Servicio';
      case 'ALMACENABLE':
        return 'Almacenable';
      case 'CONSUMIBLE':
        return 'Consumible';
      case 'INVENTARIO':
        return 'Inventario';
      case 'COMBO':
        return 'Combo';
      default:
        return type;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Warehouse className="w-5 h-5" />
          Validación de Bodega
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Estado de Validación */}
        <div className="flex items-center gap-2">
          {canBeApproved ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <span className={`font-medium ${canBeApproved ? 'text-green-700' : 'text-red-700'}`}>
            {canBeApproved ? 'Puede ser aprobada' : 'No puede ser aprobada'}
          </span>
        </div>

        {/* Tipos de Productos */}
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-2">Tipos de Productos:</h4>
          <div className="flex flex-wrap gap-2">
            {productTypes.length > 0 ? (
              productTypes.map((type, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  {getProductTypeIcon(type)}
                  {getProductTypeLabel(type)}
                </Badge>
              ))
            ) : (
              <span className="text-gray-500 text-sm">Sin productos identificados</span>
            )}
          </div>
        </div>

        {/* Análisis de Productos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            {hasPhysicalProducts ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-sm">
              Productos Físicos: {hasPhysicalProducts ? 'Sí' : 'No'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {hasServices ? (
              <CheckCircle className="w-4 h-4 text-blue-600" />
            ) : (
              <XCircle className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-sm">
              Servicios: {hasServices ? 'Sí' : 'No'}
            </span>
          </div>
        </div>

        {/* Estado de Bodega */}
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-2">Bodega Asignada:</h4>
          <div className="flex items-center gap-2">
            {warehouseId ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">
                  {warehouseName || `Bodega #${warehouseId}`}
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">No asignada</span>
              </>
            )}
          </div>
        </div>

        {/* Requisitos de Aprobación */}
        {approvalRequirements.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Requisitos Pendientes</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                {approvalRequirements.map((requirement, index) => (
                  <li key={index} className="text-sm">{requirement}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Información Adicional */}
        {needsWarehouse && !warehouseId && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Bodega Requerida</AlertTitle>
            <AlertDescription>
              Esta factura contiene productos físicos que requieren almacenamiento. 
              Debe asignar una bodega antes de poder aprobar la factura.
            </AlertDescription>
          </Alert>
        )}

        {!needsWarehouse && hasServices && (
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Factura de Servicios</AlertTitle>
            <AlertDescription className="text-blue-700">
              Esta factura contiene solo servicios. No se requiere bodega y puede ser aprobada directamente.
            </AlertDescription>
          </Alert>
        )}

      </CardContent>
    </Card>
  );
} 