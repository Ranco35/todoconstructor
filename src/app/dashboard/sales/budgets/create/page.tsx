'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import BudgetForm from '@/components/sales/BudgetForm';
import { createBudget, CreateBudgetInput } from '@/actions/sales/budgets/create';

export default function CreateBudgetPage() {
  const router = useRouter();

  const handleSubmit = async (formData: any): Promise<void> => {
    try {
      // Preparar datos para la API
      const budgetInput: CreateBudgetInput = {
        number: formData.quoteNumber,
        client_id: formData.clientId,
        total: formData.total,
        currency: formData.currency,
        expiration_date: formData.expirationDate,
        notes: formData.notes,
        payment_terms: formData.paymentTerms,
        status: 'draft',
        lines: formData.lines.map((line: any) => ({
          productId: line.productId,
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountPercent: line.discountPercent,
          taxes: [],
          subtotal: line.subtotal,
        })),
      };

      console.log('🎯 Creando presupuesto:', budgetInput);
      
      const result = await createBudget(budgetInput);
      
      if (result.success) {
        console.log('✅ Presupuesto creado exitosamente:', result.data);
        
        // Redireccionar a la lista de presupuestos
        router.push('/dashboard/sales/budgets');
      } else {
        throw new Error(result.error || 'Error al crear el presupuesto');
      }
    } catch (error) {
      console.error('❌ Error creando presupuesto:', error);
      throw error; // Re-lanzar para que BudgetForm lo maneje
    }
  };

  const handleCancel = (): void => {
    // Volver a la lista de presupuestos
    router.push('/dashboard/sales/budgets');
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
                  <a href="/dashboard/sales/budgets" className="ml-4 text-gray-400 hover:text-gray-500">
                    Presupuestos
                  </a>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-4 text-gray-500">Crear Presupuesto</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Formulario */}
        <BudgetForm 
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
} 