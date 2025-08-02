'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FileDown, FileUp, Download, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
// Eliminada importación de Server Action - ahora usa API routes
import { FileUploader } from '@/components/shared/FileUploader';
import EmailDuplicateUnificationModal from './EmailDuplicateUnificationModal';

interface ImportResult {
  success: boolean;
  message: string;
  created: number;
  updated: number;
  errors: string[];
  // Información detallada de clientes procesados
  createdClients?: Array<{
    nombre: string;
    email?: string;
    id: number;
    fila: number;
  }>;
  updatedClients?: Array<{
    nombre: string;
    email?: string;
    id: number;
    fila: number;
    razon: string;
  }>;
  // Nuevos campos para pending updates
  pendingUpdates?: Array<{
    row: number;
    reason: string;
    existingClient: any;
    newClient: any;
  }>;
  // Nuevos campos para emails inválidos
  invalidEmails?: Array<{
    row: number;
    email: string;
    clientData: any;
    reason: string;
  }>;
  // Nuevos campos para emails duplicados
  emailDuplicateGroups?: Array<{
    email: string;
    rows: Array<{
      row: number;
      clientData: any;
    }>;
  }>;
}

interface ClientImportExportProps {
  onImportComplete?: () => void;
}

// Componente para manejar emails inválidos
function InvalidEmailsManager({ 
  invalidEmails, 
  onFix, 
  loading 
}: { 
  invalidEmails: any[]; 
  onFix: (fixedEmails: any[]) => void;
  loading: boolean;
}) {
  const [emailFixes, setEmailFixes] = useState<{ [row: number]: { action: 'skip' | 'fix' | 'create_without_email', newEmail?: string } }>({});

  const handleActionChange = (row: number, action: 'skip' | 'fix' | 'create_without_email') => {
    setEmailFixes(prev => ({
      ...prev,
      [row]: { ...prev[row], action }
    }));
  };

  const handleEmailChange = (row: number, newEmail: string) => {
    setEmailFixes(prev => ({
      ...prev,
      [row]: { ...prev[row], newEmail }
    }));
  };

  const handleApplyFixes = () => {
    const fixes = invalidEmails.map(item => ({
      row: item.row,
      clientData: item.clientData,
      originalEmail: item.email,
      action: emailFixes[item.row]?.action || 'skip',
      newEmail: emailFixes[item.row]?.newEmail || ''
    }));
    onFix(fixes);
  };

  const hasActions = Object.values(emailFixes).some(fix => fix.action !== 'skip');

  return (
    <div className="border border-red-200 rounded-lg p-4 bg-red-50">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h5 className="text-lg font-medium text-red-800 flex items-center gap-2">
            <span className="text-red-600">✉️</span>
            Emails Inválidos Encontrados ({invalidEmails.length})
          </h5>
        </div>
        
        <p className="text-sm text-red-700">
          Se encontraron emails con formato incorrecto. Selecciona qué hacer con cada uno:
        </p>

        <div className="max-h-80 overflow-y-auto space-y-4">
          {invalidEmails.map((item: any) => (
            <div key={item.row} className="border border-red-300 rounded-lg p-3 bg-white">
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium text-gray-800">
                    <span className="text-red-600">Fila Excel:</span> {item.row}
                  </div>
                  <div className="text-gray-600">
                    <span className="font-medium text-red-600">Cliente:</span> {item.clientData.nombrePrincipal} {item.clientData.apellido || ''}
                  </div>
                  <div className="text-red-600">
                    <span className="font-medium">Email problemático:</span> "{item.email}"
                  </div>
                  <div className="text-gray-500 text-xs">
                    {item.reason}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">¿Qué hacer?</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`action-${item.row}`}
                        value="skip"
                        checked={emailFixes[item.row]?.action === 'skip' || !emailFixes[item.row]}
                        onChange={() => handleActionChange(item.row, 'skip')}
                        disabled={loading}
                      />
                      <span className="text-sm">Saltar este cliente (no importar)</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`action-${item.row}`}
                        value="create_without_email"
                        checked={emailFixes[item.row]?.action === 'create_without_email'}
                        onChange={() => handleActionChange(item.row, 'create_without_email')}
                        disabled={loading}
                      />
                      <span className="text-sm">Crear cliente sin email</span>
                    </label>
                    
                    <label className="flex items-start gap-2">
                      <input
                        type="radio"
                        name={`action-${item.row}`}
                        value="fix"
                        checked={emailFixes[item.row]?.action === 'fix'}
                        onChange={() => handleActionChange(item.row, 'fix')}
                        disabled={loading}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <span className="text-sm">Corregir email:</span>
                        <input
                          type="email"
                          className="mt-1 w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder={item.email}
                          value={emailFixes[item.row]?.newEmail || ''}
                          onChange={(e) => handleEmailChange(item.row, e.target.value)}
                          disabled={loading || emailFixes[item.row]?.action !== 'fix'}
                        />
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-red-200">
          <div className="text-sm text-red-700">
            <strong>{Object.values(emailFixes).filter(fix => fix.action !== 'skip').length}</strong> acciones seleccionadas
          </div>
          <Button
            onClick={handleApplyFixes}
            disabled={!hasActions || loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Procesando...
              </>
            ) : (
              'Aplicar Correcciones'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Componente para mostrar y seleccionar pending updates
function PendingUpdatesSelector({ 
  pendingUpdates, 
  onConfirm, 
  loading 
}: { 
  pendingUpdates: any[]; 
  onConfirm: (confirmedUpdates: any[]) => void;
  loading: boolean;
}) {
  const [selected, setSelected] = useState<{ [row: number]: boolean }>({});

  const handleChange = (row: number) => {
    setSelected((prev) => ({ ...prev, [row]: !prev[row] }));
  };

  const handleSelectAll = () => {
    const allSelected = pendingUpdates.every(u => selected[u.row]);
    const newSelected: { [row: number]: boolean } = {};
    if (!allSelected) {
      pendingUpdates.forEach(u => {
        newSelected[u.row] = true;
      });
    }
    setSelected(newSelected);
  };

  const handleConfirm = () => {
    const confirmed = pendingUpdates
      .filter((u: any) => selected[u.row])
      .map((u: any) => ({
        id: u.existingClient.id,
        newData: u.newClient,
      }));
    onConfirm(confirmed);
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h5 className="text-lg font-medium text-orange-800 flex items-center gap-2">
            <span className="text-orange-600">⚠️</span>
            Clientes Duplicados Encontrados ({pendingUpdates.length})
          </h5>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={loading}
          >
            {pendingUpdates.every(u => selected[u.row]) ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
          </Button>
        </div>
        
        <p className="text-sm text-orange-700">
          Se encontraron clientes en el Excel que ya existen en la base de datos. 
          Selecciona cuáles deseas actualizar:
        </p>

        <div className="max-h-80 overflow-y-auto space-y-3">
          {pendingUpdates.map((u: any) => (
            <div key={u.row} className="border border-orange-300 rounded-lg p-3 bg-white">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!selected[u.row]}
                  onChange={() => handleChange(u.row)}
                  disabled={loading}
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <div className="text-sm font-medium text-gray-800">
                    <span className="text-orange-600">Fila Excel:</span> {u.row}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-orange-600">Motivo:</span> {u.reason}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-blue-50 p-2 rounded border">
                      <div className="font-medium text-blue-800 mb-1">📋 Cliente Actual (BD):</div>
                      <div><strong>Nombre:</strong> {u.existingClient.nombrePrincipal} {u.existingClient.apellido || ''}</div>
                      <div><strong>ID:</strong> {u.existingClient.id}</div>
                      {u.existingClient.email && <div><strong>Email:</strong> {u.existingClient.email}</div>}
                      {u.existingClient.rut && <div><strong>RUT:</strong> {u.existingClient.rut}</div>}
                    </div>
                    <div className="bg-green-50 p-2 rounded border">
                      <div className="font-medium text-green-800 mb-1">📝 Datos Nuevos (Excel):</div>
                      <div><strong>Nombre:</strong> {u.newClient.nombrePrincipal} {u.newClient.apellido || ''}</div>
                      {u.newClient.email && <div><strong>Email:</strong> {u.newClient.email}</div>}
                      {u.newClient.rut && <div><strong>RUT:</strong> {u.newClient.rut}</div>}
                      {u.newClient.telefono && <div><strong>Teléfono:</strong> {u.newClient.telefono}</div>}
                    </div>
                  </div>
                </div>
              </label>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-orange-200">
          <div className="text-sm text-orange-700">
            <strong>{selectedCount}</strong> de <strong>{pendingUpdates.length}</strong> seleccionados
          </div>
          <Button
            onClick={handleConfirm}
            disabled={selectedCount === 0 || loading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Actualizando...
              </>
            ) : (
              `Actualizar ${selectedCount} Cliente${selectedCount !== 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ClientImportExport({ onImportComplete }: ClientImportExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [file, setFile] = useState<File | null>(null);
  // Nuevo estado para pending updates
  const [pendingUpdates, setPendingUpdates] = useState<any[]>([]);
  const [applyingUpdates, setApplyingUpdates] = useState(false);
  // Nuevo estado para invalid emails
  const [invalidEmails, setInvalidEmails] = useState<any[]>([]);
  // Nuevo estado para emails duplicados
  const [emailDuplicateGroups, setEmailDuplicateGroups] = useState<any[]>([]);
  const [progress, setProgress] = useState<{ processed: number; total: number; status: string; error?: string } | null>(null);
  const [importId, setImportId] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [localClientCount, setLocalClientCount] = useState<number | null>(null);
  const [progressStage, setProgressStage] = useState<'idle' | 'reading' | 'importing'>('idle');

  // Polling de progreso
  useEffect(() => {
    if (importing && importId) {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/clients/import/progress?id=${importId}`);
          if (res.ok) {
            const data = await res.json();
            setProgress(data);
            if (data.status === 'done' || data.status === 'error') {
              clearInterval(pollingRef.current!);
              pollingRef.current = null;
            }
          }
        } catch (e) {
          // Ignorar errores de polling
        }
      }, 1000);
      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }
  }, [importing, importId]);

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/clients/export', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Error al exportar clientes');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clientes_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Exportación completada exitosamente');
    } catch (error) {
      console.error('Error exportando clientes:', error);
      toast.error('Error al exportar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setImportResult(null);
    setPendingUpdates([]);
    setInvalidEmails([]);
    setEmailDuplicateGroups([]);
    setLocalClientCount(null);
    setProgressStage('idle');
    // Leer el archivo localmente para contar filas
    setProgressStage('reading');
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      let worksheetName = workbook.SheetNames[0];
      for (const sheetName of workbook.SheetNames) {
        if (sheetName.toLowerCase().includes('plantilla') || sheetName.toLowerCase().includes('clientes')) {
          worksheetName = sheetName;
          break;
        }
      }
      const worksheet = workbook.Sheets[worksheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      setLocalClientCount(jsonData.length);
      setProgressStage('idle');
    } catch {
      setLocalClientCount(null);
      setProgressStage('idle');
    }
  };

  const handleFileRemove = () => {
    setFile(null);
    setImportResult(null);
    setPendingUpdates([]);
    setInvalidEmails([]);
    setEmailDuplicateGroups([]);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setProgress(null);
    setImportId(null);
    setProgressStage('importing');
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Mostrar mensaje de inicio de importación
      toast.info('Procesando archivo Excel...');

      // Leer el archivo localmente para contar filas antes de enviar al backend
      const arrayBuffer = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      let worksheetName = workbook.SheetNames[0];
      for (const sheetName of workbook.SheetNames) {
        if (sheetName.toLowerCase().includes('plantilla') || sheetName.toLowerCase().includes('clientes')) {
          worksheetName = sheetName;
          break;
        }
      }
      const worksheet = workbook.Sheets[worksheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      toast.info(`Archivo Excel contiene ${jsonData.length} clientes para importar.`);

      const response = await fetch('/api/clients/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setImportResult(result);
      setImportId(result.importId || null);
      // Si el backend ya terminó muy rápido, setProgress a done
      if (result.importId) {
        setProgress({ processed: result.created + result.updated, total: jsonData.length, status: result.success ? 'done' : 'error' });
      }
      
      // Si hay pending updates, mostrarlos para confirmación
      if (result.pendingUpdates && result.pendingUpdates.length > 0) {
        setPendingUpdates(result.pendingUpdates);
        toast.warning(`Se encontraron ${result.pendingUpdates.length} clientes duplicados que requieren confirmación`);
      } else {
        setPendingUpdates([]);
      }
      
      // Si hay invalid emails, mostrarlos para corrección
      if (result.invalidEmails && result.invalidEmails.length > 0) {
        setInvalidEmails(result.invalidEmails);
        toast.warning(`Se encontraron ${result.invalidEmails.length} emails inválidos que requieren corrección`);
      } else {
        setInvalidEmails([]);
      }
      
      // Si hay emails duplicados, mostrarlos para unificación
      if (result.emailDuplicateGroups && result.emailDuplicateGroups.length > 0) {
        setEmailDuplicateGroups(result.emailDuplicateGroups);
        toast.warning(`Importación parcial: ${result.created} creados, ${result.updated} actualizados. Solo faltan ${result.emailDuplicateGroups.length} grupo(s) de emails duplicados por unificar.`);
      } else {
        setEmailDuplicateGroups([]);
      }
      
      if (result.success && onImportComplete && result.pendingUpdates?.length === 0 && result.invalidEmails?.length === 0 && result.emailDuplicateGroups?.length === 0) {
        onImportComplete();
      }

      if (result.success) {
        let message = '';
        if (result.emailDuplicateGroups && result.emailDuplicateGroups.length > 0) {
          message = `Importación parcial: ${result.created} clientes creados, ${result.updated} actualizados. El resto ya fue importado. Solo faltan ${result.emailDuplicateGroups.length} grupo(s) de emails duplicados por unificar.`;
        } else if (result.pendingUpdates && result.pendingUpdates.length > 0) {
          message = `Importación parcial: ${result.created} creados. ${result.pendingUpdates.length} requieren confirmación.`;
        } else {
          message = `Importación completada: ${result.created} creados, ${result.updated} actualizados.`;
        }
        if (result.invalidEmails && result.invalidEmails.length > 0) {
          message += ` ${result.invalidEmails.length} emails requieren corrección.`;
        }
        toast.success(message);
      } else {
        toast.error(result.error || 'Error durante la importación');
      }
    } catch (error) {
      console.error('Error importando clientes:', error);
      const errorResult = {
        success: false,
        message: 'Error inesperado durante la importación',
        created: 0,
        updated: 0,
        errors: ['Error interno del servidor']
      };
      setImportResult(errorResult);
      setPendingUpdates([]);
      setInvalidEmails([]);
      setEmailDuplicateGroups([]);
      toast.error('Error inesperado durante la importación');
    } finally {
      setImporting(false);
      setImportId(null);
    }
  };

  const handleConfirmUpdates = async (confirmedUpdates: any[]) => {
    setApplyingUpdates(true);
    try {
      const response = await fetch('/api/clients/apply-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: confirmedUpdates }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Actualizar el resultado de importación
        setImportResult(prev => prev ? {
          ...prev,
          updated: (prev.updated || 0) + result.updated,
          message: `${prev.message} + ${result.updated} actualizados confirmados`
        } : null);
        
        // Limpiar pending updates
        setPendingUpdates([]);
        
        toast.success(result.message);
        
        if (onImportComplete) {
          onImportComplete();
        }
      } else {
        toast.error(result.error || 'Error al aplicar actualizaciones');
      }
    } catch (error) {
      console.error('Error aplicando updates:', error);
      toast.error('Error inesperado al aplicar actualizaciones');
    } finally {
      setApplyingUpdates(false);
    }
  };

  const handleFixEmails = async (emailFixes: any[]) => {
    setApplyingUpdates(true);
    try {
      // Filtrar solo las acciones que no sean 'skip'
      const clientsToProcess = emailFixes.filter(fix => fix.action !== 'skip');
      
      if (clientsToProcess.length === 0) {
        toast.info('No se seleccionaron acciones para procesar');
        setInvalidEmails([]);
        setApplyingUpdates(false);
        return;
      }

      // Procesar cada cliente según la acción seleccionada
      const processedClients = clientsToProcess.map(fix => {
        const clientData = { ...fix.clientData };
        
        if (fix.action === 'create_without_email') {
          // Eliminar el email del clientData
          delete clientData.email;
        } else if (fix.action === 'fix' && fix.newEmail) {
          // Reemplazar con el email corregido
          clientData.email = fix.newEmail;
        }
        
        return clientData;
      });

      // Re-importar los clientes procesados
      const response = await fetch('/api/clients/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          clients: processedClients,
          isRetry: true // Flag para indicar que es un reintento
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Actualizar el resultado de importación
        setImportResult(prev => prev ? {
          ...prev,
          created: (prev.created || 0) + result.created,
          updated: (prev.updated || 0) + result.updated,
          message: `${prev.message} + ${result.created} creados adicionales, ${result.updated} actualizados`
        } : null);
        
        // Limpiar invalid emails
        setInvalidEmails([]);
        
        toast.success(`Emails corregidos: ${result.created} clientes creados, ${result.updated} actualizados`);
        
        if (onImportComplete) {
          onImportComplete();
        }
      } else {
        toast.error(result.error || 'Error al procesar emails corregidos');
      }
    } catch (error) {
      console.error('Error procesando emails:', error);
      toast.error('Error inesperado al procesar emails');
    } finally {
      setApplyingUpdates(false);
    }
  };

  const handleEmailUnification = async (unifications: any[]) => {
    setApplyingUpdates(true);
    try {
      const response = await fetch('/api/clients/apply-email-unifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unifications }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Actualizar el resultado de importación
        setImportResult(prev => prev ? {
          ...prev,
          created: (prev.created || 0) + result.created,
          message: `${prev.message} + ${result.created} clientes unificados creados`
        } : null);
        
        // Limpiar email duplicate groups
        setEmailDuplicateGroups([]);
        
        toast.success(`Unificación completada: ${result.created} clientes creados, ${result.skipped} registros omitidos`);
        
        if (onImportComplete) {
          onImportComplete();
        }
      } else {
        toast.error(result.error || 'Error al aplicar unificaciones');
        // No limpiar emailDuplicateGroups en caso de error para que el usuario pueda reintentar
      }
    } catch (error) {
      console.error('Error aplicando unificaciones:', error);
      toast.error('Error inesperado al aplicar unificaciones');
      // No limpiar emailDuplicateGroups en caso de error para que el usuario pueda reintentar
    } finally {
      setApplyingUpdates(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/clients/template');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla_clientes.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error descargando plantilla:', error);
    }
  };

  const resetModal = () => {
    setIsOpen(false);
    setFile(null);
    setImportResult(null);
    setPendingUpdates([]);
    setInvalidEmails([]);
    setEmailDuplicateGroups([]);
    setApplyingUpdates(false);
  };

  return (
    <>
      {/* Botones de acción */}
      <div className="flex gap-2">
        <Button
          onClick={handleExport}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⏳</span>
              Exportando...
            </>
          ) : (
            <>
              <FileDown className="h-4 w-4" />
              Exportar Excel
            </>
          )}
        </Button>

        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <FileUp className="h-4 w-4" />
          Importar Excel
        </Button>
      </div>

      {/* Modal de importación */}
      <Dialog open={isOpen} onOpenChange={resetModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Importar / Exportar Clientes
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetModal}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Exportación */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-700 flex items-center gap-2">
                  <FileDown className="h-4 w-4" />
                  📤 Exportar Clientes
                </h4>
                <p className="text-sm text-gray-600">
                  Descarga todos los clientes en formato Excel (.xlsx)
                </p>
                
                <Button
                  onClick={handleExport}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Descargar Clientes Excel
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Importación */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-700 flex items-center gap-2">
                  <FileUp className="h-4 w-4" />
                  📥 Importar Clientes
                </h4>
                <p className="text-sm text-gray-600">
                  Sube un archivo Excel (.xlsx) para crear o actualizar clientes masivamente
                </p>
                
                <div className="space-y-3">
                  <FileUploader
                    onFileSelect={handleFileSelect}
                    onFileRemove={handleFileRemove}
                    acceptedTypes={['.xlsx', '.xls']}
                    maxSize={10 * 1024 * 1024} // 10MB
                    disabled={importing}
                    loading={importing}
                    currentFile={file}
                    placeholder="Seleccionar archivo Excel"
                    description="o arrastra y suelta aquí"
                  />
                  
                  {localClientCount !== null && (
                    <div className="text-xs text-gray-600 mt-2 text-center">
                      Clientes detectados en el archivo: <span className="font-semibold">{localClientCount}</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleImport}
                      disabled={!file || importing}
                      className="flex-1"
                    >
                      {importing ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Importando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Importar Archivo
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={downloadTemplate}
                      variant="outline"
                      className="px-3"
                      title="Descargar plantilla Excel"
                    >
                      📋 Plantilla
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Resultado de importación */}
            {importResult && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {importResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <h5 className="font-medium">Resultado de Importación</h5>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">{importResult.message}</p>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-green-600 font-medium">Creados:</span> {importResult.created}
                      </div>
                      <div>
                        <span className="text-blue-600 font-medium">Actualizados:</span> {importResult.updated}
                      </div>
                    </div>
                  </div>

                  {/* Detalle de clientes creados */}
                  {importResult.createdClients && importResult.createdClients.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
                        <span className="text-green-600">🆕</span>
                        Clientes Nuevos Creados ({importResult.createdClients.length})
                      </h5>
                      <div className="max-h-32 overflow-y-auto bg-green-50 border border-green-200 rounded p-3">
                        <ul className="text-xs text-green-700 space-y-1">
                          {importResult.createdClients.map((client, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-green-500 mr-2">•</span>
                              <div className="flex-1">
                                <span className="font-medium">{client.nombre}</span>
                                <span className="text-green-600 ml-2">(ID: {client.id})</span>
                                <span className="text-green-500 ml-2">- Fila {client.fila}</span>
                                {client.email && <span className="text-green-600 ml-2">| {client.email}</span>}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Detalle de clientes actualizados */}
                  {importResult.updatedClients && importResult.updatedClients.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                        <span className="text-blue-600">🔄</span>
                        Clientes Actualizados ({importResult.updatedClients.length})
                      </h5>
                      <div className="max-h-32 overflow-y-auto bg-blue-50 border border-blue-200 rounded p-3">
                        <ul className="text-xs text-blue-700 space-y-2">
                          {importResult.updatedClients.map((client, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              <div className="flex-1">
                                <div>
                                  <span className="font-medium">{client.nombre}</span>
                                  <span className="text-blue-600 ml-2">(ID: {client.id})</span>
                                  <span className="text-blue-500 ml-2">- Fila {client.fila}</span>
                                  {client.email && <span className="text-blue-600 ml-2">| {client.email}</span>}
                                </div>
                                <div className="text-blue-500 text-xs mt-1">
                                  📋 Razón: {client.razon}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {importResult.errors.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-red-800 mb-2">Errores encontrados:</h5>
                      <div className="max-h-40 overflow-y-auto bg-red-50 border border-red-200 rounded p-3">
                        <ul className="text-xs text-red-700 space-y-1">
                          {importResult.errors.map((error, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-red-500 mr-2">•</span>
                              <span>{error}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pending Updates Selector */}
            {pendingUpdates.length > 0 && (
              <PendingUpdatesSelector
                pendingUpdates={pendingUpdates}
                onConfirm={handleConfirmUpdates}
                loading={applyingUpdates}
              />
            )}

            {/* Invalid Emails Manager */}
            {invalidEmails.length > 0 && (
              <InvalidEmailsManager
                invalidEmails={invalidEmails}
                onFix={handleFixEmails}
                loading={applyingUpdates}
              />
            )}

            {/* Instrucciones */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">📋 Instrucciones de Uso:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Exportar:</strong> Descarga todos los clientes actuales en Excel</li>
                <li>• <strong>Plantilla:</strong> Descarga una plantilla con ejemplos e instrucciones</li>
                <li>• <strong>Importar:</strong> Sube tu archivo Excel para crear/actualizar clientes</li>
                <li>• <strong>Sin ID:</strong> Se creará un nuevo cliente</li>
                <li>• <strong>Con ID:</strong> Se actualizará el cliente existente con ese ID</li>
                <li>• <strong>Tipos válidos:</strong> PERSONA o EMPRESA (en mayúsculas)</li>
                <li>• <strong>Formatos de fecha:</strong> YYYY-MM-DD, DD/MM/YYYY o DD-MM-YYYY</li>
              </ul>
            </div>
          </div>
          {(progressStage === 'reading' || importing || progress) && (
            <div className="w-full my-4">
              <div className="flex justify-between text-xs mb-1">
                <span>
                  {progressStage === 'reading' ? 'Leyendo archivo...' : 'Importando...'}
                </span>
                <span>
                  {progressStage === 'reading' && localClientCount !== null ? `0 / ${localClientCount}` :
                   progress && progress.total > 0 ? `${progress.processed} / ${progress.total}` :
                   localClientCount !== null ? `0 / ${localClientCount}` : ''}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${progressStage === 'reading' && localClientCount ? 0 : progress && progress.total > 0 ? (100 * progress.processed / progress.total) : 0}%` }}
                ></div>
              </div>
              {progress && progress.status === 'error' && (
                <div className="text-red-600 text-xs mt-2">Error: {progress.error || 'Error durante la importación'}</div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Duplicate Unification Modal */}
      {emailDuplicateGroups.length > 0 && (
        <EmailDuplicateUnificationModal
          emailDuplicateGroups={emailDuplicateGroups}
          onUnify={handleEmailUnification}
          onCancel={() => setEmailDuplicateGroups([])}
          loading={applyingUpdates}
        />
      )}
    </>
  );
} 