'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import BudgetTable from '@/components/sales/BudgetTable';
import type { Budget } from '@/types/ventas/budget';

export default function BudgetsListPage() {
  const router = useRouter();
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const handleView = (budget: Budget): void => {
    // Navegar al detalle del presupuesto
    router.push(`/dashboard/sales/budgets/${budget.id}`);
  };

  const handleEdit = (budget: Budget): void => {
    // Navegar a la edición del presupuesto
    router.push(`/dashboard/sales/budgets/${budget.id}/edit`);
  };

  const handleDelete = async (budget: Budget): Promise<void> => {
    const confirmed = confirm(`¿Está seguro de que desea eliminar el presupuesto ${budget.number}?`);
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/sales/budgets/${budget.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Recargar la tabla (esto se podría mejorar con un refresh callback)
        window.location.reload();
      } else {
        alert(result.error || 'Error al eliminar el presupuesto.');
      }
    } catch (error) {
      alert('Error de conexión. Intente nuevamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navegación */}
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <div>
                  <a href="/dashboard" className="text-gray-400 hover:text-gray-500">
                    Dashboard
                  </a>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <a href="/dashboard/sales" className="ml-4 text-gray-400 hover:text-gray-500">
                    Ventas
                  </a>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-4 text-gray-500">Presupuestos</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Tabla de presupuestos */}
        <BudgetTable
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
} 