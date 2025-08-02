import { Metadata } from 'next';
import WhatsAppBotClient from './WhatsAppBotClient';

export const metadata: Metadata = {
  title: 'Bot de WhatsApp - AdminTermas',
  description: 'Administración del bot de WhatsApp con respuestas automáticas powered by ChatGPT',
};

export default function WhatsAppBotPage() {
  return <WhatsAppBotClient />;
} 