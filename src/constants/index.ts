export const menus = {
    SUPER_USER: [
        {
            label: 'Dashboard',
            href: '/dashboard',
        },
        {
            label: 'Clientes',
            href: '/dashboard/customers',
        },
        {
            label: 'Reservas',
            href: '/dashboard/reservations',
            items: [
                { label: 'Dashboard', href: '/dashboard/reservations' },
                { label: '✨ Reserva Nueva', href: '/dashboard/reservations/nueva' },
                { label: '📅 Calendario', href: '/dashboard/reservations/calendar' },
                { label: '📋 Lista Completa', href: '/dashboard/reservations/list' },
                { label: '📊 Reportes', href: '/dashboard/reservations/reports' },
                { label: '🔧 Crear Tradicional', href: '/dashboard/reservations/create' },
            ],
        },
        {
            label: 'Inventario',
            href: '/dashboard/inventory',
        },
        {
            label: 'Productos',
            href: '/dashboard/configuration/products',
        },
        {
            label: 'Ventas',
            href: '/dashboard/sales',
            items: [
                { label: 'Dashboard', href: '/dashboard/sales' },
                { label: '📋 Presupuestos', href: '/dashboard/sales/budgets' },
                { label: '📝 Crear Presupuesto', href: '/dashboard/sales/budgets/create' },
                { label: '📄 Facturas', href: '/dashboard/sales/invoices' },
                { label: '💰 Pagos', href: '/dashboard/sales/payments' },
            ],
        },
        {
            label: 'Compras',
            href: '/dashboard/purchases',
            items: [
                { label: 'Dashboard', href: '/dashboard/purchases' },
                { label: '📋 Órdenes de Compra', href: '/dashboard/purchases/orders' },
                { label: '📝 Crear Orden', href: '/dashboard/purchases/orders/create' },
                { label: '📄 Facturas', href: '/dashboard/purchases/invoices' },
                { label: '💰 Pagos', href: '/dashboard/purchases/payments' },
                { label: '📊 Reportes', href: '/dashboard/purchases/reports' },
            ],
        },
        {
            label: 'Caja Chica',
            href: '/dashboard/pettyCash',
            items: [
                { label: 'Dashboard', href: '/dashboard/pettyCash' },
                { label: 'Historial de Sesiones', href: '/dashboard/pettyCash/sessions' },
                { label: '🛡️ Panel Administrativo', href: '/dashboard/pettyCash/admin' },
            ],
        },
    ],
    ADMINISTRADOR: [
        {
            label: 'Dashboard',
            href: '/dashboard',
        },
        {
            label: 'Clientes',
            href: '/dashboard/customers',
        },
        {
            label: 'Reservas',
            href: '/dashboard/reservations',
            items: [
                { label: 'Dashboard', href: '/dashboard/reservations' },
                { label: '✨ Reserva Nueva', href: '/dashboard/reservations/nueva' },
                { label: '📅 Calendario', href: '/dashboard/reservations/calendar' },
                { label: '📋 Lista Completa', href: '/dashboard/reservations/list' },
                { label: '📊 Reportes', href: '/dashboard/reservations/reports' },
                { label: '🔧 Crear Tradicional', href: '/dashboard/reservations/create' },
            ],
        },
        {
            label: 'Inventario',
            href: '/dashboard/inventory',
        },
        {
            label: 'Productos',
            href: '/dashboard/configuration/products',
        },
        {
            label: 'Ventas',
            href: '/dashboard/sales',
            items: [
                { label: 'Dashboard', href: '/dashboard/sales' },
                { label: '📋 Presupuestos', href: '/dashboard/sales/budgets' },
                { label: '📝 Crear Presupuesto', href: '/dashboard/sales/budgets/create' },
                { label: '📄 Facturas', href: '/dashboard/sales/invoices' },
                { label: '💰 Pagos', href: '/dashboard/sales/payments' },
            ],
        },
        {
            label: 'Compras',
            href: '/dashboard/purchases',
            items: [
                { label: 'Dashboard', href: '/dashboard/purchases' },
                { label: '📋 Órdenes de Compra', href: '/dashboard/purchases/orders' },
                { label: '📝 Crear Orden', href: '/dashboard/purchases/orders/create' },
                { label: '📄 Facturas', href: '/dashboard/purchases/invoices' },
                { label: '💰 Pagos', href: '/dashboard/purchases/payments' },
                { label: '📊 Reportes', href: '/dashboard/purchases/reports' },
            ],
        },
        {
            label: 'Caja Chica',
            href: '/dashboard/pettyCash',
            items: [
                { label: 'Dashboard', href: '/dashboard/pettyCash' },
                { label: 'Historial de Sesiones', href: '/dashboard/pettyCash/sessions' },
                { label: '🛡️ Panel Administrativo', href: '/dashboard/pettyCash/admin' },
            ],
        },
    ],
    JEFE_SECCION: [
        {
            label: 'Dashboard',
            href: '/dashboard',
        },
        {
            label: 'Inventario',
            href: '/dashboard/inventory',
        },
        {
            label: 'Caja Chica',
            href: '/dashboard/pettyCash',
            items: [
                { label: 'Dashboard', href: '/dashboard/pettyCash' },
                { label: 'Historial de Sesiones', href: '/dashboard/pettyCash/sessions' },
            ],
        },
    ],
    USUARIO_FINAL: [
        {
            label: 'Dashboard',
            href: '/dashboard',
        },
        {
            label: 'Caja Chica',
            href: '/dashboard/pettyCash',
            items: [
                { label: 'Dashboard', href: '/dashboard/pettyCash' },
                { label: 'Historial de Sesiones', href: '/dashboard/pettyCash/sessions' },
            ],
        },
    ],
};

