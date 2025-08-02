'use client';

import React from 'react';
import { toast } from 'sonner';

interface NotificationToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
}

export default function NotificationToast({ 
  type, 
  title, 
  message, 
  duration = 4000,
  onClose 
}: NotificationToastProps) {
  // Mostrar el toast inmediatamente cuando el componente se monta
  React.useEffect(() => {
    const toastId = (() => {
      switch (type) {
        case 'success':
          return toast.success(title, {
            description: message,
            duration,
            onDismiss: onClose,
          });
        case 'error':
          return toast.error(title, {
            description: message,
            duration,
            onDismiss: onClose,
          });
        case 'warning':
          return toast.warning(title, {
            description: message,
            duration,
            onDismiss: onClose,
          });
        case 'info':
          return toast.info(title, {
            description: message,
            duration,
            onDismiss: onClose,
          });
        default:
          return toast(title, {
            description: message,
            duration,
            onDismiss: onClose,
          });
      }
    })();

    // Limpiar el toast cuando el componente se desmonta
    return () => {
      toast.dismiss(toastId);
    };
  }, [type, title, message, duration, onClose]);

  // No renderizar nada visible
  return null;
}

// Funcion helper para mostrar notificaciones directamente
export const showNotification = (props: Omit<NotificationToastProps, 'onClose'>) => {
  const { type, title, message, duration } = props;
  
  switch (type) {
    case 'success':
      toast.success(title, { description: message, duration });
      break;
    case 'error':
      toast.error(title, { description: message, duration });
      break;
    case 'warning':
      toast.warning(title, { description: message, duration });
      break;
    case 'info':
      toast.info(title, { description: message, duration });
      break;
    default:
      toast(title, { description: message, duration });
  }
}; 