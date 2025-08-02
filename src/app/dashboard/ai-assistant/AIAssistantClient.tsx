'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bot, 
  MessageCircle, 
  Search, 
  FileText, 
  Languages, 
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AIChat from '@/components/ai/AIChat';
import AITextAnalyzer from '@/components/ai/AITextAnalyzer';

interface AIStatus {
  success: boolean;
  status: string;
  checks: {
    apiKey: boolean;
    connection: boolean;
  };
  error?: string;
}

export default function AIAssistantClient() {
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [summaryText, setSummaryText] = useState('');
  const [summaryResult, setSummaryResult] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [translateText, setTranslateText] = useState('');
  const [translateResult, setTranslateResult] = useState('');
  const [translateLoading, setTranslateLoading] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('inglés');
  const { toast } = useToast();

  // Verificar estado de la API al cargar
  useEffect(() => {
    checkAIStatus();
  }, []);

  const checkAIStatus = async () => {
    setLoadingStatus(true);
    try {
      const response = await fetch('/api/ai/status');
      const data = await response.json();
      setAiStatus(data);
    } catch (error) {
      console.error('Error checking AI status:', error);
      setAiStatus({
        success: false,
        status: 'error',
        checks: { apiKey: false, connection: false },
        error: 'No se pudo verificar el estado',
      });
    } finally {
      setLoadingStatus(false);
    }
  };

  const generateSummary = async () => {
    if (!summaryText.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa texto para resumir",
        variant: "destructive",
      });
      return;
    }

    setSummaryLoading(true);
    setSummaryResult('');

    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: summaryText,
          maxLength: 200,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSummaryResult(data.data.message);
        toast({
          title: "Resumen generado",
          description: "El resumen se ha generado exitosamente",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: "Error",
        description: `No se pudo generar el resumen: ${error}`,
        variant: "destructive",
      });
    } finally {
      setSummaryLoading(false);
    }
  };

  const translateContent = async () => {
    if (!translateText.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa texto para traducir",
        variant: "destructive",
      });
      return;
    }

    setTranslateLoading(true);
    setTranslateResult('');

    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: translateText,
          targetLanguage: targetLanguage,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setTranslateResult(data.data.message);
        toast({
          title: "Traducción completada",
          description: `Texto traducido a ${targetLanguage} exitosamente`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error translating:', error);
      toast({
        title: "Error",
        description: `No se pudo traducir el texto: ${error}`,
        variant: "destructive",
      });
    } finally {
      setTranslateLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado",
        description: "Texto copiado al portapapeles",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el texto",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="w-8 h-8" />
            Asistente de IA ChatGPT
          </h1>
          <p className="text-gray-600 mt-1">
            Herramientas de inteligencia artificial para optimizar tareas del hotel/spa
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={checkAIStatus}
          disabled={loadingStatus}
        >
          {loadingStatus ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Verificar Estado
        </Button>
      </div>

      {/* Estado de la API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Estado de la API
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStatus ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verificando estado...</span>
            </div>
          ) : aiStatus ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {aiStatus.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <span className={aiStatus.success ? 'text-green-600' : 'text-red-600'}>
                  {aiStatus.success ? 'Operacional' : 'Error'}
                </span>
              </div>
              <Badge variant={aiStatus.success ? 'default' : 'destructive'}>
                {aiStatus.status}
              </Badge>
              {aiStatus.error && (
                <span className="text-sm text-red-600">{aiStatus.error}</span>
              )}
            </div>
          ) : (
            <span className="text-gray-500">Estado desconocido</span>
          )}
        </CardContent>
      </Card>

      {/* Pestañas de funcionalidades */}
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="analyze" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Análisis
          </TabsTrigger>
          <TabsTrigger value="summarize" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="translate" className="flex items-center gap-2">
            <Languages className="w-4 h-4" />
            Traducir
          </TabsTrigger>
        </TabsList>

        {/* Tab de Chat */}
        <TabsContent value="chat" className="space-y-4">
          <div className="h-[600px]">
            <AIChat />
          </div>
        </TabsContent>

        {/* Tab de Análisis */}
        <TabsContent value="analyze" className="space-y-4">
          <AITextAnalyzer />
        </TabsContent>

        {/* Tab de Resumen */}
        <TabsContent value="summarize" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Generador de Resúmenes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Contenido a resumir</label>
                <Textarea
                  value={summaryText}
                  onChange={(e) => setSummaryText(e.target.value)}
                  placeholder="Ingresa el texto o documento que deseas resumir..."
                  className="min-h-[120px]"
                />
                <div className="text-xs text-gray-500">
                  {summaryText.length}/15000 caracteres
                </div>
              </div>
              
              <Button 
                onClick={generateSummary}
                disabled={!summaryText.trim() || summaryLoading}
                className="w-full"
              >
                {summaryLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generando resumen...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Generar Resumen
                  </>
                )}
              </Button>

              {summaryResult && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Resumen generado:</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(summaryResult)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <p className="text-sm leading-relaxed">{summaryResult}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Traducción */}
        <TabsContent value="translate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="w-5 h-5" />
                Traductor Automático
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Texto a traducir</label>
                <Textarea
                  value={translateText}
                  onChange={(e) => setTranslateText(e.target.value)}
                  placeholder="Ingresa el texto que deseas traducir..."
                  className="min-h-[120px]"
                />
                <div className="text-xs text-gray-500">
                  {translateText.length}/8000 caracteres
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Idioma de destino</label>
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inglés">Inglés</SelectItem>
                    <SelectItem value="francés">Francés</SelectItem>
                    <SelectItem value="alemán">Alemán</SelectItem>
                    <SelectItem value="italiano">Italiano</SelectItem>
                    <SelectItem value="portugués">Portugués</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={translateContent}
                disabled={!translateText.trim() || translateLoading}
                className="w-full"
              >
                {translateLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Traduciendo...
                  </>
                ) : (
                  <>
                    <Languages className="w-4 h-4 mr-2" />
                    Traducir
                  </>
                )}
              </Button>

              {translateResult && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Traducción a {targetLanguage}:</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(translateResult)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <p className="text-sm leading-relaxed">{translateResult}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 