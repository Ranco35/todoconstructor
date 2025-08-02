'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, AlertCircle, Users, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface EmailDuplicateGroup {
  email: string;
  rows: Array<{
    row: number;
    clientData: any;
  }>;
}

interface UnificationSelection {
  email: string;
  selectedData: any[]; // Changed to array to accommodate multiple selections
  rowsToSkip: number[];
}

interface EmailDuplicateUnificationModalProps {
  emailDuplicateGroups: EmailDuplicateGroup[];
  onUnify: (unifications: UnificationSelection[]) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function EmailDuplicateUnificationModal({
  emailDuplicateGroups,
  onUnify,
  onCancel,
  loading = false
}: EmailDuplicateUnificationModalProps) {
  // Cambiar a selección múltiple
  const [selections, setSelections] = useState<{ [email: string]: Set<number> }>({});

  const handleSelection = (email: string, rowIndex: number) => {
    setSelections(prev => {
      const current = prev[email] || new Set();
      const newSet = new Set(current);
      if (newSet.has(rowIndex)) {
        newSet.delete(rowIndex);
      } else {
        newSet.add(rowIndex);
      }
      return { ...prev, [email]: newSet };
    });
  };

  const handleUnify = () => {
    const unifications: UnificationSelection[] = emailDuplicateGroups.map(group => {
      const selectedIndexes = Array.from(selections[group.email] || []);
      const selectedData = selectedIndexes.map(idx => group.rows[idx].clientData);
      const rowsToSkip = group.rows
        .map((row, index) => selectedIndexes.includes(index) ? null : row.row)
        .filter(row => row !== null) as number[];
      return {
        email: group.email,
        selectedData,
        rowsToSkip
      };
    });
    onUnify(unifications);
  };

  const allSelected = emailDuplicateGroups.every(group =>
    selections[group.email] && selections[group.email]!.size > 0
  );

  const getClientDisplayName = (clientData: any) => {
    if (clientData.tipoCliente === 'EMPRESA') {
      return clientData.razonSocial || clientData.nombrePrincipal || 'Empresa sin nombre';
    } else {
      return `${clientData.nombrePrincipal || ''} ${clientData.apellido || ''}`.trim() || 'Persona sin nombre';
    }
  };

  const getClientTypeIcon = (clientData: any) => {
    return clientData.tipoCliente === 'EMPRESA' ? '🏢' : '👤';
  };

  return (
    <Dialog open={true} onOpenChange={() => !loading && onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-700">
            <AlertCircle className="h-5 w-5" />
            Unificación de Emails Duplicados
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información general */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-orange-600" />
              <h3 className="font-medium text-orange-800">
                Se encontraron {emailDuplicateGroups.length} grupo(s) de emails duplicados
              </h3>
            </div>
            <p className="text-sm text-orange-700">
              Para cada grupo, selecciona <b>uno o más registros</b> que deseas importar con el mismo email. Los demás registros serán omitidos durante la importación.
            </p>
          </div>

          {/* Grupos de emails duplicados */}
          <div className="space-y-6">
            {emailDuplicateGroups.map((group, groupIndex) => (
              <div key={group.email} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium text-gray-800">
                    Email: <span className="text-blue-600 font-mono">{group.email}</span>
                  </h4>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    {group.rows.length} registro(s)
                  </span>
                </div>

                <div className="space-y-3">
                  {group.rows.map((row, rowIndex) => {
                    const isSelected = !!(selections[group.email]?.has(rowIndex));
                    const clientName = getClientDisplayName(row.clientData);
                    const clientIcon = getClientTypeIcon(row.clientData);

                    return (
                      <div
                        key={row.row}
                        className={`border rounded-lg p-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleSelection(group.email, rowIndex)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              name={`email-${group.email}`}
                              checked={isSelected}
                              onChange={() => handleSelection(group.email, rowIndex)}
                              className="text-green-600"
                            />
                            <span className="text-lg">{clientIcon}</span>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-gray-800">
                                {clientName}
                              </span>
                              <span className="text-xs text-gray-500">
                                (Fila {row.row})
                              </span>
                              {isSelected && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Seleccionado
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                              <div>
                                <span className="font-medium">Tipo:</span> {row.clientData.tipoCliente}
                              </div>
                              {row.clientData.rut && (
                                <div>
                                  <span className="font-medium">RUT:</span> {row.clientData.rut}
                                </div>
                              )}
                              {row.clientData.telefono && (
                                <div>
                                  <span className="font-medium">Teléfono:</span> {row.clientData.telefono}
                                </div>
                              )}
                              {row.clientData.telefonoMovil && (
                                <div>
                                  <span className="font-medium">Móvil:</span> {row.clientData.telefonoMovil}
                                </div>
                              )}
                              {row.clientData.ciudad && (
                                <div>
                                  <span className="font-medium">Ciudad:</span> {row.clientData.ciudad}
                                </div>
                              )}
                              {row.clientData.razonSocial && (
                                <div>
                                  <span className="font-medium">Razón Social:</span> {row.clientData.razonSocial}
                                </div>
                              )}
                              {row.clientData.giro && (
                                <div>
                                  <span className="font-medium">Giro:</span> {row.clientData.giro}
                                </div>
                              )}
                            </div>

                            {/* Información adicional */}
                            {(row.clientData.comentarios || row.clientData.etiquetas) && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                {row.clientData.comentarios && (
                                  <div className="text-xs text-gray-500">
                                    <span className="font-medium">Comentarios:</span> {row.clientData.comentarios}
                                  </div>
                                )}
                                {row.clientData.etiquetas && (
                                  <div className="text-xs text-gray-500">
                                    <span className="font-medium">Etiquetas:</span> {row.clientData.etiquetas}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {(!selections[group.email] || selections[group.email]!.size === 0) && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                    ⚠️ Selecciona al menos un registro para este email
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Resumen y botones */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Resumen:</span> {emailDuplicateGroups.length} grupo(s) de emails duplicados
                {allSelected && (
                  <span className="text-green-600 ml-2">
                    • Todos los grupos tienen selección
                  </span>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUnify}
                  disabled={!allSelected || loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Unificando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aplicar Unificaciones
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 