import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SupplierRank, RANK_BADGES } from '@/constants/supplier';
import { cn } from '@/lib/utils';

interface RankBadgeProps {
  rank: SupplierRank;
  showPoints?: boolean;
  points?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function RankBadge({ 
  rank, 
  showPoints = false, 
  points, 
  className,
  size = 'md'
}: RankBadgeProps) {
  const config = RANK_BADGES[rank];
  
  if (!config) {
    return (
      <Badge variant="outline" className={cn("text-xs", className)}>
        {rank}
      </Badge>
    );
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2"
  };

  return (
    <div className="flex items-center space-x-1">
      <Badge 
        className={cn(
          config.color,
          sizeClasses[size],
          className
        )}
      >
        {config.label}
      </Badge>
      
      {showPoints && points !== undefined && (
        <span className={cn(
          "text-xs text-gray-500",
          size === 'sm' && "text-xs",
          size === 'md' && "text-sm",
          size === 'lg' && "text-base"
        )}>
          ({points} pts)
        </span>
      )}
    </div>
  );
}

// Componente para mostrar el ranking con iconos específicos
export function RankIcon({ rank, className }: { rank: SupplierRank; className?: string }) {
  const icons = {
    [SupplierRank.BASICO]: '🔄',
    [SupplierRank.REGULAR]: '⚠️',
    [SupplierRank.BUENO]: '✅',
    [SupplierRank.EXCELENTE]: '🌟',
    [SupplierRank.PART_TIME]: '⏰',
    [SupplierRank.PREMIUM]: '🔥',
  };

  return (
    <span className={cn("text-lg", className)}>
      {icons[rank] || '🏆'}
    </span>
  );
}

// Componente para mostrar el progreso del ranking
export function RankProgress({ 
  currentPoints, 
  nextRankPoints, 
  className 
}: { 
  currentPoints: number; 
  nextRankPoints: number; 
  className?: string;
}) {
  const progress = Math.min((currentPoints / nextRankPoints) * 100, 100);
  
  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{currentPoints} pts</span>
        <span>{nextRankPoints} pts</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-amber-400 to-yellow-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
} 