'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Hash } from 'lucide-react';

interface BudgetSectionLineProps {
  tempId: string;
  sectionTitle: string;
  onUpdate: (tempId: string, field: string, value: any) => void;
  onRemove: (tempId: string) => void;
}

export default function BudgetSectionLine({ tempId, sectionTitle, onUpdate, onRemove }: BudgetSectionLineProps) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
      <Hash className="w-4 h-4 text-emerald-600 flex-shrink-0" />
      <Input
        value={sectionTitle}
        onChange={(e) => onUpdate(tempId, 'sectionTitle', e.target.value)}
        placeholder="Nombre de la seccion (ej: Materiales de Construccion)"
        className="border-0 bg-transparent font-semibold text-gray-800 text-base focus:ring-0 focus:border-0 px-0"
      />
      <Button
        type="button"
        onClick={() => onRemove(tempId)}
        variant="ghost"
        size="sm"
        className="text-gray-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
