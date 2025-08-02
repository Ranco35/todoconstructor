'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  MailOpen, 
  Bot, 
  RefreshCw, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Eye,
  Trash2,
  Calendar,
  MessageSquare,
  BarChart3,
  Brain,
  Sparkles,
  Play,
  History,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getTodayAnalysis,
  getRecentAnalysis,
  deleteAnalysis,
  forceNewAnalysis,
  type EmailAnalysisResult
} from '@/actions/emails/analysis-actions';
import { useEmailAnalysisPopup } from '@/contexts/EmailAnalysisContext';
import ClientEmailAssociations from './ClientEmailAssociations';
import SentEmailsSummary from './SentEmailsSummary';

export default function EmailDashboard() {
  const [todayAnalysis, setTodayAnalysis] = useState<EmailAnalysisResult[]>([]);
  const [recentAnalysis, setRecentAnalysis] = useState<EmailAnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedAnalysis, setExpandedAnalysis] = useState<number | null>(null);
  const { showPopup } = useEmailAnalysisPopup();

  // Cargar datos iniciales
  useEffect(() => {
    loadAnalysisData();
  }, []);

  const loadAnalysisData = async () => {
    setLoading(true);
    try {
      const [todayResult, recentResult] = await Promise.all([
        getTodayAnalysis(),
        getRecentAnalysis(10)
      ]);

      if (todayResult.success) {
        setTodayAnalysis(todayResult.data || []);
      }

      if (recentResult.success) {
        setRecentAnalysis(recentResult.data || []);
      }
    } catch (error) {
      console.error('Error cargando análisis:', error);
      toast.error('Error cargando datos de análisis');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async (force = false) => {
    setAnalyzing(true);
    try {
      let result;

      if (force) {
        result = await forceNewAnalysis();
        toast.success('Análisis forzado iniciado...');
      } else {
        // Realizar análisis normal (endpoint API)
        const response = await fetch('/api/emails/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          result = { success: true };
          toast.success('Análisis iniciado exitosamente');
        } else {
          result = { success: false, error: 'Error en API' };
          toast.error('Error iniciando análisis');
        }
      }

      if (result.success) {
        // Mostrar popup después del análisis exitoso
        setTimeout(() => {
          showPopup('analysis');
        }, 1500);
        
        // Esperar un momento y recargar datos
        setTimeout(() => {
          loadAnalysisData();
        }, 2000);
      }
    } catch (error) {
      console.error('Error ejecutando análisis:', error);
      toast.error('Error ejecutando análisis');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteAnalysis = async (id: number) => {
    try {
      const result = await deleteAnalysis(id);
      if (result.success) {
        toast.success('Análisis eliminado');
        await loadAnalysisData();
      } else {
        toast.error(`Error eliminando análisis: ${result.error}`);
      }
    } catch (error) {
      console.error('Error eliminando análisis:', error);
      toast.error('Error eliminando análisis');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSlotLabel = (slot: string) => {
    const labels = {
      morning: '🌅 Mañana (06:00-12:00)',
      midday: '☀️ Mediodía (12:00-15:00)', 
      afternoon: '🌆 Tarde (15:00-20:00)',
      evening: '🌙 Noche (20:00-06:00)'
    };
    return labels[slot as keyof typeof labels] || slot;
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.3) return '😊';
    if (score < -0.3) return '😟';
    return '😐';
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: { variant: 'default' as const, label: '✅ Completado', color: 'bg-green-100 text-green-800' },
      processing: { variant: 'secondary' as const, label: '⏳ Procesando', color: 'bg-yellow-100 text-yellow-800' },
      failed: { variant: 'destructive' as const, label: '❌ Error', color: 'bg-red-100 text-red-800' }
    };
    
    const config = variants[status as keyof typeof variants] || variants.completed;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-lg text-gray-600">Cargando análisis de correos...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Controles */}
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => showPopup('manual')}
            className="flex items-center gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <Sparkles className="w-4 h-4" />
            Ver Resumen
          </Button>
          <Button
            variant="outline"
            onClick={() => loadAnalysisData()}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            onClick={() => handleRunAnalysis(false)}
            disabled={analyzing}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex items-center gap-2"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" />
                Ejecutar Análisis
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleRunAnalysis(true)}
            disabled={analyzing}
            className="flex items-center gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
          >
            <Zap className="w-4 h-4" />
            Forzar Nuevo
          </Button>
        </div>

        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                  <div>
                  <p className="text-sm text-blue-700 font-medium">Análisis Hoy</p>
                  <p className="text-2xl font-bold text-blue-900">{todayAnalysis.length}</p>
                </div>
                </div>
              </CardContent>
            </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                  <div>
                  <p className="text-sm text-green-700 font-medium">Completados</p>
                  <p className="text-2xl font-bold text-green-900">
                    {recentAnalysis.filter(a => a.analysisStatus === 'completed').length}
                  </p>
                </div>
                </div>
              </CardContent>
            </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                  <div>
                  <p className="text-sm text-purple-700 font-medium">Emails Analizados</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {todayAnalysis.reduce((sum, a) => sum + (a.emailsAnalyzed || 0), 0)}
                    </p>
                  </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-orange-700 font-medium">Urgentes</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {todayAnalysis.reduce((sum, a) => sum + (a.urgentEmails?.length || 0), 0)}
                  </p>
                </div>
                </div>
              </CardContent>
            </Card>
          </div>

        {/* Análisis del Día */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Análisis de Hoy
            </CardTitle>
            <CardDescription>
              Reportes automáticos generados para el día de hoy
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todayAnalysis.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No hay análisis para hoy</p>
                <p className="text-sm text-gray-400 mt-1">
                  Ejecuta un análisis para ver los resultados
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayAnalysis.map((analysis) => (
                  <Card key={analysis.id} className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{getTimeSlotLabel(analysis.timeSlot)}</span>
                          {getStatusBadge(analysis.analysisStatus)}
                        </div>
                        <div className="flex items-center gap-2">
              <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedAnalysis(
                              expandedAnalysis === analysis.id ? null : analysis.id
                            )}
                          >
                            <Eye className="h-4 w-4" />
              </Button>
              <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAnalysis(analysis.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
              </Button>
            </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {analysis.emailsAnalyzed} emails
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDate(analysis.executionTime)}
                          </span>
                          {analysis.sentimentAnalysis && (
                            <span className="flex items-center gap-1">
                              <span>{getSentimentIcon(analysis.sentimentAnalysis.score)}</span>
                              Sentimiento: {(analysis.sentimentAnalysis.score * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>

                        <p className="text-gray-700">{analysis.summary}</p>

                        {analysis.keyTopics && analysis.keyTopics.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {analysis.keyTopics.map((topic, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {expandedAnalysis === analysis.id && (
                          <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                            {analysis.detailedAnalysis && (
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Análisis Detallado</h4>
                                <p className="text-sm text-gray-700">{analysis.detailedAnalysis}</p>
                              </div>
                            )}

                            {analysis.urgentEmails && analysis.urgentEmails.length > 0 && (
                              <div>
                                <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4" />
                                  Correos Urgentes ({analysis.urgentEmails.length})
                                </h4>
                                <div className="space-y-2">
                                  {analysis.urgentEmails.map((urgent: any, index: number) => (
                                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                                      <p className="font-medium text-red-900">{urgent.subject}</p>
                                      <p className="text-sm text-red-700">De: {urgent.from}</p>
                                      <p className="text-sm text-red-600">Razón: {urgent.reason}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {analysis.actionRequired && analysis.actionRequired.length > 0 && (
                              <div>
                                <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4" />
                                  Acciones Recomendadas
                                </h4>
                                <ul className="space-y-1">
                                  {analysis.actionRequired.map((action: string, index: number) => (
                                    <li key={index} className="text-sm text-blue-700 flex items-center gap-2">
                                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                      {action}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {analysis.sentimentAnalysis && (
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Análisis de Sentimientos</h4>
                                <div className="grid grid-cols-3 gap-3">
                                  <div className="text-center p-2 bg-green-50 rounded">
                                    <p className="text-sm text-green-700">Positivos</p>
                                    <p className="text-lg font-bold text-green-900">
                                      {analysis.sentimentAnalysis.positive}
                                    </p>
                                  </div>
                                  <div className="text-center p-2 bg-gray-50 rounded">
                                    <p className="text-sm text-gray-700">Neutrales</p>
                                    <p className="text-lg font-bold text-gray-900">
                                      {analysis.sentimentAnalysis.neutral}
                                    </p>
                                  </div>
                                  <div className="text-center p-2 bg-red-50 rounded">
                                    <p className="text-sm text-red-700">Negativos</p>
                                    <p className="text-lg font-bold text-red-900">
                                      {analysis.sentimentAnalysis.negative}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historial Reciente */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-gray-600" />
              Historial Reciente
            </CardTitle>
            <CardDescription>
              Últimos 10 análisis realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentAnalysis.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No hay historial disponible</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentAnalysis.map((analysis) => (
                  <div key={analysis.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">
                        {formatDate(analysis.executionTime)}
                      </span>
                      <span className="text-sm">
                        {getTimeSlotLabel(analysis.timeSlot)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {analysis.emailsAnalyzed} emails
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(analysis.analysisStatus)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAnalysis(analysis.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clientes Identificados */}
        <ClientEmailAssociations showRecent={true} maxResults={15} />

        {/* Correos Enviados */}
        <SentEmailsSummary showRecent={true} maxResults={15} />

        {/* Configuración del Sistema */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-700">
              <Sparkles className="h-5 w-5" />
              Configuración del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-indigo-700 mb-2">Análisis Automático</h4>
                <ul className="space-y-1 text-indigo-600">
                  <li>• 4 veces al día (mañana, mediodía, tarde, noche)</li>
                  <li>• Máximo 50 emails por análisis</li>
                  <li>• Solo emails del día actual</li>
                  <li>• Análisis con ChatGPT 3.5 Turbo</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-indigo-700 mb-2">Funcionalidades</h4>
                <ul className="space-y-1 text-indigo-600">
                  <li>• Análisis de sentimientos</li>
                  <li>• Detección de emails urgentes</li>
                  <li>• Identificación de temas clave</li>
                  <li>• Recomendaciones de acciones</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-indigo-100 rounded-lg">
              <p className="text-sm text-indigo-700">
                <strong>💡 Tip:</strong> Para automatizar completamente el sistema, configura un cron job 
                que llame al endpoint <code>/api/emails/analyze</code> cada 6 horas.
              </p>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 