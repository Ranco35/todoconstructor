'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getPopupConfig, STORAGE_KEYS, logPopupDebug } from '@/utils/popupConfig';
import { getTodayAnalysis } from '@/actions/emails/analysis-actions';
import { getTodayArrivals, getTodayDepartures } from '@/actions/reservations/dashboard';

interface EmailAnalysisContextType {
  isPopupOpen: boolean;
  popupTrigger: 'login' | 'analysis' | 'manual';
  showPopup: (trigger: 'login' | 'analysis' | 'manual') => void;
  hidePopup: () => void;
  hasShownLoginPopup: boolean;
  markLoginPopupShown: () => void;
  canShowLoginPopup: () => boolean;
  checkForNewInformation: () => Promise<boolean>;
}

const EmailAnalysisContext = createContext<EmailAnalysisContextType | undefined>(undefined);

interface EmailAnalysisProviderProps {
  children: React.ReactNode;
}

export function EmailAnalysisProvider({ children }: EmailAnalysisProviderProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupTrigger, setPopupTrigger] = useState<'login' | 'analysis' | 'manual'>('login');
  const [hasShownLoginPopup, setHasShownLoginPopup] = useState(false);

  // Función para verificar si puede mostrar el popup de login
  const canShowLoginPopup = useCallback(() => {
    const config = getPopupConfig();
    
    logPopupDebug('Verificando si puede mostrar popup', { config });

    // Si el timer está deshabilitado, siempre permitir (para desarrollo)
    if (!config.enableTimer) {
      logPopupDebug('Timer deshabilitado, permitiendo popup');
      return true;
    }

    // Verificar si ya se mostró en esta sesión
    const sessionShown = sessionStorage.getItem(STORAGE_KEYS.POPUP_SESSION);
    if (sessionShown === 'true') {
      logPopupDebug('Popup ya mostrado en esta sesión');
      return false;
    }

    // Verificar el timer (última vez que se mostró)
    const lastShownTimestamp = localStorage.getItem(STORAGE_KEYS.POPUP_TIMESTAMP);
    if (lastShownTimestamp) {
      const lastShown = new Date(parseInt(lastShownTimestamp));
      const now = new Date();
      const hoursSinceLastShown = (now.getTime() - lastShown.getTime()) / (1000 * 60 * 60);
      
      logPopupDebug(`Última vez mostrado hace ${hoursSinceLastShown.toFixed(1)} horas`);
      
      if (hoursSinceLastShown < config.timerHours) {
        logPopupDebug(`Timer activo, faltan ${(config.timerHours - hoursSinceLastShown).toFixed(1)} horas`);
        return false;
      }
    }

    logPopupDebug('Popup puede mostrarse (timer cumplido)');
    return true;
  }, []);

  // Función mejorada para verificar si hay nueva información
  const checkForNewInformation = useCallback(async (): Promise<boolean> => {
    try {
      const config = getPopupConfig();
      
      logPopupDebug('Iniciando verificación de nueva información', { config });

      // Si la verificación de nueva información está deshabilitada, siempre retornar true
      if (!config.enableNewInfoCheck) {
        logPopupDebug('Verificación de nueva información deshabilitada, permitiendo popup');
        return true;
      }

      // Obtener timestamp de la última verificación
      const lastCheckTimestamp = localStorage.getItem(STORAGE_KEYS.LAST_DATA_CHECK);
      const lastCheck = lastCheckTimestamp ? new Date(parseInt(lastCheckTimestamp)) : null;
      const now = new Date();

      // Si es la primera vez, considerarlo como nueva información
      if (!lastCheck) {
        logPopupDebug('Primera verificación, considerando información nueva');
        localStorage.setItem(STORAGE_KEYS.LAST_DATA_CHECK, now.getTime().toString());
        return true;
      }

      // Verificar si ha pasado suficiente tiempo desde la última verificación
      const hoursSinceLastCheck = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastCheck < config.checkIntervalHours) {
        logPopupDebug(`No es tiempo de verificar nueva información aún (${hoursSinceLastCheck.toFixed(1)} < ${config.checkIntervalHours} horas)`);
        return false;
      }

      logPopupDebug('Verificando nueva información real...');

      // Verificar nueva información REAL
      let hasNewInfo = false;

      try {
        // 1. Verificar nuevos análisis de correos
        const analysisResult = await getTodayAnalysis();
        if (analysisResult.success && analysisResult.data) {
          const currentEmailCount = analysisResult.data.length;
          const lastEmailCount = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_EMAIL_COUNT) || '0');
          
          if (currentEmailCount > lastEmailCount) {
            logPopupDebug(`Nuevos análisis de correos: ${currentEmailCount} vs ${lastEmailCount}`);
            hasNewInfo = true;
            localStorage.setItem(STORAGE_KEYS.LAST_EMAIL_COUNT, currentEmailCount.toString());
          }
        }

        // 2. Verificar nuevas reservas (llegadas + salidas)
        const [arrivalsResult, departuresResult] = await Promise.all([
          getTodayArrivals(),
          getTodayDepartures()
        ]);

        if (arrivalsResult.success && departuresResult.success) {
          const currentReservationCount = (arrivalsResult.data?.length || 0) + (departuresResult.data?.length || 0);
          const lastReservationCount = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_RESERVATION_COUNT) || '0');

          if (currentReservationCount > lastReservationCount) {
            logPopupDebug(`Nuevas reservas: ${currentReservationCount} vs ${lastReservationCount}`);
            hasNewInfo = true;
            localStorage.setItem(STORAGE_KEYS.LAST_RESERVATION_COUNT, currentReservationCount.toString());
          }
        }

        // Si no hay nueva información específica, verificar basado en tiempo transcurrido
        if (!hasNewInfo) {
          // Considerar nueva información si han pasado más del doble del intervalo configurado
          const extendedInterval = config.checkIntervalHours * 2;
          if (hoursSinceLastCheck >= extendedInterval) {
            logPopupDebug(`Tiempo extendido transcurrido (${hoursSinceLastCheck.toFixed(1)} >= ${extendedInterval} horas), considerando nueva información`);
            hasNewInfo = true;
          }
        }

      } catch (error) {
        logPopupDebug('Error verificando datos específicos', error);
        // En caso de error al verificar datos específicos, usar criterio de tiempo
        const fallbackInterval = config.checkIntervalHours * 1.5;
        if (hoursSinceLastCheck >= fallbackInterval) {
          logPopupDebug(`Usando criterio de tiempo de fallback (${hoursSinceLastCheck.toFixed(1)} >= ${fallbackInterval} horas)`);
          hasNewInfo = true;
        }
      }

      // Actualizar timestamp de última verificación si hay nueva información
      if (hasNewInfo) {
        localStorage.setItem(STORAGE_KEYS.LAST_DATA_CHECK, now.getTime().toString());
      }

      logPopupDebug(`Verificación completada - Nueva información: ${hasNewInfo}`);
      return hasNewInfo;
      
    } catch (error) {
      console.error('❌ Error verificando nueva información:', error);
      logPopupDebug('Error en verificación, retornando false', error);
      return false; // En caso de error crítico, no mostrar el popup
    }
  }, []);

  const showPopup = useCallback(async (trigger: 'login' | 'analysis' | 'manual') => {
    logPopupDebug(`Solicitado mostrar popup con trigger "${trigger}"`);

    // Para el trigger de login, aplicar todas las validaciones
    if (trigger === 'login') {
      // Verificar si ya se mostró en esta sesión
      if (hasShownLoginPopup) {
        logPopupDebug('Popup ya mostrado en esta sesión (estado)');
        return;
      }

      // Verificar timer
      if (!canShowLoginPopup()) {
        return;
      }

      // Verificar nueva información
      const hasNewInfo = await checkForNewInformation();
      if (!hasNewInfo) {
        logPopupDebug('No hay nueva información disponible');
        return;
      }

      logPopupDebug('Todas las validaciones pasadas, mostrando popup');

      // Marcar como mostrado
      setHasShownLoginPopup(true);
      sessionStorage.setItem(STORAGE_KEYS.POPUP_SESSION, 'true');
      localStorage.setItem(STORAGE_KEYS.POPUP_TIMESTAMP, new Date().getTime().toString());
    }

    // Para otros triggers (analysis, manual), mostrar siempre
    setPopupTrigger(trigger);
    setIsPopupOpen(true);
  }, [hasShownLoginPopup, canShowLoginPopup, checkForNewInformation]);

  const hidePopup = useCallback(() => {
    logPopupDebug('Cerrando popup');
    setIsPopupOpen(false);
  }, []);

  const markLoginPopupShown = useCallback(() => {
    setHasShownLoginPopup(true);
    sessionStorage.setItem(STORAGE_KEYS.POPUP_SESSION, 'true');
    localStorage.setItem(STORAGE_KEYS.POPUP_TIMESTAMP, new Date().getTime().toString());
  }, []);

  // Verificar estado inicial al cargar
  useEffect(() => {
    const sessionShown = sessionStorage.getItem(STORAGE_KEYS.POPUP_SESSION);
    if (sessionShown === 'true') {
      setHasShownLoginPopup(true);
    }

    // Log de estado inicial
    const lastShownTimestamp = localStorage.getItem(STORAGE_KEYS.POPUP_TIMESTAMP);
    if (lastShownTimestamp) {
      const lastShown = new Date(parseInt(lastShownTimestamp));
      logPopupDebug(`Última vez mostrado: ${lastShown.toLocaleString()}`);
    } else {
      logPopupDebug('Nunca se ha mostrado antes');
    }

    // Log de configuración actual
    const config = getPopupConfig();
    logPopupDebug('Configuración actual del popup', config);
  }, []);

  const contextValue: EmailAnalysisContextType = {
    isPopupOpen,
    popupTrigger,
    showPopup,
    hidePopup,
    hasShownLoginPopup,
    markLoginPopupShown,
    canShowLoginPopup,
    checkForNewInformation,
  };

  return (
    <EmailAnalysisContext.Provider value={contextValue}>
      {children}
    </EmailAnalysisContext.Provider>
  );
}

export function useEmailAnalysisPopup() {
  const context = useContext(EmailAnalysisContext);
  if (context === undefined) {
    throw new Error('useEmailAnalysisPopup must be used within an EmailAnalysisProvider');
  }
  return context;
} 