'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, EyeOff, Eye } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  icon?: React.ReactNode;
  variant?: 'default' | 'compact';
  className?: string;
}

export default function CollapsibleSection({
  title,
  children,
  defaultExpanded = true,
  icon,
  variant = 'default',
  className = ''
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`border border-gray-200 rounded-lg bg-white shadow-sm ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 ${
          variant === 'compact' ? 'py-2' : 'py-3'
        }`}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-gray-600">{icon}</span>}
          <span className={`font-medium text-gray-900 ${
            variant === 'compact' ? 'text-sm' : 'text-base'
          }`}>
            {title}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {!isExpanded && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <EyeOff className="w-3 h-3" />
              Oculto
            </span>
          )}
          {isExpanded && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Eye className="w-3 h-3" />
              Visible
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </button>
      
      {isExpanded && (
        <div className={`px-4 pb-4 border-t border-gray-100 ${
          variant === 'compact' ? 'pt-2' : 'pt-3'
        }`}>
          {children}
        </div>
      )}
    </div>
  );
} 