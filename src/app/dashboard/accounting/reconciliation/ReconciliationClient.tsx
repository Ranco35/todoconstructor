'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, Search, Check, X, AlertTriangle, FileText, CreditCard, Building } from 'lucide-react';
import Link from 'next/link';
import BankStatementUploader from '@/components/accounting/BankStatementUploader';
import { getPaymentsForReconciliation } from '@/actions/accounting/consolidated-payments';

// Tipos de datos
interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  reference?: string;
  account: string;
  reconciled: boolean;
  matchedPaymentId?: string;
}

interface SystemPayment {
  id: string;
  source: 'pos' | 'reservation' | 'supplier' | 'invoice';
  date: string;
  description: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  reconciled: boolean;
  matchedTransactionId?: string;
}

interface ReconciliationStats {
  totalBankTransactions: number;
  totalSystemPayments: number;
  matchedTransactions: number;
  unmatchedBankTransactions: number;
  unmatchedSystemPayments: number;
  totalReconciled: number;
  pendingReconciliation: number;
}

interface ReconciliationClientProps {
  currentUser: any;
}

export default function ReconciliationClient({ currentUser }: ReconciliationClientProps) {
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [systemPayments, setSystemPayments] = useState<SystemPayment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<ReconciliationStats>({
    totalBankTransactions: 0,
    totalSystemPayments: 0,
    matchedTransactions: 0,
    unmatchedBankTransactions: 0,
    unmatchedSystemPayments: 0,
    totalReconciled: 0,
    pendingReconciliation: 0
  });

  // Cargar pagos del sistema al inicio
  useEffect(() => {
    loadSystemPayments();
  }, []);

  const loadSystemPayments = async () => {
    try {
      setIsLoading(true);
      // Obtener pagos de los últimos 30 días para conciliación
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const result = await getPaymentsForReconciliation({ dateFrom: startDate, dateTo: endDate });
      
      if (result.success && result.data) {
        const payments: SystemPayment[] = result.data.map(payment => ({
          id: payment.id,
          source: payment.source as 'pos' | 'reservation' | 'supplier' | 'invoice',
          date: payment.date,
          description: payment.description,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          reference: payment.reference,
          reconciled: false
        }));
        
        setSystemPayments(payments);
        updateStats(bankTransactions, payments);
      } else {
        // Datos mock como fallback
        const mockPayments: SystemPayment[] = [
          {
            id: '1',
            source: 'pos',
            date: '2025-01-20',
            description: 'Venta POS #1234',
            amount: 45000,
            paymentMethod: 'card',
            reference: 'TXN1234',
            reconciled: false
          },
          {
            id: '2',
            source: 'reservation',
            date: '2025-01-19',
            description: 'Pago reserva habitación 101',
            amount: 120000,
            paymentMethod: 'transfer',
            reference: 'RSV2024001',
            reconciled: false
          }
        ];
        setSystemPayments(mockPayments);
        updateStats(bankTransactions, mockPayments);
      }
    } catch (error) {
      console.error('Error loading system payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBankStatementUpload = (result: any) => {
    if (result.success && result.transactions) {
      // Convertir transacciones del componente BankStatementUploader al formato local
      const convertedTransactions: BankTransaction[] = result.transactions.map((t: any) => ({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        reference: t.reference,
        account: t.account,
        reconciled: false
      }));

      setBankTransactions(convertedTransactions);
      updateStats(convertedTransactions, systemPayments);
      
      // Intentar conciliación automática
      autoReconcile(convertedTransactions, systemPayments);
    }
  };

  const autoReconcile = (bankTxns: BankTransaction[], systemPaymentsData: SystemPayment[]) => {
    const updatedBankTxns = [...bankTxns];
    const updatedSystemPayments = [...systemPaymentsData];

    updatedBankTxns.forEach((bankTxn, bankIndex) => {
      updatedSystemPayments.forEach((payment, paymentIndex) => {
        // Conciliar por monto exacto y fecha cercana (mismo día o día siguiente)
        if (!bankTxn.reconciled && !payment.reconciled) {
          const bankDate = new Date(bankTxn.date);
          const paymentDate = new Date(payment.date);
          const dayDifference = Math.abs(bankDate.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24);

          if (
            Math.abs(bankTxn.amount) === Math.abs(payment.amount) &&
            dayDifference <= 1 // Mismo día o día siguiente
          ) {
            updatedBankTxns[bankIndex].reconciled = true;
            updatedBankTxns[bankIndex].matchedPaymentId = payment.id;
            updatedSystemPayments[paymentIndex].reconciled = true;
            updatedSystemPayments[paymentIndex].matchedTransactionId = bankTxn.id;
          }
        }
      });
    });

    setBankTransactions(updatedBankTxns);
    setSystemPayments(updatedSystemPayments);
    updateStats(updatedBankTxns, updatedSystemPayments);
  };

  const updateStats = (bankTxns: BankTransaction[], systemPaymentsData: SystemPayment[]) => {
    const matchedBankTxns = bankTxns.filter(t => t.reconciled).length;
    const matchedSystemPayments = systemPaymentsData.filter(p => p.reconciled).length;
    
    setStats({
      totalBankTransactions: bankTxns.length,
      totalSystemPayments: systemPaymentsData.length,
      matchedTransactions: matchedBankTxns,
      unmatchedBankTransactions: bankTxns.length - matchedBankTxns,
      unmatchedSystemPayments: systemPaymentsData.length - matchedSystemPayments,
      totalReconciled: matchedBankTxns,
      pendingReconciliation: (bankTxns.length - matchedBankTxns) + (systemPaymentsData.length - matchedSystemPayments)
    });
  };

  const manualReconcile = (bankTxnId: string, paymentId: string) => {
    const updatedBankTxns = bankTransactions.map(t => 
      t.id === bankTxnId ? { ...t, reconciled: true, matchedPaymentId: paymentId } : t
    );
    const updatedSystemPayments = systemPayments.map(p => 
      p.id === paymentId ? { ...p, reconciled: true, matchedTransactionId: bankTxnId } : p
    );

    setBankTransactions(updatedBankTxns);
    setSystemPayments(updatedSystemPayments);
    updateStats(updatedBankTxns, updatedSystemPayments);
  };

  const getSourceIcon = (source: string) => {
    const icons = {
      pos: '🛒',
      reservation: '🏨',
      supplier: '🏢',
      invoice: '📄'
    };
    return icons[source as keyof typeof icons] || '💳';
  };

  const getPaymentMethodIcon = (method: string) => {
    const icons = {
      cash: '💵',
      card: '💳',
      transfer: '🏦',
      check: '📝'
    };
    return icons[method as keyof typeof icons] || '💳';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Conciliaciones Bancarias</h1>
            <p className="text-blue-100">Concilia movimientos bancarios con pagos del sistema</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">🏦</div>
            <div className="text-blue-200">Sistema de Conciliación</div>
          </div>
        </div>
      </div>

      {/* Estadísticas de Conciliación */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Transacciones Bancarias</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalBankTransactions}</p>
              </div>
              <Building className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pagos del Sistema</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalSystemPayments}</p>
              </div>
              <CreditCard className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conciliadas</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.matchedTransactions}</p>
              </div>
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingReconciliation}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Carga de Cartola Bancaria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Cargar Cartola Bancaria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BankStatementUploader onUploadComplete={handleBankStatementUpload} />
        </CardContent>
      </Card>

      {/* Alertas y Estado */}
      {bankTransactions.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {stats.matchedTransactions > 0 ? (
              <span className="text-green-600">
                ✅ Se conciliaron automáticamente {stats.matchedTransactions} transacciones. 
                {stats.pendingReconciliation > 0 && ` Quedan ${stats.pendingReconciliation} por conciliar manualmente.`}
              </span>
            ) : (
              <span className="text-orange-600">
                ⚠️ No se encontraron coincidencias automáticas. Revisa las transacciones manualmente.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs de Conciliación */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Proceso de Conciliación</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => autoReconcile(bankTransactions, systemPayments)}
                disabled={bankTransactions.length === 0 || systemPayments.length === 0}
              >
                🔄 Conciliar Automático
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar Resultado
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bank" className="space-y-4">
            <TabsList>
              <TabsTrigger value="bank">
                Cartola Bancaria ({stats.totalBankTransactions})
              </TabsTrigger>
              <TabsTrigger value="system">
                Pagos Sistema ({stats.totalSystemPayments})
              </TabsTrigger>
              <TabsTrigger value="reconciled">
                Conciliadas ({stats.matchedTransactions})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bank">
              <BankTransactionsList 
                transactions={bankTransactions} 
                systemPayments={systemPayments}
                onManualReconcile={manualReconcile}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="system">
              <SystemPaymentsList 
                payments={systemPayments} 
                bankTransactions={bankTransactions}
                onManualReconcile={manualReconcile}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="reconciled">
              <ReconciledList 
                bankTransactions={bankTransactions.filter(t => t.reconciled)}
                systemPayments={systemPayments.filter(p => p.reconciled)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Enlaces de navegación */}
      <div className="flex justify-between items-center">
        <Link href="/dashboard/accounting">
          <Button variant="outline">
            ← Volver a Contabilidad
          </Button>
        </Link>
        
        <div className="space-x-2">
          <Link href="/dashboard/accounting/payments">
            <Button variant="outline">
              Ver Pagos Consolidados
            </Button>
          </Link>
          <Link href="/dashboard/accounting/reports">
            <Button variant="outline">
              Ver Reportes Financieros
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Componente para lista de transacciones bancarias
function BankTransactionsList({ 
  transactions, 
  systemPayments, 
  onManualReconcile, 
  isLoading 
}: { 
  transactions: BankTransaction[], 
  systemPayments: SystemPayment[], 
  onManualReconcile: (bankTxnId: string, paymentId: string) => void,
  isLoading: boolean 
}) {
  if (isLoading) {
    return <div className="text-center py-8">Cargando transacciones...</div>;
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">🏦</div>
        <p className="text-gray-500">No hay cartola bancaria cargada</p>
        <p className="text-gray-400">Sube un archivo CSV o Excel con los movimientos bancarios</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <div 
          key={transaction.id} 
          className={`border rounded-lg p-4 ${transaction.reconciled ? 'bg-green-50 border-green-200' : 'bg-white hover:bg-gray-50'} transition-colors`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{transaction.type === 'income' ? '📈' : '📉'}</span>
                <span className="font-medium">{transaction.description}</span>
                {transaction.reconciled && (
                  <Badge className="bg-green-100 text-green-800">
                    <Check className="h-3 w-3 mr-1" />
                    Conciliada
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {transaction.date} • {transaction.account}
                {transaction.reference && ` • Ref: ${transaction.reference}`}
              </div>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                ${transaction.amount.toLocaleString()}
              </p>
              {!transaction.reconciled && (
                <div className="mt-2">
                  <select 
                    className="text-xs border rounded px-2 py-1"
                    onChange={(e) => e.target.value && onManualReconcile(transaction.id, e.target.value)}
                    defaultValue=""
                  >
                    <option value="">Conciliar con...</option>
                    {systemPayments
                      .filter(p => !p.reconciled && Math.abs(p.amount) === Math.abs(transaction.amount))
                      .map(payment => (
                        <option key={payment.id} value={payment.id}>
                          {payment.description} - ${payment.amount.toLocaleString()}
                        </option>
                      ))
                    }
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Componente para lista de pagos del sistema
function SystemPaymentsList({ 
  payments, 
  bankTransactions, 
  onManualReconcile, 
  isLoading 
}: { 
  payments: SystemPayment[], 
  bankTransactions: BankTransaction[], 
  onManualReconcile: (bankTxnId: string, paymentId: string) => void,
  isLoading: boolean 
}) {
  if (isLoading) {
    return <div className="text-center py-8">Cargando pagos del sistema...</div>;
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">💳</div>
        <p className="text-gray-500">No hay pagos del sistema</p>
        <p className="text-gray-400">Los pagos de los últimos 30 días aparecerán aquí</p>
      </div>
    );
  }

  const getSourceIcon = (source: string) => {
    const icons = {
      pos: '🛒',
      reservation: '🏨',
      supplier: '🏢',
      invoice: '📄'
    };
    return icons[source as keyof typeof icons] || '💳';
  };

  const getPaymentMethodIcon = (method: string) => {
    const icons = {
      cash: '💵',
      card: '💳',
      transfer: '🏦',
      check: '📝'
    };
    return icons[method as keyof typeof icons] || '💳';
  };

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div 
          key={payment.id} 
          className={`border rounded-lg p-4 ${payment.reconciled ? 'bg-green-50 border-green-200' : 'bg-white hover:bg-gray-50'} transition-colors`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getSourceIcon(payment.source)}</span>
                <span className="text-lg">{getPaymentMethodIcon(payment.paymentMethod)}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{payment.description}</span>
                  {payment.reconciled && (
                    <Badge className="bg-green-100 text-green-800">
                      <Check className="h-3 w-3 mr-1" />
                      Conciliada
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {payment.date} • {payment.source} • {payment.paymentMethod}
                  {payment.reference && ` • Ref: ${payment.reference}`}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-600">
                ${payment.amount.toLocaleString()}
              </p>
              {!payment.reconciled && (
                <div className="mt-2">
                  <select 
                    className="text-xs border rounded px-2 py-1"
                    onChange={(e) => e.target.value && onManualReconcile(e.target.value, payment.id)}
                    defaultValue=""
                  >
                    <option value="">Conciliar con...</option>
                    {bankTransactions
                      .filter(t => !t.reconciled && Math.abs(t.amount) === Math.abs(payment.amount))
                      .map(transaction => (
                        <option key={transaction.id} value={transaction.id}>
                          {transaction.description} - ${transaction.amount.toLocaleString()}
                        </option>
                      ))
                    }
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Componente para lista de transacciones conciliadas
function ReconciledList({ 
  bankTransactions, 
  systemPayments 
}: { 
  bankTransactions: BankTransaction[], 
  systemPayments: SystemPayment[] 
}) {
  if (bankTransactions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">✅</div>
        <p className="text-gray-500">No hay transacciones conciliadas</p>
        <p className="text-gray-400">Las conciliaciones exitosas aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bankTransactions.map((transaction) => {
        const matchedPayment = systemPayments.find(p => p.id === transaction.matchedPaymentId);
        
        return (
          <div key={transaction.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Conciliación Exitosa</span>
                  <Badge className="bg-green-100 text-green-800">✅ Confirmado</Badge>
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">🏦 Banco:</span>
                    <span>{transaction.description} • {transaction.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">💳 Sistema:</span>
                    <span>{matchedPayment?.description} • {matchedPayment?.date}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-green-600">
                  ${transaction.amount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Montos coinciden</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
} 