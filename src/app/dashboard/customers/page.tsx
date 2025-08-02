import React from 'react';
import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { redirect } from 'next/navigation';
import CustomersClientComponent from './CustomersClientComponent';

// Marcar como página dinámica para evitar errores en build
export const dynamic = 'force-dynamic';

export default async function CustomersDashboardPage() {
  // Verificar autenticación
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  return <CustomersClientComponent />;
} 