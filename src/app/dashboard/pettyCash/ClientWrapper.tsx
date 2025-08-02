'use client';

import React from 'react';
import ClientPettyCashPage from '@/components/petty-cash/ClientPettyCashPage';

interface ClientWrapperProps {
  currentSession: any;
  expenses: any[];
  purchases: any[];
  incomes: any[];
  summary: any;
  closureSummary: any;
  currentUser?: any;
}

export default function ClientWrapper({
  currentSession,
  expenses,
  purchases,
  incomes,
  summary,
  closureSummary,
  currentUser
}: ClientWrapperProps) {
  return (
    <ClientPettyCashPage
      currentSession={currentSession}
      expenses={expenses}
      purchases={purchases}
      incomes={incomes}
      summary={summary}
      closureSummary={closureSummary}
      currentUser={currentUser}
    />
  );
} 