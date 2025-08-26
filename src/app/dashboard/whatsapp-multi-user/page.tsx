import { Metadata } from 'next';
import WhatsAppMultiUserClient from './WhatsAppMultiUserClient';

export const metadata: Metadata = {
  title: 'WhatsApp Multi-Usuario - Todo Constructor',
  description: 'Sistema multi-usuario de WhatsApp para atención de clientes distribuida',
};

export default function WhatsAppMultiUserPage() {
  return <WhatsAppMultiUserClient />;
} 