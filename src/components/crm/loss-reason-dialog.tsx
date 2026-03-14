'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { LossReasonCategory } from '@/types/crm';

interface LossReasonDialogProps {
  open: boolean;
  onConfirm: (category: LossReasonCategory, reason: string) => void;
  onCancel: () => void;
  leadTitle?: string;
}

const LOSS_REASON_CATEGORIES: { value: LossReasonCategory; label: string }[] = [
  { value: 'price', label: 'Precio' },
  { value: 'competitor', label: 'Competencia' },
  { value: 'timing', label: 'Timing' },
  { value: 'no_response', label: 'Sin Respuesta' },
  { value: 'requirements', label: 'Requisitos No Cumplidos' },
  { value: 'other', label: 'Otro' },
];

export function LossReasonDialog({ open, onConfirm, onCancel, leadTitle }: LossReasonDialogProps) {
  const [category, setCategory] = useState<LossReasonCategory | ''>('');
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!category) return;
    onConfirm(category, reason);
    setCategory('');
    setReason('');
  };

  const handleCancel = () => {
    setCategory('');
    setReason('');
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Razón de Pérdida</DialogTitle>
          <DialogDescription>
            {leadTitle
              ? `Indica por qué se perdió el lead "${leadTitle}".`
              : 'Indica la razón por la que se perdió este lead.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="loss-category">Categoría *</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as LossReasonCategory)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {LOSS_REASON_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="loss-reason">Detalle (opcional)</Label>
            <Textarea
              id="loss-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Agrega detalles sobre la razón de pérdida..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!category} className="bg-red-600 hover:bg-red-700">
            Confirmar Pérdida
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
