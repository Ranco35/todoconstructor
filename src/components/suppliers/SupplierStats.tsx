'use client';

import React from 'react';
import { SupplierStats as Stats } from '@/types/supplier';
import { RANK_BADGES } from '@/constants/supplier';
import { Badge } from '@/components/ui/badge';

interface SupplierStatsProps {
  stats: Stats;
}

export default function SupplierStats({ stats }: SupplierStatsProps) {
  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de proveedores */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-2xl">🏢</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Proveedores</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        {/* Proveedores activos */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-green-600 text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Activos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-sm text-gray-500">
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% del total
              </p>
            </div>
          </div>
        </div>

        {/* Proveedores inactivos */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <span className="text-red-600 text-2xl">❌</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Inactivos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
              <p className="text-sm text-gray-500">
                {stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0}% del total
              </p>
            </div>
          </div>
        </div>

        {/* Top proveedores */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-green-600 text-lg">✅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {stats.byRank.bueno + stats.byRank.excelente}
              </p>
              <p className="text-sm font-medium text-gray-500">Bueno+</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {stats.total > 0 ? Math.round(((stats.byRank.bueno + stats.byRank.excelente) / stats.total) * 100) : 0}% del total
          </p>
        </div>
      </div>

                {/* Distribución por tipo de proveedor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución por Tipo de proveedor</h3>
          <div className="space-y-4">
            {Object.entries(stats.byRank).map(([rank, count]) => {
              const rankKey = rank.toUpperCase() as keyof typeof RANK_BADGES;
              const config = RANK_BADGES[rankKey];
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              
              return (
                <div key={rank} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${config.color.split(' ')[0]}`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      {config.label.split(' ')[1]} {/* Solo el nombre del tipo */}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${config.color.split(' ')[0]}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500 w-12 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribución por país */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución por País</h3>
          <div className="space-y-3">
            {stats.byCountry.slice(0, 8).map((country) => (
              <div key={country.countryCode} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getCountryFlag(country.countryCode)}</span>
                  <span className="text-sm text-gray-700">{country.countryName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${(country.count / stats.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 w-8 text-right">
                    {country.count}
                  </span>
                </div>
              </div>
            ))}
            {stats.byCountry.length > 8 && (
              <div className="text-sm text-gray-500 text-center pt-2">
                +{stats.byCountry.length - 8} países más
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top proveedores */}
      {stats.topSuppliers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Proveedores</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.topSuppliers.slice(0, 6).map((supplier, index) => {
              const config = RANK_BADGES[supplier.supplierRank];
              
              return (
                <div key={supplier.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      #{index + 1} {supplier.name}
                    </span>
                    <Badge className={`${config.color} text-xs`}>
                      {config.label.split(' ')[1]}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">
                      {supplier.rankPoints} puntos
                    </p>
                    <p className="text-xs text-gray-500">
                      {supplier.totalPurchases} compras
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Función auxiliar para obtener bandera del país
function getCountryFlag(countryCode: string): string {
  const flags: { [key: string]: string } = {
    'CL': '🇨🇱',
    'AR': '🇦🇷',
    'PE': '🇵🇪',
    'CO': '🇨🇴',
    'MX': '🇲🇽',
    'BR': '🇧🇷',
    'US': '🇺🇸',
    'CA': '🇨🇦',
    'ES': '🇪🇸',
    'CN': '🇨🇳',
    'JP': '🇯🇵',
    'DE': '🇩🇪',
    'FR': '🇫🇷',
    'IT': '🇮🇹',
    'UK': '🇬🇧',
  };
  
  return flags[countryCode] || '🌍';
} 