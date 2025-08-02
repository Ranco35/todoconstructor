'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getTransactionsReport, TransactionReportData, exportTransactionsToExcel } from '@/actions/configuration/petty-cash-reports';
import PaginationControls from '@/components/shared/PaginationControls';
import { Calendar, Download, Filter, RefreshCw, Eye, TrendingUp } from 'lucide-react';

interface AdminPettyCashTransactionsProps {
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
}

export default function AdminPettyCashTransactions({ currentUser }: AdminPettyCashTransactionsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<TransactionReportData[]>([]);
  const [summary, setSummary] = useState<any>(null);
  
  // Obtener parámetros de paginación de la URL
  const currentPage = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: 'all' as 'expense' | 'purchase' | 'opening' | 'closing' | 'all',
    period: 'custom' as 'today' | 'yesterday' | 'week' | 'month' | 'custom'
  });

  // Configurar fechas por defecto (última semana)
  useEffect(() => {
    const today = new Date();
    const lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
    
    setFilters(prev => ({
      ...prev,
      startDate: lastWeek.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      period: 'week'
    }));

    // Cargar datos iniciales
    loadTransactions({
      startDate: lastWeek.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });
  }, []);

      const loadTransactions = async (filterOverrides = {}) => {
      setLoading(true);
      try {
        const finalFilters = { ...filters, ...filterOverrides };
        const result = await getTransactionsReport(finalFilters);
        
        if (result.success) {
          // Las transacciones vienen con saldos ya calculados cronológicamente del backend
          // Ahora las mostramos en orden descendente (más recientes primero) pero manteniendo los saldos correctos
          const sortedTransactions = (result.data || []).sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          setTransactions(sortedTransactions);
          setSummary(result.summary);
        } else {
          console.error('Error cargando transacciones:', result.error);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

  const handlePeriodChange = (period: string) => {
    const today = new Date();
    let startDate = '';
    let endDate = today.toISOString().split('T')[0];

    switch (period) {
      case 'today':
        startDate = today.toISOString().split('T')[0];
        break;
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        startDate = yesterday.toISOString().split('T')[0];
        endDate = yesterday.toISOString().split('T')[0];
        break;
      case 'week':
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = lastWeek.toISOString().split('T')[0];
        break;
      case 'month':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        startDate = lastMonth.toISOString().split('T')[0];
        break;
      default:
        return; // custom - no cambiar fechas
    }

    const newFilters = { ...filters, period, startDate, endDate };
    setFilters(newFilters);
    loadTransactions(newFilters);
  };

  const handleExport = async () => {
    try {
      const result = await exportTransactionsToExcel(filters);
      if (result.success && result.data) {
        const blob = new Blob([result.data], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename || 'transacciones-caja-chica.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exportando:', error);
    }
  };

  // Paginación
  const totalPages = Math.ceil(transactions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentTransactions = transactions.slice(startIndex, endIndex);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'opening': return '💰';
      case 'expense': return '💸';
      case 'purchase': return '🛒';
      case 'closing': return '🔒';
      default: return '📋';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'opening': return 'text-green-600 bg-green-50 border-green-200';
      case 'expense': return 'text-red-600 bg-red-50 border-red-200';
      case 'purchase': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'closing': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 100000) return 'text-green-600 font-bold';
    if (balance > 50000) return 'text-green-600';
    if (balance > 0) return 'text-yellow-600';
    return 'text-red-600 font-bold';
  };

  return (
    <div className="space-y-6">
      {/* Panel de Filtros */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900">Filtros de Búsqueda</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Períodos rápidos */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
            <div className="grid grid-cols-2 gap-1">
              {[
                { key: 'today', label: 'Hoy' },
                { key: 'yesterday', label: 'Ayer' },
                { key: 'week', label: 'Semana' },
                { key: 'month', label: 'Mes' }
              ].map(period => (
                <button
                  key={period.key}
                  onClick={() => handlePeriodChange(period.key)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    filters.period === period.key
                      ? 'bg-purple-100 border-purple-300 text-purple-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-purple-50'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fecha inicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => {
                const newFilters = { ...filters, startDate: e.target.value, period: 'custom' };
                setFilters(newFilters);
              }}
              className="text-sm"
            />
          </div>

          {/* Fecha fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => {
                const newFilters = { ...filters, endDate: e.target.value, period: 'custom' };
                setFilters(newFilters);
              }}
              className="text-sm"
            />
          </div>

          {/* Tipo de transacción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <select
              value={filters.type}
              onChange={(e) => {
                const newFilters = { ...filters, type: e.target.value as any };
                setFilters(newFilters);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">Todas</option>
              <option value="opening">Aperturas</option>
              <option value="expense">Gastos</option>
              <option value="purchase">Compras</option>
              <option value="closing">Cierres</option>
            </select>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Acciones</label>
            <Button
              onClick={() => loadTransactions()}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 h-auto"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              {loading ? 'Cargando...' : 'Buscar'}
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50 text-sm py-2 h-auto"
            >
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Resumen */}
      {summary && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Resumen del Período</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-sm font-medium text-blue-700">Total Transacciones</p>
              <p className="text-2xl font-bold text-blue-900">{summary.totalTransactions}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <p className="text-sm font-medium text-red-700">Total Gastos</p>
              <p className="text-2xl font-bold text-red-900">{formatCurrency(summary.totalExpenses)}</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
              <p className="text-sm font-medium text-orange-700">Total Compras</p>
              <p className="text-2xl font-bold text-orange-900">{formatCurrency(summary.totalPurchases)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <p className="text-sm font-medium text-green-700">Saldo Inicial</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(summary.initialBalance)}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <p className="text-sm font-medium text-purple-700">Saldo Final</p>
              <p className={`text-2xl font-bold ${getBalanceColor(summary.finalBalance)}`}>
                {formatCurrency(summary.finalBalance)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Transacciones */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <h2 className="text-xl font-bold text-gray-900">
            Transacciones ({transactions.length})
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Mostrando {startIndex + 1}-{Math.min(endIndex, transactions.length)} de {transactions.length} transacciones
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  N°
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Fecha/Hora
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Sesión
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-blue-50">
                  💰 Saldo Actual
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentTransactions.map((transaction, index) => (
                <tr key={`${transaction.type}-${transaction.id}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div>{new Date(transaction.createdAt).toLocaleDateString('es-CL')}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(transaction.createdAt).toLocaleTimeString('es-CL', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                      {transaction.sessionNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTransactionColor(transaction.type)}`}>
                      {getTransactionIcon(transaction.type)} {
                        transaction.type === 'expense' ? 'Gasto' :
                        transaction.type === 'purchase' ? 'Compra' :
                        transaction.type === 'opening' ? 'Apertura' :
                        transaction.type === 'closing' ? 'Cierre' : 'Otro'
                      }
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                    <div className="truncate" title={transaction.description}>
                      {transaction.description}
                    </div>
                    {transaction.category && (
                      <div className="text-xs text-blue-600 mt-1">
                        📁 {transaction.category}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`font-semibold ${
                      transaction.type === 'opening' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'opening' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {transaction.userName}
                  </td>
                  <td className="px-4 py-3 text-sm bg-blue-50">
                    <span className={`font-bold text-lg ${getBalanceColor(transaction.runningBalance)}`}>
                      {formatCurrency(transaction.runningBalance)}
                    </span>
                  </td>
                </tr>
              ))}
              
              {currentTransactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    <div className="text-4xl mb-4">📋</div>
                    <div className="text-lg font-medium">No hay transacciones en el período seleccionado</div>
                    <div className="text-sm">Ajusta los filtros para ver más resultados</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación usando el componente estándar del sistema */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize.toString()}
              totalCount={transactions.length}
              currentCount={currentTransactions.length}
              basePath="/dashboard/pettyCash/admin"
              itemName="transacciones"
            />
          </div>
        )}
      </div>
    </div>
  );
} 