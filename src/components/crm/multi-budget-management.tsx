'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  FileText,
  Star,
  StarOff,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  Calendar,
  User,
  MessageSquare,
  Receipt,
  Trophy,
  Mail,
  Send,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  getBudgetsByLeadId, 
  getUnassignedBudgets, 
  associateBudgetToLead, 
  disassociateBudgetFromLead,
  updateBudgetAssociationNotes,
  setPrimaryBudget
} from '@/actions/crm/budgets';
import { sendBudgetEmail } from '@/actions/sales/budgets/email';
import { updateCRMLead } from '@/actions/crm/leads';
import { createActivity } from '@/actions/crm/activities';
import type { Budget } from '@/types/ventas/budget';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MultiBudgetManagementProps {
  leadId: number;
  onBudgetUpdated?: () => void;
}

interface BudgetWithAssociation extends Budget {
  is_primary?: boolean;
  associated_at?: string;
  associated_by?: string;
  association_notes?: string;
}

export function MultiBudgetManagement({ leadId, onBudgetUpdated }: MultiBudgetManagementProps) {
  const [budgets, setBudgets] = useState<BudgetWithAssociation[]>([]);
  const [unassignedBudgets, setUnassignedBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSendEmailDialog, setShowSendEmailDialog] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<BudgetWithAssociation | null>(null);
  const [notes, setNotes] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [sendEmailTo, setSendEmailTo] = useState('');
  const [sendEmailMessage, setSendEmailMessage] = useState('');
  const [sendEmailIncludePDF, setSendEmailIncludePDF] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBudgets();
  }, [leadId]);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      console.log('🔄 MultiBudgetManagement - Cargando presupuestos para lead:', leadId);
      
      const [budgetsResult, unassignedResult] = await Promise.all([
        getBudgetsByLeadId(leadId),
        getUnassignedBudgets()
      ]);

      console.log('📥 MultiBudgetManagement - Resultado getBudgetsByLeadId:', budgetsResult);
      console.log('📥 MultiBudgetManagement - Resultado getUnassignedBudgets:', unassignedResult);

      if (budgetsResult.success) {
        setBudgets(budgetsResult.data || []);
        console.log('✅ MultiBudgetManagement - Presupuestos cargados:', budgetsResult.data);
      } else {
        console.error('❌ MultiBudgetManagement - Error loading budgets:', budgetsResult.error);
      }

      if (unassignedResult.success) {
        setUnassignedBudgets(unassignedResult.data || []);
      }
    } catch (error) {
      console.error('💥 MultiBudgetManagement - Error loading budgets:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los presupuestos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddBudget = async (budgetId: number) => {
    const { success, error } = await associateBudgetToLead(leadId, budgetId, notes, isPrimary);
    
    if (success) {
      toast({
        title: 'Presupuesto Asociado',
        description: 'El presupuesto se ha asociado correctamente al lead.',
      });
      setShowAddDialog(false);
      setNotes('');
      setIsPrimary(false);
      loadBudgets();
      onBudgetUpdated?.();
    } else {
      toast({
        title: 'Error',
        description: error || 'No se pudo asociar el presupuesto.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveBudget = async (budgetId: number) => {
    const { success, error } = await disassociateBudgetFromLead(leadId, budgetId);
    
    if (success) {
      toast({
        title: 'Presupuesto Desasociado',
        description: 'El presupuesto se ha desasociado del lead.',
      });
      loadBudgets();
      onBudgetUpdated?.();
    } else {
      toast({
        title: 'Error',
        description: error || 'No se pudo desasociar el presupuesto.',
        variant: 'destructive',
      });
    }
  };

  const handleSetPrimary = async (budgetId: number) => {
    const { success, error } = await setPrimaryBudget(leadId, budgetId);
    
    if (success) {
      toast({
        title: 'Presupuesto Principal',
        description: 'El presupuesto se ha marcado como principal.',
      });
      loadBudgets();
      onBudgetUpdated?.();
    } else {
      toast({
        title: 'Error',
        description: error || 'No se pudo marcar como principal.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateNotes = async () => {
    if (!selectedBudget) return;

    const { success, error } = await updateBudgetAssociationNotes(leadId, selectedBudget.id, notes);
    
    if (success) {
      toast({
        title: 'Notas Actualizadas',
        description: 'Las notas se han actualizado correctamente.',
      });
      setShowEditDialog(false);
      setSelectedBudget(null);
      setNotes('');
      loadBudgets();
      onBudgetUpdated?.();
    } else {
      toast({
        title: 'Error',
        description: error || 'No se pudieron actualizar las notas.',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (budget: BudgetWithAssociation) => {
    setSelectedBudget(budget);
    setNotes(budget.association_notes || '');
    setShowEditDialog(true);
  };

  const openSendEmailDialog = (budget: BudgetWithAssociation) => {
    setSelectedBudget(budget);
    setSendEmailTo(budget.client?.email || '');
    setSendEmailMessage('');
    setSendEmailIncludePDF(true);
    setShowSendEmailDialog(true);
  };

  const handleSendBudgetEmail = async () => {
    if (!selectedBudget || !sendEmailTo) return;

    setSendingEmail(true);
    try {
      const result = await sendBudgetEmail({
        budgetId: selectedBudget.id,
        recipientEmail: sendEmailTo,
        customMessage: sendEmailMessage || undefined,
        includePDF: sendEmailIncludePDF,
      });

      if (result.success) {
        toast({ title: 'Presupuesto Enviado', description: result.message });
        setShowSendEmailDialog(false);

        // Registrar actividad de email en el lead
        await createActivity({
          lead_id: leadId,
          type: 'email',
          subject: `Presupuesto ${selectedBudget.number} enviado a ${sendEmailTo}`,
          description: `Se envió el presupuesto ${selectedBudget.number} por email.\nDestinatario: ${sendEmailTo}${sendEmailMessage ? `\nMensaje: ${sendEmailMessage}` : ''}`,
        });

        // Auto-avanzar lead a stage 4 (cotizacion_enviada)
        try {
          await updateCRMLead({ id: leadId, stage_id: 4 });
        } catch {
          // Non-critical, don't block on stage update failure
        }

        loadBudgets();
        onBudgetUpdated?.();
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Error al enviar el presupuesto.', variant: 'destructive' });
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Presupuestos Asociados (0)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">Cargando presupuestos...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Presupuestos Asociados ({budgets.length})
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Agregar Presupuesto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white">
              <DialogHeader>
                <DialogTitle>Agregar Presupuesto al Lead</DialogTitle>
                <DialogDescription>
                  Selecciona un presupuesto para asociar a este lead.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="budget-select">Presupuesto</Label>
                  <select
                    id="budget-select"
                    className="w-full p-2 border rounded-md"
                    onChange={(e) => {
                      const budgetId = parseInt(e.target.value);
                      if (budgetId) {
                        handleAddBudget(budgetId);
                      }
                    }}
                  >
                    <option value="">Seleccionar presupuesto...</option>
                    {unassignedBudgets.map((budget) => (
                      <option key={budget.id} value={budget.id}>
                        {budget.number} - ${budget.total?.toLocaleString()} - {budget.status}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="notes">Notas (opcional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Agregar notas sobre esta asociación..."
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is-primary"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                  />
                  <Label htmlFor="is-primary">Marcar como presupuesto principal</Label>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {budgets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay presupuestos asociados a este lead.</p>
            <p className="text-sm">Usa el botón "Agregar Presupuesto" para asociar uno.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {budgets.map((budget) => (
              <div key={budget.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-lg">{budget.number}</h4>
                      {budget.is_primary && (
                        <Badge variant="default" className="bg-yellow-500 text-white">
                          <Star className="h-3 w-3 mr-1" />
                          Principal
                        </Badge>
                      )}
                      <Badge variant={budget.status === 'accepted' ? 'default' : 'secondary'}>
                        {budget.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>${budget.total?.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {budget.associated_at 
                            ? format(new Date(budget.associated_at), 'dd/MM/yyyy', { locale: es })
                            : 'N/A'
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{budget.associated_by || 'Sistema'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{budget.association_notes ? 'Con notas' : 'Sin notas'}</span>
                      </div>
                    </div>

                    {budget.association_notes && (
                      <div className="bg-blue-50 p-3 rounded-md mb-3">
                        <p className="text-sm text-blue-800">
                          <strong>Notas:</strong> {budget.association_notes}
                        </p>
                      </div>
                    )}

                    {budget.summary && (
                      <p className="text-sm text-gray-600 mb-3">{budget.summary}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {/* Botón para ir a detalle del presupuesto */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/dashboard/sales/budgets/${budget.id}`, '_blank')}
                      title="Ver detalle del presupuesto"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {/* Botón para enviar presupuesto por email */}
                    {(budget.status === 'draft' || budget.status === 'sent') && (
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => openSendEmailDialog(budget)}
                        title="Enviar presupuesto por email al cliente"
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Enviar
                      </Button>
                    )}

                    {/* Botón para facturar si está aceptado */}
                    {budget.status === 'accepted' && (
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => window.location.href = `/dashboard/sales/budgets/${budget.id}`}
                        title="Ir a facturar este presupuesto"
                      >
                        <Receipt className="h-4 w-4 mr-1" />
                        Facturar
                      </Button>
                    )}

                    {/* Botón para marcar como ganador si está enviado */}
                    {budget.status === 'sent' && (
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        onClick={() => window.location.href = `/dashboard/sales/budgets/${budget.id}`}
                        title="Marcar como ganador y aprobar"
                      >
                        <Trophy className="h-4 w-4 mr-1" />
                        Marcar Ganador
                      </Button>
                    )}
                    
                    {!budget.is_primary && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetPrimary(budget.id)}
                        title="Marcar como principal"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(budget)}
                      title="Editar notas"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" title="Desasociar presupuesto">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Desasociar Presupuesto</AlertDialogTitle>
                          <AlertDialogDescription>
                            ¿Estás seguro de que quieres desasociar el presupuesto {budget.number} de este lead?
                            Esta acción no elimina el presupuesto, solo la asociación.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRemoveBudget(budget.id)}>
                            Desasociar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dialog para editar notas */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Notas del Presupuesto</DialogTitle>
              <DialogDescription>
                Actualiza las notas para el presupuesto {selectedBudget?.number}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-notes">Notas</Label>
                <Textarea
                  id="edit-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Agregar o editar notas sobre esta asociación..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateNotes}>
                Actualizar Notas
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para enviar presupuesto por email */}
        <Dialog open={showSendEmailDialog} onOpenChange={setShowSendEmailDialog}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Enviar Presupuesto {selectedBudget?.number}
              </DialogTitle>
              <DialogDescription>
                Envía el presupuesto al cliente por email con el detalle completo.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="send-email-to">Email destinatario</Label>
                <Input
                  id="send-email-to"
                  type="email"
                  value={sendEmailTo}
                  onChange={(e) => setSendEmailTo(e.target.value)}
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="send-email-message">Mensaje personalizado (opcional)</Label>
                <Textarea
                  id="send-email-message"
                  value={sendEmailMessage}
                  onChange={(e) => setSendEmailMessage(e.target.value)}
                  placeholder="Agregar un mensaje personalizado al email..."
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="include-pdf"
                  checked={sendEmailIncludePDF}
                  onChange={(e) => setSendEmailIncludePDF(e.target.checked)}
                />
                <Label htmlFor="include-pdf">Incluir PDF adjunto del presupuesto</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSendEmailDialog(false)} disabled={sendingEmail}>
                Cancelar
              </Button>
              <Button
                onClick={handleSendBudgetEmail}
                disabled={sendingEmail || !sendEmailTo}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sendingEmail ? 'Enviando...' : 'Enviar Presupuesto'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
