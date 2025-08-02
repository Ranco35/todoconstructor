import React from 'react';
import POSCategoryManager from '@/components/pos/POSCategoryManager';

export default function POSCategoriesPage() {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          🏪 Gestión de Categorías POS
        </h1>
        <p className="text-slate-600">
          Administra las categorías de productos para el punto de venta (TPV). 
          Organiza tus productos en categorías para facilitar las ventas en restaurante y recepción.
        </p>
      </div>
      
      <POSCategoryManager />
    </div>
  );
} 