'use client';

import React, { useState } from 'react';
import { SupplierTax } from '@/types/database';
import { TAX_TYPES } from '@/constants/supplier';
import { deleteSupplierTaxAction } from '@/actions/suppliers/taxes/delete';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';

interface TaxTableProps {
  taxes: SupplierTax[];
  supplierId?: number;
}

export default function TaxTable({ taxes, supplierId }: TaxTableProps) {
  const [isLoading, setIsLoading] = useState<number | null>(null);

  // supplierId disponible para implementación futura de funcionalidades específicas del proveedor
  console.log('ID del proveedor:', supplierId);

  const handleDelete = async (taxId: number) => {
    if (!confirm('¿Está seguro de que desea eliminar esta configuración fiscal?')) {
      return;
    }

    setIsLoading(taxId);
    try {
      const result = await deleteSupplierTaxAction(taxId);
      if (result.success) {
        // Recargar la página para actualizar la lista
        window.location.reload();
      } else {
        console.error('Error deleting tax:', result.error);
        alert('Error al eliminar la configuración fiscal');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar la configuración fiscal');
    } finally {
      setIsLoading(null);
    }
  };

  const getTaxTypeLabel = (type: string) => {
    const taxType = TAX_TYPES.find(t => t.value === type);
    return taxType?.label || type;
  };

  const formatTaxRate = (rate: number) => {
    return `${rate}%`;
  };

  if (taxes.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">💸</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay configuraciones fiscales
          </h3>
          <p className="text-gray-500 mb-6">
            Este proveedor no tiene configuraciones fiscales registradas.
          </p>
          <Button
            onClick={() => {
              // TODO: Abrir modal para agregar configuración fiscal
            }}
          >
            <span className="mr-2">➕</span>
            Agregar Primera Configuración
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen de impuestos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-blue-600 text-xl">💸</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Impuestos</p>
                <p className="text-2xl font-bold text-gray-900">{taxes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-green-600 text-xl">✅</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {taxes.filter(tax => tax.active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-purple-600 text-xl">📊</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {taxes.length > 0 
                    ? formatTaxRate(taxes.reduce((sum, tax) => sum + tax.taxRate, 0) / taxes.length)
                    : '0%'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de impuestos */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración Fiscal</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo de Impuesto</TableHead>
                <TableHead>Tasa</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxes.map((tax) => (
                <TableRow key={tax.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">
                        {getTaxTypeLabel(tax.taxType)}
                      </p>
                      <p className="text-sm text-gray-500">{tax.taxType}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-sm">
                      {formatTaxRate(tax.taxRate)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {tax.taxCode ? (
                      <span className="text-sm text-gray-900">{tax.taxCode}</span>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {tax.description ? (
                      <span className="text-sm text-gray-700">{tax.description}</span>
                    ) : (
                      <span className="text-gray-400 text-sm">Sin descripción</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {tax.active ? (
                      <Badge variant="success" className="text-xs">Activo</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            // TODO: Ver detalles del impuesto
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            // TODO: Editar configuración fiscal
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(tax.id)}
                          disabled={isLoading === tax.id}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {isLoading === tax.id ? 'Eliminando...' : 'Eliminar'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 