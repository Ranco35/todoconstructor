'use client';

import React, { useState } from 'react';
import { SupplierBank } from '@/types/database';
import { ACCOUNT_TYPES } from '@/constants/supplier';
import { deleteSupplierBankAction } from '@/actions/suppliers/banks/delete';
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

interface BankTableProps {
  banks: SupplierBank[];
  supplierId?: number;
}

export default function BankTable({ banks, supplierId }: BankTableProps) {
  const [isLoading, setIsLoading] = useState<number | null>(null);

  // supplierId disponible para implementación futura de funcionalidades específicas del proveedor
  console.log('ID del proveedor:', supplierId);

  const handleDelete = async (bankId: number) => {
    if (!confirm('¿Está seguro de que desea eliminar esta cuenta bancaria?')) {
      return;
    }

    setIsLoading(bankId);
    try {
      const result = await deleteSupplierBankAction(bankId);
      if (result.success) {
        // Recargar la página para actualizar la lista
        window.location.reload();
      } else {
        console.error('Error deleting bank:', result.error);
        alert('Error al eliminar la cuenta bancaria');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar la cuenta bancaria');
    } finally {
      setIsLoading(null);
    }
  };

  const getAccountTypeLabel = (type: string | null) => {
    if (!type) return 'No especificado';
    const accountType = ACCOUNT_TYPES.find(t => t.value === type);
    return accountType?.label || type;
  };

  const formatAccountNumber = (accountNumber: string) => {
    // Ocultar parte del número de cuenta por seguridad
    if (accountNumber.length <= 4) return accountNumber;
    return `****${accountNumber.slice(-4)}`;
  };

  if (banks.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🏦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay cuentas bancarias
          </h3>
          <p className="text-gray-500 mb-6">
            Este proveedor no tiene cuentas bancarias registradas.
          </p>
          <Button
            onClick={() => {
              // TODO: Abrir modal para agregar cuenta bancaria
            }}
          >
            <span className="mr-2">➕</span>
            Agregar Primera Cuenta
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen de cuentas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-blue-600 text-xl">🏦</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Cuentas</p>
                <p className="text-2xl font-bold text-gray-900">{banks.length}</p>
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
                <p className="text-sm font-medium text-gray-500">Activas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {banks.filter(bank => bank.active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-yellow-600 text-xl">⭐</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Principales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {banks.filter(bank => bank.isPrimary).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de cuentas */}
      <Card>
        <CardHeader>
          <CardTitle>Cuentas Bancarias</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Banco</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Titular</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Principal</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banks.map((bank) => (
                <TableRow key={bank.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{bank.bankName}</p>
                      {bank.routingNumber && (
                        <p className="text-sm text-gray-500">
                          Routing: {bank.routingNumber}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatAccountNumber(bank.accountNumber)}
                      </p>
                      {bank.accountType && (
                        <p className="text-sm text-gray-500">
                          {getAccountTypeLabel(bank.accountType)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm text-gray-900">{bank.accountType || 'No especificado'}</p>
                      {bank.swiftCode && (
                        <p className="text-xs text-gray-500">SWIFT: {bank.swiftCode}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{bank.holderName}</p>
                      {bank.holderDocument && (
                        <p className="text-sm text-gray-500">
                          Doc: {bank.holderDocument}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {bank.active ? (
                      <Badge variant="success" className="text-xs">Activa</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">Inactiva</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {bank.isPrimary ? (
                      <Badge variant="default" className="text-xs">⭐ Principal</Badge>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
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
                            // TODO: Ver detalles de la cuenta
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            // TODO: Editar cuenta bancaria
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(bank.id)}
                          disabled={isLoading === bank.id}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {isLoading === bank.id ? 'Eliminando...' : 'Eliminar'}
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