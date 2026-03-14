'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, StickyNote } from 'lucide-react';

interface BudgetNoteLineProps {
  tempId: string;
  noteText: string;
  onUpdate: (tempId: string, field: string, value: any) => void;
  onRemove: (tempId: string) => void;
}

export default function BudgetNoteLine({ tempId, noteText, onUpdate, onRemove }: BudgetNoteLineProps) {
  return (
    <div className="flex items-start gap-3 bg-amber-50/50 border border-amber-200 rounded-lg px-4 py-3">
      <StickyNote className="w-4 h-4 text-amber-600 flex-shrink-0 mt-2" />
      <Textarea
        value={noteText}
        onChange={(e) => onUpdate(tempId, 'noteText', e.target.value)}
        placeholder="Texto de la nota (ej: Condiciones especiales, instrucciones)"
        rows={2}
        className="border-0 bg-transparent text-gray-700 focus:ring-0 focus:border-0 px-0 resize-none"
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
