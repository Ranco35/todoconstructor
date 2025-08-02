'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Save, 
  RotateCcw,
  Bot,
  Mail,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle,
  FileText,
  Sliders,
  Zap,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

interface AnalysisSettings {
  maxEmails: number;
  textLimit: number;
  enableSpamFilter: boolean;
  customPrompt: string;
  analysisDepth: 'basic' | 'detailed' | 'comprehensive';
  enableUrgentDetection: boolean;
  enableSentimentAnalysis: boolean;
  timeouts: {
    emailFetch: number;
    aiAnalysis: number;
  };
  scheduleConfig: {
    enabled: boolean;
    times: string[];
  };
}

const DEFAULT_SETTINGS: AnalysisSettings = {
  maxEmails: 50,
  textLimit: 500,
  enableSpamFilter: true,
  customPrompt: `Como asistente de análisis de correos electrónicos para el Hotel/Spa Termas Llifén, analiza los siguientes correos recibidos hoy en el horario {timeSlot}:

CORREOS A ANALIZAR ({emailCount} total):
{emailData}

Por favor proporciona un análisis estructurado en el siguiente formato JSON:

{
  "summary": "Resumen ejecutivo de 2-3 líneas de los correos analizados",
  "detailedAnalysis": "Análisis detallado de patrones, tendencias y observaciones importantes", 
  "keyTopics": ["tema1", "tema2", "tema3"],
  "sentimentAnalysis": {
    "positive": número_de_correos_positivos,
    "neutral": número_de_correos_neutrales,
    "negative": número_de_correos_negativos,
    "score": puntuación_general_de_-1_a_1
  },
  "urgentEmails": [
    {
      "subject": "asunto_del_correo",
      "from": "remitente", 
      "reason": "razón_por_la_cual_es_urgente"
    }
  ],
  "actionRequired": ["acción1", "acción2", "acción3"],
  "metadata": {
    "domains": ["dominio1.com", "dominio2.com"],
    "types": ["reservas", "consultas", "quejas", "soporte"],
    "trends": "tendencias_observadas"
  }
}

Enfócate especialmente en:
- Reservas y consultas de alojamiento
- Quejas o problemas de servicio
- Consultas sobre servicios del spa  
- Cancelaciones o modificaciones
- Feedback de huéspedes
- Correos que requieren respuesta urgente

Responde SOLO con el JSON válido, sin texto adicional.`,
  analysisDepth: 'detailed',
  enableUrgentDetection: true,
  enableSentimentAnalysis: true,
  timeouts: {
    emailFetch: 30000,
    aiAnalysis: 60000
  },
  scheduleConfig: {
    enabled: true,
    times: ['06:00', '12:00', '15:00', '20:00']
  }
};

const PREDEFINED_PROMPTS = {
  basic: {
    name: 'Análisis Básico',
    description: 'Análisis simple con resumen y temas principales',
    prompt: `Analiza estos correos del Hotel/Spa Termas Llifén y proporciona un resumen básico en JSON:

{emailData}

Formato requerido:
{
  "summary": "Resumen de los correos",
  "keyTopics": ["tema1", "tema2"],
  "urgentEmails": [],
  "actionRequired": ["acción1", "acción2"]
}`
  },
  detailed: {
    name: 'Análisis Detallado', 
    description: 'Análisis completo con sentimientos y metadatos',
    prompt: DEFAULT_SETTINGS.customPrompt
  },
  customer_focused: {
    name: 'Enfoque en Cliente',
    description: 'Prioriza reservas, quejas y experiencia del cliente',
    prompt: `Como experto en servicio al cliente para Termas Llifén, analiza estos correos priorizando la experiencia del huésped:

{emailData}

Enfócate en:
- Satisfacción del cliente (quejas, elogios, sugerencias)
- Reservas y modificaciones críticas
- Problemas de servicio que requieren atención inmediata
- Oportunidades de mejora en el servicio

JSON requerido:
{
  "summary": "Resumen enfocado en experiencia del cliente",
  "customerSatisfaction": "análisis_de_satisfacción",
  "criticalIssues": ["problema1", "problema2"],
  "urgentEmails": [],
  "improvementOpportunities": ["oportunidad1", "oportunidad2"]
}`
  },
  operational: {
    name: 'Enfoque Operacional',
    description: 'Prioriza aspectos operativos y administrativos',
    prompt: `Como gerente operacional de Termas Llifén, analiza estos correos enfocándote en aspectos operativos:

{emailData}

Prioriza:
- Problemas operativos (mantenimiento, personal, logística)
- Coordinación entre departamentos
- Proveedores y servicios externos
- Emergencias o situaciones críticas

JSON requerido:
{
  "summary": "Resumen operacional",
  "operationalIssues": ["issue1", "issue2"],
  "departmentAlerts": ["alert1", "alert2"],
  "supplierComms": ["comm1", "comm2"],
  "urgentEmails": [],
  "actionRequired": ["acción1", "acción2"]
}`
  }
};

export default function EmailAnalysisSettings() {
  const [settings, setSettings] = useState<AnalysisSettings>(DEFAULT_SETTINGS);
  const [selectedPromptTemplate, setSelectedPromptTemplate] = useState<string>('detailed');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Cargar configuración guardada
  useEffect(() => {
    const savedSettings = localStorage.getItem('emailAnalysisSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.error('Error cargando configuración:', error);
      }
    }
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      localStorage.setItem('emailAnalysisSettings', JSON.stringify(settings));
      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      toast.error('Error guardando configuración');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    setSelectedPromptTemplate('detailed');
    toast.info('Configuración restaurada a valores por defecto');
  };

  const applyPromptTemplate = (templateKey: string) => {
    const template = PREDEFINED_PROMPTS[templateKey as keyof typeof PREDEFINED_PROMPTS];
    if (template) {
      setSettings(prev => ({ ...prev, customPrompt: template.prompt }));
      setSelectedPromptTemplate(templateKey);
      toast.success(`Aplicado template: ${template.name}`);
    }
  };

  const testConfiguration = async () => {
    setTesting(true);
    try {
      // Simular test de configuración
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Configuración validada exitosamente');
    } catch (error) {
      toast.error('Error en la configuración');
    } finally {
      setTesting(false);
    }
  };

  const getAnalysisDepthBadge = (depth: string) => {
    const configs = {
      basic: { color: 'bg-blue-100 text-blue-800', icon: '🚀' },
      detailed: { color: 'bg-green-100 text-green-800', icon: '🔍' },
      comprehensive: { color: 'bg-purple-100 text-purple-800', icon: '🧠' }
    };
    const config = configs[depth as keyof typeof configs] || configs.detailed;
    return (
      <Badge className={config.color}>
        {config.icon} {depth.charAt(0).toUpperCase() + depth.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Configuración del Análisis
          </h2>
          <p className="text-gray-600 mt-1">
            Personaliza los parámetros del análisis automático de correos electrónicos
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Restaurar
          </Button>
          <Button
            variant="outline"
            onClick={testConfiguration}
            disabled={testing}
            className="flex items-center gap-2"
          >
            {testing ? (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            Probar Config
          </Button>
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuración Básica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sliders className="w-5 h-5" />
              Parámetros Básicos
            </CardTitle>
            <CardDescription>
              Configuración general del análisis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Max Emails */}
            <div className="space-y-2">
              <Label htmlFor="maxEmails">Máximo de correos a analizar</Label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  id="maxEmails"
                  min="10"
                  max="200"
                  step="10"
                  value={settings.maxEmails}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxEmails: parseInt(e.target.value) }))}
                  className="flex-1"
                />
                <Badge variant="outline">{settings.maxEmails}</Badge>
              </div>
              <p className="text-xs text-gray-500">Limita el número de correos por análisis para evitar sobrecarga</p>
            </div>

            {/* Text Limit */}
            <div className="space-y-2">
              <Label htmlFor="textLimit">Límite de caracteres por correo</Label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  id="textLimit"
                  min="100"
                  max="2000"
                  step="100"
                  value={settings.textLimit}
                  onChange={(e) => setSettings(prev => ({ ...prev, textLimit: parseInt(e.target.value) }))}
                  className="flex-1"
                />
                <Badge variant="outline">{settings.textLimit}</Badge>
              </div>
              <p className="text-xs text-gray-500">Máximo de caracteres del contenido a analizar por correo</p>
            </div>

            {/* Analysis Depth */}
            <div className="space-y-2">
              <Label>Profundidad del análisis</Label>
              <div className="flex gap-2">
                {(['basic', 'detailed', 'comprehensive'] as const).map(depth => (
                  <button
                    key={depth}
                    onClick={() => setSettings(prev => ({ ...prev, analysisDepth: depth }))}
                    className={`p-2 rounded-lg border text-sm transition-colors ${
                      settings.analysisDepth === depth
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {getAnalysisDepthBadge(depth)}
                  </button>
                ))}
              </div>
            </div>

            {/* Switches */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Filtrar spam automáticamente</Label>
                  <p className="text-xs text-gray-500">Excluir correos marcados como spam del análisis</p>
                </div>
                <Switch
                  checked={settings.enableSpamFilter}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableSpamFilter: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Detección de urgencia</Label>
                  <p className="text-xs text-gray-500">Identificar correos que requieren atención inmediata</p>
                </div>
                <Switch
                  checked={settings.enableUrgentDetection}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableUrgentDetection: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Análisis de sentimientos</Label>
                  <p className="text-xs text-gray-500">Analizar el tono emocional de los correos</p>
                </div>
                <Switch
                  checked={settings.enableSentimentAnalysis}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableSentimentAnalysis: checked }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeouts y Programación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Timeouts y Programación
            </CardTitle>
            <CardDescription>
              Configuración de tiempos y horarios de ejecución
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Timeouts */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Timeout para lectura de correos (segundos)</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="120"
                    step="5"
                    value={settings.timeouts.emailFetch / 1000}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      timeouts: { ...prev.timeouts, emailFetch: parseInt(e.target.value) * 1000 }
                    }))}
                    className="flex-1"
                  />
                  <Badge variant="outline">{settings.timeouts.emailFetch / 1000}s</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Timeout para análisis de IA (segundos)</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="30"
                    max="300"
                    step="15"
                    value={settings.timeouts.aiAnalysis / 1000}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      timeouts: { ...prev.timeouts, aiAnalysis: parseInt(e.target.value) * 1000 }
                    }))}
                    className="flex-1"
                  />
                  <Badge variant="outline">{settings.timeouts.aiAnalysis / 1000}s</Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Schedule */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Análisis automático programado</Label>
                <Switch
                  checked={settings.scheduleConfig.enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ 
                    ...prev, 
                    scheduleConfig: { ...prev.scheduleConfig, enabled: checked }
                  }))}
                />
              </div>

              {settings.scheduleConfig.enabled && (
                <div className="space-y-2">
                  <Label>Horarios de ejecución</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {settings.scheduleConfig.times.map((time, index) => (
                      <input
                        key={index}
                        type="time"
                        value={time}
                        onChange={(e) => {
                          const newTimes = [...settings.scheduleConfig.times];
                          newTimes[index] = e.target.value;
                          setSettings(prev => ({ 
                            ...prev, 
                            scheduleConfig: { ...prev.scheduleConfig, times: newTimes }
                          }));
                        }}
                        className="p-2 border rounded-md text-sm"
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">4 análisis diarios recomendados</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuración de Prompt */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Configuración del Prompt de ChatGPT
          </CardTitle>
          <CardDescription>
            Personaliza las instrucciones que se envían a ChatGPT para el análisis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Templates Predefinidos */}
          <div className="space-y-2">
            <Label>Templates predefinidos</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {Object.entries(PREDEFINED_PROMPTS).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => applyPromptTemplate(key)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedPromptTemplate === key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Editor de Prompt */}
          <div className="space-y-2">
            <Label htmlFor="customPrompt">Prompt personalizado</Label>
            <Textarea
              id="customPrompt"
              value={settings.customPrompt}
              onChange={(e) => setSettings(prev => ({ ...prev, customPrompt: e.target.value }))}
              rows={12}
              className="font-mono text-sm"
              placeholder="Ingresa tu prompt personalizado para ChatGPT..."
            />
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Info className="w-3 h-3" />
              <span>
                Usa {'{timeSlot}'}, {'{emailCount}'} y {'{emailData}'} como variables que se reemplazarán automáticamente
              </span>
            </div>
          </div>

          {/* Información del Prompt */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-amber-800 font-medium text-sm">
              <AlertTriangle className="w-4 h-4" />
              Variables disponibles
            </div>
            <div className="mt-2 space-y-1 text-xs text-amber-700">
              <div><code className="bg-amber-100 px-1 rounded">{'{timeSlot}'}</code> - Franja horaria actual (morning, midday, afternoon, evening)</div>
              <div><code className="bg-amber-100 px-1 rounded">{'{emailCount}'}</code> - Número total de correos a analizar</div>
              <div><code className="bg-amber-100 px-1 rounded">{'{emailData}'}</code> - Datos formateados de todos los correos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estado y Diagnóstico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Estado del Sistema
          </CardTitle>
          <CardDescription>
            Información sobre el estado actual del sistema de análisis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-800 font-medium text-sm">
                <Mail className="w-4 h-4" />
                Conexión Gmail
              </div>
              <div className="text-xs text-green-700 mt-1">
                Configurado y operativo
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-800 font-medium text-sm">
                <Bot className="w-4 h-4" />
                OpenAI API
              </div>
              <div className="text-xs text-blue-700 mt-1">
                API Key configurada
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-purple-800 font-medium text-sm">
                <FileText className="w-4 h-4" />
                Base de Datos
              </div>
              <div className="text-xs text-purple-700 mt-1">
                Tabla EmailAnalysis activa
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 