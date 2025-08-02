import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { redirect } from 'next/navigation';
import EmailsMainPage from '@/components/emails/EmailsMainPage';

export const dynamic = 'force-dynamic';

export default async function EmailsPage() {
  // Verificar autenticación
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  return <EmailsMainPage />;
} 