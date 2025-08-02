'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getReportFilterOptions, getTransactionsReport, TransactionReportData } from '@/actions/configuration/petty-cash-reports';

interface TransactionsReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FilterOptions {
  users: Array<{ id: string; name: string }>;
  cashRegisters: Array<{ id: number; name: string }>;
  dateRange?: { earliest: string; latest: string };
}

export default function TransactionsReportModal({ isOpen, onClose }: TransactionsReportModalProps) {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    sessionId: '',
    type: 'all' as 'expense' | 'purchase' | 'all',
    userId: '',
    cashRegisterId: ''
  });

  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<TransactionReportData[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showHeader, setShowHeader] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadFilterOptions();
      // Configurar fechas por defecto (último mes)
      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      
      setFilters(prev => ({
        ...prev,
        startDate: lastMonth.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      }));

      // Cargar datos iniciales
      loadTransactions({
        startDate: lastMonth.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      });
    }
  }, [isOpen]);

  const loadFilterOptions = async () => {
    try {
      const result = await getReportFilterOptions();
      console.log('🔍 Filter options result:', result);
      
      if (result && result.success) {
        setFilterOptions({
          users: result.users || [],
          cashRegisters: result.cashRegisters || [],
          dateRange: result.dateRange
        });
      } else {
        console.warn('⚠️ Filter options failed:', result?.error || 'Unknown error');
        // Usar valores por defecto
        setFilterOptions({
          users: [],
          cashRegisters: [{ id: 1, name: 'Caja Principal' }],
          dateRange: undefined
        });
      }
    } catch (error) {
      console.error('❌ Error loading filter options:', error);
      // Usar valores por defecto en caso de error
      setFilterOptions({
        users: [],
        cashRegisters: [{ id: 1, name: 'Caja Principal' }],
        dateRange: undefined
      });
    }
  };

  const loadTransactions = async (customFilters?: any) => {
    setLoading(true);
    try {
      const filterToUse = customFilters || filters;
      console.log('🔍 Loading transactions with filters:', filterToUse);
      
      const result = await getTransactionsReport({
        startDate: filterToUse.startDate || undefined,
        endDate: filterToUse.endDate || undefined,
        sessionId: filterToUse.sessionId ? parseInt(filterToUse.sessionId) : undefined,
        type: filterToUse.type === 'all' ? undefined : filterToUse.type,
        userId: filterToUse.userId || undefined,
        cashRegisterId: filterToUse.cashRegisterId ? parseInt(filterToUse.cashRegisterId) : undefined,
      });

      console.log('📊 Transactions result:', result);

      if (result && result.success) {
        setTransactions(result.data || []);
        setSummary(result.summary);
        setCurrentPage(1); // Reset a primera página
      } else {
        console.error('❌ Transactions failed:', result?.error || 'Unknown error');
        alert('Error al cargar transacciones: ' + (result?.error || 'Error desconocido'));
        setTransactions([]);
        setSummary(null);
      }
    } catch (error) {
      console.error('❌ Error loading transactions:', error);
      alert('Error inesperado al cargar transacciones');
      setTransactions([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = () => {
    loadTransactions();
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.sessionId) params.append('sessionId', filters.sessionId);
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.cashRegisterId) params.append('cashRegisterId', filters.cashRegisterId);

      const response = await fetch(`/api/petty-cash/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Error al generar el reporte');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      let filename = 'reporte_transacciones.xlsx';
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Error al exportar el reporte');
    } finally {
      setLoading(false);
    }
  };

  // Cálculo de paginación
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = transactions.slice(startIndex, endIndex);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-7xl w-full mx-4 max-h-[95vh] overflow-hidden flex flex-col">
        {/* Botón para ocultar/mostrar filtros y resumen */}
        <div className="flex justify-end mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHeader((prev) => !prev)}
            className="text-xs"
          >
            {showHeader ? 'Ocultar filtros y resumen' : 'Mostrar filtros y resumen'}
          </Button>
        </div>
        {/* Header */}
        {showHeader && (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  📊 Listado de Transacciones
                </h2>
                <p className="text-gray-600 text-sm">
                  Todas las transacciones ordenadas por fecha con saldos corrientes
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>
            {/* Filtros Compactos */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Inicio</label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Fin</label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">Todas</option>
                    <option value="opening">Aperturas</option>
                    <option value="expense">Gastos</option>
                    <option value="purchase">Compras</option>
                    <option value="closing">Cierres</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sesión</label>
                  <Input
                    type="number"
                    placeholder="# Sesión"
                    value={filters.sessionId}
                    onChange={(e) => setFilters(prev => ({ ...prev, sessionId: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Acción</label>
                  <Button
                    onClick={handleFilterChange}
                    disabled={loading}
                    className="w-full text-sm py-1.5 h-8"
                  >
                    {loading ? '⏳' : '🔍'} Buscar
                  </Button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Exportar</label>
                  <Button
                    onClick={handleExport}
                    disabled={loading}
                    variant="outline"
                    className="w-full text-sm py-1.5 h-8"
                  >
                    📥 Excel
                  </Button>
                </div>
              </div>
            </div>
            {/* Resumen Rápido */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-blue-600">{summary.totalTransactions}</div>
                  <div className="text-xs text-blue-800">Transacciones</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-red-600">${summary.totalExpenses.toLocaleString()}</div>
                  <div className="text-xs text-red-800">Total Gastos</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-orange-600">${summary.totalPurchases.toLocaleString()}</div>
                  <div className="text-xs text-orange-800">Total Compras</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-green-600">${summary.initialBalance.toLocaleString()}</div>
                  <div className="text-xs text-green-800">Saldo Inicial</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-purple-600">${summary.finalBalance.toLocaleString()}</div>
                  <div className="text-xs text-purple-800">Saldo Final</div>
                </div>
              </div>
            )}
          </>
        )}
        {/* Tabla de Transacciones */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b">N°</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b">Fecha/Hora</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b">Sesión</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b">Tipo</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b">Descripción</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 border-b">Monto</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 border-b">💰 Saldo</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                      <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                      Cargando transacciones...
                    </td>
                  </tr>
                ) : currentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                      😔 No se encontraron transacciones para los filtros seleccionados
                    </td>
                  </tr>
                ) : (
                  currentTransactions.map((transaction, index) => (
                    <tr key={`${transaction.type}-${transaction.id}`} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-900">{startIndex + index + 1}</td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        <div>{new Date(transaction.createdAt).toLocaleDateString('es-CL')}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(transaction.createdAt).toLocaleTimeString('es-CL', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">{transaction.sessionNumber}</td>
                      <td className="px-3 py-2 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.type === 'expense' 
                            ? 'bg-red-100 text-red-800' 
                            : transaction.type === 'purchase'
                            ? 'bg-orange-100 text-orange-800'
                            : transaction.type === 'opening'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {transaction.type === 'expense' ? '💸 Gasto' : 
                           transaction.type === 'purchase' ? '🛒 Compra' :
                           transaction.type === 'opening' ? '💰 Apertura' : '🔒 Cierre'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate" title={transaction.description}>
                        {transaction.description}
                        {transaction.productName && (
                          <div className="text-xs text-gray-500">
                            {transaction.productName} {transaction.quantity && `(${transaction.quantity})`}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-sm font-semibold text-right">
                        <span className={
                          transaction.type === 'expense' ? 'text-red-600' : 
                          transaction.type === 'purchase' ? 'text-orange-600' :
                          transaction.type === 'opening' ? 'text-green-600' : 'text-purple-600'
                        }>
                          {transaction.type === 'opening' ? '+' : '-'}${transaction.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm font-bold text-right">
                        <span className={transaction.runningBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${Math.abs(transaction.runningBalance).toLocaleString()}
                          {transaction.runningBalance < 0 && ' ⚠️'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">{transaction.userName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Mostrando {startIndex + 1} a {Math.min(endIndex, transactions.length)} de {transactions.length} transacciones
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  ← Anterior
                </Button>
                <span className="px-3 py-1 text-sm bg-gray-100 rounded">
                  {currentPage} de {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                >
                  Siguiente →
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
