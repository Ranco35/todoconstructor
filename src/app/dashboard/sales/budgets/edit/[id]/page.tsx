'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BudgetForm from '@/components/sales/BudgetForm';
import { getBudgetForEdit } from '@/actions/sales/budgets/get';
import { updateBudget, type BudgetUpdateData } from '@/actions/sales/budgets/update';

export default function EditBudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const budgetId = parseInt(resolvedParams.id);

  const [budgetData, setBudgetData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (budgetId && !isNaN(budgetId)) {
      loadBudget();
    } else {
      setError('ID de presupuesto inválido');
      setLoading(false);
    }
  }, [budgetId]);

  const loadBudget = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getBudgetForEdit(budgetId);
      
      if (result.success && result.data) {
        setBudgetData(result.data);
      } else {
        setError(result.error || 'Error al cargar el presupuesto');
      }
    } catch (err) {
      setError('Error inesperado al cargar el presupuesto');
      console.error('Error cargando presupuesto para edición:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: any): Promise<void> => {
    try {
      // Preparar datos para la actualización
      const updateData: BudgetUpdateData = {
        clientId: formData.clientId,
        expirationDate: formData.expirationDate,
        paymentTerms: formData.paymentTerms,
        currency: formData.currency,
        notes: formData.notes,
        total: formData.total,
        lines: formData.lines.map((line: any) => ({
          id: line.id,
          tempId: line.tempId,
          productId: line.productId,
          productName: line.productName,
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountPercent: line.discountPercent,
          subtotal: line.subtotal,
        })),
      };

      console.log('🎯 Actualizando presupuesto:', updateData);
      
      const result = await updateBudget(budgetId, updateData);
      
      if (result.success) {
        console.log('✅ Presupuesto actualizado exitosamente');
        
        // Redireccionar al detalle del presupuesto
        router.push(`/dashboard/sales/budgets/${budgetId}`);
      } else {
        throw new Error(result.error || 'Error al actualizar el presupuesto');
      }
    } catch (error) {
      console.error('❌ Error actualizando presupuesto:', error);
      throw error; // Re-lanzar para que BudgetForm lo maneje
    }
  };

  const handleCancel = (): void => {
    // Volver al detalle del presupuesto
    router.push(`/dashboard/sales/budgets/${budgetId}`);
  };

  // Loading simple
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 text-lg">Cargando presupuesto...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error simple
  if (error || !budgetData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto py-20 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar presupuesto</h2>
            <p className="text-gray-600 mb-6">{error || 'Presupuesto no encontrado'}</p>
            <div className="space-x-4">
              <Button onClick={loadBudget} variant="outline">
                Reintentar
              </Button>
              <Button onClick={() => router.push('/dashboard/sales/budgets')}>
                Volver a Presupuestos
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Formato igual al de creación
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navegación simple */}
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
                  <span className="ml-4 text-gray-500">Editar Presupuesto</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Formulario igual que en creación */}
        <BudgetForm 
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          initialData={budgetData}
          isEditing={true}
        />
      </div>
    </div>
  );
} 