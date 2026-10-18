import { redirect } from 'next/navigation';

// next.config.js ya redirige "/" a "/website"; esto es el respaldo por si esa regla se quita.
export default function HomePage() {
  redirect('/website');
}
