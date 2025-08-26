import { Metadata } from 'next';
import WhatsAppLinkClient from './WhatsAppLinkClient';

export const metadata: Metadata = {
  title: 'Vincular WhatsApp - Todo Constructor',
  description: 'Vincula el número principal de WhatsApp al sistema AdminTermas',
};

export default function WhatsAppLinkPage() {
  return <WhatsAppLinkClient />;
} 