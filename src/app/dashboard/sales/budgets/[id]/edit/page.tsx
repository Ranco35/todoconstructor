'use client';

import React, { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function BudgetEditRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const budgetId = resolvedParams.id;

  useEffect(() => {
    // Redireccionar automáticamente a la ruta correcta
    router.replace(`/dashboard/sales/budgets/edit/${budgetId}`);
  }, [budgetId, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600 text-lg">Redirigiendo a edición...</p>
        <p className="text-gray-400 text-sm mt-2">
          Te estamos llevando a la página correcta de edición
        </p>
      </div>
    </div>
  );
} 