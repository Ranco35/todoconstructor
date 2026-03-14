'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { BudgetTemplateCategory } from '@/types/ventas/budget-template';

interface BudgetSaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (mode: 'create' | 'update', name?: string, category?: BudgetTemplateCategory) => void;
  saving: boolean;
  activeTemplateName?: string;
  activeTemplateId?: number | null;
}

export default function BudgetSaveTemplateDialog({
  open,
  onOpenChange,
  onSave,
  saving,
  activeTemplateName,
  activeTemplateId,
}: BudgetSaveTemplateDialogProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<BudgetTemplateCategory>('pintura');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Guardar como Plantilla</DialogTitle>
          <DialogDescription>Guarda este presupuesto como plantilla reutilizable</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Update existing template option */}
          {activeTemplateId && activeTemplateName && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 mb-2">
                Actualizar <strong>&quot;{activeTemplateName}&quot;</strong>
              </p>
              <Button
                type="button"
                onClick={() => onSave('update')}
                disabled={saving}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? 'Actualizando...' : 'Actualizar Plantilla'}
              </Button>
            </div>
          )}

          {/* Create new template */}
          <div>
            {activeTemplateId && (
              <p className="text-sm text-gray-500 mb-2">O crear una nueva:</p>
            )}
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-700">Nombre</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Kit Pintura Interior, Pack Plomeria Bano..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Categoria</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as BudgetTemplateCategory)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pintura">Pintura</SelectItem>
                    <SelectItem value="plomeria">Plomeria</SelectItem>
                    <SelectItem value="electricidad">Electricidad</SelectItem>
                    <SelectItem value="construccion">Construccion</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => onSave('create', name, category)}
            disabled={saving || !name.trim()}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            {saving ? 'Guardando...' : 'Crear Plantilla'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
