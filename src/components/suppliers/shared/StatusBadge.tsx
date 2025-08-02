import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'suspended' | 'blacklisted' | 'prospect';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export default function StatusBadge({ 
  status, 
  className,
  size = 'md',
  showIcon = true
}: StatusBadgeProps) {
  const statusConfig = {
    active: {
      label: 'Activo',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: '✅'
    },
    inactive: {
      label: 'Inactivo',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: '⏸️'
    },
    suspended: {
      label: 'Suspendido',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: '⚠️'
    },
    blacklisted: {
      label: 'Lista Negra',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: '🚫'
    },
    prospect: {
      label: 'Prospecto',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: '👁️'
    }
  };

  const config = statusConfig[status];
  
  if (!config) {
    return (
      <Badge variant="outline" className={cn("text-xs", className)}>
        {status}
      </Badge>
    );
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2"
  };

  return (
    <Badge 
      className={cn(
        config.color,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  );
}

// Componente para mostrar el estado con indicador de punto
export function StatusIndicator({ 
  status, 
  className 
}: { 
  status: 'active' | 'inactive' | 'suspended' | 'blacklisted' | 'prospect';
  className?: string;
}) {
  const colors = {
    active: 'bg-green-500',
    inactive: 'bg-gray-500',
    suspended: 'bg-yellow-500',
    blacklisted: 'bg-red-500',
    prospect: 'bg-blue-500'
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className={cn(
        "w-2 h-2 rounded-full",
        colors[status]
      )} />
      <StatusBadge status={status} showIcon={false} size="sm" />
    </div>
  );
}

// Componente para mostrar el estado con tooltip
export function StatusWithTooltip({ 
  status, 
  className,
  tooltip 
}: { 
  status: 'active' | 'inactive' | 'suspended' | 'blacklisted' | 'prospect';
  className?: string;
  tooltip?: string;
}) {
  return (
    <div className="group relative inline-block">
      <StatusBadge status={status} className={className} />
      {tooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
} 