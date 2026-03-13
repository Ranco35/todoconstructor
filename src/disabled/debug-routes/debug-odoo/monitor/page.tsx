"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface OdooStatus {
  url: string;
  available: boolean;
  responseTime: number;
  lastChecked: Date;
  status: 'checking' | 'online' | 'offline';
}

export default function OdooMonitorPage() {
  const [monitoring, setMonitoring] = useState(false);
  const [statuses, setStatuses] = useState<OdooStatus[]>([]);
  const [lastWorkingUrl, setLastWorkingUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const urls = [
    'https://ranco35-hotelspatermasllifen4-prueba10-21690156.dev.odoo.com',
    'https://ranco35-hotelspatermasllifen4-staging-productos-api-21685451.dev.odoo.com',
    'https://ranco35-hotelspatermasllifen4-produccion-21690157.dev.odoo.com',
  ];

  const checkSingleUrl = async (url: string): Promise<OdooStatus> => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${url}/api/productos`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(8000), // 8 segundos timeout
      });

      const responseTime = Date.now() - startTime;
      const available = response.ok;

      return {
        url,
        available,
        responseTime,
        lastChecked: new Date(),
        status: available ? 'online' : 'offline'
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        url,
        available: false,
        responseTime,
        lastChecked: new Date(),
        status: 'offline'
      };
    }
  };

  const checkAllUrls = async () => {
    // Actualizar estados a 'checking'
    setStatuses(prev => prev.map(status => ({ ...status, status: 'checking' as const })));

    const newStatuses = await Promise.all(
      urls.map(url => checkSingleUrl(url))
    );

    setStatuses(newStatuses);

    // Verificar si hay alguna URL disponible
    const workingUrl = newStatuses.find(status => status.available)?.url;
    if (workingUrl) {
      setLastWorkingUrl(workingUrl);
    }
  };

  const startMonitoring = () => {
    setMonitoring(true);
    // Inicializar estados
    setStatuses(urls.map(url => ({
      url,
      available: false,
      responseTime: 0,
      lastChecked: new Date(),
      status: 'checking' as const
    })));
    
    checkAllUrls(); // Primera verificación inmediata
  };

  const stopMonitoring = () => {
    setMonitoring(false);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;

    if (monitoring) {
      // Verificar cada 30 segundos
      interval = setInterval(() => {
        checkAllUrls();
        setCountdown(30);
      }, 30000);

      // Countdown cada segundo
      countdownInterval = setInterval(() => {
        setCountdown(prev => prev > 0 ? prev - 1 : 30);
      }, 1000);

      // Inicializar countdown
      setCountdown(30);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [monitoring]);

  const getStatusBadge = (status: OdooStatus) => {
    if (status.status === 'checking') {
      return <Badge variant="outline">🔄 Verificando...</Badge>;
    } else if (status.available) {
      return <Badge className="bg-green-500">✅ Online</Badge>;
    } else {
      return <Badge variant="destructive">❌ Offline</Badge>;
    }
  };

  const onlineCount = statuses.filter(s => s.available).length;
  const totalCount = statuses.length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">📡 Monitor de Odoo en Tiempo Real</h1>
        <p className="text-muted-foreground">
          Monitoreo continuo del estado de las instancias de Odoo
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🎛️ Control de Monitoreo</CardTitle>
          <CardDescription>
            Inicia o detén el monitoreo automático de las instancias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button 
              onClick={startMonitoring} 
              disabled={monitoring}
              className="flex-1"
            >
              {monitoring ? '🔄 Monitoreando...' : '▶️ Iniciar Monitoreo'}
            </Button>
            
            <Button 
              onClick={stopMonitoring} 
              disabled={!monitoring}
              variant="outline"
            >
              ⏹️ Detener
            </Button>
          </div>

          {monitoring && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Próxima verificación en:</span>
                <span className="font-mono">{countdown}s</span>
              </div>
              <Progress value={(30 - countdown) / 30 * 100} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {statuses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Estado de las Instancias</CardTitle>
            <CardDescription>
              {onlineCount} de {totalCount} instancias online
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {statuses.map((status, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <p className="font-mono text-sm break-all mb-1">
                    {status.url.replace('https://', '')}
                  </p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Tiempo: {status.responseTime}ms</span>
                    <span>Última verificación: {status.lastChecked.toLocaleTimeString()}</span>
                  </div>
                </div>
                <div>{getStatusBadge(status)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {lastWorkingUrl && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription>
            <strong>🎯 ¡Instancia disponible!</strong>
            <br />
            <span className="font-mono text-sm">{lastWorkingUrl}</span> está funcionando.
            <br />
            <strong>Ahora puedes usar la funcionalidad de Odoo en tu aplicación.</strong>
          </AlertDescription>
        </Alert>
      )}

      {monitoring && onlineCount === 0 && statuses.every(s => s.status !== 'checking') && (
        <Alert>
          <AlertDescription>
            <strong>⏳ Todas las instancias están offline</strong>
            <br />
            El monitoreo continúa cada 30 segundos. Te notificaremos cuando alguna instancia esté disponible.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>💡 Información Útil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p><strong>¿Qué hace este monitor?</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>✅ Verifica el estado de las instancias cada 30 segundos</li>
              <li>⚡ Te notifica inmediatamente cuando una instancia esté disponible</li>
              <li>📊 Muestra tiempos de respuesta en tiempo real</li>
              <li>🎯 Identifica cuál URL usar cuando esté disponible</li>
            </ul>
            
            <p className="mt-4"><strong>💡 Recomendación:</strong></p>
            <p>Deja esta página abierta mientras trabajas en otras cosas. Cuando veas que una instancia está "Online", podrás usar la funcionalidad de búsqueda por categorías en Odoo.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 