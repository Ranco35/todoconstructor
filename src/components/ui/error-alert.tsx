import { AlertTriangle, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onClose?: () => void;
  variant?: 'default' | 'destructive';
}

export function ErrorAlert({ 
  title = 'Error', 
  message, 
  onClose, 
  variant = 'destructive' 
}: ErrorAlertProps) {
  return (
    <Alert variant={variant} className="border-red-500 bg-red-50">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertTitle className="text-red-800 font-semibold">
        {title}
      </AlertTitle>
      <AlertDescription className="text-red-700 mt-1">
        {message}
      </AlertDescription>
      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-2 right-2 h-6 w-6 p-0 text-red-600 hover:text-red-800"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  );
}

export function SuccessAlert({ 
  title = 'Éxito', 
  message, 
  onClose 
}: Omit<ErrorAlertProps, 'variant'>) {
  return (
    <Alert className="border-green-500 bg-green-50">
      <div className="h-4 w-4 rounded-full bg-green-600 flex items-center justify-center">
        <span className="text-white text-xs">✓</span>
      </div>
      <AlertTitle className="text-green-800 font-semibold">
        {title}
      </AlertTitle>
      <AlertDescription className="text-green-700 mt-1">
        {message}
      </AlertDescription>
      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-2 right-2 h-6 w-6 p-0 text-green-600 hover:text-green-800"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  );
} 