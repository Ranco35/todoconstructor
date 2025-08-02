'use client';

import { formatCurrency } from '@/utils/currency';

interface StatsCardProps {
  icon: string;
  title: string;
  value: string;
  color: string;
  subtitle?: string;
}

function StatsCard({ icon, title, value, color, subtitle }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color}`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface DashboardStatsProps {
  salesStats: {
    revenueToday: number;
  };
  posStats: {
    totalSalesToday: number;
    revenueToday: number;
  };
  purchaseStats: {
    spentToday: number;
    totalOrders: number;
  };
}

export default function DashboardStats({ salesStats, posStats, purchaseStats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <StatsCard
        icon="📊"
        title="Reservas Hoy"
        value="12"
        color="bg-blue-100 text-blue-600"
      />
      
      <StatsCard
        icon="💰"
        title="Recaudado Hoy"
        value={formatCurrency(salesStats.revenueToday)}
        color="bg-green-100 text-green-600"
      />
      
      <StatsCard
        icon="👥"
        title="Clientes Activos"
        value="486"
        color="bg-purple-100 text-purple-600"
      />
      
      <StatsCard
        icon="🛒"
        title="POS Ventas Hoy"
        value={posStats.totalSalesToday.toString()}
        color="bg-cyan-100 text-cyan-600"
        subtitle={formatCurrency(posStats.revenueToday)}
      />
      
      <StatsCard
        icon="📦"
        title="Gastos Hoy"
        value={formatCurrency(purchaseStats.spentToday)}
        color="bg-teal-100 text-teal-600"
        subtitle={`${purchaseStats.totalOrders} órdenes`}
      />
    </div>
  );
} 