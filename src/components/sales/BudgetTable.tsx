'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Eye, Edit, Trash2, FileText } from 'lucide-react';
import Link from 'next/link';
import type { Budget, BudgetStatus, BudgetFilters, BudgetListResponse } from '../../types/ventas/budget';

// Interfaces TypeScript
interface BudgetTableProps {
  onEdit?: (budget: Budget) => void;
  onDelete?: (budget: Budget) => void;
  onView?: (budget: Budget) => void;
}

interface TableFilters extends BudgetFilters {
  pageSize: number;
}

const BudgetTable: React.FC<BudgetTableProps> = ({
  onEdit,
  onDelete,
  onView
}) => {
  // Estados tipados
  const [budgets, setBudgets] = useState<(Budget & { client: { id: number; nombrePrincipal: string; apellido: string; email: string } | null })[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  
  const [filters, setFilters] = useState<TableFilters>({
    status: undefined,
    clientId: undefined,
    dateFrom: '',
    dateTo: '',
    search: '',
    pageSize: 20
  });

  // Cargar presupuestos
  const loadBudgets = async (): Promise<void> => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('pageSize', filters.pageSize.toString());
      
      if (filters.status) params.append('status', filters.status);
      if (filters.clientId) params.append('clientId', filters.clientId.toString());
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/sales/budgets/list?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setBudgets(result.data.budgets);
        setTotalPages(result.data.totalPages);
        setTotalCount(result.data.total);
      } else {
        setError(result.error || 'Error al cargar presupuestos.');
      }
    } catch (err) {
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Efectos
  useEffect(() => {
    loadBudgets();
  }, [currentPage, filters]);

  // Funciones auxiliares
  const getStatusBadge = (status: BudgetStatus): JSX.Element => {
    const statusConfig = {
      draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
      sent: { label: 'Enviado', color: 'bg-blue-100 text-blue-800' },
      accepted: { label: 'Aceptado', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-800' },
      expired: { label: 'Expirado', color: 'bg-orange-100 text-orange-800' },
      converted: { label: 'Convertido', color: 'bg-purple-100 text-purple-800' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  const formatCurrency = (amount: number, currency: string = 'CLP'): string => {
    return `$${amount.toLocaleString('es-CL')} ${currency}`;
  };

  const handleFilterChange = (key: keyof TableFilters, value: string | number | undefined): void => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page
  };

  const handleSearch = (searchTerm: string): void => {
    handleFilterChange('search', searchTerm);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado con acciones */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Presupuestos</h1>
          <p className="text-gray-600">Gestión de presupuestos de ventas</p>
        </div>
        <Link href="/dashboard/sales/budgets/create">
          <Button className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Nuevo Presupuesto</span>
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por número o notas..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Estado */}
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="accepted">Aceptado</SelectItem>
                <SelectItem value="rejected">Rechazado</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
                <SelectItem value="converted">Convertido</SelectItem>
              </SelectContent>
            </Select>

            {/* Fecha desde */}
            <Input
              type="date"
              placeholder="Fecha desde"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />

            {/* Fecha hasta */}
            <Input
              type="date"
              placeholder="Fecha hasta"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />

            {/* Tamaño de página */}
            <Select
              value={filters.pageSize.toString()}
              onValueChange={(value) => handleFilterChange('pageSize', parseInt(value, 10))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 por página</SelectItem>
                <SelectItem value="20">20 por página</SelectItem>
                <SelectItem value="50">50 por página</SelectItem>
                <SelectItem value="100">100 por página</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando presupuestos...</p>
            </div>
          ) : budgets.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay presupuestos disponibles.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {budgets.map((budget) => (
                    <tr key={budget.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {budget.number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {budget.client ? `${budget.client.nombrePrincipal} ${budget.client.apellido}` : 'Cliente no encontrado'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {budget.client?.email || ''}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(budget.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(budget.total, budget.currency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(budget.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onView?.(budget)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit?.(budget)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDelete?.(budget)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginación */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Mostrando {((currentPage - 1) * filters.pageSize) + 1} - {Math.min(currentPage * filters.pageSize, totalCount)} de {totalCount} presupuestos
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Página {currentPage} de {totalPages}
              </span>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetTable; 