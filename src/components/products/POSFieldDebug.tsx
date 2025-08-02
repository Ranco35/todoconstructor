'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff } from 'lucide-react';

interface POSFieldDebugProps {
  formData: any;
  isVisible?: boolean;
}

export default function POSFieldDebug({ formData, isVisible = false }: POSFieldDebugProps) {
  const [showDebug, setShowDebug] = useState(isVisible);

  if (!showDebug) {
    return (
      <Button
        onClick={() => setShowDebug(true)}
        variant="outline"
        size="sm"
        className="mb-4"
      >
        <Eye className="h-4 w-4 mr-2" />
        Debug Campo POS
      </Button>
    );
  }

  return (
    <Card className="mb-4 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <span>🔍 Debug Campo isPOSEnabled</span>
          <Button
            onClick={() => setShowDebug(false)}
            variant="ghost"
            size="sm"
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-xs">
          <div>
            <strong>Valor actual:</strong>
            <Badge variant={formData.isPOSEnabled ? "default" : "secondary"} className="ml-2">
              {formData.isPOSEnabled ? 'true' : 'false'}
            </Badge>
          </div>
          
          <div>
            <strong>Tipo de dato:</strong>
            <span className="ml-2 text-gray-600">
              {typeof formData.isPOSEnabled}
            </span>
          </div>
          
          <div>
            <strong>Campo definido:</strong>
            <span className="ml-2 text-gray-600">
              {formData.isPOSEnabled !== undefined ? 'Sí' : 'No'}
            </span>
          </div>
          
          <div>
            <strong>Valor por defecto:</strong>
            <span className="ml-2 text-gray-600">
              {formData.isPOSEnabled ?? 'undefined'}
            </span>
          </div>
          
          <div className="pt-2 border-t">
            <strong>Datos completos del formulario:</strong>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 