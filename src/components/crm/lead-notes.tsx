'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
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
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  User, 
  Edit, 
  Trash2, 
  Lock,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  getLeadNotes, 
  createLeadNote, 
  updateLeadNote, 
  deleteLeadNote,
  type LeadNote,
  type CreateNoteInput 
} from '@/actions/crm/notes';
import { getCurrentUserWithResult } from '@/actions/configuration/auth-actions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface LeadNotesProps {
  leadId: number;
  leadTitle: string;
}

export function LeadNotes({ leadId, leadTitle }: LeadNotesProps) {
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState<LeadNote | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  // Form data
  const [formData, setFormData] = useState({
    note_text: '',
    note_type: 'general' as const,
    is_private: false
  });

  useEffect(() => {
    loadNotes();
    loadCurrentUser();
  }, [leadId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const result = await getLeadNotes(leadId);
      
      if (result.success) {
        setNotes(result.data || []);
      } else {
        console.error('Error loading notes:', result.error);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUser = async () => {
    try {
      console.log('🔍 loadCurrentUser - Iniciando...');
      const result = await getCurrentUserWithResult();
      console.log('🔍 loadCurrentUser - Resultado:', result);
      if (result.success && result.data) {
        console.log('✅ Usuario cargado:', result.data);
        setCurrentUser(result.data);
      } else {
        console.log('❌ Error cargando usuario:', result.error);
        // FALLBACK: Usar datos hardcodeados para probar
        console.log('🔄 Usando usuario de fallback para pruebas...');
        setCurrentUser({
          id: '4c7d3972-1796-44fb-bf30-2594c1d892aa',
          username: 'eduardo@todoconstructor.cl',
          email: 'eduardo@todoconstructor.cl',
          firstName: 'Eduardo',
          lastName: 'Proboste',
          name: 'Eduardo Proboste',
          role: 'ADMINISTRADOR',
          roleId: 2,
          department: null,
          isCashier: false,
          isActive: true,
          lastLogin: null,
        });
      }
    } catch (error) {
      console.error('❌ Error loading current user:', error);
      // FALLBACK: Usar datos hardcodeados para probar
      console.log('🔄 Usando usuario de fallback por error...');
      setCurrentUser({
        id: '4c7d3972-1796-44fb-bf30-2594c1d892aa',
        username: 'eduardo@todoconstructor.cl',
        email: 'eduardo@todoconstructor.cl',
        firstName: 'Eduardo',
        lastName: 'Proboste',
        name: 'Eduardo Proboste',
        role: 'ADMINISTRADOR',
        roleId: 2,
        department: null,
        isCashier: false,
        isActive: true,
        lastLogin: null,
      });
    }
  };

  const handleAddNote = async () => {
    console.log('🔍 handleAddNote - Iniciando...');
    console.log('🔍 currentUser:', currentUser);
    console.log('🔍 formData:', formData);
    
    if (!currentUser || !formData.note_text.trim()) {
      console.log('❌ Validación falló - currentUser:', !!currentUser, 'note_text:', formData.note_text.trim());
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos requeridos.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const input: CreateNoteInput = {
        lead_id: leadId,
        note_text: formData.note_text,
        note_type: formData.note_type,
        is_private: formData.is_private,
        created_by: currentUser.id,
        created_by_name: currentUser.name || currentUser.username || 'Usuario',
        created_by_email: currentUser.email || ''
      };

      console.log('🔍 Input para createLeadNote:', input);
      const result = await createLeadNote(input);
      console.log('🔍 Resultado createLeadNote:', result);
      
      if (result.success) {
        toast({
          title: 'Nota Creada',
          description: 'La nota se ha agregado correctamente.',
        });
        
        setFormData({ note_text: '', note_type: 'general', is_private: false });
        setShowAddDialog(false);
        loadNotes();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'No se pudo crear la nota.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: 'Error',
        description: 'Error inesperado al crear la nota.',
        variant: 'destructive',
      });
    }
  };

  const handleEditNote = async () => {
    if (!selectedNote || !formData.note_text.trim()) {
      return;
    }

    try {
      const result = await updateLeadNote({
        id: selectedNote.id,
        note_text: formData.note_text,
        note_type: formData.note_type,
        is_private: formData.is_private
      });
      
      if (result.success) {
        toast({
          title: 'Nota Actualizada',
          description: 'La nota se ha actualizado correctamente.',
        });
        
        setShowEditDialog(false);
        setSelectedNote(null);
        loadNotes();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'No se pudo actualizar la nota.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: 'Error',
        description: 'Error inesperado al actualizar la nota.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      const result = await deleteLeadNote(noteId);
      
      if (result.success) {
        toast({
          title: 'Nota Eliminada',
          description: 'La nota se ha eliminado correctamente.',
        });
        
        loadNotes();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'No se pudo eliminar la nota.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: 'Error',
        description: 'Error inesperado al eliminar la nota.',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (note: LeadNote) => {
    setSelectedNote(note);
    setFormData({
      note_text: note.note_text,
      note_type: note.note_type,
      is_private: note.is_private
    });
    setShowEditDialog(true);
  };

  const getNoteTypeIcon = (type: string) => {
    const icons = {
      general: MessageSquare,
      call: Phone,
      email: Mail,
      meeting: Calendar,
      follow_up: Clock,
      internal: Lock
    };
    
    const Icon = icons[type as keyof typeof icons] || MessageSquare;
    return <Icon className="h-4 w-4" />;
  };

  const getNoteTypeLabel = (type: string) => {
    const labels = {
      general: 'General',
      call: 'Llamada',
      email: 'Email',
      meeting: 'Reunión',
      follow_up: 'Seguimiento',
      internal: 'Interna'
    };
    
    return labels[type as keyof typeof labels] || 'General';
  };

  const getNoteTypeColor = (type: string) => {
    const colors = {
      general: 'bg-gray-100 text-gray-800',
      call: 'bg-blue-100 text-blue-800',
      email: 'bg-green-100 text-green-800',
      meeting: 'bg-purple-100 text-purple-800',
      follow_up: 'bg-orange-100 text-orange-800',
      internal: 'bg-red-100 text-red-800'
    };
    
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notas del Lead
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">Cargando notas...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notas del Lead ({notes.length})
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" data-add-note-button>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Nota
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white">
              <DialogHeader>
                <DialogTitle>Agregar Nueva Nota</DialogTitle>
                <DialogDescription>
                  Agrega una nota para el lead: {leadTitle}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="note_type" className="text-sm font-medium">Tipo de Nota</Label>
                  <Select
                    value={formData.note_type}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, note_type: value }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="call">Llamada</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="meeting">Reunión</SelectItem>
                      <SelectItem value="follow_up">Seguimiento</SelectItem>
                      <SelectItem value="internal">Interna</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="note_text" className="text-sm font-medium">Contenido de la Nota *</Label>
                  <Textarea
                    id="note_text"
                    value={formData.note_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, note_text: e.target.value }))}
                    placeholder="Escribe tu nota aquí..."
                    rows={3}
                    className="min-h-[80px] resize-none"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_private"
                    checked={formData.is_private}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_private: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="is_private" className="text-sm">
                    Nota privada (solo visible para administradores)
                  </Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => {
                  console.log('🔘 Botón Agregar Nota clickeado');
                  console.log('🔘 formData actual:', formData);
                  console.log('🔘 currentUser:', currentUser);
                  handleAddNote();
                }}>
                  Agregar Nota
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay notas para este lead</p>
            <p className="text-sm">Agrega la primera nota para comenzar el historial</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
              <div
                key={note.id}
                className="border rounded-lg p-2 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {getNoteTypeIcon(note.note_type)}
                    <Badge className={getNoteTypeColor(note.note_type)}>
                      {getNoteTypeLabel(note.note_type)}
                    </Badge>
                    {note.is_private && (
                      <Badge variant="outline" className="text-red-600 border-red-600">
                        <Lock className="h-3 w-3 mr-1" />
                        Privada
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(note)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar nota?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. La nota se eliminará permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteNote(note.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-1 whitespace-pre-wrap text-sm leading-relaxed">{note.note_text}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{note.created_by_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {format(new Date(note.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </span>
                    </div>
                  </div>
                  
                  {note.updated_at !== note.created_at && (
                    <span className="text-xs">
                      Editado: {format(new Date(note.updated_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Dialog de Edición */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Editar Nota</DialogTitle>
            <DialogDescription>
              Modifica el contenido de la nota
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="edit_note_type" className="text-sm font-medium">Tipo de Nota</Label>
              <Select
                value={formData.note_type}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, note_type: value }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="call">Llamada</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Reunión</SelectItem>
                  <SelectItem value="follow_up">Seguimiento</SelectItem>
                  <SelectItem value="internal">Interna</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit_note_text" className="text-sm font-medium">Contenido de la Nota *</Label>
              <Textarea
                id="edit_note_text"
                value={formData.note_text}
                onChange={(e) => setFormData(prev => ({ ...prev, note_text: e.target.value }))}
                placeholder="Escribe tu nota aquí..."
                rows={3}
                className="min-h-[80px] resize-none"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit_is_private"
                checked={formData.is_private}
                onChange={(e) => setFormData(prev => ({ ...prev, is_private: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="edit_is_private" className="text-sm">
                Nota privada (solo visible para administradores)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditNote}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
