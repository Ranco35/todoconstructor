'use client';

import { MultiBudgetManagement } from './multi-budget-management';

interface BudgetManagementProps {
  leadId: number;
  leadTitle: string;
  clientId?: number;
  onBudgetUpdate?: () => void;
}

export function BudgetManagement({ leadId, leadTitle, clientId, onBudgetUpdate }: BudgetManagementProps) {
  return (
    <MultiBudgetManagement 
      leadId={leadId} 
      onBudgetUpdated={onBudgetUpdate} 
    />
  );
}
