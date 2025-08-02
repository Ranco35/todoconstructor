'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, FileText, Copy, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AITextAnalyzerProps {
  initialText?: string;
  className?: string;
  onAnalysisComplete?: (analysis: string) => void;
}

const analysisTypes = {
  'general': 'Análisis General',
  'sentiment': 'Análisis de Sentimiento',
  'keywords': 'Extracción de Palabras Clave',
  'summary': 'Resumen del Contenido',
  'grammar': 'Revisión Gramatical',
  'tone': 'Análisis de Tono',
  'readability': 'Análisis de Legibilidad',
  'seo': 'Optimización SEO',
  'marketing': 'Análisis de Marketing',
  'technical': 'Análisis Técnico',
};

export default function AITextAnalyzer({ 
  initialText = '',
  className = '',
  onAnalysisComplete
}: AITextAnalyzerProps) {
  const [text, setText] = useState(initialText);
  const [analysisType, setAnalysisType] = useState('general');
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const analyzeText = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa texto para analizar",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysis('');

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          analysisType: analysisType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAnalysis(data.data.message);
        onAnalysisComplete?.(data.data.message);
        
        toast({
          title: "Análisis completado",
          description: `Análisis de tipo "${analysisTypes[analysisType]}" realizado exitosamente`,
        });
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error analyzing text:', error);
      toast({
        title: "Error",
        description: `No se pudo analizar el texto: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyAnalysis = async () => {
    if (!analysis) return;

    try {
      await navigator.clipboard.writeText(analysis);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Copiado",
        description: "Análisis copiado al portapapeles",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el análisis",
        variant: "destructive",
      });
    }
  };

  const clearAll = () => {
    setText('');
    setAnalysis('');
    setAnalysisType('general');
  };

  return (
    <div className={`grid gap-6 ${className}`}>
      {/* Panel de entrada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Analizador de Texto con AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Texto a analizar</label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ingresa aquí el texto que deseas analizar..."
              className="min-h-[120px]"
              disabled={isAnalyzing}
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{text.length} caracteres</span>
              <span>Máximo: 10,000 caracteres</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de análisis</label>
            <Select value={analysisType} onValueChange={setAnalysisType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(analysisTypes).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={analyzeText}
              disabled={!text.trim() || isAnalyzing || text.length > 10000}
              className="flex-1"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Analizar Texto
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={clearAll}
              disabled={isAnalyzing}
            >
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Panel de resultados */}
      {(analysis || isAnalyzing) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Resultado del Análisis
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {analysisTypes[analysisType]}
                </Badge>
                {analysis && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={copyAnalysis}
                    className="flex items-center gap-1"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isAnalyzing ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-500" />
                  <p className="text-gray-600">Analizando el texto...</p>
                  <p className="text-sm text-gray-400">Esto puede tomar unos segundos</p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                  {analysis}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 