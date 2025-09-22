'use client';

import React, { useState, useEffect } from 'react';
import { formatPrice, formatPercentage } from '@/utils/price-utils';
import { 
  getCategoryProfitConfigs, 
  getActivePricePromotions, 
  getPriceHistory,
  getPriceAnalysis 
} from '@/actions/pricing/price-management-actions';

interface DashboardStats {
  totalCategories: number;
  activePromotions: number;
  priceChangesToday: number;
  averageMargin: number;
  lowMarginProducts: number;
  expiringPromotions: number;
}

interface PriceChange {
  productId: number;
  productName: string;
  oldPrice: number;
  newPrice: number;
  changePercent: number;
  changedAt: string;
}

interface LowMarginProduct {
  productId: number;
  productName: string;
  costPrice: number;
  salePrice: number;
  profitMargin: number;
  categoryName: string;
}

export default function PriceManagementDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCategories: 0,
    activePromotions: 0,
    priceChangesToday: 0,
    averageMargin: 0,
    lowMarginProducts: 0,
    expiringPromotions: 0
  });
  
  const [recentChanges, setRecentChanges] = useState<PriceChange[]>([]);
  const [lowMarginProducts, setLowMarginProducts] = useState<LowMarginProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar datos en paralelo
      const [
        categoriesResult,
        promotionsResult,
        historyResult,
        analysisResult
      ] = await Promise.all([
        getCategoryProfitConfigs(),
        getActivePricePromotions(),
        getPriceHistory(),
        getPriceAnalysis()
      ]);

      // Procesar estadísticas
      const categories = categoriesResult.success ? categoriesResult.data || [] : [];
      const promotions = promotionsResult.success ? promotionsResult.data || [] : [];
      const history = historyResult.success ? historyResult.data || [] : [];
      const analysis = analysisResult.success ? analysisResult.data || [] : [];

      // Calcular estadísticas
      const today = new Date().toISOString().split('T')[0];
      const changesToday = history.filter(h => 
        h.changedAt.startsWith(today)
      );

      const expiringPromotions = promotions.filter(p => {
        const endDate = new Date(p.endDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
      });

      const averageMargin = analysis.length > 0 
        ? analysis.reduce((sum, a) => sum + a.profitMargin, 0) / analysis.length 
        : 0;

      const lowMargin = analysis.filter(a => a.profitMargin < 15);

      setStats({
        totalCategories: categories.length,
        activePromotions: promotions.length,
        priceChangesToday: changesToday.length,
        averageMargin,
        lowMarginProducts: lowMargin.length,
        expiringPromotions: expiringPromotions.length
      });

      // Procesar cambios recientes
      const recentChangesData = history.slice(0, 5).map(h => ({
        productId: h.productId,
        productName: (h as any).Product?.name || 'Producto',
        oldPrice: h.oldSalePrice || 0,
        newPrice: h.newSalePrice || 0,
        changePercent: h.oldSalePrice 
          ? ((h.newSalePrice || 0) - (h.oldSalePrice || 0)) / (h.oldSalePrice || 0) * 100
          : 0,
        changedAt: h.changedAt
      }));

      setRecentChanges(recentChangesData);

      // Procesar productos con margen bajo
      const lowMarginData = lowMargin.map(a => ({
        productId: a.productId,
        productName: (a as any).Product?.name || 'Producto',
        costPrice: a.costPrice,
        salePrice: a.salePrice,
        profitMargin: a.profitMargin,
        categoryName: 'Categoría' // TODO: Obtener nombre de categoría
      }));

      setLowMarginProducts(lowMarginData.slice(0, 5));

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard de precios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
            <button 
              onClick={loadDashboardData}
              className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Precios</h1>
          <p className="mt-2 text-gray-600">
            Dashboard para administrar precios, utilidades y promociones
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Categorías Configuradas */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">🏷️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categorías Configuradas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCategories}</p>
              </div>
            </div>
          </div>

          {/* Promociones Activas */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">📈</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Promociones Activas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activePromotions}</p>
              </div>
            </div>
          </div>

          {/* Cambios Hoy */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">⏰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cambios Hoy</p>
                <p className="text-2xl font-bold text-gray-900">{stats.priceChangesToday}</p>
              </div>
            </div>
          </div>

          {/* Margen Promedio */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Margen Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPercentage(stats.averageMargin)}
                </p>
              </div>
            </div>
          </div>

          {/* Productos Margen Bajo */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Margen Bajo (&lt;15%)</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lowMarginProducts}</p>
              </div>
            </div>
          </div>

          {/* Promociones por Vencer */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <span className="text-2xl">📉</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Promociones por Vencer</p>
                <p className="text-2xl font-bold text-gray-900">{stats.expiringPromotions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cambios Recientes */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Cambios Recientes</h3>
            </div>
            <div className="p-6">
              {recentChanges.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No hay cambios recientes</p>
              ) : (
                <div className="space-y-4">
                  {recentChanges.map((change, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{change.productName}</p>
                        <p className="text-sm text-gray-500">
                          {formatPrice(change.oldPrice)} → {formatPrice(change.newPrice)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          change.changePercent >= 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {change.changePercent >= 0 ? '+' : ''}{change.changePercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Productos con Margen Bajo */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Margen Bajo</h3>
            </div>
            <div className="p-6">
              {lowMarginProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No hay productos con margen bajo</p>
              ) : (
                <div className="space-y-4">
                  {lowMarginProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{product.productName}</p>
                        <p className="text-sm text-gray-500">{product.categoryName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600">
                          {formatPercentage(product.profitMargin)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatPrice(product.costPrice)} → {formatPrice(product.salePrice)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap gap-4">
          <a 
            href="/dashboard/pricing/products"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
          >
            <span className="mr-2">💰</span>
            Configurar Productos
          </a>
          <a 
            href="/dashboard/pricing/categories"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center"
          >
            <span className="mr-2">🏷️</span>
            Utilidades por Categoría
          </a>
          <a 
            href="/dashboard/pricing/promotions"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center"
          >
            <span className="mr-2">📈</span>
            Promociones
          </a>
          <button className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors inline-flex items-center">
            <span className="mr-2">⏰</span>
            Historial Completo
          </button>
        </div>
      </div>
    </div>
  );
}
