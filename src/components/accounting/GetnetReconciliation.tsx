'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Download, Search, Check, X, AlertTriangle, CreditCard, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

// Interfaces para Getnet
interface GetnetTransaction {
  id: string;
  date: string;
  time: string;
  terminalId: string;
  cardType: string; // VISA, MASTERCARD, etc.
  amount: number;
  fees: number;
  netAmount: number;
  authCode: string;
  transactionId: string;
  status: 'approved' | 'declined' | 'pending';
  reconciled: boolean;
  matchedSaleId?: string;
}

interface POSCardSale {
  id: string;
  date: string;
  time: string;
  amount: number;
  terminal?: string;
  customerName?: string;
  receiptNumber?: string;
  cashRegisterType: 'recepcion' | 'restaurante';
  reconciled: boolean;
  matchedGetnetId?: string;
}

interface GetnetReconciliationStats {
  totalGetnetTransactions: number;
  totalPOSSales: number;
  matchedTransactions: number;
  unmatchedGetnet: number;
  unmatchedPOS: number;
  totalGetnetAmount: number;
  totalPOSAmount: number;
  differenceAmount: number;
  totalFees: number;
}

interface GetnetReconciliationProps {
  onReconciliationComplete?: (stats: GetnetReconciliationStats) => void;
}

export default function GetnetReconciliation({ onReconciliationComplete }: GetnetReconciliationProps) {
  const [getnetTransactions, setGetnetTransactions] = useState<GetnetTransaction[]>([]);
  const [posSales, setPOSSales] = useState<POSCardSale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dateFilter, setDateFilter] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [stats, setStats] = useState<GetnetReconciliationStats>({
    totalGetnetTransactions: 0,
    totalPOSSales: 0,
    matchedTransactions: 0,
    unmatchedGetnet: 0,
    unmatchedPOS: 0,
    totalGetnetAmount: 0,
    totalPOSAmount: 0,
    differenceAmount: 0,
    totalFees: 0
  });

  useEffect(() => {
    loadPOSCardSales();
  }, [dateFilter]);

  const loadPOSCardSales = async () => {
    setIsLoading(true);
    try {
      // Cargar ventas con tarjeta del POS
      // Por ahora simulamos datos - en producción esto vendría de las acciones del POS
      const mockPOSSales: POSCardSale[] = [
        {
          id: 'pos-card-001',
          date: '2025-01-22',
          time: '14:30:15',
          amount: 25000,
          terminal: 'TERM001',
          customerName: 'Cliente 1',
          receiptNumber: 'REC001',
          cashRegisterType: 'restaurante',
          reconciled: false
        },
        {
          id: 'pos-card-002',
          date: '2025-01-22',
          time: '16:45:30',
          amount: 42000,
          terminal: 'TERM002',
          customerName: 'Cliente 2',
          receiptNumber: 'REC002',
          cashRegisterType: 'recepcion',
          reconciled: false
        },
        {
          id: 'pos-card-003',
          date: '2025-01-21',
          time: '12:15:45',
          amount: 18500,
          terminal: 'TERM001',
          customerName: 'Cliente 3',
          receiptNumber: 'REC003',
          cashRegisterType: 'restaurante',
          reconciled: false
        }
      ];

      setPOSSales(mockPOSSales);
      updateStats(getnetTransactions, mockPOSSales);
    } catch (error) {
      console.error('Error loading POS card sales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetnetFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsLoading(true);

    try {
      // Simular procesamiento del archivo de Getnet
      // En producción, esto procesaría el CSV/Excel de Getnet
      const mockGetnetTransactions: GetnetTransaction[] = [
        {
          id: 'getnet-001',
          date: '2025-01-22',
          time: '14:30:25',
          terminalId: 'TERM001',
          cardType: 'VISA',
          amount: 25000,
          fees: 875, // ~3.5%
          netAmount: 24125,
          authCode: 'AUTH123456',
          transactionId: 'TXN789012',
          status: 'approved',
          reconciled: false
        },
        {
          id: 'getnet-002',
          date: '2025-01-22',
          time: '16:45:45',
          terminalId: 'TERM002',
          cardType: 'MASTERCARD',
          amount: 42000,
          fees: 1470, // ~3.5%
          netAmount: 40530,
          authCode: 'AUTH654321',
          transactionId: 'TXN345678',
          status: 'approved',
          reconciled: false
        },
        {
          id: 'getnet-003',
          date: '2025-01-21',
          time: '12:16:00',
          terminalId: 'TERM001',
          cardType: 'VISA',
          amount: 18500,
          fees: 647,
          netAmount: 17853,
          authCode: 'AUTH987654',
          transactionId: 'TXN901234',
          status: 'approved',
          reconciled: false
        },
        {
          id: 'getnet-004',
          date: '2025-01-20',
          time: '10:30:00',
          terminalId: 'TERM002',
          cardType: 'VISA',
          amount: 15000,
          fees: 525,
          netAmount: 14475,
          authCode: 'AUTH111222',
          transactionId: 'TXN567890',
          status: 'approved',
          reconciled: false
        }
      ];

      setGetnetTransactions(mockGetnetTransactions);
      updateStats(mockGetnetTransactions, posSales);
      
      // Intentar conciliación automática
      autoReconcile(mockGetnetTransactions, posSales);
      
    } catch (error) {
      console.error('Error processing Getnet file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const autoReconcile = (getnetTxns: GetnetTransaction[], posSalesData: POSCardSale[]) => {
    const updatedGetnetTxns = [...getnetTxns];
    const updatedPOSSales = [...posSalesData];

    updatedGetnetTxns.forEach((getnetTxn, getnetIndex) => {
      updatedPOSSales.forEach((posSale, posIndex) => {
        // Conciliar por monto y fecha/hora aproximada (tolerancia de 5 minutos)
        if (!getnetTxn.reconciled && !posSale.reconciled) {
          const getnetDateTime = new Date(`${getnetTxn.date}T${getnetTxn.time}`);
          const posDateTime = new Date(`${posSale.date}T${posSale.time}`);
          const timeDifference = Math.abs(getnetDateTime.getTime() - posDateTime.getTime());
          const fiveMinutes = 5 * 60 * 1000; // 5 minutos en millisegundos

          if (
            getnetTxn.amount === posSale.amount &&
            timeDifference <= fiveMinutes &&
            getnetTxn.status === 'approved'
          ) {
            updatedGetnetTxns[getnetIndex].reconciled = true;
            updatedGetnetTxns[getnetIndex].matchedSaleId = posSale.id;
            updatedPOSSales[posIndex].reconciled = true;
            updatedPOSSales[posIndex].matchedGetnetId = getnetTxn.id;
          }
        }
      });
    });

    setGetnetTransactions(updatedGetnetTxns);
    setPOSSales(updatedPOSSales);
    updateStats(updatedGetnetTxns, updatedPOSSales);
  };

  const updateStats = (getnetTxns: GetnetTransaction[], posSalesData: POSCardSale[]) => {
    const reconciledGetnet = getnetTxns.filter(t => t.reconciled);
    const reconciledPOS = posSalesData.filter(s => s.reconciled);
    
    const totalGetnetAmount = getnetTxns.reduce((sum, t) => sum + t.amount, 0);
    const totalPOSAmount = posSalesData.reduce((sum, s) => sum + s.amount, 0);
    const totalFees = getnetTxns.reduce((sum, t) => sum + t.fees, 0);

    const newStats: GetnetReconciliationStats = {
      totalGetnetTransactions: getnetTxns.length,
      totalPOSSales: posSalesData.length,
      matchedTransactions: reconciledGetnet.length,
      unmatchedGetnet: getnetTxns.length - reconciledGetnet.length,
      unmatchedPOS: posSalesData.length - reconciledPOS.length,
      totalGetnetAmount,
      totalPOSAmount,
      differenceAmount: totalGetnetAmount - totalPOSAmount,
      totalFees
    };

    setStats(newStats);
    
    if (onReconciliationComplete) {
      onReconciliationComplete(newStats);
    }
  };

  const getCardTypeColor = (cardType: string) => {
    switch (cardType.toUpperCase()) {
      case 'VISA': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'MASTERCARD': return 'bg-red-100 text-red-700 border-red-200';
      case 'AMEX': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCashRegisterTypeColor = (type: string) => {
    switch (type) {
      case 'recepcion': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'restaurante': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Conciliación Getnet</h1>
            <p className="text-blue-100">
              Concilia las ventas con tarjeta del POS contra los reportes de Getnet
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">💳</div>
            <div className="text-blue-200">Sistema Getnet</div>
          </div>
        </div>
      </div>

      {/* Estadísticas de Conciliación */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Transacciones Getnet</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalGetnetTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ventas POS</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalPOSSales}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Check className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Conciliadas</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.matchedTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 ${Math.abs(stats.differenceAmount) < 1000 ? 'border-green-200' : 'border-orange-200'}`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${Math.abs(stats.differenceAmount) < 1000 ? 'bg-green-100' : 'bg-orange-100'}`}>
                <AlertTriangle className={`h-6 w-6 ${Math.abs(stats.differenceAmount) < 1000 ? 'text-green-600' : 'text-orange-600'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Diferencia</p>
                <p className={`text-lg font-bold ${Math.abs(stats.differenceAmount) < 1000 ? 'text-green-600' : 'text-orange-600'}`}>
                  {formatCurrency(stats.differenceAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumen Financiero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Getnet</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalGetnetAmount)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total POS</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPOSAmount)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Comisiones Getnet</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalFees)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y carga de archivo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Filtros de fecha */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Filtros de Fecha</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Desde</label>
                <Input
                  type="date"
                  value={dateFilter.from}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Hasta</label>
                <Input
                  type="date"
                  value={dateFilter.to}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cargar archivo Getnet */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Cargar Reporte Getnet</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Suba el archivo CSV exportado desde el portal de Getnet con las transacciones del período.
                </AlertDescription>
              </Alert>

              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleGetnetFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                
                {selectedFile && (
                  <div className="text-sm text-gray-600">
                    Archivo: {selectedFile.name}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de visualización */}
      <Tabs defaultValue="getnet" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="getnet">Transacciones Getnet</TabsTrigger>
          <TabsTrigger value="pos">Ventas POS</TabsTrigger>
          <TabsTrigger value="matched">Conciliadas</TabsTrigger>
        </TabsList>

        {/* Transacciones Getnet */}
        <TabsContent value="getnet">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Transacciones Getnet</span>
                <Badge variant="outline">{getnetTransactions.length} transacciones</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getnetTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className={`p-4 border rounded-lg ${
                      transaction.reconciled 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getCardTypeColor(transaction.cardType)}>
                            {transaction.cardType}
                          </Badge>
                          <Badge variant="outline">
                            Terminal: {transaction.terminalId}
                          </Badge>
                          {transaction.reconciled && (
                            <Badge className="bg-green-600 text-white">
                              <Check className="h-3 w-3 mr-1" />
                              Conciliada
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                          <span>📅 {transaction.date}</span>
                          <span>🕐 {transaction.time}</span>
                          <span>🔐 {transaction.authCode}</span>
                          <span>📋 {transaction.transactionId}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600">
                          {formatCurrency(transaction.amount)}
                        </div>
                        <div className="text-sm text-red-600">
                          Comisión: {formatCurrency(transaction.fees)}
                        </div>
                        <div className="text-sm font-medium text-blue-600">
                          Neto: {formatCurrency(transaction.netAmount)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {getnetTransactions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay transacciones de Getnet cargadas</p>
                    <p className="text-sm">Sube un archivo CSV de Getnet para comenzar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ventas POS */}
        <TabsContent value="pos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Ventas POS con Tarjeta</span>
                <Badge variant="outline">{posSales.length} ventas</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {posSales.map((sale) => (
                  <div
                    key={sale.id}
                    className={`p-4 border rounded-lg ${
                      sale.reconciled 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getCashRegisterTypeColor(sale.cashRegisterType)}>
                            {sale.cashRegisterType === 'recepcion' ? 'Recepción' : 'Restaurante'}
                          </Badge>
                          {sale.terminal && (
                            <Badge variant="outline">
                              Terminal: {sale.terminal}
                            </Badge>
                          )}
                          {sale.reconciled && (
                            <Badge className="bg-green-600 text-white">
                              <Check className="h-3 w-3 mr-1" />
                              Conciliada
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          <span>📅 {sale.date}</span>
                          <span>🕐 {sale.time}</span>
                          <span>👤 {sale.customerName || 'Cliente'}</span>
                          {sale.receiptNumber && (
                            <span>🧾 {sale.receiptNumber}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600">
                          {formatCurrency(sale.amount)}
                        </div>
                        <div className="text-sm text-gray-600">
                          Venta POS
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {posSales.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay ventas con tarjeta en el período seleccionado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transacciones Conciliadas */}
        <TabsContent value="matched">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Transacciones Conciliadas</span>
                <Badge className="bg-green-600 text-white">
                  {stats.matchedTransactions} coincidencias
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getnetTransactions
                  .filter(transaction => transaction.reconciled)
                  .map((transaction) => {
                    const matchedSale = posSales.find(
                      s => s.id === transaction.matchedSaleId
                    );
                    
                    return (
                      <div key={transaction.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                        <div className="flex items-center justify-between mb-3">
                          <Badge className="bg-green-600 text-white">
                            <Check className="h-3 w-3 mr-1" />
                            Conciliación Exitosa
                          </Badge>
                          <div className="text-lg font-semibold text-green-600">
                            {formatCurrency(transaction.amount)}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Transacción Getnet */}
                          <div className="bg-white p-3 rounded border">
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                              <CreditCard className="h-4 w-4 mr-2" />
                              Transacción Getnet
                            </h4>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p><strong>Tarjeta:</strong> {transaction.cardType}</p>
                              <p><strong>Fecha/Hora:</strong> {transaction.date} {transaction.time}</p>
                              <p><strong>Terminal:</strong> {transaction.terminalId}</p>
                              <p><strong>Auth Code:</strong> {transaction.authCode}</p>
                              <p><strong>Comisión:</strong> {formatCurrency(transaction.fees)}</p>
                              <p><strong>Monto Neto:</strong> {formatCurrency(transaction.netAmount)}</p>
                            </div>
                          </div>
                          
                          {/* Venta POS */}
                          {matchedSale && (
                            <div className="bg-white p-3 rounded border">
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                <DollarSign className="h-4 w-4 mr-2" />
                                Venta POS
                              </h4>
                              <div className="space-y-1 text-sm text-gray-600">
                                <p><strong>Tipo:</strong> {matchedSale.cashRegisterType === 'recepcion' ? 'Recepción' : 'Restaurante'}</p>
                                <p><strong>Fecha/Hora:</strong> {matchedSale.date} {matchedSale.time}</p>
                                <p><strong>Cliente:</strong> {matchedSale.customerName || 'Cliente'}</p>
                                {matchedSale.receiptNumber && (
                                  <p><strong>Recibo:</strong> {matchedSale.receiptNumber}</p>
                                )}
                                <p><strong>Monto:</strong> {formatCurrency(matchedSale.amount)}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                
                {stats.matchedTransactions === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay transacciones conciliadas aún</p>
                    <p className="text-sm">Las conciliaciones aparecerán cuando se procesen los archivos</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Acciones */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          <p>Conciliación automática por monto y tiempo (tolerancia: 5 minutos)</p>
        </div>
        
        <div className="space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Reporte
          </Button>
          <Button>
            <Check className="h-4 w-4 mr-2" />
            Confirmar Conciliaciones
          </Button>
        </div>
      </div>
    </div>
  );
} 