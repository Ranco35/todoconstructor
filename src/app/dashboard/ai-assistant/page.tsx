import { Metadata } from 'next';
import AIAssistantClient from './AIAssistantClient';

export const metadata: Metadata = {
  title: 'Asistente de IA - ChatGPT | AdminTermas',
  description: 'Herramientas de inteligencia artificial para optimizar tareas del hotel/spa',
};

export default function AIAssistantPage() {
  return <AIAssistantClient />;
} 