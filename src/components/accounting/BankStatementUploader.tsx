'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, CheckCircle, AlertTriangle, FileText, X } from 'lucide-react';
import * as XLSX from 'xlsx';

// Interfaces para las transacciones bancarias
export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  reference?: string;
  account: string;
  balance?: number;
  category?: string;
  subcategory?: string;
}

interface UploadResult {
  success: boolean;
  transactions: BankTransaction[];
  errors: string[];
  warnings: string[];
  summary: {
    totalTransactions: number;
    totalIncome: number;
    totalExpense: number;
    duplicates: number;
    invalidRows: number;
  };
}

interface BankStatementUploaderProps {
  onUploadComplete?: (result: UploadResult) => void;
  acceptedFormats?: string[];
  maxFileSize?: number; // en MB
}

export default function BankStatementUploader({
  onUploadComplete,
  acceptedFormats = ['.csv', '.xlsx', '.xls'],
  maxFileSize = 10
}: BankStatementUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  // Validar archivo
  const validateFile = (file: File): string[] => {
    const errors: string[] = [];
    
    // Validar tamaño
    if (file.size > maxFileSize * 1024 * 1024) {
      errors.push(`El archivo excede el tamaño máximo de ${maxFileSize}MB`);
    }

    // Validar formato
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(fileExtension)) {
      errors.push(`Formato no soportado. Use: ${acceptedFormats.join(', ')}`);
    }

    return errors;
  };

  // Procesar archivo CSV
  const processCSV = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          
          const data = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
              const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
              const row: any = {};
              headers.forEach((header, index) => {
                row[header] = values[index] || '';
              });
              return row;
            });
          
          resolve(data);
        } catch (error) {
          reject(new Error('Error procesando archivo CSV'));
        }
      };
      reader.onerror = () => reject(new Error('Error leyendo archivo'));
      reader.readAsText(file);
    });
  };

  // Procesar archivo Excel
  const processExcel = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(new Error('Error procesando archivo Excel'));
        }
      };
      reader.onerror = () => reject(new Error('Error leyendo archivo'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Normalizar datos de transacciones
  const normalizeTransactionData = (rawData: any[]): { transactions: BankTransaction[]; errors: string[]; warnings: string[] } => {
    const transactions: BankTransaction[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Mapeo de posibles nombres de columnas
    const columnMappings = {
      date: ['fecha', 'date', 'fecha_transaccion', 'transaction_date', 'fecha_operacion'],
      description: ['descripcion', 'description', 'detalle', 'concepto', 'glosa', 'memo'],
      amount: ['monto', 'amount', 'importe', 'valor', 'cantidad'],
      reference: ['referencia', 'reference', 'numero_referencia', 'ref', 'numero_operacion'],
      account: ['cuenta', 'account', 'numero_cuenta', 'account_number'],
      balance: ['saldo', 'balance', 'saldo_final'],
      type: ['tipo', 'type', 'movimiento']
    };

    // Detectar columnas automáticamente
    const detectedColumns: any = {};
    if (rawData.length > 0) {
      const firstRow = rawData[0];
      const availableColumns = Object.keys(firstRow).map(k => k.toLowerCase());

      Object.entries(columnMappings).forEach(([key, possibleNames]) => {
        const found = possibleNames.find(name => 
          availableColumns.some(col => col.includes(name))
        );
        if (found) {
          const exactColumn = availableColumns.find(col => col.includes(found));
          if (exactColumn) {
            detectedColumns[key] = Object.keys(firstRow).find(k => k.toLowerCase() === exactColumn);
          }
        }
      });
    }

    // Validar que tenemos las columnas esenciales
    if (!detectedColumns.date || !detectedColumns.description || !detectedColumns.amount) {
      errors.push('No se pudieron detectar las columnas esenciales (fecha, descripción, monto)');
      return { transactions, errors, warnings };
    }

    rawData.forEach((row, index) => {
      try {
        const rowNumber = index + 2; // +2 porque empezamos desde la fila 2 (después del header)
        
        // Extraer fecha
        let date = row[detectedColumns.date];
        if (!date) {
          warnings.push(`Fila ${rowNumber}: Fecha faltante`);
          return;
        }

        // Normalizar formato de fecha
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
          // Intentar otros formatos de fecha
          const dateFormats = [
            /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/, // DD/MM/YYYY o MM/DD/YYYY
            /(\d{1,2})-(\d{1,2})-(\d{2,4})/, // DD-MM-YYYY o MM-DD-YYYY
            /(\d{2,4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
          ];

          let parsedDate: Date | null = null;
          for (const format of dateFormats) {
            const match = String(date).match(format);
            if (match) {
              // Asumir formato DD/MM/YYYY para fechas chilenas
              if (format === dateFormats[0] || format === dateFormats[1]) {
                parsedDate = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
              } else {
                parsedDate = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
              }
              break;
            }
          }

          if (!parsedDate || isNaN(parsedDate.getTime())) {
            errors.push(`Fila ${rowNumber}: Formato de fecha inválido: ${date}`);
            return;
          }
          dateObj.setTime(parsedDate.getTime());
        }

        // Extraer descripción
        const description = String(row[detectedColumns.description] || '').trim();
        if (!description) {
          warnings.push(`Fila ${rowNumber}: Descripción faltante`);
        }

        // Extraer monto
        let amount = row[detectedColumns.amount];
        if (amount === undefined || amount === null || amount === '') {
          warnings.push(`Fila ${rowNumber}: Monto faltante`);
          return;
        }

        // Limpiar y convertir monto
        const amountStr = String(amount).replace(/[$.]/g, '').replace(/,/g, '');
        const amountNum = parseFloat(amountStr);
        if (isNaN(amountNum)) {
          errors.push(`Fila ${rowNumber}: Monto inválido: ${amount}`);
          return;
        }

        // Determinar tipo de transacción
        let type: 'income' | 'expense' = amountNum >= 0 ? 'income' : 'expense';
        if (detectedColumns.type && row[detectedColumns.type]) {
          const typeStr = String(row[detectedColumns.type]).toLowerCase();
          if (typeStr.includes('debito') || typeStr.includes('egreso') || typeStr.includes('cargo')) {
            type = 'expense';
          } else if (typeStr.includes('credito') || typeStr.includes('ingreso') || typeStr.includes('abono')) {
            type = 'income';
          }
        }

        // Crear transacción
        const transaction: BankTransaction = {
          id: `import-${Date.now()}-${index}`,
          date: dateObj.toISOString().split('T')[0],
          description: description || 'Transacción sin descripción',
          amount: Math.abs(amountNum) * (type === 'expense' ? -1 : 1),
          type,
          reference: detectedColumns.reference ? String(row[detectedColumns.reference] || '') : undefined,
          account: detectedColumns.account ? String(row[detectedColumns.account] || 'CUENTA-PRINCIPAL') : 'CUENTA-PRINCIPAL',
          balance: detectedColumns.balance ? parseFloat(String(row[detectedColumns.balance] || '0')) : undefined
        };

        transactions.push(transaction);

      } catch (error) {
        errors.push(`Fila ${index + 2}: Error procesando fila - ${error}`);
      }
    });

    return { transactions, errors, warnings };
  };

  // Calcular estadísticas
  const calculateSummary = (transactions: BankTransaction[]) => {
    const totalIncome = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      totalTransactions: transactions.length,
      totalIncome,
      totalExpense,
      duplicates: 0, // TODO: implementar detección de duplicados
      invalidRows: 0
    };
  };

  // Procesar archivo completo
  const processFile = async (file: File): Promise<UploadResult> => {
    setUploadProgress(10);

    try {
      // Determinar tipo de archivo y procesar
      let rawData: any[];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      setUploadProgress(30);
      
      if (fileExtension === '.csv') {
        rawData = await processCSV(file);
      } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
        rawData = await processExcel(file);
      } else {
        throw new Error('Formato de archivo no soportado');
      }

      setUploadProgress(60);

      // Normalizar datos
      const { transactions, errors, warnings } = normalizeTransactionData(rawData);
      
      setUploadProgress(80);

      // Calcular resumen
      const summary = calculateSummary(transactions);
      
      setUploadProgress(100);

      return {
        success: errors.length === 0,
        transactions,
        errors,
        warnings,
        summary
      };

    } catch (error) {
      return {
        success: false,
        transactions: [],
        errors: [error instanceof Error ? error.message : 'Error procesando archivo'],
        warnings: [],
        summary: {
          totalTransactions: 0,
          totalIncome: 0,
          totalExpense: 0,
          duplicates: 0,
          invalidRows: 0
        }
      };
    }
  };

  // Manejar selección de archivo
  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setUploadResult(null);
    
    const validationErrors = validateFile(file);
    if (validationErrors.length > 0) {
      setUploadResult({
        success: false,
        transactions: [],
        errors: validationErrors,
        warnings: [],
        summary: {
          totalTransactions: 0,
          totalIncome: 0,
          totalExpense: 0,
          duplicates: 0,
          invalidRows: 0
        }
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await processFile(file);
      setUploadResult(result);
      
      if (onUploadComplete) {
        onUploadComplete(result);
      }
    } catch (error) {
      setUploadResult({
        success: false,
        transactions: [],
        errors: [error instanceof Error ? error.message : 'Error desconocido'],
        warnings: [],
        summary: {
          totalTransactions: 0,
          totalIncome: 0,
          totalExpense: 0,
          duplicates: 0,
          invalidRows: 0
        }
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [onUploadComplete, maxFileSize]);

  // Eventos de drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  // Generar plantillas de ejemplo
  const downloadTemplate = (format: 'csv' | 'excel') => {
    const headers = ['Fecha', 'Descripcion', 'Monto', 'Referencia', 'Cuenta'];
    const sampleData = [
      ['2025-01-22', 'PAGO TARJETA GETNET', '25000', 'REF123456', 'CUENTA-CORRIENTE-001'],
      ['2025-01-22', 'TRANSFERENCIA RECIBIDA', '85000', 'TRANS789', 'CUENTA-CORRIENTE-001'],
      ['2025-01-21', 'TRANSFERENCIA ENVIADA', '-45000', 'PAY001', 'CUENTA-CORRIENTE-001'],
      ['2025-01-21', 'COMISION BANCO', '-2500', '', 'CUENTA-CORRIENTE-001']
    ];

    if (format === 'csv') {
      const csvContent = [headers, ...sampleData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'plantilla-cartola-bancaria.csv';
      link.click();
    } else {
      const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Cartola');
      XLSX.writeFile(wb, 'plantilla-cartola-bancaria.xlsx');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Área de carga */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Cargar Cartola Bancaria</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="space-y-4">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-600">Procesando archivo...</p>
                <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                <p className="text-sm text-gray-500">{uploadProgress}% completado</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Arrastra tu cartola bancaria aquí
                  </p>
                  <p className="text-gray-600">o</p>
                  <input
                    type="file"
                    accept={acceptedFormats.join(',')}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  >
                    Seleccionar archivo
                  </label>
                </div>
                <div className="text-sm text-gray-500">
                  <p>Formatos soportados: {acceptedFormats.join(', ')}</p>
                  <p>Tamaño máximo: {maxFileSize}MB</p>
                </div>
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                  <Badge variant="outline">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setUploadResult(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plantillas */}
      <Card>
        <CardHeader>
          <CardTitle>Plantillas de Ejemplo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button variant="outline" onClick={() => downloadTemplate('csv')}>
              <Download className="h-4 w-4 mr-2" />
              Descargar Plantilla CSV
            </Button>
            <Button variant="outline" onClick={() => downloadTemplate('excel')}>
              <Download className="h-4 w-4 mr-2" />
              Descargar Plantilla Excel
            </Button>
          </div>
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Columnas requeridas:</strong> Fecha, Descripción, Monto. 
              <strong>Columnas opcionales:</strong> Referencia, Cuenta, Saldo.
              El sistema detecta automáticamente las columnas basándose en nombres comunes.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Resultado de la carga */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {uploadResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              <span>Resultado de la Importación</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{uploadResult.summary.totalTransactions}</p>
                <p className="text-sm text-blue-600">Transacciones</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-lg font-bold text-green-600">{formatCurrency(uploadResult.summary.totalIncome)}</p>
                <p className="text-sm text-green-600">Ingresos</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-lg font-bold text-red-600">{formatCurrency(uploadResult.summary.totalExpense)}</p>
                <p className="text-sm text-red-600">Egresos</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-gray-600">
                  {formatCurrency(uploadResult.summary.totalIncome - uploadResult.summary.totalExpense)}
                </p>
                <p className="text-sm text-gray-600">Neto</p>
              </div>
            </div>

            {/* Errores */}
            {uploadResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Errores encontrados:</strong>
                  <ul className="mt-2 space-y-1">
                    {uploadResult.errors.map((error, index) => (
                      <li key={index} className="text-sm">• {error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Advertencias */}
            {uploadResult.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Advertencias:</strong>
                  <ul className="mt-2 space-y-1">
                    {uploadResult.warnings.slice(0, 5).map((warning, index) => (
                      <li key={index} className="text-sm">• {warning}</li>
                    ))}
                    {uploadResult.warnings.length > 5 && (
                      <li className="text-sm text-gray-500">... y {uploadResult.warnings.length - 5} más</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Vista previa de transacciones */}
            {uploadResult.transactions.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Vista Previa (primeras 5 transacciones)</h4>
                <div className="space-y-2">
                  {uploadResult.transactions.slice(0, 5).map((transaction, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-600">
                            {transaction.date} • {transaction.reference || 'Sin referencia'}
                          </p>
                        </div>
                        <div className={`font-semibold ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(transaction.amount)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {uploadResult.transactions.length > 5 && (
                    <p className="text-sm text-gray-500 text-center">
                      ... y {uploadResult.transactions.length - 5} transacciones más
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 