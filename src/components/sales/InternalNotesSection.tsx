'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit3, Save, X, Lock, AlertCircle } from 'lucide-react';
import { updateBudgetInternalNotes } from '@/actions/sales/budgets/update';
import { toast } from 'sonner';

interface InternalNotesSectionProps {
  budgetId: number;
  initialNotes: string;
  userRole?: string; // Para verificar permisos
}

export default function InternalNotesSection({ 
  budgetId, 
  initialNotes, 
  userRole = 'USER' 
}: InternalNotesSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(initialNotes || '');
  const [isSaving, setIsSaving] = useState(false);

  // Verificar si el usuario tiene permisos para editar notas internas
  const canEdit = ['ADMIN', 'JEFE_SECCION', 'RECEPCIONISTA'].includes(userRole);

  const handleEdit = () => {
    if (!canEdit) {
      toast.error('No tienes permisos para editar notas internas');
      return;
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setNotes(initialNotes || '');
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!canEdit) {
      toast.error('No tienes permisos para editar notas internas');
      return;
    }

    setIsSaving(true);
    
    try {
      const result = await updateBudgetInternalNotes(budgetId, notes);
      
      if (result.success) {
        toast.success('Notas internas actualizadas correctamente');
        setIsEditing(false);
      } else {
        toast.error(result.error || 'Error al actualizar las notas internas');
        setNotes(initialNotes || ''); // Revertir cambios
      }
    } catch (error) {
      console.error('Error al guardar notas internas:', error);
      toast.error('Error inesperado al guardar las notas');
      setNotes(initialNotes || ''); // Revertir cambios
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-red-600" />
            Notas Internas del Presupuesto
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="bg-red-100 text-red-800">
              🔒 Solo Personal Interno
            </Badge>
            {!isEditing && (
              <Button
                onClick={handleEdit}
                size="sm"
                variant="outline"
                className="border-red-300 hover:bg-red-100"
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Editar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3 p-3 bg-red-100 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">
              ⚠️ Estas notas son CONFIDENCIALES - NO se envían a clientes en emails ni PDFs
            </span>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Escribe notas internas sobre el presupuesto, seguimiento del cliente, observaciones del equipo, etc..."
              rows={6}
              className="border-red-300 focus:border-red-500 focus:ring-red-500"
            />
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {notes.length} caracteres
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  size="sm"
                  disabled={isSaving}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 mr-1 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1" />
                      Guardar Notas
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {notes ? (
              <div className="bg-white p-4 rounded-lg border border-red-200 min-h-[100px]">
                <pre className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
                  {notes}
                </pre>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-lg border border-red-200 min-h-[100px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Edit3 className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  <p>No hay notas internas para este presupuesto</p>
                  <p className="text-xs mt-1">Haz clic en "Editar" para agregar notas</p>
                </div>
              </div>
            )}
            
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Última actualización: {new Date().toLocaleDateString('es-CL')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 