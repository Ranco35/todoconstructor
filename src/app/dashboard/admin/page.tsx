import Link from 'next/link';
import { Shield, Boxes, Barcode } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface AdminLinkProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
}

function AdminLink({ title, description, href, icon, color }: AdminLinkProps) {
  return (
    <Link href={href} className="block">
      <div className={`p-6 rounded-xl border transition-all duration-200 hover:shadow-md ${color}`}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/70 rounded-lg">{icon}</div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-gradient-to-r from-red-600 to-rose-700 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Panel de Administración</h1>
              <p className="text-red-100 mt-1">
                Herramientas avanzadas reservadas para administradores del sistema
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AdminLink
            title="Gestión de SKUs"
            description="Modificar SKUs de productos existentes. Usar solo en casos excepcionales."
            href="/dashboard/admin/sku-management"
            icon={<Barcode className="h-6 w-6 text-orange-600" />}
            color="bg-orange-50 border-orange-200 hover:bg-orange-100"
          />
          <AdminLink
            title="Productos Modulares"
            description="Administración de productos modulares y sus componentes."
            href="/dashboard/admin/productos-modulares"
            icon={<Boxes className="h-6 w-6 text-blue-600" />}
            color="bg-blue-50 border-blue-200 hover:bg-blue-100"
          />
        </div>
      </div>
    </div>
  );
}
