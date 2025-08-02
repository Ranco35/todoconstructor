'use client';

import React, { useState, useEffect } from 'react';
import { getPopupConfig, savePopupConfig, resetPopupConfig, clearPopupState, getPopupDebugInfo, DEFAULT_POPUP_CONFIG } from '@/utils/popupConfig';
import type { PopupConfig } from '@/utils/popupConfig';

interface PopupConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PopupConfigModal({ isOpen, onClose }: PopupConfigModalProps) {
  const [config, setConfig] = useState<PopupConfig>(DEFAULT_POPUP_CONFIG);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
      loadDebugInfo();
    }
  }, [isOpen]);

  const loadConfig = () => {
    const currentConfig = getPopupConfig();
    setConfig(currentConfig);
  };

  const loadDebugInfo = () => {
    const info = getPopupDebugInfo();
    setDebugInfo(info);
  };

  const handleSave = () => {
    savePopupConfig(config);
    onClose();
  };

  const handleReset = () => {
    if (confirm('¿Estás seguro de que quieres resetear la configuración a los valores por defecto?')) {
      resetPopupConfig();
      setConfig(DEFAULT_POPUP_CONFIG);
    }
  };

  const handleClearState = () => {
    if (confirm('¿Estás seguro de que quieres limpiar completamente el estado del popup? Esto hará que el popup aparezca inmediatamente en la próxima carga.')) {
      clearPopupState();
      loadDebugInfo(); // Recargar debug info
    }
  };

  const updateConfig = (key: keyof PopupConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              ⚙️ Configuración del Modal de Bienvenida
            </h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Configuración */}
          <div className="space-y-6">
            {/* Timer Settings */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                ⏰ Configuración de Timer
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.enableTimer}
                      onChange={(e) => updateConfig('enableTimer', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Habilitar timer
                  </label>
                </div>

                {config.enableTimer && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horas entre apariciones del modal
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={72}
                      value={config.timerHours}
                      onChange={(e) => updateConfig('timerHours', parseInt(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      El modal no aparecerá hasta que pasen {config.timerHours} horas desde la última vez
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* New Information Check */}
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                📊 Verificación de Nueva Información
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.enableNewInfoCheck}
                      onChange={(e) => updateConfig('enableNewInfoCheck', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Solo mostrar cuando hay nueva información
                  </label>
                </div>

                {config.enableNewInfoCheck && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Intervalo de verificación (horas)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={config.checkIntervalHours}
                      onChange={(e) => updateConfig('checkIntervalHours', parseInt(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      El sistema verificará nueva información cada {config.checkIntervalHours} horas
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Debug Mode */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                🐛 Modo Desarrollo
              </h4>
              
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.debugMode}
                    onChange={(e) => updateConfig('debugMode', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Habilitar logs de debug en consola
                </label>
              </div>
            </div>

            {/* Debug Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  🔍 Información de Debug
                </h4>
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
                >
                  {showDebug ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>

              {showDebug && debugInfo && (
                <div className="bg-white rounded border p-3 text-xs font-mono">
                  <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-4 border-t">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Guardar Configuración
                </button>
              </div>

              {/* Reset and Clear Actions */}
              <div className="flex gap-3 justify-center pt-3 border-t border-gray-200">
                <button
                  onClick={handleReset}
                  className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  🔄 Resetear Config
                </button>
                <button
                  onClick={handleClearState}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                >
                  🧹 Limpiar Estado
                </button>
                <button
                  onClick={loadDebugInfo}
                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  🔄 Actualizar Debug
                </button>
              </div>
            </div>

            {/* Help Text */}
            <div className="bg-blue-100 rounded-lg p-3 text-sm text-blue-800">
              <h5 className="font-semibold mb-2">💡 Explicación:</h5>
              <ul className="space-y-1 text-xs">
                <li><strong>Timer:</strong> Controla cada cuánto tiempo puede aparecer el modal</li>
                <li><strong>Nueva información:</strong> Solo muestra el modal cuando hay nuevos correos o reservas</li>
                <li><strong>Limpiar estado:</strong> Útil para testing, hace que el modal aparezca inmediatamente</li>
                <li><strong>Debug mode:</strong> Muestra logs detallados en la consola del navegador</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 