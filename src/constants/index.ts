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
            label: 'Inventario',
            href: '/dashboard/inventory',
        },
        {
            label: 'Productos',
            href: '/dashboard/configuration/products',
        },
        {
            label: '🛒 Punto de Venta',
            href: '/dashboard/pos/recepcion',
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
            label: 'CRM',
            href: '/dashboard/crm',
            items: [
                { label: 'Pipeline', href: '/dashboard/crm' },
                { label: '➕ Nuevo Lead', href: '/dashboard/crm/create' },
                { label: '📊 Reportes', href: '/dashboard/crm/reports' },
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
            label: 'Inventario',
            href: '/dashboard/inventory',
        },
        {
            label: 'Productos',
            href: '/dashboard/configuration/products',
        },
        {
            label: '🛒 Punto de Venta',
            href: '/dashboard/pos/recepcion',
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
            label: 'CRM',
            href: '/dashboard/crm',
            items: [
                { label: 'Pipeline', href: '/dashboard/crm' },
                { label: '➕ Nuevo Lead', href: '/dashboard/crm/create' },
                { label: '📊 Reportes', href: '/dashboard/crm/reports' },
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
    ],
    USUARIO_FINAL: [
        {
            label: 'Dashboard',
            href: '/dashboard',
        },
    ],
};

