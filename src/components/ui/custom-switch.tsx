'use client';

import * as React from 'react';

interface CustomSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  activeColor?: 'green' | 'amber' | 'purple';
  size?: 'sm' | 'md' | 'lg';
}

export default function CustomSwitch({ 
  checked, 
  onCheckedChange, 
  disabled = false,
  activeColor = 'green',
  size = 'md'
}: CustomSwitchProps) {
  const sizeClasses = {
    sm: 'w-10 h-6',
    md: 'w-12 h-7',
    lg: 'w-14 h-8'
  };

  const toggleClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const colorClasses = {
    green: checked ? 'bg-green-500 shadow-green-200' : 'bg-red-400 shadow-red-200',
    amber: checked ? 'bg-amber-500 shadow-amber-200' : 'bg-gray-400 shadow-gray-200',
    purple: checked ? 'bg-purple-500 shadow-purple-200' : 'bg-gray-400 shadow-gray-200'
  };

  const togglePosition = {
    sm: checked ? 'translate-x-4' : 'translate-x-1',
    md: checked ? 'translate-x-5' : 'translate-x-1',
    lg: checked ? 'translate-x-6' : 'translate-x-1'
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      className={`
        relative inline-flex items-center rounded-full transition-all duration-300 ease-in-out
        ${sizeClasses[size]}
        ${colorClasses[activeColor]}
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 hover:scale-105'
        }
        ${checked && activeColor === 'green' && !disabled ? 'shadow-lg shadow-green-300/50 focus:ring-green-200' : ''}
        ${checked && activeColor === 'amber' && !disabled ? 'shadow-lg shadow-amber-300/50 focus:ring-amber-200' : ''}
        ${checked && activeColor === 'purple' && !disabled ? 'shadow-lg shadow-purple-300/50 focus:ring-purple-200' : ''}
        ${!checked && !disabled ? 'focus:ring-gray-200' : ''}
      `}
    >
      <span className="sr-only">Toggle switch</span>
      <span
        className={`
          relative inline-block bg-white rounded-full shadow-lg transform transition-all duration-300 ease-in-out
          ${toggleClasses[size]}
          ${togglePosition[size]}
          ${checked && !disabled ? 'scale-110 shadow-xl' : 'scale-100'}
          ${checked ? 'border-2 border-white/20' : ''}
        `}
      >
        {checked && (
          <>
            <span className={`
              absolute inset-0 rounded-full animate-ping opacity-30
              ${activeColor === 'green' ? 'bg-green-400' : ''}
              ${activeColor === 'amber' ? 'bg-amber-400' : ''}
              ${activeColor === 'purple' ? 'bg-purple-400' : ''}
            `} />
            <span className={`
              absolute inset-1 rounded-full opacity-60
              ${activeColor === 'green' ? 'bg-green-300' : ''}
              ${activeColor === 'amber' ? 'bg-amber-300' : ''}
              ${activeColor === 'purple' ? 'bg-purple-300' : ''}
            `} />
          </>
        )}
      </span>
    </button>
  );
} 