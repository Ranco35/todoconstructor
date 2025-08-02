'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Zap,
  BarChart3,
  Filter,
  Download,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { 
  getTokenUsageStats, 
  getTokenUsageHistory, 
  getTokenUsageTrends,
  type TokenUsageStats,
  type TokenUsageRecord,
  type TokenUsageFilters 
} from '@/actions/ai/token-usage-actions';

interface TokenUsageTrackerProps {
  currentUser: any;
}

export default function TokenUsageTracker({ currentUser }: TokenUsageTrackerProps) {
  const [stats, setStats] = useState<TokenUsageStats | null>(null);
  const [history, setHistory] = useState<TokenUsageRecord[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<TokenUsageFilters>({ period: 'month' });
  const [showHistory, setShowHistory] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Función para cargar estadísticas
  const loadStats = async (filters: TokenUsageFilters = activeFilter) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Cargando estadísticas de tokens...', filters);
      
      const [statsResult, trendsResult] = await Promise.all([
        getTokenUsageStats(filters),
        getTokenUsageTrends('daily', 30)
      ]);
      
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      } else {
        setError(statsResult.error || 'Error cargando estadísticas');
      }
      
      if (trendsResult.success && trendsResult.data) {
        setTrends(trendsResult.data);
      }
      
    } catch (err) {
      console.error('❌ Error cargando estadísticas:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cargar historial
  const loadHistory = async (page: number = 1) => {
    try {
      setIsLoading(true);
      
      const historyResult = await getTokenUsageHistory(activeFilter, page, 20);
      
      if (historyResult.success && historyResult.data) {
        setHistory(historyResult.data);
        setTotalCount(historyResult.totalCount || 0);
        setCurrentPage(page);
      } else {
        setError(historyResult.error || 'Error cargando historial');
      }
      
    } catch (err) {
      console.error('❌ Error cargando historial:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadStats();
  }, []);

  // Cargar historial cuando se activa
  useEffect(() => {
    if (showHistory) {
      loadHistory();
    }
  }, [showHistory, activeFilter]);

  // Manejar cambio de filtro
  const handleFilterChange = (newFilter: TokenUsageFilters) => {
    setActiveFilter(newFilter);
    loadStats(newFilter);
    if (showHistory) {
      loadHistory(1);
    }
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para formatear costo en USD
  const formatUSDCost = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 6
    }).format(amount);
  };

  // Convertir USD a CLP aproximado (para referencia)
  const formatCLPCost = (usdAmount: number) => {
    const exchangeRate = 900; // Aproximado, en producción usar API de cambio
    const clpAmount = usdAmount * exchangeRate;
    return formatCurrency(clpAmount);
  };

  // Obtener icono de función
  const getFeatureIcon = (featureType: string) => {
    const icons = {
      'chat': '💬',
      'analysis': '🔍',
      'summarization': '📝',
      'translation': '🌐',
      'code_assistance': '💻'
    };
    return icons[featureType as keyof typeof icons] || '🤖';
  };

  // Obtener color del modelo
  const getModelColor = (model: string) => {
    if (model.includes('gpt-4')) return 'bg-purple-100 text-purple-800';
    if (model.includes('gpt-3.5')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">💰 Gastos en Tokens</h2>
          <p className="text-gray-600 mt-1">
            Seguimiento detallado del uso y costos de ChatGPT
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => loadStats()}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filtros de Período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros de Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'today', label: 'Hoy', icon: '📅' },
              { key: 'week', label: 'Esta Semana', icon: '📊' },
              { key: 'month', label: 'Este Mes', icon: '📈' },
              { key: 'all', label: 'Todo el Tiempo', icon: '🕰️' }
            ].map((period) => (
              <Button
                key={period.key}
                onClick={() => handleFilterChange({ period: period.key as any })}
                variant={activeFilter.period === period.key ? 'default' : 'outline'}
                size="sm"
                className="flex items-center"
              >
                <span className="mr-2">{period.icon}</span>
                {period.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Estadísticas Principales */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total de Tokens */}
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Tokens</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {stats.total_tokens.toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Promedio: {stats.average_tokens_per_request} por request
                  </p>
                </div>
                <div className="p-3 bg-blue-200 rounded-full">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Costo Total USD */}
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Costo Total (USD)</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatUSDCost(stats.total_cost_usd)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    ≈ {formatCLPCost(stats.total_cost_usd)} CLP
                  </p>
                </div>
                <div className="p-3 bg-green-200 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Requests */}
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Total Requests</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {stats.total_requests}
                  </p>
                  <div className="flex items-center mt-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-purple-600">
                      {stats.successful_requests} exitosos
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-purple-200 rounded-full">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modelo Más Usado */}
          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Modelo Más Usado</p>
                  <p className="text-lg font-bold text-orange-900">
                    {stats.most_used_model}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    Función: {stats.most_used_feature}
                  </p>
                </div>
                <div className="p-3 bg-orange-200 rounded-full">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráfico de Tendencias Simple */}
      {trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Tendencias de Uso (Últimos 30 días)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trends.slice(-7).map((trend, index) => (
                <div key={trend.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">
                      {new Date(trend.date).toLocaleDateString('es-ES', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-600">
                      {trend.total_tokens.toLocaleString()} tokens
                    </span>
                    <span className="text-green-600 font-medium">
                      {formatUSDCost(trend.total_cost_usd)}
                    </span>
                    <span className="text-blue-600">
                      {trend.requests} requests
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historial Detallado */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Historial Detallado
            </CardTitle>
            <Button
              onClick={() => setShowHistory(!showHistory)}
              variant="outline"
              size="sm"
            >
              {showHistory ? 'Ocultar' : 'Mostrar'} Historial
            </Button>
          </div>
        </CardHeader>
        
        {showHistory && (
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando historial...</p>
              </div>
            ) : history.length > 0 ? (
              <div className="space-y-3">
                {history.map((record) => (
                  <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getFeatureIcon(record.feature_type)}</span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getModelColor(record.model_used)}>
                              {record.model_used}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {record.feature_type}
                            </Badge>
                            {record.success ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(record.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-gray-600">
                            {record.total_tokens.toLocaleString()} tokens
                          </span>
                          <span className="font-medium text-green-600">
                            {formatUSDCost(record.estimated_cost_usd)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {record.prompt_tokens} prompt + {record.completion_tokens} completion
                        </p>
                      </div>
                    </div>
                    
                    {!record.success && record.error_message && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        Error: {record.error_message}
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Paginación Simple */}
                {totalCount > 20 && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Mostrando {history.length} de {totalCount} registros
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => loadHistory(currentPage - 1)}
                        disabled={currentPage <= 1 || isLoading}
                        variant="outline"
                        size="sm"
                      >
                        Anterior
                      </Button>
                      <Button
                        onClick={() => loadHistory(currentPage + 1)}
                        disabled={history.length < 20 || isLoading}
                        variant="outline"
                        size="sm"
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay historial disponible para el período seleccionado</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
} 