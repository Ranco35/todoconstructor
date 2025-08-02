'use client';

import React, { useEffect, useState } from 'react';
import { getTodayAnalysis, getLastSyncInfo } from '@/actions/emails/analysis-actions';
import { getTodayArrivals, getTodayDepartures } from '@/actions/reservations/dashboard';
import PopupConfigModal from './PopupConfigModal';

interface EmailAnalysisPopupProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  trigger: 'login' | 'analysis' | 'manual';
}

interface AnalysisData {
  id: string;
  executionTime: string;
  timeSlot: string;
  totalEmails: number;
  urgentEmails: number;
  sentiment: string;
  keyTopics: string[];
  recommendedActions: string[];
  summaryData: any;
}

interface ReservationInfo {
  id: number;
  client_nombre: string;
  room_name?: string;
  status: string;
  check_in: string;
  check_out: string;
}

interface SyncInfo {
  lastSync: Date | null;
  lastSyncText: string;
  nextSync: string;
  totalAnalysisToday: number;
}

interface PaymentInfo {
  senderEmail?: string;
  email?: string;
  subject?: string;
  amount?: string;
  method?: string;
  reservationReference?: string;
}

interface ClientInfo {
  email: string;
  name?: string;
  paymentMentioned?: boolean;
  paymentAmount?: string;
  reservationDates?: string;
}

export default function EmailAnalysisPopup({ 
  isOpen, 
  onClose, 
  userName, 
  trigger 
}: EmailAnalysisPopupProps) {
  const [analysis, setAnalysis] = useState<AnalysisData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayArrivals, setTodayArrivals] = useState<ReservationInfo[]>([]);
  const [todayDepartures, setTodayDepartures] = useState<ReservationInfo[]>([]);
  const [syncInfo, setSyncInfo] = useState<SyncInfo | null>(null);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [paymentEmails, setPaymentEmails] = useState<PaymentInfo[]>([]);
  const [clientEmails, setClientEmails] = useState<ClientInfo[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAllData();
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setLoadingReservations(true);
      
      console.log('🔍 EmailAnalysisPopup - cargando todos los datos...');
      
      // Cargar datos en paralelo
      const [analysisResult, syncResult, arrivalsResult, departuresResult] = await Promise.all([
        getTodayAnalysis(),
        getLastSyncInfo(),
        getTodayArrivals(),
        getTodayDepartures()
      ]);

      // Procesar análisis de correos
      if (analysisResult.success && analysisResult.data) {
        console.log('✅ EmailAnalysisPopup - datos de análisis recibidos:', analysisResult.data);
        
        const mappedData = analysisResult.data.map((item: any) => {
          let keyTopics = [];
          let recommendedActions = [];
          
          try {
            if (typeof item.keyTopics === 'string') {
              keyTopics = JSON.parse(item.keyTopics);
            } else if (Array.isArray(item.keyTopics)) {
              keyTopics = item.keyTopics;
            }
          } catch (e) {
            console.warn('Error parsing keyTopics:', e);
            keyTopics = [];
          }
          
          try {
            if (typeof item.actionRequired === 'string') {
              const parsed = JSON.parse(item.actionRequired);
              recommendedActions = Array.isArray(parsed) ? parsed : [parsed];
            } else if (Array.isArray(item.actionRequired)) {
              recommendedActions = item.actionRequired;
            }
          } catch (e) {
            console.warn('Error parsing actionRequired:', e);
            recommendedActions = [];
          }
          
          // Extraer información de pagos y clientes del análisis detallado
          let paymentsDetected = [];
          let clientsIdentified = [];
          
          try {
            if (item.detailedAnalysis && typeof item.detailedAnalysis === 'string') {
              const detailedData = JSON.parse(item.detailedAnalysis);
              if (detailedData.paymentsDetected && Array.isArray(detailedData.paymentsDetected)) {
                paymentsDetected = detailedData.paymentsDetected;
              }
              if (detailedData.clientsIdentified && Array.isArray(detailedData.clientsIdentified)) {
                clientsIdentified = detailedData.clientsIdentified;
              }
            }
          } catch (e) {
            console.warn('Error parsing detailed analysis:', e);
          }
          
          return {
            id: item.id,
            executionTime: item.executionTime,
            timeSlot: item.timeSlot,
            totalEmails: item.emailsAnalyzed || 0,
            urgentEmails: item.urgentEmails || 0,
            sentiment: (item.sentimentAnalysis && typeof item.sentimentAnalysis === 'string') ? item.sentimentAnalysis : 'No determinado',
            keyTopics: keyTopics,
            recommendedActions: recommendedActions,
            summaryData: item,
            paymentsDetected: paymentsDetected,
            clientsIdentified: clientsIdentified
          };
        });
        
        setAnalysis(mappedData);
        
        // Extraer pagos y clientes del análisis más reciente
        if (mappedData.length > 0) {
          const latestAnalysis = mappedData[0];
          if (latestAnalysis.paymentsDetected && latestAnalysis.paymentsDetected.length > 0) {
            setPaymentEmails(latestAnalysis.paymentsDetected);
            console.log('💰 Correos de pagos detectados:', latestAnalysis.paymentsDetected.length);
          }
          if (latestAnalysis.clientsIdentified && latestAnalysis.clientsIdentified.length > 0) {
            setClientEmails(latestAnalysis.clientsIdentified);
            console.log('👥 Clientes identificados:', latestAnalysis.clientsIdentified.length);
          }
        }
      } else {
        console.warn('❌ EmailAnalysisPopup - no hay datos de análisis:', analysisResult);
        setAnalysis([]);
      }

      // Procesar información de sincronización
      if (syncResult.success && syncResult.data) {
        setSyncInfo(syncResult.data);
        console.log('✅ Información de sincronización cargada:', syncResult.data);
      }

      // Procesar reservas que llegan hoy
      if (arrivalsResult.success && arrivalsResult.data) {
        const mappedArrivals = arrivalsResult.data.map(item => ({
          id: item.id,
          client_nombre: item.client_nombre || 'Sin nombre',
          room_name: item.room_name,
          status: item.status,
          check_in: item.check_in,
          check_out: item.check_out
        }));
        setTodayArrivals(mappedArrivals);
        console.log('✅ Llegadas de hoy cargadas:', mappedArrivals.length);
      }

      // Procesar reservas que se van hoy
      if (departuresResult.success && departuresResult.data) {
        const mappedDepartures = departuresResult.data.map(item => ({
          id: item.id,
          client_nombre: item.client_nombre || 'Sin nombre',
          room_name: item.room_name,
          status: item.status,
          check_in: item.check_in,
          check_out: item.check_out
        }));
        setTodayDepartures(mappedDepartures);
        console.log('✅ Salidas de hoy cargadas:', mappedDepartures.length);
      }

    } catch (error) {
      console.error('❌ EmailAnalysisPopup - error loading data:', error);
    } finally {
      setLoading(false);
      setLoadingReservations(false);
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    const firstName = userName.split(' ')[0];
    
    let greeting = '';
    if (hour < 12) greeting = 'Buenos días';
    else if (hour < 18) greeting = 'Buenas tardes';
    else greeting = 'Buenas noches';

    switch (trigger) {
      case 'login':
        return `¡${greeting}, ${firstName}! 🌟`;
      case 'analysis':
        return `¡${greeting}, ${firstName}! 📧 Nuevo análisis completado`;
      case 'manual':
        return `¡Hola ${firstName}! 📊 Análisis solicitado`;
      default:
        return `¡${greeting}, ${firstName}!`;
    }
  };

  const getWelcomeMessage = () => {
    switch (trigger) {
      case 'login':
        return 'Bienvenido de vuelta al sistema. Aquí tienes el resumen del día';
      case 'analysis':
        return 'Se ha completado un nuevo análisis automático de correos electrónicos';
      case 'manual':
        return 'Has solicitado ver el análisis de correos del día';
      default:
        return 'Resumen del día';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'prereserva': return 'bg-yellow-100 text-yellow-800';
      case 'confirmada': return 'bg-green-100 text-green-800';
      case 'en_curso': return 'bg-blue-100 text-blue-800';
      case 'finalizada': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const getTimeSlotName = (timeSlot: string) => {
    const slots = {
      'morning': '🌅 Mañana (6:00-12:00)',
      'midday': '☀️ Mediodía (12:00-15:00)',
      'afternoon': '🌇 Tarde (15:00-20:00)',
      'evening': '🌙 Noche (20:00-6:00)'
    };
    return slots[timeSlot as keyof typeof slots] || timeSlot;
  };

  const getSentimentColor = (sentiment: string) => {
    if (!sentiment || typeof sentiment !== 'string') {
      return 'text-blue-600 bg-blue-100';
    }
    
    switch (sentiment.toLowerCase()) {
      case 'positivo': return 'text-green-600 bg-green-100';
      case 'negativo': return 'text-red-600 bg-red-100';
      case 'neutral': return 'text-gray-600 bg-gray-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getLatestAnalysis = () => {
    if (!analysis.length) return null;
    return analysis.sort((a, b) => 
      new Date(b.executionTime).getTime() - new Date(a.executionTime).getTime()
    )[0];
  };

  if (!isOpen) return null;

  const latestAnalysis = getLatestAnalysis();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">{getGreeting()}</h2>
                <p className="text-blue-100 text-lg">{getWelcomeMessage()}</p>
                <p className="text-blue-200 text-sm mt-1">
                  {currentTime.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="text-white hover:text-yellow-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
                  title="Configurar modal de bienvenida"
                >
                  ⚙️
                </button>
                <button
                  onClick={onClose}
                  className="text-white hover:text-red-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {loading || loadingReservations ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-4 text-gray-600">Cargando información del día...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumen del día con grid de 3 columnas */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Columna 1: Análisis de Correos */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                    📧 Correos Electrónicos
                  </h3>
                  
                  {syncInfo && (
                    <div className="mb-4 space-y-2">
                      <div className="text-sm">
                        <span className="text-gray-600">Última sincronización:</span>
                        <span className="ml-1 font-medium text-blue-700">{syncInfo.lastSyncText}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Próxima sincronización:</span>
                        <span className="ml-1 font-medium text-gray-700">{syncInfo.nextSync}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Análisis realizados hoy:</span>
                        <span className="ml-1 font-medium text-purple-700">{syncInfo.totalAnalysisToday}</span>
                      </div>
                    </div>
                  )}

                  {!latestAnalysis ? (
                    <div className="text-center py-6">
                      <div className="text-4xl mb-2">📭</div>
                      <p className="text-gray-600 text-sm">
                        No hay análisis disponibles.
                        <br />
                        El análisis automático se ejecuta 4 veces al día.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-blue-600">{latestAnalysis.totalEmails}</div>
                          <div className="text-xs text-gray-600">📧 Correos</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-red-600">{latestAnalysis.urgentEmails}</div>
                          <div className="text-xs text-gray-600">🚨 Urgentes</div>
                        </div>
                      </div>
                      
                      {latestAnalysis.sentiment && (
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(latestAnalysis.sentiment)}`}>
                            {latestAnalysis.sentiment}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">😊 Sentimiento</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Columna 2: Llegadas de Hoy */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                    🏨 Llegadas de Hoy
                  </h3>
                  
                  {todayArrivals.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="text-4xl mb-2">🛄</div>
                      <p className="text-gray-600 text-sm">
                        No hay llegadas programadas para hoy
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-center mb-4">
                        <div className="text-2xl font-bold text-green-600">{todayArrivals.length}</div>
                        <div className="text-sm text-gray-600">Reservas llegando</div>
                      </div>
                      
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {todayArrivals.slice(0, 5).map((arrival) => (
                          <div key={arrival.id} className="bg-white rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-sm text-gray-900 truncate">
                                  {arrival.client_nombre}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {arrival.room_name || 'Sin habitación'}
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(arrival.status)}`}>
                                {arrival.status}
                              </span>
                            </div>
                          </div>
                        ))}
                        {todayArrivals.length > 5 && (
                          <div className="text-center text-xs text-gray-500 py-2">
                            +{todayArrivals.length - 5} más...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  </div>

                {/* Columna 3: Salidas de Hoy */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                  <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
                    🚪 Salidas de Hoy
                  </h3>
                  
                  {todayDepartures.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="text-4xl mb-2">🧳</div>
                      <p className="text-gray-600 text-sm">
                        No hay salidas programadas para hoy
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-center mb-4">
                        <div className="text-2xl font-bold text-orange-600">{todayDepartures.length}</div>
                        <div className="text-sm text-gray-600">Reservas saliendo</div>
                      </div>
                      
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {todayDepartures.slice(0, 5).map((departure) => (
                          <div key={departure.id} className="bg-white rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-sm text-gray-900 truncate">
                                  {departure.client_nombre}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {departure.room_name || 'Sin habitación'}
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(departure.status)}`}>
                                {departure.status}
                              </span>
                            </div>
                          </div>
                        ))}
                        {todayDepartures.length > 5 && (
                          <div className="text-center text-xs text-gray-500 py-2">
                            +{todayDepartures.length - 5} más...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sección de PAGOS Y CLIENTES DETECTADOS - ALTA PRIORIDAD */}
              {(paymentEmails.length > 0 || clientEmails.length > 0) && (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-300">
                  <h3 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
                    🚨 ¡ATENCIÓN! Correos Críticos Detectados
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Correos de PAGOS detectados */}
                    {paymentEmails.length > 0 && (
                      <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                        <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                          💰 PAGOS DETECTADOS ({paymentEmails.length})
                        </h4>
                        <div className="space-y-3 max-h-40 overflow-y-auto">
                          {paymentEmails.map((payment, index) => (
                            <div key={index} className="bg-green-50 rounded-lg p-3 border border-green-200">
                              <div className="text-sm font-medium text-green-900">
                                📧 {payment.senderEmail || payment.email}
                              </div>
                              {payment.amount && (
                                <div className="text-sm text-green-700 font-bold">
                                  💵 {payment.amount}
                                </div>
                              )}
                              {payment.method && (
                                <div className="text-xs text-green-600">
                                  🏦 {payment.method}
                                </div>
                              )}
                              {payment.reservationReference && (
                                <div className="text-xs text-blue-600">
                                  📅 {payment.reservationReference}
                                </div>
                              )}
                              <div className="text-xs text-gray-600 mt-1">
                                📋 {payment.subject || 'Sin asunto'}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 p-2 bg-yellow-100 rounded text-xs text-yellow-800">
                          ⚡ <strong>ACCIÓN REQUERIDA:</strong> Verificar estos pagos y asociarlos con reservas
                        </div>
                      </div>
                    )}

                    {/* CLIENTES identificados */}
                    {clientEmails.length > 0 && (
                      <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                        <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                          👥 CLIENTES IDENTIFICADOS ({clientEmails.length})
                        </h4>
                        <div className="space-y-3 max-h-40 overflow-y-auto">
                          {clientEmails.map((client, index) => (
                            <div key={index} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                              <div className="text-sm font-medium text-blue-900">
                                👤 {client.name || 'Sin nombre detectado'}
                              </div>
                              <div className="text-sm text-blue-700">
                                📧 {client.email}
                              </div>
                              {client.paymentMentioned && (
                                <div className="text-xs text-green-600 font-medium">
                                  💰 Menciona pago
                                  {client.paymentAmount && ` (${client.paymentAmount})`}
                                </div>
                              )}
                              {client.reservationDates && (
                                <div className="text-xs text-purple-600">
                                  📅 {client.reservationDates}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
                          ⚡ <strong>ACCIÓN REQUERIDA:</strong> Verificar en base de datos y actualizar historial
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botones de acción rápida para pagos y clientes */}
                  <div className="mt-4 flex flex-wrap gap-3 justify-center">
                    {paymentEmails.length > 0 && (
                      <button
                        onClick={() => window.open('/dashboard/reservations?filter=payments', '_blank')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        💰 Gestionar Pagos
                      </button>
                    )}
                    {clientEmails.length > 0 && (
                      <button
                        onClick={() => window.open('/dashboard/customers', '_blank')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        👥 Ver Clientes
                      </button>
                    )}
                    <button
                      onClick={() => window.open('/dashboard/emails', '_blank')}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                      📧 Revisar Correos
                    </button>
                  </div>
                </div>
              )}

              {/* Información adicional de análisis si existe */}
              {latestAnalysis && (latestAnalysis.keyTopics?.length > 0 || latestAnalysis.recommendedActions?.length > 0) && (
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    📊 Detalles del Último Análisis
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Temas clave */}
                {latestAnalysis.keyTopics && latestAnalysis.keyTopics.length > 0 && (
                      <div>
                    <h4 className="font-semibold text-gray-800 mb-2">🔍 Temas principales:</h4>
                    <div className="flex flex-wrap gap-2">
                      {latestAnalysis.keyTopics.map((topic, index) => (
                        <span 
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Acciones recomendadas */}
                {latestAnalysis.recommendedActions && latestAnalysis.recommendedActions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">💡 Acciones recomendadas:</h4>
                    <ul className="space-y-1">
                          {latestAnalysis.recommendedActions.slice(0, 3).map((action, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                              <span className="text-gray-700 text-sm">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex justify-center gap-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => window.open('/dashboard/reservations', '_blank')}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  🏨 Ver Reservas
                </button>
                <button
                  onClick={() => window.open('/dashboard/emails', '_blank')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  📧 Ver Correos
                </button>
                <button
                  onClick={onClose}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  ✅ Entendido
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de configuración */}
      <PopupConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />
    </div>
  );
} 