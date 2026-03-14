'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { BudgetTemplate, BudgetTemplateCategory } from '@/types/ventas/budget-template';

interface BudgetTemplatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: BudgetTemplate) => void;
}

const TABS: { key: BudgetTemplateCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'pintura', label: 'Pintura' },
  { key: 'plomeria', label: 'Plomeria' },
  { key: 'electricidad', label: 'Electricidad' },
  { key: 'construccion', label: 'Construccion' },
];

export default function BudgetTemplatePicker({ open, onOpenChange, onSelect }: BudgetTemplatePickerProps) {
  const [templates, setTemplates] = useState<BudgetTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<BudgetTemplateCategory | 'all'>('all');

  useEffect(() => {
    if (open && templates.length === 0) {
      setLoading(true);
      fetch('/api/sales/budgets/templates')
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            setTemplates(data.templates.filter((t: BudgetTemplate) => t.category !== 'custom'));
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, templates.length]);

  const filtered = templates.filter(t => tab === 'all' || t.category === tab);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Seleccionar Plantilla</DialogTitle>
          <DialogDescription>Elige una plantilla para precargar las lineas del presupuesto</DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {TABS.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Templates */}
        {loading ? (
          <div className="text-center py-8 text-gray-500 text-sm">Cargando plantillas...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">No hay plantillas en esta categoria</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
            {filtered.map(template => {
              const productCount = template.linesTemplate.filter(l => l.displayType === 'product').length;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    onSelect(template);
                    onOpenChange(false);
                  }}
                  className="bg-white border border-gray-200 hover:border-blue-400 rounded-lg p-4 text-left transition-all hover:shadow-sm group"
                >
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-xl">{template.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-gray-900 group-hover:text-blue-700 truncate text-sm transition-colors">
                        {template.name}
                      </h5>
                      <span className="text-xs text-gray-400">
                        {productCount} {productCount === 1 ? 'producto' : 'productos'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{template.description}</p>
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
