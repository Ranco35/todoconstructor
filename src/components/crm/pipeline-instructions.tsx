'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Target, Users, MessageSquare, FileText, Handshake, CheckCircle, XCircle } from 'lucide-react';

interface PipelineInstructionsProps {
  stageId: number;
  stageName: string;
  stageDescription: string;
  stageColor: string;
}

// Definición de instrucciones para cada etapa
const stageInstructions = {
  1: {
    title: "Nuevo Contacto",
    icon: <Users className="h-5 w-5" />,
    description: "Leads recién creados o importados que requieren primer contacto",
    actions: [
      "Realizar primer contacto telefónico o email",
      "Recopilar información básica del cliente",
      "Calificar el interés inicial",
      "Programar seguimiento si es necesario"
    ],
    examples: [
      "Cliente que llenó formulario web",
      "Referido por otro cliente",
      "Contacto de feria o evento",
      "Lead importado desde sistema anterior"
    ],
    nextStep: "Mover a 'Cliente Interesado' si responde positivamente"
  },
  2: {
    title: "Cliente Interesado",
    icon: <MessageSquare className="h-5 w-5" />,
    description: "Contactos que han respondido y mostrado interés inicial",
    actions: [
      "Calificar necesidades específicas",
      "Determinar presupuesto disponible",
      "Identificar tipo de proyecto",
      "Enviar catálogo de productos"
    ],
    examples: [
      "Cliente que pidió información por WhatsApp",
      "Visitante que consultó precios",
      "Cliente que respondió a email promocional",
      "Persona interesada en paquetes especiales"
    ],
    nextStep: "Mover a 'Contacto Calificado' cuando tenga necesidades claras"
  },
  3: {
    title: "Contacto Calificado",
    icon: <Target className="h-5 w-5" />,
    description: "Clientes con necesidades claras y presupuesto definido",
    actions: [
      "Crear presupuesto personalizado",
      "Enviar propuesta detallada",
      "Programar llamada de seguimiento",
      "Negociar términos y condiciones"
    ],
    examples: [
      "Cliente que especificó materiales exactos",
      "Contratista con requerimientos claros",
      "Constructor que definió especificaciones",
      "Cliente con presupuesto aprobado"
    ],
    nextStep: "Mover a 'Propuesta Enviada' al entregar presupuesto"
  },
  4: {
    title: "Propuesta Enviada",
    icon: <FileText className="h-5 w-5" />,
    description: "Presupuesto enviado, esperando respuesta del cliente",
    actions: [
      "Hacer seguimiento en 24-48 horas",
      "Responder preguntas del cliente",
      "Ajustar propuesta si es necesario",
      "Mantener comunicación activa"
    ],
    examples: [
      "Presupuesto enviado por email",
      "Propuesta entregada en persona",
      "Cotización enviada por WhatsApp",
      "Oferta especial presentada"
    ],
    nextStep: "Mover a 'Negociación' si hay contrapropuestas"
  },
  5: {
    title: "Negociación",
    icon: <Handshake className="h-5 w-5" />,
    description: "En proceso de negociación de términos y precios",
    actions: [
      "Evaluar contrapropuestas",
      "Consultar con gerencia si es necesario",
      "Buscar alternativas de valor",
      "Mantener relación positiva"
    ],
    examples: [
      "Cliente pide descuento especial",
      "Negociación de fechas de pago",
      "Ajuste de servicios incluidos",
      "Condiciones especiales solicitadas"
    ],
    nextStep: "Mover a 'Cerrado Ganado' si acepta o 'Cerrado Perdido' si rechaza"
  },
  6: {
    title: "Cerrado Ganado",
    icon: <CheckCircle className="h-5 w-5" />,
    description: "Cliente aceptó la propuesta y confirmó el pedido",
    actions: [
      "Crear pedido en el sistema",
      "Enviar confirmación al cliente",
      "Procesar pago inicial",
      "Coordinar detalles del viaje"
    ],
    examples: [
      "Cliente confirmó presupuesto",
      "Pago inicial recibido",
      "Pedido creado exitosamente",
      "Contrato firmado"
    ],
    nextStep: "Lead completado - crear pedido y seguimiento post-venta"
  },
  7: {
    title: "Cerrado Perdido",
    icon: <XCircle className="h-5 w-5" />,
    description: "Cliente rechazó la propuesta o no respondió",
    actions: [
      "Analizar razones del rechazo",
      "Mantener relación para futuras oportunidades",
      "Actualizar base de datos",
      "Aplicar aprendizajes"
    ],
    examples: [
      "Cliente eligió competencia",
      "Presupuesto fuera de rango",
      "Fechas no disponibles",
      "Sin respuesta después de seguimientos"
    ],
    nextStep: "Lead archivado - mantener para futuras campañas"
  }
};

export function PipelineInstructions({ stageId, stageName, stageDescription, stageColor }: PipelineInstructionsProps) {
  const [open, setOpen] = useState(false);
  
  const instruction = stageInstructions[stageId as keyof typeof stageInstructions];
  
  if (!instruction) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-gray-100"
          title={`Instrucciones para ${stageName}`}
        >
          <HelpCircle className="h-4 w-4 text-gray-500" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: stageColor }}
            >
              {instruction.icon}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{instruction.title}</h3>
              <p className="text-sm text-gray-600 font-normal">{instruction.description}</p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Acciones requeridas */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Acciones Requeridas
            </h4>
            <ul className="space-y-2">
              {instruction.actions.map((action, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Ejemplos */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Ejemplos de Casos
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {instruction.examples.map((example, index) => (
                <div key={index} className="flex items-start gap-2 text-sm bg-gray-50 p-2 rounded">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>{example}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Próximo paso */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Próximo Paso
            </h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">{instruction.nextStep}</p>
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">💡 Consejos</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Mantén comunicación regular con el cliente</li>
              <li>• Documenta todas las interacciones en las notas</li>
              <li>• Actualiza la probabilidad según el progreso</li>
              <li>• Usa los tags para categorizar el tipo de lead</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
