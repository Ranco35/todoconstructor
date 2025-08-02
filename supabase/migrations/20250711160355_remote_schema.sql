create sequence "public"."CashRegisterType_id_seq";

create sequence "public"."CashRegister_id_seq";

create sequence "public"."CashSession_id_seq";

create sequence "public"."Category_id_seq";

create sequence "public"."ClientContact_id_seq";

create sequence "public"."ClientTagAssignment_id_seq";

create sequence "public"."ClientTag_id_seq";

create sequence "public"."Client_id_seq";

create sequence "public"."Cost_Center_id_seq";

create sequence "public"."Country_id_seq";

create sequence "public"."EconomicSector_id_seq";

create sequence "public"."InventoryMovement_id_seq";

create sequence "public"."POSConfig_id_seq";

create sequence "public"."POSProductCategory_id_seq";

create sequence "public"."POSProduct_id_seq";

create sequence "public"."POSSaleItem_id_seq";

create sequence "public"."POSSale_id_seq";

create sequence "public"."POSTable_id_seq";

create sequence "public"."PettyCashExpense_id_seq";

create sequence "public"."PettyCashIncome_id_seq";

create sequence "public"."PettyCashPurchase_id_seq";

create sequence "public"."Product_id_seq";

create sequence "public"."RelationshipType_id_seq";

create sequence "public"."Role_id_seq";

create sequence "public"."SupplierContact_id_seq";

create sequence "public"."SupplierPayment_id_seq";

create sequence "public"."SupplierTagAssignment_id_seq";

create sequence "public"."SupplierTag_id_seq";

create sequence "public"."Supplier_id_seq";

create sequence "public"."Warehouse_Product_id_seq";

create sequence "public"."Warehouse_id_seq";

create sequence "public"."age_pricing_modular_id_seq";

create sequence "public"."companies_id_seq";

create sequence "public"."company_contacts_id_seq";

create sequence "public"."invoice_lines_id_seq";

create sequence "public"."invoice_payments_id_seq";

create sequence "public"."invoices_id_seq";

create sequence "public"."modular_reservations_id_seq";

create sequence "public"."package_products_modular_id_seq";

create sequence "public"."packages_modular_id_seq";

create sequence "public"."payments_id_seq";

create sequence "public"."product_components_id_seq";

create sequence "public"."product_package_linkage_id_seq";

create sequence "public"."product_sales_tracking_id_seq";

create sequence "public"."products_modular_id_seq";

create sequence "public"."reservation_comments_id_seq";

create sequence "public"."reservation_payments_id_seq";

create sequence "public"."reservation_products_id_seq";

create sequence "public"."reservations_id_seq";

create sequence "public"."rooms_id_seq";

create sequence "public"."sales_quote_lines_id_seq";

create sequence "public"."sales_quotes_id_seq";

create sequence "public"."sales_tracking_id_seq";

create sequence "public"."season_configurations_id_seq";

create sequence "public"."spa_products_id_seq";

create table "public"."CashRegister" (
    "id" bigint not null default nextval('"CashRegister_id_seq"'::regclass),
    "name" text not null,
    "location" text,
    "baseAmount" numeric(10,2) default 0,
    "cashAmount" numeric(10,2) default 0,
    "isActive" boolean default true,
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now(),
    "typeId" bigint,
    "costCenterId" bigint,
    "currentSessionId" bigint
);


alter table "public"."CashRegister" enable row level security;

create table "public"."CashRegisterType" (
    "id" bigint not null default nextval('"CashRegisterType_id_seq"'::regclass),
    "name" text not null,
    "displayName" text not null,
    "description" text,
    "isActive" boolean default true,
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now()
);


alter table "public"."CashRegisterType" enable row level security;

create table "public"."CashSession" (
    "id" bigint not null default nextval('"CashSession_id_seq"'::regclass),
    "userId" uuid not null,
    "cashRegisterId" bigint,
    "openingAmount" numeric(10,2) not null,
    "currentAmount" numeric(10,2) not null,
    "status" text not null default 'open'::text,
    "openedAt" timestamp with time zone default now(),
    "closedAt" timestamp with time zone,
    "notes" text,
    "sessionNumber" character varying(32),
    "cashRegisterTypeId" bigint,
    "isActive" boolean default true
);


alter table "public"."CashSession" enable row level security;

create table "public"."Category" (
    "id" bigint not null default nextval('"Category_id_seq"'::regclass),
    "name" text not null,
    "description" text,
    "parentId" bigint,
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now()
);


alter table "public"."Category" enable row level security;

create table "public"."Client" (
    "id" bigint not null default nextval('"Client_id_seq"'::regclass),
    "tipoCliente" text not null default 'empresa'::text,
    "nombrePrincipal" text not null,
    "apellido" text,
    "rut" text,
    "email" text,
    "telefono" text,
    "telefonoMovil" text,
    "estado" text not null default 'activo'::text,
    "fechaCreacion" timestamp with time zone default now(),
    "fechaModificacion" timestamp with time zone default now(),
    "calle" text,
    "calle2" text,
    "ciudad" text,
    "codigoPostal" text,
    "region" text,
    "paisId" bigint,
    "sitioWeb" text,
    "idioma" text default 'es'::text,
    "zonaHoraria" text,
    "imagen" text,
    "comentarios" text,
    "razonSocial" text,
    "giro" text,
    "numeroEmpleados" integer,
    "facturacionAnual" numeric(15,2),
    "sectorEconomicoId" bigint,
    "fechaNacimiento" date,
    "genero" text,
    "profesion" text,
    "titulo" text,
    "esClienteFrecuente" boolean default false,
    "fechaUltimaCompra" date,
    "totalCompras" numeric(15,2) default 0,
    "rankingCliente" integer default 0,
    "origenCliente" text,
    "recibirNewsletter" boolean default true,
    "aceptaMarketing" boolean default false
);


alter table "public"."Client" enable row level security;

create table "public"."ClientContact" (
    "id" bigint not null default nextval('"ClientContact_id_seq"'::regclass),
    "clienteId" bigint not null,
    "nombre" text not null,
    "apellido" text,
    "email" text,
    "telefono" text,
    "telefonoMovil" text,
    "cargo" text,
    "departamento" text,
    "tipoRelacionId" bigint,
    "relacion" text,
    "esContactoPrincipal" boolean default false,
    "notas" text,
    "fechaCreacion" timestamp with time zone default now()
);


alter table "public"."ClientContact" enable row level security;

create table "public"."ClientTag" (
    "id" bigint not null default nextval('"ClientTag_id_seq"'::regclass),
    "nombre" text not null,
    "color" text default '#3B82F6'::text,
    "icono" text,
    "descripcion" text,
    "tipoAplicacion" text default 'todos'::text,
    "esSistema" boolean default false,
    "activo" boolean default true,
    "orden" integer default 0,
    "fechaCreacion" timestamp with time zone default now()
);


alter table "public"."ClientTag" enable row level security;

create table "public"."ClientTagAssignment" (
    "id" bigint not null default nextval('"ClientTagAssignment_id_seq"'::regclass),
    "clienteId" bigint not null,
    "etiquetaId" bigint not null,
    "fechaAsignacion" timestamp with time zone default now(),
    "asignadoPor" uuid
);


alter table "public"."ClientTagAssignment" enable row level security;

create table "public"."Cost_Center" (
    "id" bigint not null default nextval('"Cost_Center_id_seq"'::regclass),
    "name" text not null,
    "description" text,
    "code" text,
    "isActive" boolean default true,
    "parentId" bigint,
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now()
);


alter table "public"."Cost_Center" enable row level security;

create table "public"."Country" (
    "id" bigint not null default nextval('"Country_id_seq"'::regclass),
    "codigo" character varying(3) not null,
    "nombre" text not null,
    "nombreCompleto" text,
    "activo" boolean default true
);


alter table "public"."Country" enable row level security;

create table "public"."EconomicSector" (
    "id" bigint not null default nextval('"EconomicSector_id_seq"'::regclass),
    "nombre" text not null,
    "descripcion" text,
    "activo" boolean default true,
    "orden" integer default 0,
    "fechaCreacion" timestamp with time zone default now(),
    "sectorPadreId" bigint
);


alter table "public"."EconomicSector" enable row level security;

create table "public"."InventoryMovement" (
    "id" bigint not null default nextval('"InventoryMovement_id_seq"'::regclass),
    "productId" bigint not null,
    "fromWarehouseId" bigint,
    "toWarehouseId" bigint,
    "movementType" character varying(50) not null,
    "quantity" integer not null,
    "reason" text,
    "notes" text,
    "userId" uuid,
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now()
);


alter table "public"."InventoryMovement" enable row level security;

create table "public"."POSConfig" (
    "id" bigint not null default nextval('"POSConfig_id_seq"'::regclass),
    "cashRegisterTypeId" bigint not null,
    "taxRate" numeric(5,2) default 19.00,
    "currency" text default 'COP'::text,
    "receiptFooter" text,
    "allowNegativeStock" boolean default false,
    "requireCustomerInfo" boolean default false,
    "autoGenerateReceipt" boolean default true,
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now()
);


alter table "public"."POSConfig" enable row level security;

create table "public"."POSProduct" (
    "id" bigint not null default nextval('"POSProduct_id_seq"'::regclass),
    "name" text not null,
    "description" text,
    "sku" text,
    "price" numeric(10,2) not null,
    "cost" numeric(10,2),
    "image" text,
    "categoryId" bigint not null,
    "productId" bigint,
    "isActive" boolean default true,
    "stockRequired" boolean default false,
    "sortOrder" integer default 0,
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now()
);


alter table "public"."POSProduct" enable row level security;

create table "public"."POSProductCategory" (
    "id" bigint not null default nextval('"POSProductCategory_id_seq"'::regclass),
    "name" text not null,
    "displayName" text not null,
    "icon" text,
    "color" text,
    "cashRegisterTypeId" bigint,
    "sortOrder" integer default 0,
    "isActive" boolean default true,
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now()
);


alter table "public"."POSProductCategory" enable row level security;

create table "public"."POSSale" (
    "id" bigint not null default nextval('"POSSale_id_seq"'::regclass),
    "sessionId" bigint not null,
    "saleNumber" text not null,
    "customerName" text,
    "customerDocument" text,
    "tableNumber" text,
    "roomNumber" text,
    "subtotal" numeric(10,2) not null,
    "taxAmount" numeric(10,2) not null default 0,
    "discountAmount" numeric(10,2) not null default 0,
    "total" numeric(10,2) not null,
    "paymentMethod" text not null,
    "cashReceived" numeric(10,2),
    "change" numeric(10,2),
    "status" text not null default 'completed'::text,
    "notes" text,
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now()
);


alter table "public"."POSSale" enable row level security;

create table "public"."POSSaleItem" (
    "id" bigint not null default nextval('"POSSaleItem_id_seq"'::regclass),
    "saleId" bigint not null,
    "productId" bigint not null,
    "productName" text not null,
    "quantity" integer not null,
    "unitPrice" numeric(10,2) not null,
    "total" numeric(10,2) not null,
    "notes" text,
    "createdAt" timestamp with time zone default now()
);


alter table "public"."POSSaleItem" enable row level security;

create table "public"."POSTable" (
    "id" bigint not null default nextval('"POSTable_id_seq"'::regclass),
    "number" text not null,
    "name" text,
    "capacity" integer,
    "status" text not null default 'available'::text,
    "currentSaleId" bigint,
    "isActive" boolean default true,
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now()
);


alter table "public"."POSTable" enable row level security;

create table "public"."PettyCashExpense" (
    "id" bigint not null default nextval('"PettyCashExpense_id_seq"'::regclass),
    "sessionId" bigint not null,
    "amount" numeric(10,2) not null,
    "description" text not null,
    "category" text not null,
    "costCenterId" bigint,
    "receiptNumber" text,
    "createdAt" timestamp with time zone default now(),
    "paymentMethod" text default 'cash'::text,
    "transactionType" text default 'expense'::text,
    "affectsPhysicalCash" boolean default true,
    "bankReference" text,
    "bankAccount" text,
    "status" text not null default 'approved'::text,
    "userId" uuid
);


alter table "public"."PettyCashExpense" enable row level security;

create table "public"."PettyCashIncome" (
    "id" integer not null default nextval('"PettyCashIncome_id_seq"'::regclass),
    "sessionId" integer not null,
    "amount" numeric(10,2) not null,
    "description" text not null,
    "category" character varying(50) not null default 'Otros'::character varying,
    "paymentMethod" character varying(50) not null default 'Efectivo'::character varying,
    "notes" text,
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now()
);


alter table "public"."PettyCashIncome" enable row level security;

create table "public"."PettyCashPurchase" (
    "id" bigint not null default nextval('"PettyCashPurchase_id_seq"'::regclass),
    "sessionId" bigint not null,
    "productId" bigint,
    "quantity" integer not null,
    "unitPrice" numeric(10,2) not null,
    "totalAmount" numeric(10,2) not null,
    "costCenterId" bigint,
    "supplierId" bigint,
    "createdAt" timestamp with time zone default now(),
    "paymentMethod" text default 'cash'::text,
    "transactionType" text default 'purchase'::text,
    "affectsPhysicalCash" boolean default true,
    "bankReference" text,
    "bankAccount" text,
    "status" text not null default 'approved'::text,
    "userId" uuid
);


alter table "public"."PettyCashPurchase" enable row level security;

create table "public"."Product" (
    "id" bigint not null default nextval('"Product_id_seq"'::regclass),
    "name" text not null,
    "sku" text,
    "barcode" text,
    "description" text,
    "categoryid" bigint,
    "brand" text,
    "image" text,
    "costprice" numeric(10,2),
    "saleprice" numeric(10,2),
    "vat" numeric(5,2),
    "supplierid" bigint,
    "supplierCode" text,
    "defaultCostCenterId" bigint,
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now(),
    "type" character varying(20) not null default 'ALMACENABLE'::character varying,
    "isEquipment" boolean default false,
    "model" text,
    "serialNumber" text,
    "purchaseDate" date,
    "warrantyExpiration" date,
    "usefulLife" integer,
    "maintenanceInterval" integer,
    "lastMaintenance" date,
    "nextMaintenance" date,
    "maintenanceCost" numeric,
    "maintenanceProvider" text,
    "currentLocation" text,
    "responsiblePerson" text,
    "operationalStatus" text default 'OPERATIVO'::text,
    "servicesSold" integer default 0,
    "final_price_with_vat" numeric(12,2),
    "isPOSEnabled" boolean default false
);


alter table "public"."Product" enable row level security;

create table "public"."RelationshipType" (
    "id" bigint not null default nextval('"RelationshipType_id_seq"'::regclass),
    "nombre" text not null,
    "descripcion" text,
    "activo" boolean default true,
    "orden" integer default 0
);


alter table "public"."RelationshipType" enable row level security;

create table "public"."Role" (
    "id" bigint not null default nextval('"Role_id_seq"'::regclass),
    "roleName" text not null,
    "description" text,
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now()
);


alter table "public"."Role" enable row level security;

create table "public"."Supplier" (
    "id" bigint not null default nextval('"Supplier_id_seq"'::regclass),
    "name" text not null,
    "email" text,
    "phone" text,
    "address" text,
    "city" text,
    "state" text,
    "country" text,
    "postalCode" text,
    "taxId" text,
    "companyType" text,
    "rank" text,
    "paymentTerm" text,
    "creditLimit" numeric(10,2),
    "isActive" boolean default true,
    "notes" text,
    "costCenterId" bigint,
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now(),
    "active" boolean not null default true,
    "accountManager" text,
    "purchasingAgent" text,
    "category" text,
    "countryCode" text,
    "displayName" text,
    "internalRef" text,
    "website" text,
    "street" text,
    "street2" text,
    "zipCode" text,
    "mobile" text,
    "fax" text,
    "currency" text,
    "customPaymentDays" integer,
    "supplierRank" text,
    "rankPoints" integer default 0,
    "logo" text,
    "image" text,
    "publicNotes" text,
    "language" text,
    "timezone" text,
    "createdBy" integer,
    "lastModifiedBy" integer,
    "vat" text
);


alter table "public"."Supplier" enable row level security;

create table "public"."SupplierContact" (
    "id" integer not null default nextval('"SupplierContact_id_seq"'::regclass),
    "supplierId" integer not null,
    "name" text not null,
    "position" text,
    "type" text not null default 'PRINCIPAL'::text,
    "email" text,
    "phone" text,
    "mobile" text,
    "notes" text,
    "isPrimary" boolean not null default false,
    "active" boolean not null default true,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now()
);


alter table "public"."SupplierContact" enable row level security;

create table "public"."SupplierPayment" (
    "id" bigint not null default nextval('"SupplierPayment_id_seq"'::regclass),
    "sessionId" bigint not null,
    "supplierId" bigint not null,
    "amount" numeric(10,2) not null,
    "description" text not null,
    "costCenterId" bigint,
    "paymentMethod" text not null default 'cash'::text,
    "bankReference" text,
    "bankAccount" text,
    "receiptNumber" text,
    "notes" text,
    "userId" uuid not null,
    "pettyCashExpenseId" bigint,
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now()
);


create table "public"."SupplierTag" (
    "id" integer not null default nextval('"SupplierTag_id_seq"'::regclass),
    "nombre" text not null,
    "descripcion" text,
    "color" text default '#3B82F6'::text,
    "tipoAplicacion" text not null default 'todos'::text,
    "esSistema" boolean default false,
    "orden" integer default 0,
    "activo" boolean default true,
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now(),
    "icono" text default 'truck'::text
);


create table "public"."SupplierTagAssignment" (
    "id" integer not null default nextval('"SupplierTagAssignment_id_seq"'::regclass),
    "supplierId" integer not null,
    "etiquetaId" integer not null,
    "createdAt" timestamp with time zone default now()
);


create table "public"."User" (
    "id" uuid not null,
    "name" text not null,
    "username" text,
    "email" text,
    "roleId" bigint,
    "department" text,
    "costCenterId" bigint,
    "isActive" boolean default true,
    "lastLogin" timestamp with time zone,
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now(),
    "isCashier" boolean default false
);


alter table "public"."User" enable row level security;

create table "public"."Warehouse" (
    "id" bigint not null default nextval('"Warehouse_id_seq"'::regclass),
    "name" text not null,
    "description" text,
    "location" text,
    "type" text not null,
    "capacity" integer,
    "costCenterId" bigint,
    "isActive" boolean default true,
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now(),
    "parentId" bigint
);


alter table "public"."Warehouse" enable row level security;

create table "public"."Warehouse_Product" (
    "id" bigint not null default nextval('"Warehouse_Product_id_seq"'::regclass),
    "warehouseId" bigint not null,
    "productId" bigint not null,
    "quantity" integer not null default 0,
    "minStock" integer default 0,
    "maxStock" integer,
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now()
);


alter table "public"."Warehouse_Product" enable row level security;

create table "public"."age_pricing_modular" (
    "id" bigint not null default nextval('age_pricing_modular_id_seq'::regclass),
    "age_category" character varying(20) not null,
    "min_age" integer not null,
    "max_age" integer,
    "multiplier" numeric(3,2) not null,
    "description" character varying(255),
    "created_at" timestamp without time zone default now()
);


create table "public"."companies" (
    "id" bigint not null default nextval('companies_id_seq'::regclass),
    "name" character varying(255) not null,
    "rut" character varying(20) not null,
    "address" text,
    "contact_email" character varying(255),
    "contact_phone" character varying(50),
    "payment_terms" character varying(50) default '30 días'::character varying,
    "credit_limit" numeric(12,2) default 0,
    "is_active" boolean default true,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


create table "public"."company_contacts" (
    "id" bigint not null default nextval('company_contacts_id_seq'::regclass),
    "company_id" bigint,
    "name" character varying(255) not null,
    "email" character varying(255) not null,
    "phone" character varying(50),
    "position" character varying(100),
    "can_make_reservations" boolean default true,
    "can_authorize_expenses" boolean default false,
    "spending_limit" numeric(10,2) default 0,
    "is_active" boolean default true,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
);


create table "public"."invoice_lines" (
    "id" bigint not null default nextval('invoice_lines_id_seq'::regclass),
    "invoice_id" bigint,
    "product_id" bigint,
    "description" character varying(255),
    "quantity" numeric(10,2) not null default 1,
    "unit_price" numeric(18,2) not null default 0,
    "discount_percent" numeric(5,2) default 0,
    "taxes" jsonb,
    "subtotal" numeric(18,2) not null default 0,
    "modular_product_id" integer,
    "name" text
);


create table "public"."invoice_payments" (
    "id" bigint not null default nextval('invoice_payments_id_seq'::regclass),
    "invoice_id" bigint,
    "payment_date" date not null default now(),
    "amount" numeric(18,2) not null default 0,
    "payment_method" character varying(32) not null,
    "reference" character varying(64),
    "created_by" uuid
);


create table "public"."invoices" (
    "id" bigint not null default nextval('invoices_id_seq'::regclass),
    "number" character varying(32) not null,
    "client_id" bigint,
    "reservation_id" bigint,
    "quote_id" bigint,
    "status" character varying(16) not null default 'draft'::character varying,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "total" numeric(18,2) not null default 0,
    "currency" character varying(8) not null default 'CLP'::character varying,
    "due_date" date,
    "notes" text,
    "payment_terms" character varying(64),
    "company_id" bigint,
    "seller_id" uuid,
    "budget_id" bigint
);


create table "public"."modular_reservations" (
    "id" bigint not null default nextval('modular_reservations_id_seq'::regclass),
    "reservation_id" bigint,
    "adults" integer not null default 1,
    "children" integer not null default 0,
    "children_ages" jsonb default '[]'::jsonb,
    "package_modular_id" bigint,
    "room_code" character varying(100) not null,
    "package_code" character varying(100) not null,
    "additional_products" jsonb default '[]'::jsonb,
    "pricing_breakdown" jsonb,
    "room_total" numeric(12,2) default 0,
    "package_total" numeric(12,2) default 0,
    "additional_total" numeric(12,2) default 0,
    "grand_total" numeric(12,2) default 0,
    "nights" integer not null,
    "daily_average" numeric(12,2) default 0,
    "client_id" bigint not null,
    "comments" text,
    "status" character varying(50) default 'active'::character varying,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "season_name" character varying(100),
    "season_type" character varying(20),
    "seasonal_multiplier" numeric(5,2) default 0.00,
    "base_price" numeric(12,2) default 0,
    "final_price" numeric(12,2) default 0
);


alter table "public"."modular_reservations" enable row level security;

create table "public"."package_products_modular" (
    "id" bigint not null default nextval('package_products_modular_id_seq'::regclass),
    "package_id" bigint,
    "product_id" bigint,
    "is_included" boolean default true,
    "sort_order" integer default 0,
    "created_at" timestamp without time zone default now()
);


create table "public"."packages_modular" (
    "id" bigint not null default nextval('packages_modular_id_seq'::regclass),
    "code" character varying(50) not null,
    "name" character varying(255) not null,
    "description" text,
    "color" character varying(20) default 'blue'::character varying,
    "is_active" boolean default true,
    "sort_order" integer default 0,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now()
);


create table "public"."payments" (
    "id" bigint not null default nextval('payments_id_seq'::regclass),
    "reservation_id" bigint,
    "amount" numeric(10,2) not null,
    "method" character varying(50) not null,
    "reference" character varying(255),
    "notes" text,
    "processed_by" character varying(255),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
);


create table "public"."product_components" (
    "id" bigint not null default nextval('product_components_id_seq'::regclass),
    "combo_product_id" bigint not null,
    "component_product_id" bigint not null,
    "quantity" numeric(10,2) not null default 1,
    "unit_price" numeric(10,2) not null default 0,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now()
);


alter table "public"."product_components" enable row level security;

create table "public"."product_package_linkage" (
    "id" bigint not null default nextval('product_package_linkage_id_seq'::regclass),
    "product_id" bigint not null,
    "package_id" bigint not null,
    "is_included" boolean default true,
    "sort_order" integer default 0,
    "quantity_per_person" numeric(3,2) default 1.0,
    "cost_percentage" numeric(5,2) default 100.0,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now()
);


alter table "public"."product_package_linkage" enable row level security;

create table "public"."product_sales_tracking" (
    "id" bigint not null default nextval('product_sales_tracking_id_seq'::regclass),
    "product_id" bigint not null,
    "sale_date" date not null default CURRENT_DATE,
    "sale_type" character varying(20) not null,
    "package_id" bigint,
    "quantity" numeric(10,2) not null default 1,
    "unit_price" numeric(10,2) not null,
    "total_amount" numeric(10,2) not null,
    "customer_info" jsonb,
    "reservation_id" bigint,
    "created_at" timestamp without time zone default now(),
    "user_id" uuid,
    "notes" text,
    "updated_at" timestamp without time zone default now()
);


alter table "public"."product_sales_tracking" enable row level security;

create table "public"."products_modular" (
    "id" bigint not null default nextval('products_modular_id_seq'::regclass),
    "code" character varying(50) not null,
    "name" character varying(255) not null,
    "description" text,
    "price" numeric(12,2) not null default 0,
    "category" character varying(50) not null,
    "per_person" boolean default true,
    "is_active" boolean default true,
    "sort_order" integer default 0,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now(),
    "original_id" bigint,
    "sku" text
);


create table "public"."reservation_comments" (
    "id" bigint not null default nextval('reservation_comments_id_seq'::regclass),
    "reservation_id" bigint,
    "text" text not null,
    "author" character varying(255) not null,
    "comment_type" character varying(50) default 'general'::character varying,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
);


create table "public"."reservation_payments" (
    "id" bigint not null default nextval('reservation_payments_id_seq'::regclass),
    "reservation_id" bigint not null,
    "amount" numeric(12,2) not null,
    "payment_type" character varying(20) not null,
    "payment_method" character varying(50) not null,
    "previous_paid_amount" numeric(12,2) default 0,
    "new_total_paid" numeric(12,2) not null,
    "remaining_balance" numeric(12,2) not null,
    "total_reservation_amount" numeric(12,2) not null,
    "reference_number" character varying(100),
    "notes" text,
    "processed_by" character varying(100),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."reservation_payments" enable row level security;

create table "public"."reservation_products" (
    "id" bigint not null default nextval('reservation_products_id_seq'::regclass),
    "reservation_id" bigint,
    "product_id" bigint,
    "quantity" integer not null default 1,
    "unit_price" numeric(10,2) not null,
    "total_price" numeric(10,2) not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "product_type" character varying(50) default 'spa_product'::character varying,
    "modular_product_id" bigint
);


create table "public"."reservations" (
    "id" bigint not null default nextval('reservations_id_seq'::regclass),
    "guest_name" character varying(255) not null,
    "guest_email" character varying(255) not null,
    "guest_phone" character varying(50) not null,
    "check_in" date not null,
    "check_out" date not null,
    "guests" integer not null default 1,
    "room_id" bigint not null,
    "client_type" character varying(20) default 'individual'::character varying,
    "contact_id" bigint,
    "company_id" bigint,
    "billing_name" character varying(255) not null,
    "billing_rut" character varying(20) not null,
    "billing_address" text not null,
    "authorized_by" character varying(255) not null,
    "status" character varying(20) default 'pending'::character varying,
    "total_amount" numeric(12,2) default 0,
    "deposit_amount" numeric(12,2) default 0,
    "paid_amount" numeric(12,2) default 0,
    "pending_amount" numeric(12,2) default 0,
    "payment_status" character varying(20) default 'no_payment'::character varying,
    "payment_method" character varying(50),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "client_id" bigint not null
);


create table "public"."rooms" (
    "id" bigint not null default nextval('rooms_id_seq'::regclass),
    "number" character varying(10) not null,
    "type" character varying(100) not null,
    "capacity" integer not null,
    "floor" integer,
    "amenities" text,
    "price_per_night" numeric(10,2),
    "is_active" boolean default true,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "max_capacity" integer default 0,
    "child_capacity" integer default 0,
    "bed_config" jsonb default '[]'::jsonb,
    "extra_bed_available" boolean default false,
    "extra_bed_price" numeric(8,2) default 0,
    "building" character varying(50),
    "view_type" character varying(50),
    "wifi" boolean default true,
    "minibar" boolean default false,
    "balcony" boolean default false,
    "jacuzzi" boolean default false,
    "price_low_season" numeric(10,2),
    "price_mid_season" numeric(10,2),
    "price_high_season" numeric(10,2),
    "room_status" character varying(20) default 'available'::character varying
);


create table "public"."sales_quote_lines" (
    "id" bigint not null default nextval('sales_quote_lines_id_seq'::regclass),
    "quote_id" bigint,
    "product_id" bigint,
    "description" character varying(255),
    "quantity" numeric(10,2) not null default 1,
    "unit_price" numeric(18,2) not null default 0,
    "discount_percent" numeric(5,2) default 0,
    "taxes" jsonb,
    "subtotal" numeric(18,2) not null default 0
);


create table "public"."sales_quotes" (
    "id" bigint not null default nextval('sales_quotes_id_seq'::regclass),
    "number" character varying(32) not null,
    "client_id" bigint,
    "reservation_id" bigint,
    "status" character varying(16) not null default 'draft'::character varying,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "total" numeric(18,2) not null default 0,
    "currency" character varying(8) not null default 'CLP'::character varying,
    "expiration_date" date,
    "notes" text,
    "payment_terms" character varying(64),
    "company_id" bigint,
    "seller_id" uuid
);


create table "public"."sales_tracking" (
    "id" bigint not null default nextval('sales_tracking_id_seq'::regclass),
    "product_id" bigint not null,
    "product_name" character varying(255) not null,
    "product_sku" character varying(100),
    "category_id" bigint not null,
    "category_name" character varying(255) not null,
    "quantity" integer not null default 1,
    "unit_price" numeric(10,2) not null,
    "total_price" numeric(10,2) not null,
    "sale_type" character varying(20) not null,
    "package_name" character varying(255),
    "reservation_id" bigint,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."sales_tracking" enable row level security;

create table "public"."season_configurations" (
    "id" bigint not null default nextval('season_configurations_id_seq'::regclass),
    "name" character varying(100) not null,
    "season_type" character varying(20) not null,
    "start_date" date not null,
    "end_date" date not null,
    "discount_percentage" numeric(5,2) default 0,
    "priority" integer default 1,
    "applies_to_rooms" boolean default true,
    "applies_to_programs" boolean default true,
    "is_active" boolean default true,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" character varying(255)
);


alter table "public"."season_configurations" enable row level security;

create table "public"."spa_products" (
    "id" bigint not null default nextval('spa_products_id_seq'::regclass),
    "name" character varying(255) not null,
    "description" text,
    "category" character varying(100) not null,
    "type" character varying(50) not null,
    "price" numeric(10,2) not null,
    "duration" character varying(50),
    "sku" character varying(50),
    "is_active" boolean default true,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "category_id" bigint
);


alter sequence "public"."CashRegisterType_id_seq" owned by "public"."CashRegisterType"."id";

alter sequence "public"."CashRegister_id_seq" owned by "public"."CashRegister"."id";

alter sequence "public"."CashSession_id_seq" owned by "public"."CashSession"."id";

alter sequence "public"."Category_id_seq" owned by "public"."Category"."id";

alter sequence "public"."ClientContact_id_seq" owned by "public"."ClientContact"."id";

alter sequence "public"."ClientTagAssignment_id_seq" owned by "public"."ClientTagAssignment"."id";

alter sequence "public"."ClientTag_id_seq" owned by "public"."ClientTag"."id";

alter sequence "public"."Client_id_seq" owned by "public"."Client"."id";

alter sequence "public"."Cost_Center_id_seq" owned by "public"."Cost_Center"."id";

alter sequence "public"."Country_id_seq" owned by "public"."Country"."id";

alter sequence "public"."EconomicSector_id_seq" owned by "public"."EconomicSector"."id";

alter sequence "public"."InventoryMovement_id_seq" owned by "public"."InventoryMovement"."id";

alter sequence "public"."POSConfig_id_seq" owned by "public"."POSConfig"."id";

alter sequence "public"."POSProductCategory_id_seq" owned by "public"."POSProductCategory"."id";

alter sequence "public"."POSProduct_id_seq" owned by "public"."POSProduct"."id";

alter sequence "public"."POSSaleItem_id_seq" owned by "public"."POSSaleItem"."id";

alter sequence "public"."POSSale_id_seq" owned by "public"."POSSale"."id";

alter sequence "public"."POSTable_id_seq" owned by "public"."POSTable"."id";

alter sequence "public"."PettyCashExpense_id_seq" owned by "public"."PettyCashExpense"."id";

alter sequence "public"."PettyCashIncome_id_seq" owned by "public"."PettyCashIncome"."id";

alter sequence "public"."PettyCashPurchase_id_seq" owned by "public"."PettyCashPurchase"."id";

alter sequence "public"."Product_id_seq" owned by "public"."Product"."id";

alter sequence "public"."RelationshipType_id_seq" owned by "public"."RelationshipType"."id";

alter sequence "public"."Role_id_seq" owned by "public"."Role"."id";

alter sequence "public"."SupplierContact_id_seq" owned by "public"."SupplierContact"."id";

alter sequence "public"."SupplierPayment_id_seq" owned by "public"."SupplierPayment"."id";

alter sequence "public"."SupplierTagAssignment_id_seq" owned by "public"."SupplierTagAssignment"."id";

alter sequence "public"."SupplierTag_id_seq" owned by "public"."SupplierTag"."id";

alter sequence "public"."Supplier_id_seq" owned by "public"."Supplier"."id";

alter sequence "public"."Warehouse_Product_id_seq" owned by "public"."Warehouse_Product"."id";

alter sequence "public"."Warehouse_id_seq" owned by "public"."Warehouse"."id";

alter sequence "public"."age_pricing_modular_id_seq" owned by "public"."age_pricing_modular"."id";

alter sequence "public"."companies_id_seq" owned by "public"."companies"."id";

alter sequence "public"."company_contacts_id_seq" owned by "public"."company_contacts"."id";

alter sequence "public"."invoice_lines_id_seq" owned by "public"."invoice_lines"."id";

alter sequence "public"."invoice_payments_id_seq" owned by "public"."invoice_payments"."id";

alter sequence "public"."invoices_id_seq" owned by "public"."invoices"."id";

alter sequence "public"."modular_reservations_id_seq" owned by "public"."modular_reservations"."id";

alter sequence "public"."package_products_modular_id_seq" owned by "public"."package_products_modular"."id";

alter sequence "public"."packages_modular_id_seq" owned by "public"."packages_modular"."id";

alter sequence "public"."payments_id_seq" owned by "public"."payments"."id";

alter sequence "public"."product_components_id_seq" owned by "public"."product_components"."id";

alter sequence "public"."product_package_linkage_id_seq" owned by "public"."product_package_linkage"."id";

alter sequence "public"."product_sales_tracking_id_seq" owned by "public"."product_sales_tracking"."id";

alter sequence "public"."products_modular_id_seq" owned by "public"."products_modular"."id";

alter sequence "public"."reservation_comments_id_seq" owned by "public"."reservation_comments"."id";

alter sequence "public"."reservation_payments_id_seq" owned by "public"."reservation_payments"."id";

alter sequence "public"."reservation_products_id_seq" owned by "public"."reservation_products"."id";

alter sequence "public"."reservations_id_seq" owned by "public"."reservations"."id";

alter sequence "public"."rooms_id_seq" owned by "public"."rooms"."id";

alter sequence "public"."sales_quote_lines_id_seq" owned by "public"."sales_quote_lines"."id";

alter sequence "public"."sales_quotes_id_seq" owned by "public"."sales_quotes"."id";

alter sequence "public"."sales_tracking_id_seq" owned by "public"."sales_tracking"."id";

alter sequence "public"."season_configurations_id_seq" owned by "public"."season_configurations"."id";

alter sequence "public"."spa_products_id_seq" owned by "public"."spa_products"."id";

CREATE UNIQUE INDEX "CashRegisterType_name_key" ON public."CashRegisterType" USING btree (name);

CREATE UNIQUE INDEX "CashRegisterType_pkey" ON public."CashRegisterType" USING btree (id);

CREATE UNIQUE INDEX "CashRegister_pkey" ON public."CashRegister" USING btree (id);

CREATE UNIQUE INDEX "CashSession_pkey" ON public."CashSession" USING btree (id);

CREATE UNIQUE INDEX "Category_pkey" ON public."Category" USING btree (id);

CREATE UNIQUE INDEX "ClientContact_pkey" ON public."ClientContact" USING btree (id);

CREATE UNIQUE INDEX "ClientTagAssignment_clienteId_etiquetaId_key" ON public."ClientTagAssignment" USING btree ("clienteId", "etiquetaId");

CREATE UNIQUE INDEX "ClientTagAssignment_pkey" ON public."ClientTagAssignment" USING btree (id);

CREATE UNIQUE INDEX "ClientTag_nombre_key" ON public."ClientTag" USING btree (nombre);

CREATE UNIQUE INDEX "ClientTag_pkey" ON public."ClientTag" USING btree (id);

CREATE UNIQUE INDEX "Client_pkey" ON public."Client" USING btree (id);

CREATE UNIQUE INDEX "Client_rut_key" ON public."Client" USING btree (rut);

CREATE UNIQUE INDEX "Cost_Center_code_key" ON public."Cost_Center" USING btree (code);

CREATE UNIQUE INDEX "Cost_Center_name_key" ON public."Cost_Center" USING btree (name);

CREATE UNIQUE INDEX "Cost_Center_pkey" ON public."Cost_Center" USING btree (id);

CREATE UNIQUE INDEX "Country_codigo_key" ON public."Country" USING btree (codigo);

CREATE UNIQUE INDEX "Country_pkey" ON public."Country" USING btree (id);

CREATE UNIQUE INDEX "EconomicSector_nombre_key" ON public."EconomicSector" USING btree (nombre);

CREATE UNIQUE INDEX "EconomicSector_pkey" ON public."EconomicSector" USING btree (id);

CREATE UNIQUE INDEX "InventoryMovement_pkey" ON public."InventoryMovement" USING btree (id);

CREATE UNIQUE INDEX "POSConfig_pkey" ON public."POSConfig" USING btree (id);

CREATE UNIQUE INDEX "POSProductCategory_pkey" ON public."POSProductCategory" USING btree (id);

CREATE UNIQUE INDEX "POSProduct_pkey" ON public."POSProduct" USING btree (id);

CREATE UNIQUE INDEX "POSProduct_sku_key" ON public."POSProduct" USING btree (sku);

CREATE UNIQUE INDEX "POSSaleItem_pkey" ON public."POSSaleItem" USING btree (id);

CREATE UNIQUE INDEX "POSSale_pkey" ON public."POSSale" USING btree (id);

CREATE UNIQUE INDEX "POSTable_pkey" ON public."POSTable" USING btree (id);

CREATE UNIQUE INDEX "PettyCashExpense_pkey" ON public."PettyCashExpense" USING btree (id);

CREATE INDEX "PettyCashIncome_category_idx" ON public."PettyCashIncome" USING btree (category);

CREATE INDEX "PettyCashIncome_createdAt_idx" ON public."PettyCashIncome" USING btree ("createdAt");

CREATE UNIQUE INDEX "PettyCashIncome_pkey" ON public."PettyCashIncome" USING btree (id);

CREATE INDEX "PettyCashIncome_sessionId_idx" ON public."PettyCashIncome" USING btree ("sessionId");

CREATE UNIQUE INDEX "PettyCashPurchase_pkey" ON public."PettyCashPurchase" USING btree (id);

CREATE UNIQUE INDEX "Product_pkey" ON public."Product" USING btree (id);

CREATE UNIQUE INDEX "RelationshipType_nombre_key" ON public."RelationshipType" USING btree (nombre);

CREATE UNIQUE INDEX "RelationshipType_pkey" ON public."RelationshipType" USING btree (id);

CREATE UNIQUE INDEX "Role_pkey" ON public."Role" USING btree (id);

CREATE UNIQUE INDEX "Role_roleName_key" ON public."Role" USING btree ("roleName");

CREATE UNIQUE INDEX "SupplierContact_pkey" ON public."SupplierContact" USING btree (id);

CREATE UNIQUE INDEX "SupplierPayment_pkey" ON public."SupplierPayment" USING btree (id);

CREATE UNIQUE INDEX "SupplierTagAssignment_pkey" ON public."SupplierTagAssignment" USING btree (id);

CREATE UNIQUE INDEX "SupplierTagAssignment_supplierId_etiquetaId_key" ON public."SupplierTagAssignment" USING btree ("supplierId", "etiquetaId");

CREATE UNIQUE INDEX "SupplierTag_pkey" ON public."SupplierTag" USING btree (id);

CREATE UNIQUE INDEX "Supplier_pkey" ON public."Supplier" USING btree (id);

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);

CREATE UNIQUE INDEX "User_pkey" ON public."User" USING btree (id);

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);

CREATE UNIQUE INDEX "Warehouse_Product_pkey" ON public."Warehouse_Product" USING btree (id);

CREATE UNIQUE INDEX "Warehouse_Product_warehouseId_productId_key" ON public."Warehouse_Product" USING btree ("warehouseId", "productId");

CREATE UNIQUE INDEX "Warehouse_pkey" ON public."Warehouse" USING btree (id);

CREATE UNIQUE INDEX age_pricing_modular_pkey ON public.age_pricing_modular USING btree (id);

CREATE UNIQUE INDEX companies_pkey ON public.companies USING btree (id);

CREATE UNIQUE INDEX companies_rut_key ON public.companies USING btree (rut);

CREATE UNIQUE INDEX company_contacts_pkey ON public.company_contacts USING btree (id);

CREATE INDEX idx_cash_register_active ON public."CashRegister" USING btree ("isActive");

CREATE INDEX idx_cash_register_current_session ON public."CashRegister" USING btree ("currentSessionId");

CREATE INDEX idx_cash_register_name ON public."CashRegister" USING btree (name);

CREATE INDEX idx_cash_register_type ON public."CashRegister" USING btree ("typeId");

CREATE INDEX idx_cash_session_number ON public."CashSession" USING btree ("sessionNumber");

CREATE INDEX idx_cash_session_register_type ON public."CashSession" USING btree ("cashRegisterTypeId");

CREATE INDEX idx_cash_session_user ON public."CashSession" USING btree ("userId");

CREATE INDEX idx_category_parent ON public."Category" USING btree ("parentId");

CREATE INDEX idx_client_ciudad ON public."Client" USING btree (ciudad);

CREATE INDEX idx_client_contacto_cliente ON public."ClientContact" USING btree ("clienteId");

CREATE INDEX idx_client_contacto_email ON public."ClientContact" USING btree (email);

CREATE INDEX idx_client_contacto_nombre ON public."ClientContact" USING btree (nombre, apellido);

CREATE INDEX idx_client_frecuente ON public."Client" USING btree ("esClienteFrecuente");

CREATE INDEX idx_client_nombre ON public."Client" USING btree ("nombrePrincipal");

CREATE INDEX idx_client_ranking ON public."Client" USING btree ("rankingCliente");

CREATE INDEX idx_client_rut ON public."Client" USING btree (rut);

CREATE INDEX idx_client_tag_activo ON public."ClientTag" USING btree (activo);

CREATE INDEX idx_client_tag_aplicacion ON public."ClientTag" USING btree ("tipoAplicacion");

CREATE INDEX idx_client_tag_assignment_cliente ON public."ClientTagAssignment" USING btree ("clienteId");

CREATE INDEX idx_client_tag_assignment_etiqueta ON public."ClientTagAssignment" USING btree ("etiquetaId");

CREATE INDEX idx_client_tag_assignment_fecha ON public."ClientTagAssignment" USING btree ("fechaAsignacion");

CREATE INDEX idx_client_tag_nombre ON public."ClientTag" USING btree (nombre);

CREATE INDEX idx_client_tipo ON public."Client" USING btree ("tipoCliente");

CREATE INDEX idx_cost_center_parent ON public."Cost_Center" USING btree ("parentId");

CREATE INDEX idx_economic_sector_padre ON public."EconomicSector" USING btree ("sectorPadreId");

CREATE INDEX idx_inventory_movement_created_at ON public."InventoryMovement" USING btree ("createdAt");

CREATE INDEX idx_inventory_movement_from_warehouse ON public."InventoryMovement" USING btree ("fromWarehouseId");

CREATE INDEX idx_inventory_movement_product ON public."InventoryMovement" USING btree ("productId");

CREATE INDEX idx_inventory_movement_to_warehouse ON public."InventoryMovement" USING btree ("toWarehouseId");

CREATE INDEX idx_inventory_movement_type ON public."InventoryMovement" USING btree ("movementType");

CREATE INDEX idx_inventory_movement_user ON public."InventoryMovement" USING btree ("userId");

CREATE INDEX idx_invoice_payments_invoice_id ON public.invoice_payments USING btree (invoice_id);

CREATE INDEX idx_invoices_client_id ON public.invoices USING btree (client_id);

CREATE INDEX idx_modular_reservations_client_id ON public.modular_reservations USING btree (client_id);

CREATE INDEX idx_modular_reservations_created_at ON public.modular_reservations USING btree (created_at);

CREATE INDEX idx_modular_reservations_package_modular_id ON public.modular_reservations USING btree (package_modular_id);

CREATE INDEX idx_modular_reservations_reservation_id ON public.modular_reservations USING btree (reservation_id);

CREATE INDEX idx_modular_reservations_season_name ON public.modular_reservations USING btree (season_name);

CREATE INDEX idx_modular_reservations_season_type ON public.modular_reservations USING btree (season_type);

CREATE INDEX idx_modular_reservations_status ON public.modular_reservations USING btree (status);

CREATE INDEX idx_petty_cash_expense_affects_cash ON public."PettyCashExpense" USING btree ("affectsPhysicalCash");

CREATE INDEX idx_petty_cash_expense_payment_method ON public."PettyCashExpense" USING btree ("paymentMethod");

CREATE INDEX idx_petty_cash_expense_session ON public."PettyCashExpense" USING btree ("sessionId");

CREATE INDEX idx_petty_cash_expense_transaction_type ON public."PettyCashExpense" USING btree ("transactionType");

CREATE INDEX idx_petty_cash_purchase_affects_cash ON public."PettyCashPurchase" USING btree ("affectsPhysicalCash");

CREATE INDEX idx_petty_cash_purchase_payment_method ON public."PettyCashPurchase" USING btree ("paymentMethod");

CREATE INDEX idx_petty_cash_purchase_session ON public."PettyCashPurchase" USING btree ("sessionId");

CREATE INDEX idx_petty_cash_purchase_transaction_type ON public."PettyCashPurchase" USING btree ("transactionType");

CREATE INDEX idx_pos_product_category ON public."POSProduct" USING btree ("categoryId");

CREATE INDEX idx_pos_product_product ON public."POSProduct" USING btree ("productId");

CREATE INDEX idx_pos_sale_item_product ON public."POSSaleItem" USING btree ("productId");

CREATE INDEX idx_pos_sale_item_sale ON public."POSSaleItem" USING btree ("saleId");

CREATE INDEX idx_pos_sale_number ON public."POSSale" USING btree ("saleNumber");

CREATE INDEX idx_pos_sale_session ON public."POSSale" USING btree ("sessionId");

CREATE INDEX idx_pos_table_current_sale ON public."POSTable" USING btree ("currentSaleId");

CREATE INDEX idx_product_category ON public."Product" USING btree (categoryid);

CREATE INDEX idx_product_components_combo_id ON public.product_components USING btree (combo_product_id);

CREATE INDEX idx_product_components_component_id ON public.product_components USING btree (component_product_id);

CREATE INDEX idx_product_cost_center ON public."Product" USING btree ("defaultCostCenterId");

CREATE INDEX idx_product_is_equipment ON public."Product" USING btree ("isEquipment");

CREATE INDEX idx_product_package_linkage_package_id ON public.product_package_linkage USING btree (package_id);

CREATE INDEX idx_product_package_linkage_product_id ON public.product_package_linkage USING btree (product_id);

CREATE INDEX idx_product_pos_enabled ON public."Product" USING btree ("isPOSEnabled");

CREATE INDEX idx_product_sales_composite_extended ON public.product_sales_tracking USING btree (sale_type, sale_date, product_id);

CREATE INDEX idx_product_sales_package ON public.product_sales_tracking USING btree (package_id);

CREATE INDEX idx_product_sales_product_date ON public.product_sales_tracking USING btree (product_id, sale_date);

CREATE INDEX idx_product_sales_reservation_id ON public.product_sales_tracking USING btree (reservation_id);

CREATE INDEX idx_product_sales_type ON public.product_sales_tracking USING btree (sale_type);

CREATE INDEX idx_product_sales_user_id ON public.product_sales_tracking USING btree (user_id);

CREATE INDEX idx_product_services_sold ON public."Product" USING btree ("servicesSold");

CREATE INDEX idx_product_supplier ON public."Product" USING btree (supplierid);

CREATE INDEX idx_product_type ON public."Product" USING btree (type);

CREATE INDEX idx_products_modular_original_id ON public.products_modular USING btree (original_id);

CREATE INDEX idx_reservation_payments_created_at ON public.reservation_payments USING btree (created_at);

CREATE INDEX idx_reservation_payments_payment_method ON public.reservation_payments USING btree (payment_method);

CREATE INDEX idx_reservation_payments_payment_type ON public.reservation_payments USING btree (payment_type);

CREATE INDEX idx_reservation_payments_reservation_id ON public.reservation_payments USING btree (reservation_id);

CREATE INDEX idx_reservation_products_modular_product_id ON public.reservation_products USING btree (modular_product_id);

CREATE INDEX idx_reservation_products_product_type ON public.reservation_products USING btree (product_type);

CREATE INDEX idx_reservations_client_id ON public.reservations USING btree (client_id);

CREATE INDEX idx_sales_quotes_client_id ON public.sales_quotes USING btree (client_id);

CREATE INDEX idx_sales_quotes_number ON public.sales_quotes USING btree (number);

CREATE INDEX idx_sales_tracking_category_id ON public.sales_tracking USING btree (category_id);

CREATE INDEX idx_sales_tracking_category_type ON public.sales_tracking USING btree (category_id, sale_type);

CREATE INDEX idx_sales_tracking_created_at ON public.sales_tracking USING btree (created_at DESC);

CREATE INDEX idx_sales_tracking_product_id ON public.sales_tracking USING btree (product_id);

CREATE INDEX idx_sales_tracking_product_type_date ON public.sales_tracking USING btree (product_id, sale_type, created_at DESC);

CREATE INDEX idx_sales_tracking_reservation_id ON public.sales_tracking USING btree (reservation_id) WHERE (reservation_id IS NOT NULL);

CREATE INDEX idx_sales_tracking_sale_type ON public.sales_tracking USING btree (sale_type);

CREATE INDEX idx_season_configurations_active ON public.season_configurations USING btree (is_active);

CREATE INDEX idx_season_configurations_dates ON public.season_configurations USING btree (start_date, end_date);

CREATE INDEX idx_season_configurations_type ON public.season_configurations USING btree (season_type);

CREATE INDEX idx_spa_products_category_id ON public.spa_products USING btree (category_id);

CREATE INDEX idx_supplier_active ON public."Supplier" USING btree (active);

CREATE INDEX idx_supplier_contact_active ON public."SupplierContact" USING btree (active);

CREATE INDEX idx_supplier_contact_email ON public."SupplierContact" USING btree (email) WHERE (email IS NOT NULL);

CREATE INDEX idx_supplier_contact_is_primary ON public."SupplierContact" USING btree ("isPrimary") WHERE ("isPrimary" = true);

CREATE INDEX idx_supplier_contact_supplier_id ON public."SupplierContact" USING btree ("supplierId");

CREATE INDEX idx_supplier_contact_type ON public."SupplierContact" USING btree (type);

CREATE INDEX idx_supplier_cost_center ON public."Supplier" USING btree ("costCenterId");

CREATE INDEX idx_supplier_payment_cost_center ON public."SupplierPayment" USING btree ("costCenterId");

CREATE INDEX idx_supplier_payment_created ON public."SupplierPayment" USING btree ("createdAt");

CREATE INDEX idx_supplier_payment_method ON public."SupplierPayment" USING btree ("paymentMethod");

CREATE INDEX idx_supplier_payment_session ON public."SupplierPayment" USING btree ("sessionId");

CREATE INDEX idx_supplier_payment_supplier ON public."SupplierPayment" USING btree ("supplierId");

CREATE INDEX idx_supplier_payment_user ON public."SupplierPayment" USING btree ("userId");

CREATE INDEX idx_supplier_supplier_rank ON public."Supplier" USING btree ("supplierRank");

CREATE INDEX idx_supplier_tag_activo ON public."SupplierTag" USING btree (activo);

CREATE INDEX idx_supplier_tag_assignment_etiqueta ON public."SupplierTagAssignment" USING btree ("etiquetaId");

CREATE INDEX idx_supplier_tag_assignment_supplier ON public."SupplierTagAssignment" USING btree ("supplierId");

CREATE INDEX idx_supplier_tag_icono ON public."SupplierTag" USING btree (icono);

CREATE INDEX idx_supplier_tag_nombre ON public."SupplierTag" USING btree (nombre);

CREATE INDEX idx_supplier_tag_tipo_aplicacion ON public."SupplierTag" USING btree ("tipoAplicacion");

CREATE INDEX idx_supplier_vat ON public."Supplier" USING btree (vat);

CREATE INDEX idx_user_cost_center ON public."User" USING btree ("costCenterId");

CREATE INDEX idx_user_role ON public."User" USING btree ("roleId");

CREATE INDEX idx_warehouse_cost_center ON public."Warehouse" USING btree ("costCenterId");

CREATE INDEX idx_warehouse_parent_id ON public."Warehouse" USING btree ("parentId");

CREATE INDEX idx_warehouse_product_product ON public."Warehouse_Product" USING btree ("productId");

CREATE INDEX idx_warehouse_product_warehouse ON public."Warehouse_Product" USING btree ("warehouseId");

CREATE UNIQUE INDEX invoice_lines_pkey ON public.invoice_lines USING btree (id);

CREATE UNIQUE INDEX invoice_payments_pkey ON public.invoice_payments USING btree (id);

CREATE UNIQUE INDEX invoices_number_key ON public.invoices USING btree (number);

CREATE UNIQUE INDEX invoices_pkey ON public.invoices USING btree (id);

CREATE UNIQUE INDEX modular_reservations_pkey ON public.modular_reservations USING btree (id);

CREATE UNIQUE INDEX package_products_modular_package_id_product_id_key ON public.package_products_modular USING btree (package_id, product_id);

CREATE UNIQUE INDEX package_products_modular_pkey ON public.package_products_modular USING btree (id);

CREATE UNIQUE INDEX packages_modular_code_key ON public.packages_modular USING btree (code);

CREATE UNIQUE INDEX packages_modular_pkey ON public.packages_modular USING btree (id);

CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id);

CREATE UNIQUE INDEX product_components_pkey ON public.product_components USING btree (id);

CREATE UNIQUE INDEX product_package_linkage_pkey ON public.product_package_linkage USING btree (id);

CREATE UNIQUE INDEX product_package_linkage_product_id_package_id_key ON public.product_package_linkage USING btree (product_id, package_id);

CREATE UNIQUE INDEX product_sales_tracking_pkey ON public.product_sales_tracking USING btree (id);

CREATE UNIQUE INDEX products_modular_code_key ON public.products_modular USING btree (code);

CREATE UNIQUE INDEX products_modular_pkey ON public.products_modular USING btree (id);

CREATE UNIQUE INDEX reservation_comments_pkey ON public.reservation_comments USING btree (id);

CREATE UNIQUE INDEX reservation_payments_pkey ON public.reservation_payments USING btree (id);

CREATE UNIQUE INDEX reservation_products_pkey ON public.reservation_products USING btree (id);

CREATE UNIQUE INDEX reservations_pkey ON public.reservations USING btree (id);

CREATE UNIQUE INDEX rooms_number_key ON public.rooms USING btree (number);

CREATE UNIQUE INDEX rooms_pkey ON public.rooms USING btree (id);

CREATE UNIQUE INDEX sales_quote_lines_pkey ON public.sales_quote_lines USING btree (id);

CREATE UNIQUE INDEX sales_quotes_number_key ON public.sales_quotes USING btree (number);

CREATE UNIQUE INDEX sales_quotes_pkey ON public.sales_quotes USING btree (id);

CREATE UNIQUE INDEX sales_tracking_pkey ON public.sales_tracking USING btree (id);

CREATE UNIQUE INDEX season_configurations_pkey ON public.season_configurations USING btree (id);

CREATE UNIQUE INDEX spa_products_pkey ON public.spa_products USING btree (id);

CREATE UNIQUE INDEX spa_products_sku_key ON public.spa_products USING btree (sku);

CREATE UNIQUE INDEX unique_combo_component ON public.product_components USING btree (combo_product_id, component_product_id);

CREATE UNIQUE INDEX unique_primary_contact_per_supplier ON public."SupplierContact" USING btree ("supplierId") WHERE (("isPrimary" = true) AND (active = true));

alter table "public"."CashRegister" add constraint "CashRegister_pkey" PRIMARY KEY using index "CashRegister_pkey";

alter table "public"."CashRegisterType" add constraint "CashRegisterType_pkey" PRIMARY KEY using index "CashRegisterType_pkey";

alter table "public"."CashSession" add constraint "CashSession_pkey" PRIMARY KEY using index "CashSession_pkey";

alter table "public"."Category" add constraint "Category_pkey" PRIMARY KEY using index "Category_pkey";

alter table "public"."Client" add constraint "Client_pkey" PRIMARY KEY using index "Client_pkey";

alter table "public"."ClientContact" add constraint "ClientContact_pkey" PRIMARY KEY using index "ClientContact_pkey";

alter table "public"."ClientTag" add constraint "ClientTag_pkey" PRIMARY KEY using index "ClientTag_pkey";

alter table "public"."ClientTagAssignment" add constraint "ClientTagAssignment_pkey" PRIMARY KEY using index "ClientTagAssignment_pkey";

alter table "public"."Cost_Center" add constraint "Cost_Center_pkey" PRIMARY KEY using index "Cost_Center_pkey";

alter table "public"."Country" add constraint "Country_pkey" PRIMARY KEY using index "Country_pkey";

alter table "public"."EconomicSector" add constraint "EconomicSector_pkey" PRIMARY KEY using index "EconomicSector_pkey";

alter table "public"."InventoryMovement" add constraint "InventoryMovement_pkey" PRIMARY KEY using index "InventoryMovement_pkey";

alter table "public"."POSConfig" add constraint "POSConfig_pkey" PRIMARY KEY using index "POSConfig_pkey";

alter table "public"."POSProduct" add constraint "POSProduct_pkey" PRIMARY KEY using index "POSProduct_pkey";

alter table "public"."POSProductCategory" add constraint "POSProductCategory_pkey" PRIMARY KEY using index "POSProductCategory_pkey";

alter table "public"."POSSale" add constraint "POSSale_pkey" PRIMARY KEY using index "POSSale_pkey";

alter table "public"."POSSaleItem" add constraint "POSSaleItem_pkey" PRIMARY KEY using index "POSSaleItem_pkey";

alter table "public"."POSTable" add constraint "POSTable_pkey" PRIMARY KEY using index "POSTable_pkey";

alter table "public"."PettyCashExpense" add constraint "PettyCashExpense_pkey" PRIMARY KEY using index "PettyCashExpense_pkey";

alter table "public"."PettyCashIncome" add constraint "PettyCashIncome_pkey" PRIMARY KEY using index "PettyCashIncome_pkey";

alter table "public"."PettyCashPurchase" add constraint "PettyCashPurchase_pkey" PRIMARY KEY using index "PettyCashPurchase_pkey";

alter table "public"."Product" add constraint "Product_pkey" PRIMARY KEY using index "Product_pkey";

alter table "public"."RelationshipType" add constraint "RelationshipType_pkey" PRIMARY KEY using index "RelationshipType_pkey";

alter table "public"."Role" add constraint "Role_pkey" PRIMARY KEY using index "Role_pkey";

alter table "public"."Supplier" add constraint "Supplier_pkey" PRIMARY KEY using index "Supplier_pkey";

alter table "public"."SupplierContact" add constraint "SupplierContact_pkey" PRIMARY KEY using index "SupplierContact_pkey";

alter table "public"."SupplierPayment" add constraint "SupplierPayment_pkey" PRIMARY KEY using index "SupplierPayment_pkey";

alter table "public"."SupplierTag" add constraint "SupplierTag_pkey" PRIMARY KEY using index "SupplierTag_pkey";

alter table "public"."SupplierTagAssignment" add constraint "SupplierTagAssignment_pkey" PRIMARY KEY using index "SupplierTagAssignment_pkey";

alter table "public"."User" add constraint "User_pkey" PRIMARY KEY using index "User_pkey";

alter table "public"."Warehouse" add constraint "Warehouse_pkey" PRIMARY KEY using index "Warehouse_pkey";

alter table "public"."Warehouse_Product" add constraint "Warehouse_Product_pkey" PRIMARY KEY using index "Warehouse_Product_pkey";

alter table "public"."age_pricing_modular" add constraint "age_pricing_modular_pkey" PRIMARY KEY using index "age_pricing_modular_pkey";

alter table "public"."companies" add constraint "companies_pkey" PRIMARY KEY using index "companies_pkey";

alter table "public"."company_contacts" add constraint "company_contacts_pkey" PRIMARY KEY using index "company_contacts_pkey";

alter table "public"."invoice_lines" add constraint "invoice_lines_pkey" PRIMARY KEY using index "invoice_lines_pkey";

alter table "public"."invoice_payments" add constraint "invoice_payments_pkey" PRIMARY KEY using index "invoice_payments_pkey";

alter table "public"."invoices" add constraint "invoices_pkey" PRIMARY KEY using index "invoices_pkey";

alter table "public"."modular_reservations" add constraint "modular_reservations_pkey" PRIMARY KEY using index "modular_reservations_pkey";

alter table "public"."package_products_modular" add constraint "package_products_modular_pkey" PRIMARY KEY using index "package_products_modular_pkey";

alter table "public"."packages_modular" add constraint "packages_modular_pkey" PRIMARY KEY using index "packages_modular_pkey";

alter table "public"."payments" add constraint "payments_pkey" PRIMARY KEY using index "payments_pkey";

alter table "public"."product_components" add constraint "product_components_pkey" PRIMARY KEY using index "product_components_pkey";

alter table "public"."product_package_linkage" add constraint "product_package_linkage_pkey" PRIMARY KEY using index "product_package_linkage_pkey";

alter table "public"."product_sales_tracking" add constraint "product_sales_tracking_pkey" PRIMARY KEY using index "product_sales_tracking_pkey";

alter table "public"."products_modular" add constraint "products_modular_pkey" PRIMARY KEY using index "products_modular_pkey";

alter table "public"."reservation_comments" add constraint "reservation_comments_pkey" PRIMARY KEY using index "reservation_comments_pkey";

alter table "public"."reservation_payments" add constraint "reservation_payments_pkey" PRIMARY KEY using index "reservation_payments_pkey";

alter table "public"."reservation_products" add constraint "reservation_products_pkey" PRIMARY KEY using index "reservation_products_pkey";

alter table "public"."reservations" add constraint "reservations_pkey" PRIMARY KEY using index "reservations_pkey";

alter table "public"."rooms" add constraint "rooms_pkey" PRIMARY KEY using index "rooms_pkey";

alter table "public"."sales_quote_lines" add constraint "sales_quote_lines_pkey" PRIMARY KEY using index "sales_quote_lines_pkey";

alter table "public"."sales_quotes" add constraint "sales_quotes_pkey" PRIMARY KEY using index "sales_quotes_pkey";

alter table "public"."sales_tracking" add constraint "sales_tracking_pkey" PRIMARY KEY using index "sales_tracking_pkey";

alter table "public"."season_configurations" add constraint "season_configurations_pkey" PRIMARY KEY using index "season_configurations_pkey";

alter table "public"."spa_products" add constraint "spa_products_pkey" PRIMARY KEY using index "spa_products_pkey";

alter table "public"."CashRegister" add constraint "CashRegister_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "Cost_Center"(id) not valid;

alter table "public"."CashRegister" validate constraint "CashRegister_costCenterId_fkey";

alter table "public"."CashRegister" add constraint "CashRegister_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "CashRegisterType"(id) not valid;

alter table "public"."CashRegister" validate constraint "CashRegister_typeId_fkey";

alter table "public"."CashRegister" add constraint "fk_cash_register_current_session" FOREIGN KEY ("currentSessionId") REFERENCES "CashSession"(id) not valid;

alter table "public"."CashRegister" validate constraint "fk_cash_register_current_session";

alter table "public"."CashRegisterType" add constraint "CashRegisterType_name_key" UNIQUE using index "CashRegisterType_name_key";

alter table "public"."CashSession" add constraint "CashSession_cashRegisterTypeId_fkey" FOREIGN KEY ("cashRegisterTypeId") REFERENCES "CashRegisterType"(id) not valid;

alter table "public"."CashSession" validate constraint "CashSession_cashRegisterTypeId_fkey";

alter table "public"."CashSession" add constraint "CashSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) not valid;

alter table "public"."CashSession" validate constraint "CashSession_userId_fkey";

alter table "public"."Category" add constraint "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"(id) not valid;

alter table "public"."Category" validate constraint "Category_parentId_fkey";

alter table "public"."Client" add constraint "Client_paisId_fkey" FOREIGN KEY ("paisId") REFERENCES "Country"(id) not valid;

alter table "public"."Client" validate constraint "Client_paisId_fkey";

alter table "public"."Client" add constraint "Client_rut_key" UNIQUE using index "Client_rut_key";

alter table "public"."Client" add constraint "Client_sectorEconomicoId_fkey" FOREIGN KEY ("sectorEconomicoId") REFERENCES "EconomicSector"(id) not valid;

alter table "public"."Client" validate constraint "Client_sectorEconomicoId_fkey";

alter table "public"."ClientContact" add constraint "ClientContact_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Client"(id) ON DELETE CASCADE not valid;

alter table "public"."ClientContact" validate constraint "ClientContact_clienteId_fkey";

alter table "public"."ClientContact" add constraint "ClientContact_tipoRelacionId_fkey" FOREIGN KEY ("tipoRelacionId") REFERENCES "RelationshipType"(id) not valid;

alter table "public"."ClientContact" validate constraint "ClientContact_tipoRelacionId_fkey";

alter table "public"."ClientTag" add constraint "ClientTag_nombre_key" UNIQUE using index "ClientTag_nombre_key";

alter table "public"."ClientTagAssignment" add constraint "ClientTagAssignment_asignadoPor_fkey" FOREIGN KEY ("asignadoPor") REFERENCES "User"(id) not valid;

alter table "public"."ClientTagAssignment" validate constraint "ClientTagAssignment_asignadoPor_fkey";

alter table "public"."ClientTagAssignment" add constraint "ClientTagAssignment_clienteId_etiquetaId_key" UNIQUE using index "ClientTagAssignment_clienteId_etiquetaId_key";

alter table "public"."ClientTagAssignment" add constraint "ClientTagAssignment_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Client"(id) ON DELETE CASCADE not valid;

alter table "public"."ClientTagAssignment" validate constraint "ClientTagAssignment_clienteId_fkey";

alter table "public"."ClientTagAssignment" add constraint "ClientTagAssignment_etiquetaId_fkey" FOREIGN KEY ("etiquetaId") REFERENCES "ClientTag"(id) ON DELETE CASCADE not valid;

alter table "public"."ClientTagAssignment" validate constraint "ClientTagAssignment_etiquetaId_fkey";

alter table "public"."Cost_Center" add constraint "Cost_Center_code_key" UNIQUE using index "Cost_Center_code_key";

alter table "public"."Cost_Center" add constraint "Cost_Center_name_key" UNIQUE using index "Cost_Center_name_key";

alter table "public"."Cost_Center" add constraint "Cost_Center_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Cost_Center"(id) not valid;

alter table "public"."Cost_Center" validate constraint "Cost_Center_parentId_fkey";

alter table "public"."Country" add constraint "Country_codigo_key" UNIQUE using index "Country_codigo_key";

alter table "public"."EconomicSector" add constraint "EconomicSector_nombre_key" UNIQUE using index "EconomicSector_nombre_key";

alter table "public"."EconomicSector" add constraint "EconomicSector_sectorPadreId_fkey" FOREIGN KEY ("sectorPadreId") REFERENCES "EconomicSector"(id) ON DELETE SET NULL not valid;

alter table "public"."EconomicSector" validate constraint "EconomicSector_sectorPadreId_fkey";

alter table "public"."InventoryMovement" add constraint "InventoryMovement_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "Warehouse"(id) ON DELETE SET NULL not valid;

alter table "public"."InventoryMovement" validate constraint "InventoryMovement_fromWarehouseId_fkey";

alter table "public"."InventoryMovement" add constraint "InventoryMovement_movementType_check" CHECK ((("movementType")::text = ANY ((ARRAY['TRANSFER'::character varying, 'ENTRADA'::character varying, 'SALIDA'::character varying, 'AJUSTE'::character varying])::text[]))) not valid;

alter table "public"."InventoryMovement" validate constraint "InventoryMovement_movementType_check";

alter table "public"."InventoryMovement" add constraint "InventoryMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"(id) ON DELETE CASCADE not valid;

alter table "public"."InventoryMovement" validate constraint "InventoryMovement_productId_fkey";

alter table "public"."InventoryMovement" add constraint "InventoryMovement_quantity_check" CHECK ((quantity > 0)) not valid;

alter table "public"."InventoryMovement" validate constraint "InventoryMovement_quantity_check";

alter table "public"."InventoryMovement" add constraint "InventoryMovement_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES "Warehouse"(id) ON DELETE SET NULL not valid;

alter table "public"."InventoryMovement" validate constraint "InventoryMovement_toWarehouseId_fkey";

alter table "public"."InventoryMovement" add constraint "InventoryMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE SET NULL not valid;

alter table "public"."InventoryMovement" validate constraint "InventoryMovement_userId_fkey";

alter table "public"."POSConfig" add constraint "POSConfig_cashRegisterTypeId_fkey" FOREIGN KEY ("cashRegisterTypeId") REFERENCES "CashRegisterType"(id) not valid;

alter table "public"."POSConfig" validate constraint "POSConfig_cashRegisterTypeId_fkey";

alter table "public"."POSProduct" add constraint "POSProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "POSProductCategory"(id) not valid;

alter table "public"."POSProduct" validate constraint "POSProduct_categoryId_fkey";

alter table "public"."POSProduct" add constraint "POSProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"(id) not valid;

alter table "public"."POSProduct" validate constraint "POSProduct_productId_fkey";

alter table "public"."POSProduct" add constraint "POSProduct_sku_key" UNIQUE using index "POSProduct_sku_key";

alter table "public"."POSProductCategory" add constraint "POSProductCategory_cashRegisterTypeId_fkey" FOREIGN KEY ("cashRegisterTypeId") REFERENCES "CashRegisterType"(id) not valid;

alter table "public"."POSProductCategory" validate constraint "POSProductCategory_cashRegisterTypeId_fkey";

alter table "public"."POSSale" add constraint "POSSale_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CashSession"(id) not valid;

alter table "public"."POSSale" validate constraint "POSSale_sessionId_fkey";

alter table "public"."POSSaleItem" add constraint "POSSaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "POSProduct"(id) not valid;

alter table "public"."POSSaleItem" validate constraint "POSSaleItem_productId_fkey";

alter table "public"."POSSaleItem" add constraint "POSSaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "POSSale"(id) ON DELETE CASCADE not valid;

alter table "public"."POSSaleItem" validate constraint "POSSaleItem_saleId_fkey";

alter table "public"."POSTable" add constraint "POSTable_currentSaleId_fkey" FOREIGN KEY ("currentSaleId") REFERENCES "POSSale"(id) not valid;

alter table "public"."POSTable" validate constraint "POSTable_currentSaleId_fkey";

alter table "public"."PettyCashExpense" add constraint "PettyCashExpense_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "Cost_Center"(id) not valid;

alter table "public"."PettyCashExpense" validate constraint "PettyCashExpense_costCenterId_fkey";

alter table "public"."PettyCashExpense" add constraint "PettyCashExpense_paymentMethod_check" CHECK (("paymentMethod" = ANY (ARRAY['cash'::text, 'transfer'::text, 'card'::text, 'other'::text]))) not valid;

alter table "public"."PettyCashExpense" validate constraint "PettyCashExpense_paymentMethod_check";

alter table "public"."PettyCashExpense" add constraint "PettyCashExpense_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CashSession"(id) not valid;

alter table "public"."PettyCashExpense" validate constraint "PettyCashExpense_sessionId_fkey";

alter table "public"."PettyCashExpense" add constraint "PettyCashExpense_transactionType_check" CHECK (("transactionType" = ANY (ARRAY['expense'::text, 'income'::text, 'refund'::text]))) not valid;

alter table "public"."PettyCashExpense" validate constraint "PettyCashExpense_transactionType_check";

alter table "public"."PettyCashExpense" add constraint "PettyCashExpense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) not valid;

alter table "public"."PettyCashExpense" validate constraint "PettyCashExpense_userId_fkey";

alter table "public"."PettyCashExpense" add constraint "petty_cash_expense_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))) not valid;

alter table "public"."PettyCashExpense" validate constraint "petty_cash_expense_status_check";

alter table "public"."PettyCashIncome" add constraint "PettyCashIncome_amount_check" CHECK ((amount > (0)::numeric)) not valid;

alter table "public"."PettyCashIncome" validate constraint "PettyCashIncome_amount_check";

alter table "public"."PettyCashIncome" add constraint "PettyCashIncome_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CashSession"(id) ON DELETE CASCADE not valid;

alter table "public"."PettyCashIncome" validate constraint "PettyCashIncome_sessionId_fkey";

alter table "public"."PettyCashPurchase" add constraint "PettyCashPurchase_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "Cost_Center"(id) not valid;

alter table "public"."PettyCashPurchase" validate constraint "PettyCashPurchase_costCenterId_fkey";

alter table "public"."PettyCashPurchase" add constraint "PettyCashPurchase_paymentMethod_check" CHECK (("paymentMethod" = ANY (ARRAY['cash'::text, 'transfer'::text, 'card'::text, 'other'::text]))) not valid;

alter table "public"."PettyCashPurchase" validate constraint "PettyCashPurchase_paymentMethod_check";

alter table "public"."PettyCashPurchase" add constraint "PettyCashPurchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"(id) not valid;

alter table "public"."PettyCashPurchase" validate constraint "PettyCashPurchase_productId_fkey";

alter table "public"."PettyCashPurchase" add constraint "PettyCashPurchase_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CashSession"(id) not valid;

alter table "public"."PettyCashPurchase" validate constraint "PettyCashPurchase_sessionId_fkey";

alter table "public"."PettyCashPurchase" add constraint "PettyCashPurchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"(id) not valid;

alter table "public"."PettyCashPurchase" validate constraint "PettyCashPurchase_supplierId_fkey";

alter table "public"."PettyCashPurchase" add constraint "PettyCashPurchase_transactionType_check" CHECK (("transactionType" = ANY (ARRAY['purchase'::text, 'return'::text]))) not valid;

alter table "public"."PettyCashPurchase" validate constraint "PettyCashPurchase_transactionType_check";

alter table "public"."PettyCashPurchase" add constraint "PettyCashPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) not valid;

alter table "public"."PettyCashPurchase" validate constraint "PettyCashPurchase_userId_fkey";

alter table "public"."PettyCashPurchase" add constraint "petty_cash_purchase_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))) not valid;

alter table "public"."PettyCashPurchase" validate constraint "petty_cash_purchase_status_check";

alter table "public"."Product" add constraint "Product_categoryid_fkey" FOREIGN KEY (categoryid) REFERENCES "Category"(id) not valid;

alter table "public"."Product" validate constraint "Product_categoryid_fkey";

alter table "public"."Product" add constraint "Product_defaultCostCenterId_fkey" FOREIGN KEY ("defaultCostCenterId") REFERENCES "Cost_Center"(id) not valid;

alter table "public"."Product" validate constraint "Product_defaultCostCenterId_fkey";

alter table "public"."Product" add constraint "Product_supplierid_fkey" FOREIGN KEY (supplierid) REFERENCES "Supplier"(id) not valid;

alter table "public"."Product" validate constraint "Product_supplierid_fkey";

alter table "public"."RelationshipType" add constraint "RelationshipType_nombre_key" UNIQUE using index "RelationshipType_nombre_key";

alter table "public"."Role" add constraint "Role_roleName_key" UNIQUE using index "Role_roleName_key";

alter table "public"."Supplier" add constraint "Supplier_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "Cost_Center"(id) not valid;

alter table "public"."Supplier" validate constraint "Supplier_costCenterId_fkey";

alter table "public"."Supplier" add constraint "check_supplier_rank_values" CHECK ((("supplierRank" IS NULL) OR ("supplierRank" = ANY (ARRAY['BASICO'::text, 'REGULAR'::text, 'BUENO'::text, 'EXCELENTE'::text, 'PREMIUM'::text])))) not valid;

alter table "public"."Supplier" validate constraint "check_supplier_rank_values";

alter table "public"."SupplierContact" add constraint "SupplierContact_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"(id) ON DELETE CASCADE not valid;

alter table "public"."SupplierContact" validate constraint "SupplierContact_supplierId_fkey";

alter table "public"."SupplierContact" add constraint "SupplierContact_type_check" CHECK ((type = ANY (ARRAY['PRINCIPAL'::text, 'SECUNDARIO'::text, 'EMERGENCIA'::text]))) not valid;

alter table "public"."SupplierContact" validate constraint "SupplierContact_type_check";

alter table "public"."SupplierPayment" add constraint "SupplierPayment_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "Cost_Center"(id) ON DELETE SET NULL not valid;

alter table "public"."SupplierPayment" validate constraint "SupplierPayment_costCenterId_fkey";

alter table "public"."SupplierPayment" add constraint "SupplierPayment_paymentMethod_check" CHECK (("paymentMethod" = ANY (ARRAY['cash'::text, 'transfer'::text, 'card'::text, 'other'::text]))) not valid;

alter table "public"."SupplierPayment" validate constraint "SupplierPayment_paymentMethod_check";

alter table "public"."SupplierPayment" add constraint "SupplierPayment_pettyCashExpenseId_fkey" FOREIGN KEY ("pettyCashExpenseId") REFERENCES "PettyCashExpense"(id) ON DELETE SET NULL not valid;

alter table "public"."SupplierPayment" validate constraint "SupplierPayment_pettyCashExpenseId_fkey";

alter table "public"."SupplierPayment" add constraint "SupplierPayment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CashSession"(id) ON DELETE CASCADE not valid;

alter table "public"."SupplierPayment" validate constraint "SupplierPayment_sessionId_fkey";

alter table "public"."SupplierPayment" add constraint "SupplierPayment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"(id) ON DELETE RESTRICT not valid;

alter table "public"."SupplierPayment" validate constraint "SupplierPayment_supplierId_fkey";

alter table "public"."SupplierPayment" add constraint "SupplierPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) not valid;

alter table "public"."SupplierPayment" validate constraint "SupplierPayment_userId_fkey";

alter table "public"."SupplierTag" add constraint "SupplierTag_tipoAplicacion_check" CHECK (("tipoAplicacion" = ANY (ARRAY['todos'::text, 'EMPRESA_INDIVIDUAL'::text, 'SOCIEDAD_ANONIMA'::text]))) not valid;

alter table "public"."SupplierTag" validate constraint "SupplierTag_tipoAplicacion_check";

alter table "public"."SupplierTagAssignment" add constraint "SupplierTagAssignment_etiquetaId_fkey" FOREIGN KEY ("etiquetaId") REFERENCES "SupplierTag"(id) ON DELETE CASCADE not valid;

alter table "public"."SupplierTagAssignment" validate constraint "SupplierTagAssignment_etiquetaId_fkey";

alter table "public"."SupplierTagAssignment" add constraint "SupplierTagAssignment_supplierId_etiquetaId_key" UNIQUE using index "SupplierTagAssignment_supplierId_etiquetaId_key";

alter table "public"."SupplierTagAssignment" add constraint "SupplierTagAssignment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"(id) ON DELETE CASCADE not valid;

alter table "public"."SupplierTagAssignment" validate constraint "SupplierTagAssignment_supplierId_fkey";

alter table "public"."User" add constraint "User_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "Cost_Center"(id) not valid;

alter table "public"."User" validate constraint "User_costCenterId_fkey";

alter table "public"."User" add constraint "User_email_key" UNIQUE using index "User_email_key";

alter table "public"."User" add constraint "User_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."User" validate constraint "User_id_fkey";

alter table "public"."User" add constraint "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"(id) not valid;

alter table "public"."User" validate constraint "User_roleId_fkey";

alter table "public"."User" add constraint "User_username_key" UNIQUE using index "User_username_key";

alter table "public"."Warehouse" add constraint "Warehouse_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "Cost_Center"(id) not valid;

alter table "public"."Warehouse" validate constraint "Warehouse_costCenterId_fkey";

alter table "public"."Warehouse" add constraint "fk_warehouse_parent" FOREIGN KEY ("parentId") REFERENCES "Warehouse"(id) ON DELETE SET NULL not valid;

alter table "public"."Warehouse" validate constraint "fk_warehouse_parent";

alter table "public"."Warehouse_Product" add constraint "Warehouse_Product_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"(id) not valid;

alter table "public"."Warehouse_Product" validate constraint "Warehouse_Product_productId_fkey";

alter table "public"."Warehouse_Product" add constraint "Warehouse_Product_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"(id) not valid;

alter table "public"."Warehouse_Product" validate constraint "Warehouse_Product_warehouseId_fkey";

alter table "public"."Warehouse_Product" add constraint "Warehouse_Product_warehouseId_productId_key" UNIQUE using index "Warehouse_Product_warehouseId_productId_key";

alter table "public"."companies" add constraint "companies_rut_key" UNIQUE using index "companies_rut_key";

alter table "public"."company_contacts" add constraint "company_contacts_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE not valid;

alter table "public"."company_contacts" validate constraint "company_contacts_company_id_fkey";

alter table "public"."invoice_lines" add constraint "invoice_lines_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE not valid;

alter table "public"."invoice_lines" validate constraint "invoice_lines_invoice_id_fkey";

alter table "public"."invoice_payments" add constraint "invoice_payments_created_by_fkey" FOREIGN KEY (created_by) REFERENCES "User"(id) not valid;

alter table "public"."invoice_payments" validate constraint "invoice_payments_created_by_fkey";

alter table "public"."invoice_payments" add constraint "invoice_payments_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE not valid;

alter table "public"."invoice_payments" validate constraint "invoice_payments_invoice_id_fkey";

alter table "public"."invoices" add constraint "fk_invoice_budget" FOREIGN KEY (budget_id) REFERENCES sales_quotes(id) ON DELETE SET NULL not valid;

alter table "public"."invoices" validate constraint "fk_invoice_budget";

alter table "public"."invoices" add constraint "invoices_client_id_fkey" FOREIGN KEY (client_id) REFERENCES "Client"(id) not valid;

alter table "public"."invoices" validate constraint "invoices_client_id_fkey";

alter table "public"."invoices" add constraint "invoices_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) not valid;

alter table "public"."invoices" validate constraint "invoices_company_id_fkey";

alter table "public"."invoices" add constraint "invoices_number_key" UNIQUE using index "invoices_number_key";

alter table "public"."invoices" add constraint "invoices_quote_id_fkey" FOREIGN KEY (quote_id) REFERENCES sales_quotes(id) not valid;

alter table "public"."invoices" validate constraint "invoices_quote_id_fkey";

alter table "public"."invoices" add constraint "invoices_reservation_id_fkey" FOREIGN KEY (reservation_id) REFERENCES reservations(id) not valid;

alter table "public"."invoices" validate constraint "invoices_reservation_id_fkey";

alter table "public"."invoices" add constraint "invoices_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES "User"(id) not valid;

alter table "public"."invoices" validate constraint "invoices_seller_id_fkey";

alter table "public"."modular_reservations" add constraint "modular_reservations_client_id_fkey" FOREIGN KEY (client_id) REFERENCES "Client"(id) not valid;

alter table "public"."modular_reservations" validate constraint "modular_reservations_client_id_fkey";

alter table "public"."modular_reservations" add constraint "modular_reservations_package_modular_id_fkey" FOREIGN KEY (package_modular_id) REFERENCES packages_modular(id) not valid;

alter table "public"."modular_reservations" validate constraint "modular_reservations_package_modular_id_fkey";

alter table "public"."modular_reservations" add constraint "modular_reservations_reservation_id_fkey" FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE not valid;

alter table "public"."modular_reservations" validate constraint "modular_reservations_reservation_id_fkey";

alter table "public"."package_products_modular" add constraint "package_products_modular_package_id_fkey" FOREIGN KEY (package_id) REFERENCES packages_modular(id) ON DELETE CASCADE not valid;

alter table "public"."package_products_modular" validate constraint "package_products_modular_package_id_fkey";

alter table "public"."package_products_modular" add constraint "package_products_modular_package_id_product_id_key" UNIQUE using index "package_products_modular_package_id_product_id_key";

alter table "public"."package_products_modular" add constraint "package_products_modular_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products_modular(id) ON DELETE CASCADE not valid;

alter table "public"."package_products_modular" validate constraint "package_products_modular_product_id_fkey";

alter table "public"."packages_modular" add constraint "packages_modular_code_key" UNIQUE using index "packages_modular_code_key";

alter table "public"."payments" add constraint "payments_reservation_id_fkey" FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE not valid;

alter table "public"."payments" validate constraint "payments_reservation_id_fkey";

alter table "public"."product_components" add constraint "positive_price" CHECK ((unit_price >= (0)::numeric)) not valid;

alter table "public"."product_components" validate constraint "positive_price";

alter table "public"."product_components" add constraint "positive_quantity" CHECK ((quantity > (0)::numeric)) not valid;

alter table "public"."product_components" validate constraint "positive_quantity";

alter table "public"."product_components" add constraint "product_components_combo_product_id_fkey" FOREIGN KEY (combo_product_id) REFERENCES "Product"(id) ON DELETE CASCADE not valid;

alter table "public"."product_components" validate constraint "product_components_combo_product_id_fkey";

alter table "public"."product_components" add constraint "product_components_component_product_id_fkey" FOREIGN KEY (component_product_id) REFERENCES "Product"(id) ON DELETE CASCADE not valid;

alter table "public"."product_components" validate constraint "product_components_component_product_id_fkey";

alter table "public"."product_components" add constraint "unique_combo_component" UNIQUE using index "unique_combo_component";

alter table "public"."product_package_linkage" add constraint "fk_product_package_linkage_product_id" FOREIGN KEY (product_id) REFERENCES "Product"(id) ON DELETE CASCADE not valid;

alter table "public"."product_package_linkage" validate constraint "fk_product_package_linkage_product_id";

alter table "public"."product_package_linkage" add constraint "product_package_linkage_package_id_fkey" FOREIGN KEY (package_id) REFERENCES packages_modular(id) ON DELETE CASCADE not valid;

alter table "public"."product_package_linkage" validate constraint "product_package_linkage_package_id_fkey";

alter table "public"."product_package_linkage" add constraint "product_package_linkage_product_id_fkey" FOREIGN KEY (product_id) REFERENCES "Product"(id) ON DELETE CASCADE not valid;

alter table "public"."product_package_linkage" validate constraint "product_package_linkage_product_id_fkey";

alter table "public"."product_package_linkage" add constraint "product_package_linkage_product_id_package_id_key" UNIQUE using index "product_package_linkage_product_id_package_id_key";

alter table "public"."product_sales_tracking" add constraint "product_sales_tracking_package_id_fkey" FOREIGN KEY (package_id) REFERENCES packages_modular(id) ON DELETE SET NULL not valid;

alter table "public"."product_sales_tracking" validate constraint "product_sales_tracking_package_id_fkey";

alter table "public"."product_sales_tracking" add constraint "product_sales_tracking_product_id_fkey" FOREIGN KEY (product_id) REFERENCES "Product"(id) ON DELETE CASCADE not valid;

alter table "public"."product_sales_tracking" validate constraint "product_sales_tracking_product_id_fkey";

alter table "public"."product_sales_tracking" add constraint "product_sales_tracking_sale_type_check" CHECK (((sale_type)::text = ANY ((ARRAY['direct'::character varying, 'package'::character varying])::text[]))) not valid;

alter table "public"."product_sales_tracking" validate constraint "product_sales_tracking_sale_type_check";

alter table "public"."product_sales_tracking" add constraint "product_sales_tracking_user_id_fkey" FOREIGN KEY (user_id) REFERENCES "User"(id) ON DELETE SET NULL not valid;

alter table "public"."product_sales_tracking" validate constraint "product_sales_tracking_user_id_fkey";

alter table "public"."products_modular" add constraint "fk_products_modular_original_id" FOREIGN KEY (original_id) REFERENCES "Product"(id) ON DELETE CASCADE not valid;

alter table "public"."products_modular" validate constraint "fk_products_modular_original_id";

alter table "public"."products_modular" add constraint "products_modular_code_key" UNIQUE using index "products_modular_code_key";

alter table "public"."products_modular" add constraint "products_modular_must_have_original_id" CHECK ((original_id IS NOT NULL)) not valid;

alter table "public"."products_modular" validate constraint "products_modular_must_have_original_id";

alter table "public"."products_modular" add constraint "products_modular_original_id_fkey" FOREIGN KEY (original_id) REFERENCES "Product"(id) ON DELETE SET NULL not valid;

alter table "public"."products_modular" validate constraint "products_modular_original_id_fkey";

alter table "public"."reservation_comments" add constraint "reservation_comments_reservation_id_fkey" FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE not valid;

alter table "public"."reservation_comments" validate constraint "reservation_comments_reservation_id_fkey";

alter table "public"."reservation_payments" add constraint "reservation_payments_amount_check" CHECK ((amount > (0)::numeric)) not valid;

alter table "public"."reservation_payments" validate constraint "reservation_payments_amount_check";

alter table "public"."reservation_payments" add constraint "reservation_payments_payment_type_check" CHECK (((payment_type)::text = ANY ((ARRAY['abono'::character varying, 'pago_total'::character varying])::text[]))) not valid;

alter table "public"."reservation_payments" validate constraint "reservation_payments_payment_type_check";

alter table "public"."reservation_payments" add constraint "reservation_payments_reservation_id_fkey" FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE not valid;

alter table "public"."reservation_payments" validate constraint "reservation_payments_reservation_id_fkey";

alter table "public"."reservation_products" add constraint "reservation_products_reservation_id_fkey" FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE not valid;

alter table "public"."reservation_products" validate constraint "reservation_products_reservation_id_fkey";

alter table "public"."reservations" add constraint "fk_reservations_client" FOREIGN KEY (client_id) REFERENCES "Client"(id) not valid;

alter table "public"."reservations" validate constraint "fk_reservations_client";

alter table "public"."reservations" add constraint "reservations_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) not valid;

alter table "public"."reservations" validate constraint "reservations_company_id_fkey";

alter table "public"."reservations" add constraint "reservations_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES company_contacts(id) not valid;

alter table "public"."reservations" validate constraint "reservations_contact_id_fkey";

alter table "public"."reservations" add constraint "reservations_room_id_fkey" FOREIGN KEY (room_id) REFERENCES rooms(id) not valid;

alter table "public"."reservations" validate constraint "reservations_room_id_fkey";

alter table "public"."rooms" add constraint "rooms_number_key" UNIQUE using index "rooms_number_key";

alter table "public"."sales_quote_lines" add constraint "sales_quote_lines_quote_id_fkey" FOREIGN KEY (quote_id) REFERENCES sales_quotes(id) ON DELETE CASCADE not valid;

alter table "public"."sales_quote_lines" validate constraint "sales_quote_lines_quote_id_fkey";

alter table "public"."sales_quotes" add constraint "sales_quotes_client_id_fkey" FOREIGN KEY (client_id) REFERENCES "Client"(id) not valid;

alter table "public"."sales_quotes" validate constraint "sales_quotes_client_id_fkey";

alter table "public"."sales_quotes" add constraint "sales_quotes_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) not valid;

alter table "public"."sales_quotes" validate constraint "sales_quotes_company_id_fkey";

alter table "public"."sales_quotes" add constraint "sales_quotes_number_key" UNIQUE using index "sales_quotes_number_key";

alter table "public"."sales_quotes" add constraint "sales_quotes_reservation_id_fkey" FOREIGN KEY (reservation_id) REFERENCES reservations(id) not valid;

alter table "public"."sales_quotes" validate constraint "sales_quotes_reservation_id_fkey";

alter table "public"."sales_quotes" add constraint "sales_quotes_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES "User"(id) not valid;

alter table "public"."sales_quotes" validate constraint "sales_quotes_seller_id_fkey";

alter table "public"."sales_tracking" add constraint "sales_tracking_sale_type_check" CHECK (((sale_type)::text = ANY ((ARRAY['individual'::character varying, 'package'::character varying])::text[]))) not valid;

alter table "public"."sales_tracking" validate constraint "sales_tracking_sale_type_check";

alter table "public"."season_configurations" add constraint "valid_dates" CHECK ((end_date >= start_date)) not valid;

alter table "public"."season_configurations" validate constraint "valid_dates";

alter table "public"."season_configurations" add constraint "valid_percentage" CHECK (((discount_percentage >= ('-100'::integer)::numeric) AND (discount_percentage <= (200)::numeric))) not valid;

alter table "public"."season_configurations" validate constraint "valid_percentage";

alter table "public"."season_configurations" add constraint "valid_season_type" CHECK (((season_type)::text = ANY (ARRAY[('low'::character varying)::text, ('mid'::character varying)::text, ('high'::character varying)::text]))) not valid;

alter table "public"."season_configurations" validate constraint "valid_season_type";

alter table "public"."spa_products" add constraint "spa_products_category_id_fkey" FOREIGN KEY (category_id) REFERENCES "Category"(id) not valid;

alter table "public"."spa_products" validate constraint "spa_products_category_id_fkey";

alter table "public"."spa_products" add constraint "spa_products_sku_key" UNIQUE using index "spa_products_sku_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.calculate_combo_total_price(combo_id bigint)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
DECLARE
  total_price DECIMAL(10,2) := 0;
BEGIN
  SELECT COALESCE(SUM(quantity * unit_price), 0)
  INTO total_price
  FROM product_components
  WHERE combo_product_id = combo_id;
  
  RETURN total_price;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_package_price_modular(p_package_code character varying, p_room_code character varying, p_adults integer, p_children_ages integer[], p_nights integer)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  room_price DECIMAL(10,2) := 0;
  package_total DECIMAL(10,2) := 0;
  product_breakdown JSONB := '[]'::jsonb;
BEGIN
  -- Obtener precio de habitación
  SELECT price INTO room_price
  FROM products_modular 
  WHERE code = p_room_code AND category = 'alojamiento';
  
  room_price := COALESCE(room_price, 0) * p_nights;
  
  -- Calcular productos del paquete
  SELECT COALESCE(SUM(
    CASE 
      WHEN pr.per_person THEN 
        (p_adults * pr.price + (array_length(p_children_ages, 1) * pr.price * 0.5)) * p_nights
      ELSE 
        pr.price * p_nights
    END
  ), 0) INTO package_total
  FROM products_modular pr
  JOIN package_products_modular pp ON pr.id = pp.product_id
  JOIN packages_modular pk ON pp.package_id = pk.id
  WHERE pk.code = p_package_code AND pr.is_active = true;
  
  RETURN jsonb_build_object(
    'room_total', room_price,
    'package_total', package_total,
    'grand_total', room_price + package_total,
    'nights', p_nights
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_package_price_modular(p_package_code character varying, p_room_code character varying, p_adults integer, p_children_ages integer[], p_nights integer, p_additional_products character varying[] DEFAULT '{}'::character varying[])
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  room_price DECIMAL(10,2) := 0;
  package_total DECIMAL(10,2) := 0;
  additional_total DECIMAL(10,2) := 0;
  product_breakdown JSONB := '[]'::jsonb;
  product_record RECORD;
  age INTEGER;
  multiplier DECIMAL(3,2);
  product_total DECIMAL(10,2);
  adults_price DECIMAL(10,2);
  children_price DECIMAL(10,2);
BEGIN
  -- 1. HABITACIÓN: Precio directo de products_modular (YA ES FINAL)
  SELECT price INTO room_price
  FROM products_modular 
  WHERE code = p_room_code AND category = 'alojamiento';
  
  room_price := COALESCE(room_price, 0) * p_nights;
  
  -- 2. PRODUCTOS DEL PAQUETE: Precios directos (YA SON FINALES)
  FOR product_record IN 
    SELECT pr.code, pr.name, pr.price, pr.per_person, pr.category
    FROM products_modular pr
    JOIN package_products_modular pp ON pr.id = pp.product_id
    JOIN packages_modular pk ON pp.package_id = pk.id
    WHERE pk.code = p_package_code AND pr.is_active = true
    ORDER BY pp.sort_order
  LOOP
    product_total := 0;
    adults_price := 0;
    children_price := 0;
    
    IF product_record.per_person THEN
      -- Precio por adultos (precio directo sin IVA adicional)
      adults_price := p_adults * product_record.price * 1.0;
      
      -- Precio por niños según edad (precio directo sin IVA adicional)
      FOREACH age IN ARRAY p_children_ages
      LOOP
        SELECT age_pricing_modular.multiplier INTO multiplier
        FROM age_pricing_modular
        WHERE age >= min_age AND (max_age IS NULL OR age <= max_age);
        
        children_price := children_price + (product_record.price * COALESCE(multiplier, 0));
      END LOOP;
      
      product_total := (adults_price + children_price) * p_nights;
    ELSE
      -- Precio fijo (precio directo sin IVA adicional)
      product_total := product_record.price * p_nights;
    END IF;
    
    package_total := package_total + product_total;
    
    -- Agregar al breakdown
    product_breakdown := product_breakdown || jsonb_build_object(
      'code', product_record.code,
      'name', product_record.name,
      'category', product_record.category,
      'total', product_total,
      'adults_price', adults_price * p_nights,
      'children_price', children_price * p_nights,
      'per_person', product_record.per_person,
      'is_included', true
    );
  END LOOP;
  
  -- 3. PRODUCTOS ADICIONALES (si los hay)
  IF p_additional_products IS NOT NULL AND array_length(p_additional_products, 1) > 0 THEN
    FOR product_record IN 
      SELECT pr.code, pr.name, pr.price, pr.per_person, pr.category
      FROM products_modular pr
      WHERE pr.code = ANY(p_additional_products) AND pr.is_active = true
    LOOP
      product_total := 0;
      adults_price := 0;
      children_price := 0;
      
      IF product_record.per_person THEN
        adults_price := p_adults * product_record.price * 1.0;
        
        FOREACH age IN ARRAY p_children_ages
        LOOP
          SELECT age_pricing_modular.multiplier INTO multiplier
          FROM age_pricing_modular
          WHERE age >= min_age AND (max_age IS NULL OR age <= max_age);
          
          children_price := children_price + (product_record.price * COALESCE(multiplier, 0));
        END LOOP;
        
        product_total := (adults_price + children_price) * p_nights;
      ELSE
        product_total := product_record.price * p_nights;
      END IF;
      
      additional_total := additional_total + product_total;
      
      product_breakdown := product_breakdown || jsonb_build_object(
        'code', product_record.code,
        'name', product_record.name,
        'category', product_record.category,
        'total', product_total,
        'adults_price', adults_price * p_nights,
        'children_price', children_price * p_nights,
        'per_person', product_record.per_person,
        'is_included', false
      );
    END LOOP;
  END IF;
  
  -- 4. RETORNAR RESULTADO COMPLETO
  RETURN jsonb_build_object(
    'room_total', room_price,
    'package_total', package_total,
    'additional_total', additional_total,
    'grand_total', room_price + package_total + additional_total,
    'nights', p_nights,
    'daily_average', (room_price + package_total + additional_total) / p_nights,
    'breakdown', product_breakdown
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_package_price_modular(p_room_code text, p_package_code text, p_nights integer)
 RETURNS TABLE(room_price numeric, total_price numeric, product_details jsonb)
 LANGUAGE plpgsql
AS $function$
DECLARE
  room_price numeric := 0;
  package_price numeric := 0;
  total_price numeric := 0;
  product_record RECORD;
  product_details_array jsonb := '[]'::jsonb;
  product_detail jsonb;
BEGIN
  -- HABITACIÓN: Precio directo de products_modular (YA ES FINAL)
  SELECT pm.price INTO room_price
  FROM products_modular pm
  WHERE pm.code = p_room_code AND pm.category = 'alojamiento';
  
  room_price := COALESCE(room_price, 0) * p_nights;
  
  -- PRODUCTOS: Precios directos de products_modular (YA SON FINALES)
  FOR product_record IN 
    SELECT 
      pr.code, 
      pr.name, 
      pr.per_person, 
      pr.category,
      pr.price as final_price  -- 🔥 PRECIO DIRECTO SIN IVA ADICIONAL
    FROM products_modular pr
    JOIN package_products_modular pp ON pr.id = pp.product_id
    JOIN packages_modular pk ON pp.package_id = pk.id
    WHERE pk.code = p_package_code AND pr.is_active = true
    ORDER BY pp.sort_order
  LOOP
    package_price := package_price + product_record.final_price;
    
    product_detail := jsonb_build_object(
      'code', product_record.code,
      'name', product_record.name,
      'category', product_record.category,
      'price', product_record.final_price,
      'per_person', product_record.per_person
    );
    
    product_details_array := product_details_array || product_detail;
  END LOOP;
  
  total_price := room_price + package_price;
  
  RETURN QUERY SELECT 
    room_price, 
    total_price, 
    product_details_array;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_seasonal_price(base_price numeric, check_date date, price_type character varying DEFAULT 'room'::character varying)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
DECLARE
  season_info RECORD;
  final_price DECIMAL(10,2);
BEGIN
  -- Obtener información de temporada para la fecha
  SELECT * INTO season_info FROM get_season_for_date(check_date);
  
  -- Si no hay configuración de temporada, retornar precio base
  IF season_info IS NULL THEN
    RETURN base_price;
  END IF;
  
  -- Verificar si la temporada aplica al tipo de precio
  IF price_type = 'room' AND NOT season_info.applies_to_rooms THEN
    RETURN base_price;
  END IF;
  
  IF price_type = 'program' AND NOT season_info.applies_to_programs THEN
    RETURN base_price;
  END IF;
  
  -- Calcular precio con descuento/aumento
  final_price := base_price * (1 + (season_info.discount_percentage / 100));
  
  -- Asegurar que el precio no sea negativo
  IF final_price < 0 THEN
    final_price := 0;
  END IF;
  
  RETURN final_price;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_combo_stock_availability(combo_id bigint, requested_quantity integer DEFAULT 1)
 RETURNS TABLE(component_id bigint, component_name text, required_quantity numeric, available_stock numeric, sufficient_stock boolean)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    (pc.quantity * requested_quantity) as required_quantity,
    COALESCE(wp.quantity, 0) as available_stock,
    (COALESCE(wp.quantity, 0) >= (pc.quantity * requested_quantity)) as sufficient_stock
  FROM product_components pc
  JOIN "Product" p ON pc.component_product_id = p.id
  LEFT JOIN "Warehouse_Product" wp ON wp."productId" = p.id
  WHERE pc.combo_product_id = combo_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_orphaned_client_images()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Eliminar imágenes que no están referenciadas en la tabla Client
  DELETE FROM storage.objects
  WHERE bucket_id = 'client-images'
    AND name NOT IN (
      SELECT SUBSTRING(imagen FROM 'clients/(.+)$')
      FROM "Client"
      WHERE imagen IS NOT NULL
        AND imagen LIKE '%supabase%'
        AND imagen LIKE '%client-images%'
    )
    AND name LIKE 'client-%' -- Solo eliminar imágenes con prefijo client-
    AND created_at < NOW() - INTERVAL '7 days'; -- Solo eliminar imágenes de más de 7 días
END;
$function$
;

CREATE OR REPLACE FUNCTION public.crear_modular_al_vincular_producto()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  prod RECORD;
  catname TEXT;
BEGIN
  -- Buscar el producto real y su categoría
  SELECT id, name, categoryid INTO prod FROM "Product" WHERE id = NEW.product_id;
  IF prod.id IS NOT NULL THEN
    -- Buscar el nombre de la categoría
    IF prod.categoryid IS NOT NULL THEN
      SELECT name INTO catname FROM "Category" WHERE id = prod.categoryid;
    ELSE
      catname := 'sin_categoria';
    END IF;
    -- Si no existe el modular, crearlo
    IF NOT EXISTS (
      SELECT 1 FROM products_modular WHERE original_id = prod.id
    ) THEN
      INSERT INTO products_modular (code, name, original_id, is_active, category)
      VALUES (
        UPPER(REPLACE(prod.name, ' ', '_')) || '_' || prod.id,
        prod.name,
        prod.id,
        TRUE,
        COALESCE(catname, 'sin_categoria')
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_modular_product_if_not_exists()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Solo crear si no existe ya un producto modular con ese original_id
  IF NOT EXISTS (
    SELECT 1 FROM public.products_modular WHERE original_id = NEW.product_id
  ) THEN
    -- Insertar el producto modular basado en el producto real
    INSERT INTO public.products_modular (
      original_id, 
      is_active, 
      category, 
      code, 
      name,
      created_at, 
      updated_at
    )
    SELECT
      p.id,
      TRUE,
      COALESCE(c.name, 'Sin Categoría'),
      COALESCE(p.model, 'PROD-' || p.id),
      p.name,
      NOW(),
      NOW()
    FROM public."Product" p
    LEFT JOIN public."Category" c ON c.id = p.categoryid
    WHERE p.id = NEW.product_id;
    
    -- Log para debug
    RAISE NOTICE 'Producto modular creado automáticamente para product_id: %', NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_product_components_table_if_not_exists()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- La tabla ya existe, no hacer nada
  RETURN;
END;
$function$
;

create or replace view "public"."enhanced_package_analysis" as  SELECT date_trunc('month'::text, (product_sales_tracking.sale_date)::timestamp with time zone) AS month,
    product_sales_tracking.sale_type,
    count(*) AS sales_count,
    sum(product_sales_tracking.total_amount) AS revenue,
    avg(product_sales_tracking.total_amount) AS avg_value,
    sum(product_sales_tracking.quantity) AS total_items,
    count(DISTINCT product_sales_tracking.product_id) AS unique_products
   FROM product_sales_tracking
  GROUP BY (date_trunc('month'::text, (product_sales_tracking.sale_date)::timestamp with time zone)), product_sales_tracking.sale_type
  ORDER BY (date_trunc('month'::text, (product_sales_tracking.sale_date)::timestamp with time zone)) DESC, product_sales_tracking.sale_type;


create or replace view "public"."enhanced_sales_by_category" as  SELECT c.id AS category_id,
    c.name AS category_name,
    count(pst.*) AS total_sales,
    sum(pst.quantity) AS total_quantity,
    sum(pst.total_amount) AS total_revenue,
    avg(pst.total_amount) AS avg_sale_amount,
    count(DISTINCT pst.product_id) AS unique_products_sold,
    min(pst.sale_date) AS first_sale,
    max(pst.sale_date) AS last_sale
   FROM ((product_sales_tracking pst
     JOIN "Product" p ON ((pst.product_id = p.id)))
     JOIN "Category" c ON ((p.categoryid = c.id)))
  GROUP BY c.id, c.name
  ORDER BY (sum(pst.total_amount)) DESC;


create or replace view "public"."enhanced_sales_by_type" as  SELECT product_sales_tracking.sale_type,
    count(*) AS total_sales,
    sum(product_sales_tracking.quantity) AS total_quantity,
    sum(product_sales_tracking.total_amount) AS total_revenue,
    avg(product_sales_tracking.total_amount) AS avg_sale_amount,
    round((((count(*))::numeric * 100.0) / (( SELECT count(*) AS count
           FROM product_sales_tracking product_sales_tracking_1))::numeric), 2) AS percentage_of_total,
    min(product_sales_tracking.sale_date) AS first_sale,
    max(product_sales_tracking.sale_date) AS last_sale
   FROM product_sales_tracking
  GROUP BY product_sales_tracking.sale_type;


create or replace view "public"."enhanced_top_products_by_sales" as  SELECT pst.product_id,
    p.name AS product_name,
    p.sku AS product_sku,
    c.name AS category_name,
    count(*) AS total_sales,
    sum(pst.quantity) AS total_quantity_sold,
    sum(pst.total_amount) AS total_revenue,
    avg(pst.total_amount) AS avg_sale_amount,
    string_agg(DISTINCT (pst.sale_type)::text, ', '::text) AS sale_types,
    min(pst.sale_date) AS first_sale,
    max(pst.sale_date) AS last_sale
   FROM ((product_sales_tracking pst
     JOIN "Product" p ON ((pst.product_id = p.id)))
     LEFT JOIN "Category" c ON ((p.categoryid = c.id)))
  GROUP BY pst.product_id, p.name, p.sku, c.name
  ORDER BY (sum(pst.total_amount)) DESC;


CREATE OR REPLACE FUNCTION public.generate_room_sku(room_number text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN 'HAB-' || LPAD(room_number, 3, '0');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_sale_number(register_type_id integer)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    prefix TEXT;
    counter INTEGER;
    sale_number TEXT;
BEGIN
    -- Obtener el prefijo según el tipo de registro
    CASE register_type_id
        WHEN 1 THEN prefix := 'REC-';
        WHEN 2 THEN prefix := 'REST-';
        ELSE prefix := 'POS-';
    END CASE;
    
    -- Obtener el próximo número secuencial
    SELECT COALESCE(MAX(CAST(SUBSTRING("saleNumber" FROM LENGTH(prefix) + 1) AS INTEGER)), 0) + 1
    INTO counter
    FROM "POSSale" ps
    JOIN "CashSession" cs ON ps."sessionId" = cs.id
    WHERE cs."cashRegisterTypeId" = register_type_id
    AND ps."saleNumber" LIKE prefix || '%';
    
    -- Formatear el número con ceros a la izquierda
    sale_number := prefix || LPAD(counter::TEXT, 6, '0');
    
    RETURN sale_number;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_budget_lines_with_product(budget_id bigint)
 RETURNS TABLE(id bigint, quote_id bigint, product_id bigint, product_name text, description character varying, quantity numeric, unit_price numeric, discount_percent numeric, taxes jsonb, subtotal numeric)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
    SELECT 
        sql.id,
        sql.quote_id,
        sql.product_id,
        p.name as product_name,
        sql.description,
        sql.quantity,
        sql.unit_price,
        sql.discount_percent,
        sql.taxes,
        sql.subtotal
    FROM sales_quote_lines sql
    LEFT JOIN "Product" p ON sql.product_id = p.id
    WHERE sql.quote_id = budget_id
    ORDER BY sql.id;
$function$
;

CREATE OR REPLACE FUNCTION public.get_client_image_url(image_path text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  base_url text;
  public_url text;
BEGIN
  -- Obtener la URL base del proyecto
  SELECT concat('https://', current_setting('app.settings.supabase_url', true), '/storage/v1/object/public/')
  INTO base_url;
  
  -- Construir URL pública
  IF image_path IS NOT NULL AND image_path != '' THEN
    public_url := concat(base_url, 'client-images/', image_path);
  ELSE
    public_url := NULL;
  END IF;
  
  RETURN public_url;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_combo_components(combo_id bigint)
 RETURNS TABLE(component_id bigint, component_name text, component_sku text, quantity numeric, unit_price numeric, subtotal numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.sku,
    pc.quantity,
    pc.unit_price,
    (pc.quantity * pc.unit_price) as subtotal
  FROM product_components pc
  JOIN "Product" p ON pc.component_product_id = p.id
  WHERE pc.combo_product_id = combo_id
  ORDER BY p.name;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_enhanced_sales_stats_for_period(start_date date, end_date date)
 RETURNS TABLE(total_sales bigint, total_revenue numeric, direct_sales bigint, package_sales bigint, direct_revenue numeric, package_revenue numeric, avg_direct_sale numeric, avg_package_sale numeric, top_category text, top_product text, unique_products bigint, unique_categories bigint)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as total_count,
            SUM(total_amount) as total_amount,
            COUNT(*) FILTER (WHERE sale_type = 'direct') as direct_count,
            COUNT(*) FILTER (WHERE sale_type = 'package') as package_count,
            SUM(total_amount) FILTER (WHERE sale_type = 'direct') as direct_amount,
            SUM(total_amount) FILTER (WHERE sale_type = 'package') as package_amount,
            COUNT(DISTINCT product_id) as unique_prods,
            COUNT(DISTINCT p.categoryId) as unique_cats
        FROM product_sales_tracking pst
        JOIN "Product" p ON pst.product_id = p.id
        WHERE pst.sale_date BETWEEN start_date AND end_date
    ),
    top_cat AS (
        SELECT c.name as category_name
        FROM product_sales_tracking pst
        JOIN "Product" p ON pst.product_id = p.id
        JOIN "Category" c ON p.categoryId = c.id
        WHERE pst.sale_date BETWEEN start_date AND end_date
        GROUP BY c.name
        ORDER BY SUM(pst.total_amount) DESC
        LIMIT 1
    ),
    top_prod AS (
        SELECT p.name as product_name
        FROM product_sales_tracking pst
        JOIN "Product" p ON pst.product_id = p.id
        WHERE pst.sale_date BETWEEN start_date AND end_date
        GROUP BY p.name
        ORDER BY SUM(pst.total_amount) DESC
        LIMIT 1
    )
    SELECT 
        s.total_count,
        s.total_amount,
        s.direct_count,
        s.package_count,
        COALESCE(s.direct_amount, 0),
        COALESCE(s.package_amount, 0),
        CASE WHEN s.direct_count > 0 THEN s.direct_amount / s.direct_count ELSE 0 END,
        CASE WHEN s.package_count > 0 THEN s.package_amount / s.package_count ELSE 0 END,
        COALESCE(tc.category_name, 'Sin ventas'),
        COALESCE(tp.product_name, 'Sin ventas'),
        s.unique_prods,
        s.unique_cats
    FROM stats s
    CROSS JOIN top_cat tc
    CROSS JOIN top_prod tp;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_enhanced_top_products_for_period(start_date date, end_date date, limit_count integer DEFAULT 10)
 RETURNS TABLE(product_id bigint, product_name text, product_sku text, category_name text, total_sales bigint, total_revenue numeric, avg_sale_amount numeric, direct_sales bigint, package_sales bigint, direct_revenue numeric, package_revenue numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.sku,
        COALESCE(c.name, 'Sin categoría'),
        COUNT(*),
        SUM(pst.total_amount),
        AVG(pst.total_amount),
        COUNT(*) FILTER (WHERE pst.sale_type = 'direct'),
        COUNT(*) FILTER (WHERE pst.sale_type = 'package'),
        SUM(pst.total_amount) FILTER (WHERE pst.sale_type = 'direct'),
        SUM(pst.total_amount) FILTER (WHERE pst.sale_type = 'package')
    FROM product_sales_tracking pst
    JOIN "Product" p ON pst.product_id = p.id
    LEFT JOIN "Category" c ON p.categoryId = c.id
    WHERE pst.sale_date BETWEEN start_date AND end_date
    GROUP BY p.id, p.name, p.sku, c.name
    ORDER BY SUM(pst.total_amount) DESC
    LIMIT limit_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_sales_stats_for_period(start_date date DEFAULT (CURRENT_DATE - '30 days'::interval), end_date date DEFAULT CURRENT_DATE)
 RETURNS TABLE(sale_type character varying, total_sales numeric, total_quantity bigint, sales_count bigint, avg_sale_amount numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    st.sale_type,
    SUM(st.total_price)::DECIMAL(12,2) as total_sales,
    SUM(st.quantity) as total_quantity,
    COUNT(*)::BIGINT as sales_count,
    AVG(st.total_price)::DECIMAL(12,2) as avg_sale_amount
  FROM sales_tracking st
  WHERE st.created_at::DATE BETWEEN start_date AND end_date
  GROUP BY st.sale_type;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_season_for_date(check_date date)
 RETURNS TABLE(id bigint, name character varying, season_type character varying, discount_percentage numeric, applies_to_rooms boolean, applies_to_programs boolean)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id,
    sc.name,
    sc.season_type,
    sc.discount_percentage,
    sc.applies_to_rooms,
    sc.applies_to_programs
  FROM season_configurations sc
  WHERE check_date BETWEEN sc.start_date AND sc.end_date
    AND sc.is_active = true
  ORDER BY sc.priority DESC, sc.id DESC
  LIMIT 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_top_products_for_period(start_date date DEFAULT (CURRENT_DATE - '30 days'::interval), end_date date DEFAULT CURRENT_DATE, limit_results integer DEFAULT 10)
 RETURNS TABLE(product_id bigint, product_name character varying, category_name character varying, total_quantity bigint, total_revenue numeric, individual_sales numeric, package_sales numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    st.product_id,
    st.product_name,
    st.category_name,
    SUM(st.quantity) as total_quantity,
    SUM(st.total_price)::DECIMAL(12,2) as total_revenue,
    SUM(CASE WHEN st.sale_type = 'individual' THEN st.total_price ELSE 0 END)::DECIMAL(12,2) as individual_sales,
    SUM(CASE WHEN st.sale_type = 'package' THEN st.total_price ELSE 0 END)::DECIMAL(12,2) as package_sales
  FROM sales_tracking st
  WHERE st.created_at::DATE BETWEEN start_date AND end_date
  GROUP BY st.product_id, st.product_name, st.category_name
  ORDER BY total_revenue DESC
  LIMIT limit_results;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_role TEXT;
BEGIN
  -- Obtener el rol del usuario actual usando los nombres correctos de columna
  SELECT r."roleName" 
  INTO user_role
  FROM "User" u
  JOIN "Role" r ON u."roleId" = r."id"
  WHERE u."id" = auth.uid()
  AND u."isActive" = true;
  
  -- Retornar el rol o 'USUARIO_FINAL' por defecto
  RETURN COALESCE(user_role, 'USUARIO_FINAL');
END;
$function$
;

create or replace view "public"."package_analysis" as  SELECT sales_tracking.package_name,
    count(*) AS sales_count,
    sum(sales_tracking.quantity) AS total_quantity,
    sum(sales_tracking.total_price) AS total_revenue,
    count(DISTINCT sales_tracking.product_id) AS unique_products,
    count(DISTINCT sales_tracking.category_id) AS unique_categories,
    avg(sales_tracking.total_price) AS avg_package_value
   FROM sales_tracking
  WHERE (((sales_tracking.sale_type)::text = 'package'::text) AND (sales_tracking.package_name IS NOT NULL))
  GROUP BY sales_tracking.package_name
  ORDER BY (sum(sales_tracking.total_price)) DESC;


create or replace view "public"."product_sales_summary" as  SELECT p.id AS product_id,
    p.name AS product_name,
    p.sku,
    c.name AS category_name,
    COALESCE(sum(pst.quantity), (0)::numeric) AS total_quantity_sold,
    COALESCE(sum(pst.total_amount), (0)::numeric) AS total_revenue,
    COALESCE(sum(
        CASE
            WHEN ((pst.sale_type)::text = 'direct'::text) THEN pst.quantity
            ELSE (0)::numeric
        END), (0)::numeric) AS direct_sales_quantity,
    COALESCE(sum(
        CASE
            WHEN ((pst.sale_type)::text = 'direct'::text) THEN pst.total_amount
            ELSE (0)::numeric
        END), (0)::numeric) AS direct_sales_revenue,
    COALESCE(sum(
        CASE
            WHEN ((pst.sale_type)::text = 'package'::text) THEN pst.quantity
            ELSE (0)::numeric
        END), (0)::numeric) AS package_sales_quantity,
    COALESCE(sum(
        CASE
            WHEN ((pst.sale_type)::text = 'package'::text) THEN pst.total_amount
            ELSE (0)::numeric
        END), (0)::numeric) AS package_sales_revenue,
    count(DISTINCT ppl.package_id) AS linked_packages_count,
    min(pst.sale_date) AS first_sale_date,
    max(pst.sale_date) AS last_sale_date,
    p.saleprice AS current_price
   FROM ((("Product" p
     LEFT JOIN "Category" c ON ((p.categoryid = c.id)))
     LEFT JOIN product_sales_tracking pst ON ((p.id = pst.product_id)))
     LEFT JOIN product_package_linkage ppl ON ((p.id = ppl.product_id)))
  WHERE ((p.saleprice IS NOT NULL) AND (p.saleprice > (0)::numeric))
  GROUP BY p.id, p.name, p.sku, c.name, p.saleprice;


CREATE OR REPLACE FUNCTION public.register_enhanced_product_sale(p_product_id bigint, p_sale_type character varying, p_package_id bigint DEFAULT NULL::bigint, p_quantity numeric DEFAULT 1, p_unit_price numeric DEFAULT NULL::numeric, p_customer_info jsonb DEFAULT NULL::jsonb, p_reservation_id bigint DEFAULT NULL::bigint, p_user_id uuid DEFAULT NULL::uuid, p_notes text DEFAULT NULL::text)
 RETURNS bigint
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_unit_price DECIMAL(10,2);
    v_total_amount DECIMAL(10,2);
    v_sale_id BIGINT;
    v_user_id UUID;
BEGIN
    -- Validar que el producto existe
    IF NOT EXISTS (SELECT 1 FROM "Product" WHERE id = p_product_id) THEN
        RAISE EXCEPTION 'Producto con ID % no existe', p_product_id;
    END IF;
    
    -- Obtener precio si no se especifica
    IF p_unit_price IS NULL THEN
        SELECT saleprice INTO v_unit_price FROM "Product" WHERE id = p_product_id;
        IF v_unit_price IS NULL THEN
            RAISE EXCEPTION 'Producto no tiene precio definido y no se especificó precio';
        END IF;
    ELSE
        v_unit_price := p_unit_price;
    END IF;
    
    -- Calcular total
    v_total_amount := p_quantity * v_unit_price;
    
    -- Obtener user_id si no se especifica
    IF p_user_id IS NULL THEN
        v_user_id := auth.uid();
    ELSE
        v_user_id := p_user_id;
    END IF;
    
    -- Insertar registro de venta
    INSERT INTO product_sales_tracking (
        product_id, sale_type, package_id, quantity, 
        unit_price, total_amount, customer_info, reservation_id,
        user_id, notes
    ) VALUES (
        p_product_id, p_sale_type, p_package_id, p_quantity,
        v_unit_price, v_total_amount, p_customer_info, p_reservation_id,
        v_user_id, p_notes
    ) RETURNING id INTO v_sale_id;
    
    RETURN v_sale_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.register_product_sale(p_product_id bigint, p_sale_type character varying, p_package_id bigint DEFAULT NULL::bigint, p_quantity numeric DEFAULT 1, p_unit_price numeric DEFAULT NULL::numeric, p_customer_info jsonb DEFAULT NULL::jsonb, p_reservation_id bigint DEFAULT NULL::bigint)
 RETURNS bigint
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_unit_price DECIMAL(10,2);
  v_total_amount DECIMAL(10,2);
  v_sale_id BIGINT;
BEGIN
  -- Obtener precio si no se especifica
  IF p_unit_price IS NULL THEN
    SELECT saleprice INTO v_unit_price FROM "Product" WHERE id = p_product_id;
  ELSE
    v_unit_price := p_unit_price;
  END IF;
  
  v_total_amount := p_quantity * v_unit_price;
  
  -- Insertar registro de venta
  INSERT INTO product_sales_tracking (
    product_id, sale_type, package_id, quantity, 
    unit_price, total_amount, customer_info, reservation_id
  ) VALUES (
    p_product_id, p_sale_type, p_package_id, p_quantity,
    v_unit_price, v_total_amount, p_customer_info, p_reservation_id
  ) RETURNING id INTO v_sale_id;
  
  RETURN v_sale_id;
END;
$function$
;

create or replace view "public"."sales_by_category" as  SELECT sales_tracking.category_id,
    sales_tracking.category_name,
    sales_tracking.sale_type,
    count(*) AS sales_count,
    sum(sales_tracking.quantity) AS total_quantity,
    sum(sales_tracking.total_price) AS total_revenue,
    count(DISTINCT sales_tracking.product_id) AS unique_products
   FROM sales_tracking
  GROUP BY sales_tracking.category_id, sales_tracking.category_name, sales_tracking.sale_type
  ORDER BY (sum(sales_tracking.total_price)) DESC;


create or replace view "public"."sales_by_type" as  SELECT sales_tracking.sale_type,
    count(*) AS sales_count,
    sum(sales_tracking.quantity) AS total_quantity,
    sum(sales_tracking.total_price) AS total_revenue,
    avg(sales_tracking.total_price) AS avg_sale_amount,
    count(DISTINCT sales_tracking.product_id) AS unique_products
   FROM sales_tracking
  GROUP BY sales_tracking.sale_type;


create or replace view "public"."top_products_by_sales" as  SELECT sales_tracking.product_id,
    sales_tracking.product_name,
    sales_tracking.category_name,
    sales_tracking.sale_type,
    count(*) AS sales_count,
    sum(sales_tracking.quantity) AS total_quantity,
    sum(sales_tracking.total_price) AS total_revenue,
    avg(sales_tracking.unit_price) AS avg_unit_price
   FROM sales_tracking
  GROUP BY sales_tracking.product_id, sales_tracking.product_name, sales_tracking.category_name, sales_tracking.sale_type
  ORDER BY (sum(sales_tracking.total_price)) DESC;


CREATE OR REPLACE FUNCTION public.update_client_modified_on_image_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF OLD.imagen IS DISTINCT FROM NEW.imagen THEN
    NEW."fechaModificacion" = NOW();
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_final_price_with_vat()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.final_price_with_vat := ROUND(COALESCE(NEW.saleprice,0) * (1 + COALESCE(NEW.vat,0)/100));
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_inventory_movement_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_product_components_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_product_sales_tracking_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_sales_tracking_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, now());
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_supplier_contact_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_supplier_payment_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_supplier_tag_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_warehouse_product_stock(p_product_id bigint, p_warehouse_id bigint, p_quantity_change integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Verificar si existe la relación producto-bodega
    IF NOT EXISTS (
        SELECT 1 FROM "Warehouse_Product" 
        WHERE "productId" = p_product_id AND "warehouseId" = p_warehouse_id
    ) THEN
        -- Si no existe, crear la relación con la cantidad inicial
        INSERT INTO "Warehouse_Product" ("productId", "warehouseId", "quantity", "minStock", "maxStock")
        VALUES (p_product_id, p_warehouse_id, GREATEST(0, p_quantity_change), 0, NULL);
    ELSE
        -- Si existe, actualizar la cantidad
        UPDATE "Warehouse_Product"
        SET "quantity" = GREATEST(0, "quantity" + p_quantity_change),
            "updatedAt" = NOW()
        WHERE "productId" = p_product_id AND "warehouseId" = p_warehouse_id;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_warehouse_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_combo_component_types()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Validar que el producto combo sea de tipo COMBO
  IF NOT EXISTS (
    SELECT 1 FROM "Product" 
    WHERE id = NEW.combo_product_id AND type = 'COMBO'
  ) THEN
    RAISE EXCEPTION 'El producto principal debe ser de tipo COMBO';
  END IF;
  
  -- Validar que el componente no sea de tipo COMBO (evitar combos anidados)
  IF EXISTS (
    SELECT 1 FROM "Product" 
    WHERE id = NEW.component_product_id AND type = 'COMBO'
  ) THEN
    RAISE EXCEPTION 'Un componente no puede ser de tipo COMBO';
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_product_reference()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Si es un producto spa, verificar que existe en spa_products
    IF NEW.product_type = 'spa_product' AND NEW.product_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM spa_products WHERE id = NEW.product_id) THEN
            RAISE EXCEPTION 'El producto spa con ID % no existe', NEW.product_id;
        END IF;
    END IF;
    
    -- Si es un producto modular, verificar que existe en products_modular
    IF NEW.product_type = 'modular_product' AND NEW.modular_product_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM products_modular WHERE id = NEW.modular_product_id) THEN
            RAISE EXCEPTION 'El producto modular con ID % no existe', NEW.modular_product_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.verify_rls_policies()
 RETURNS TABLE(table_name text, policy_name text, policy_type text)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname || '.' || tablename as table_name,
    policyname as policy_name,
    cmd as policy_type
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename IN ('Product', 'Warehouse', 'Warehouse_Product', 'Category', 'Supplier')
  ORDER BY tablename, policyname;
END;
$function$
;

grant delete on table "public"."CashRegister" to "anon";

grant insert on table "public"."CashRegister" to "anon";

grant references on table "public"."CashRegister" to "anon";

grant select on table "public"."CashRegister" to "anon";

grant trigger on table "public"."CashRegister" to "anon";

grant truncate on table "public"."CashRegister" to "anon";

grant update on table "public"."CashRegister" to "anon";

grant delete on table "public"."CashRegister" to "authenticated";

grant insert on table "public"."CashRegister" to "authenticated";

grant references on table "public"."CashRegister" to "authenticated";

grant select on table "public"."CashRegister" to "authenticated";

grant trigger on table "public"."CashRegister" to "authenticated";

grant truncate on table "public"."CashRegister" to "authenticated";

grant update on table "public"."CashRegister" to "authenticated";

grant delete on table "public"."CashRegister" to "service_role";

grant insert on table "public"."CashRegister" to "service_role";

grant references on table "public"."CashRegister" to "service_role";

grant select on table "public"."CashRegister" to "service_role";

grant trigger on table "public"."CashRegister" to "service_role";

grant truncate on table "public"."CashRegister" to "service_role";

grant update on table "public"."CashRegister" to "service_role";

grant delete on table "public"."CashRegisterType" to "anon";

grant insert on table "public"."CashRegisterType" to "anon";

grant references on table "public"."CashRegisterType" to "anon";

grant select on table "public"."CashRegisterType" to "anon";

grant trigger on table "public"."CashRegisterType" to "anon";

grant truncate on table "public"."CashRegisterType" to "anon";

grant update on table "public"."CashRegisterType" to "anon";

grant delete on table "public"."CashRegisterType" to "authenticated";

grant insert on table "public"."CashRegisterType" to "authenticated";

grant references on table "public"."CashRegisterType" to "authenticated";

grant select on table "public"."CashRegisterType" to "authenticated";

grant trigger on table "public"."CashRegisterType" to "authenticated";

grant truncate on table "public"."CashRegisterType" to "authenticated";

grant update on table "public"."CashRegisterType" to "authenticated";

grant delete on table "public"."CashRegisterType" to "service_role";

grant insert on table "public"."CashRegisterType" to "service_role";

grant references on table "public"."CashRegisterType" to "service_role";

grant select on table "public"."CashRegisterType" to "service_role";

grant trigger on table "public"."CashRegisterType" to "service_role";

grant truncate on table "public"."CashRegisterType" to "service_role";

grant update on table "public"."CashRegisterType" to "service_role";

grant delete on table "public"."CashSession" to "anon";

grant insert on table "public"."CashSession" to "anon";

grant references on table "public"."CashSession" to "anon";

grant select on table "public"."CashSession" to "anon";

grant trigger on table "public"."CashSession" to "anon";

grant truncate on table "public"."CashSession" to "anon";

grant update on table "public"."CashSession" to "anon";

grant delete on table "public"."CashSession" to "authenticated";

grant insert on table "public"."CashSession" to "authenticated";

grant references on table "public"."CashSession" to "authenticated";

grant select on table "public"."CashSession" to "authenticated";

grant trigger on table "public"."CashSession" to "authenticated";

grant truncate on table "public"."CashSession" to "authenticated";

grant update on table "public"."CashSession" to "authenticated";

grant delete on table "public"."CashSession" to "service_role";

grant insert on table "public"."CashSession" to "service_role";

grant references on table "public"."CashSession" to "service_role";

grant select on table "public"."CashSession" to "service_role";

grant trigger on table "public"."CashSession" to "service_role";

grant truncate on table "public"."CashSession" to "service_role";

grant update on table "public"."CashSession" to "service_role";

grant delete on table "public"."Category" to "anon";

grant insert on table "public"."Category" to "anon";

grant references on table "public"."Category" to "anon";

grant select on table "public"."Category" to "anon";

grant trigger on table "public"."Category" to "anon";

grant truncate on table "public"."Category" to "anon";

grant update on table "public"."Category" to "anon";

grant delete on table "public"."Category" to "authenticated";

grant insert on table "public"."Category" to "authenticated";

grant references on table "public"."Category" to "authenticated";

grant select on table "public"."Category" to "authenticated";

grant trigger on table "public"."Category" to "authenticated";

grant truncate on table "public"."Category" to "authenticated";

grant update on table "public"."Category" to "authenticated";

grant delete on table "public"."Category" to "service_role";

grant insert on table "public"."Category" to "service_role";

grant references on table "public"."Category" to "service_role";

grant select on table "public"."Category" to "service_role";

grant trigger on table "public"."Category" to "service_role";

grant truncate on table "public"."Category" to "service_role";

grant update on table "public"."Category" to "service_role";

grant delete on table "public"."Client" to "anon";

grant insert on table "public"."Client" to "anon";

grant references on table "public"."Client" to "anon";

grant select on table "public"."Client" to "anon";

grant trigger on table "public"."Client" to "anon";

grant truncate on table "public"."Client" to "anon";

grant update on table "public"."Client" to "anon";

grant delete on table "public"."Client" to "authenticated";

grant insert on table "public"."Client" to "authenticated";

grant references on table "public"."Client" to "authenticated";

grant select on table "public"."Client" to "authenticated";

grant trigger on table "public"."Client" to "authenticated";

grant truncate on table "public"."Client" to "authenticated";

grant update on table "public"."Client" to "authenticated";

grant delete on table "public"."Client" to "service_role";

grant insert on table "public"."Client" to "service_role";

grant references on table "public"."Client" to "service_role";

grant select on table "public"."Client" to "service_role";

grant trigger on table "public"."Client" to "service_role";

grant truncate on table "public"."Client" to "service_role";

grant update on table "public"."Client" to "service_role";

grant delete on table "public"."ClientContact" to "anon";

grant insert on table "public"."ClientContact" to "anon";

grant references on table "public"."ClientContact" to "anon";

grant select on table "public"."ClientContact" to "anon";

grant trigger on table "public"."ClientContact" to "anon";

grant truncate on table "public"."ClientContact" to "anon";

grant update on table "public"."ClientContact" to "anon";

grant delete on table "public"."ClientContact" to "authenticated";

grant insert on table "public"."ClientContact" to "authenticated";

grant references on table "public"."ClientContact" to "authenticated";

grant select on table "public"."ClientContact" to "authenticated";

grant trigger on table "public"."ClientContact" to "authenticated";

grant truncate on table "public"."ClientContact" to "authenticated";

grant update on table "public"."ClientContact" to "authenticated";

grant delete on table "public"."ClientContact" to "service_role";

grant insert on table "public"."ClientContact" to "service_role";

grant references on table "public"."ClientContact" to "service_role";

grant select on table "public"."ClientContact" to "service_role";

grant trigger on table "public"."ClientContact" to "service_role";

grant truncate on table "public"."ClientContact" to "service_role";

grant update on table "public"."ClientContact" to "service_role";

grant delete on table "public"."ClientTag" to "anon";

grant insert on table "public"."ClientTag" to "anon";

grant references on table "public"."ClientTag" to "anon";

grant select on table "public"."ClientTag" to "anon";

grant trigger on table "public"."ClientTag" to "anon";

grant truncate on table "public"."ClientTag" to "anon";

grant update on table "public"."ClientTag" to "anon";

grant delete on table "public"."ClientTag" to "authenticated";

grant insert on table "public"."ClientTag" to "authenticated";

grant references on table "public"."ClientTag" to "authenticated";

grant select on table "public"."ClientTag" to "authenticated";

grant trigger on table "public"."ClientTag" to "authenticated";

grant truncate on table "public"."ClientTag" to "authenticated";

grant update on table "public"."ClientTag" to "authenticated";

grant delete on table "public"."ClientTag" to "service_role";

grant insert on table "public"."ClientTag" to "service_role";

grant references on table "public"."ClientTag" to "service_role";

grant select on table "public"."ClientTag" to "service_role";

grant trigger on table "public"."ClientTag" to "service_role";

grant truncate on table "public"."ClientTag" to "service_role";

grant update on table "public"."ClientTag" to "service_role";

grant delete on table "public"."ClientTagAssignment" to "anon";

grant insert on table "public"."ClientTagAssignment" to "anon";

grant references on table "public"."ClientTagAssignment" to "anon";

grant select on table "public"."ClientTagAssignment" to "anon";

grant trigger on table "public"."ClientTagAssignment" to "anon";

grant truncate on table "public"."ClientTagAssignment" to "anon";

grant update on table "public"."ClientTagAssignment" to "anon";

grant delete on table "public"."ClientTagAssignment" to "authenticated";

grant insert on table "public"."ClientTagAssignment" to "authenticated";

grant references on table "public"."ClientTagAssignment" to "authenticated";

grant select on table "public"."ClientTagAssignment" to "authenticated";

grant trigger on table "public"."ClientTagAssignment" to "authenticated";

grant truncate on table "public"."ClientTagAssignment" to "authenticated";

grant update on table "public"."ClientTagAssignment" to "authenticated";

grant delete on table "public"."ClientTagAssignment" to "service_role";

grant insert on table "public"."ClientTagAssignment" to "service_role";

grant references on table "public"."ClientTagAssignment" to "service_role";

grant select on table "public"."ClientTagAssignment" to "service_role";

grant trigger on table "public"."ClientTagAssignment" to "service_role";

grant truncate on table "public"."ClientTagAssignment" to "service_role";

grant update on table "public"."ClientTagAssignment" to "service_role";

grant delete on table "public"."Cost_Center" to "anon";

grant insert on table "public"."Cost_Center" to "anon";

grant references on table "public"."Cost_Center" to "anon";

grant select on table "public"."Cost_Center" to "anon";

grant trigger on table "public"."Cost_Center" to "anon";

grant truncate on table "public"."Cost_Center" to "anon";

grant update on table "public"."Cost_Center" to "anon";

grant delete on table "public"."Cost_Center" to "authenticated";

grant insert on table "public"."Cost_Center" to "authenticated";

grant references on table "public"."Cost_Center" to "authenticated";

grant select on table "public"."Cost_Center" to "authenticated";

grant trigger on table "public"."Cost_Center" to "authenticated";

grant truncate on table "public"."Cost_Center" to "authenticated";

grant update on table "public"."Cost_Center" to "authenticated";

grant delete on table "public"."Cost_Center" to "service_role";

grant insert on table "public"."Cost_Center" to "service_role";

grant references on table "public"."Cost_Center" to "service_role";

grant select on table "public"."Cost_Center" to "service_role";

grant trigger on table "public"."Cost_Center" to "service_role";

grant truncate on table "public"."Cost_Center" to "service_role";

grant update on table "public"."Cost_Center" to "service_role";

grant delete on table "public"."Country" to "anon";

grant insert on table "public"."Country" to "anon";

grant references on table "public"."Country" to "anon";

grant select on table "public"."Country" to "anon";

grant trigger on table "public"."Country" to "anon";

grant truncate on table "public"."Country" to "anon";

grant update on table "public"."Country" to "anon";

grant delete on table "public"."Country" to "authenticated";

grant insert on table "public"."Country" to "authenticated";

grant references on table "public"."Country" to "authenticated";

grant select on table "public"."Country" to "authenticated";

grant trigger on table "public"."Country" to "authenticated";

grant truncate on table "public"."Country" to "authenticated";

grant update on table "public"."Country" to "authenticated";

grant delete on table "public"."Country" to "service_role";

grant insert on table "public"."Country" to "service_role";

grant references on table "public"."Country" to "service_role";

grant select on table "public"."Country" to "service_role";

grant trigger on table "public"."Country" to "service_role";

grant truncate on table "public"."Country" to "service_role";

grant update on table "public"."Country" to "service_role";

grant delete on table "public"."EconomicSector" to "anon";

grant insert on table "public"."EconomicSector" to "anon";

grant references on table "public"."EconomicSector" to "anon";

grant select on table "public"."EconomicSector" to "anon";

grant trigger on table "public"."EconomicSector" to "anon";

grant truncate on table "public"."EconomicSector" to "anon";

grant update on table "public"."EconomicSector" to "anon";

grant delete on table "public"."EconomicSector" to "authenticated";

grant insert on table "public"."EconomicSector" to "authenticated";

grant references on table "public"."EconomicSector" to "authenticated";

grant select on table "public"."EconomicSector" to "authenticated";

grant trigger on table "public"."EconomicSector" to "authenticated";

grant truncate on table "public"."EconomicSector" to "authenticated";

grant update on table "public"."EconomicSector" to "authenticated";

grant delete on table "public"."EconomicSector" to "service_role";

grant insert on table "public"."EconomicSector" to "service_role";

grant references on table "public"."EconomicSector" to "service_role";

grant select on table "public"."EconomicSector" to "service_role";

grant trigger on table "public"."EconomicSector" to "service_role";

grant truncate on table "public"."EconomicSector" to "service_role";

grant update on table "public"."EconomicSector" to "service_role";

grant delete on table "public"."InventoryMovement" to "anon";

grant insert on table "public"."InventoryMovement" to "anon";

grant references on table "public"."InventoryMovement" to "anon";

grant select on table "public"."InventoryMovement" to "anon";

grant trigger on table "public"."InventoryMovement" to "anon";

grant truncate on table "public"."InventoryMovement" to "anon";

grant update on table "public"."InventoryMovement" to "anon";

grant delete on table "public"."InventoryMovement" to "authenticated";

grant insert on table "public"."InventoryMovement" to "authenticated";

grant references on table "public"."InventoryMovement" to "authenticated";

grant select on table "public"."InventoryMovement" to "authenticated";

grant trigger on table "public"."InventoryMovement" to "authenticated";

grant truncate on table "public"."InventoryMovement" to "authenticated";

grant update on table "public"."InventoryMovement" to "authenticated";

grant delete on table "public"."InventoryMovement" to "service_role";

grant insert on table "public"."InventoryMovement" to "service_role";

grant references on table "public"."InventoryMovement" to "service_role";

grant select on table "public"."InventoryMovement" to "service_role";

grant trigger on table "public"."InventoryMovement" to "service_role";

grant truncate on table "public"."InventoryMovement" to "service_role";

grant update on table "public"."InventoryMovement" to "service_role";

grant delete on table "public"."POSConfig" to "anon";

grant insert on table "public"."POSConfig" to "anon";

grant references on table "public"."POSConfig" to "anon";

grant select on table "public"."POSConfig" to "anon";

grant trigger on table "public"."POSConfig" to "anon";

grant truncate on table "public"."POSConfig" to "anon";

grant update on table "public"."POSConfig" to "anon";

grant delete on table "public"."POSConfig" to "authenticated";

grant insert on table "public"."POSConfig" to "authenticated";

grant references on table "public"."POSConfig" to "authenticated";

grant select on table "public"."POSConfig" to "authenticated";

grant trigger on table "public"."POSConfig" to "authenticated";

grant truncate on table "public"."POSConfig" to "authenticated";

grant update on table "public"."POSConfig" to "authenticated";

grant delete on table "public"."POSConfig" to "service_role";

grant insert on table "public"."POSConfig" to "service_role";

grant references on table "public"."POSConfig" to "service_role";

grant select on table "public"."POSConfig" to "service_role";

grant trigger on table "public"."POSConfig" to "service_role";

grant truncate on table "public"."POSConfig" to "service_role";

grant update on table "public"."POSConfig" to "service_role";

grant delete on table "public"."POSProduct" to "anon";

grant insert on table "public"."POSProduct" to "anon";

grant references on table "public"."POSProduct" to "anon";

grant select on table "public"."POSProduct" to "anon";

grant trigger on table "public"."POSProduct" to "anon";

grant truncate on table "public"."POSProduct" to "anon";

grant update on table "public"."POSProduct" to "anon";

grant delete on table "public"."POSProduct" to "authenticated";

grant insert on table "public"."POSProduct" to "authenticated";

grant references on table "public"."POSProduct" to "authenticated";

grant select on table "public"."POSProduct" to "authenticated";

grant trigger on table "public"."POSProduct" to "authenticated";

grant truncate on table "public"."POSProduct" to "authenticated";

grant update on table "public"."POSProduct" to "authenticated";

grant delete on table "public"."POSProduct" to "service_role";

grant insert on table "public"."POSProduct" to "service_role";

grant references on table "public"."POSProduct" to "service_role";

grant select on table "public"."POSProduct" to "service_role";

grant trigger on table "public"."POSProduct" to "service_role";

grant truncate on table "public"."POSProduct" to "service_role";

grant update on table "public"."POSProduct" to "service_role";

grant delete on table "public"."POSProductCategory" to "anon";

grant insert on table "public"."POSProductCategory" to "anon";

grant references on table "public"."POSProductCategory" to "anon";

grant select on table "public"."POSProductCategory" to "anon";

grant trigger on table "public"."POSProductCategory" to "anon";

grant truncate on table "public"."POSProductCategory" to "anon";

grant update on table "public"."POSProductCategory" to "anon";

grant delete on table "public"."POSProductCategory" to "authenticated";

grant insert on table "public"."POSProductCategory" to "authenticated";

grant references on table "public"."POSProductCategory" to "authenticated";

grant select on table "public"."POSProductCategory" to "authenticated";

grant trigger on table "public"."POSProductCategory" to "authenticated";

grant truncate on table "public"."POSProductCategory" to "authenticated";

grant update on table "public"."POSProductCategory" to "authenticated";

grant delete on table "public"."POSProductCategory" to "service_role";

grant insert on table "public"."POSProductCategory" to "service_role";

grant references on table "public"."POSProductCategory" to "service_role";

grant select on table "public"."POSProductCategory" to "service_role";

grant trigger on table "public"."POSProductCategory" to "service_role";

grant truncate on table "public"."POSProductCategory" to "service_role";

grant update on table "public"."POSProductCategory" to "service_role";

grant delete on table "public"."POSSale" to "anon";

grant insert on table "public"."POSSale" to "anon";

grant references on table "public"."POSSale" to "anon";

grant select on table "public"."POSSale" to "anon";

grant trigger on table "public"."POSSale" to "anon";

grant truncate on table "public"."POSSale" to "anon";

grant update on table "public"."POSSale" to "anon";

grant delete on table "public"."POSSale" to "authenticated";

grant insert on table "public"."POSSale" to "authenticated";

grant references on table "public"."POSSale" to "authenticated";

grant select on table "public"."POSSale" to "authenticated";

grant trigger on table "public"."POSSale" to "authenticated";

grant truncate on table "public"."POSSale" to "authenticated";

grant update on table "public"."POSSale" to "authenticated";

grant delete on table "public"."POSSale" to "service_role";

grant insert on table "public"."POSSale" to "service_role";

grant references on table "public"."POSSale" to "service_role";

grant select on table "public"."POSSale" to "service_role";

grant trigger on table "public"."POSSale" to "service_role";

grant truncate on table "public"."POSSale" to "service_role";

grant update on table "public"."POSSale" to "service_role";

grant delete on table "public"."POSSaleItem" to "anon";

grant insert on table "public"."POSSaleItem" to "anon";

grant references on table "public"."POSSaleItem" to "anon";

grant select on table "public"."POSSaleItem" to "anon";

grant trigger on table "public"."POSSaleItem" to "anon";

grant truncate on table "public"."POSSaleItem" to "anon";

grant update on table "public"."POSSaleItem" to "anon";

grant delete on table "public"."POSSaleItem" to "authenticated";

grant insert on table "public"."POSSaleItem" to "authenticated";

grant references on table "public"."POSSaleItem" to "authenticated";

grant select on table "public"."POSSaleItem" to "authenticated";

grant trigger on table "public"."POSSaleItem" to "authenticated";

grant truncate on table "public"."POSSaleItem" to "authenticated";

grant update on table "public"."POSSaleItem" to "authenticated";

grant delete on table "public"."POSSaleItem" to "service_role";

grant insert on table "public"."POSSaleItem" to "service_role";

grant references on table "public"."POSSaleItem" to "service_role";

grant select on table "public"."POSSaleItem" to "service_role";

grant trigger on table "public"."POSSaleItem" to "service_role";

grant truncate on table "public"."POSSaleItem" to "service_role";

grant update on table "public"."POSSaleItem" to "service_role";

grant delete on table "public"."POSTable" to "anon";

grant insert on table "public"."POSTable" to "anon";

grant references on table "public"."POSTable" to "anon";

grant select on table "public"."POSTable" to "anon";

grant trigger on table "public"."POSTable" to "anon";

grant truncate on table "public"."POSTable" to "anon";

grant update on table "public"."POSTable" to "anon";

grant delete on table "public"."POSTable" to "authenticated";

grant insert on table "public"."POSTable" to "authenticated";

grant references on table "public"."POSTable" to "authenticated";

grant select on table "public"."POSTable" to "authenticated";

grant trigger on table "public"."POSTable" to "authenticated";

grant truncate on table "public"."POSTable" to "authenticated";

grant update on table "public"."POSTable" to "authenticated";

grant delete on table "public"."POSTable" to "service_role";

grant insert on table "public"."POSTable" to "service_role";

grant references on table "public"."POSTable" to "service_role";

grant select on table "public"."POSTable" to "service_role";

grant trigger on table "public"."POSTable" to "service_role";

grant truncate on table "public"."POSTable" to "service_role";

grant update on table "public"."POSTable" to "service_role";

grant delete on table "public"."PettyCashExpense" to "anon";

grant insert on table "public"."PettyCashExpense" to "anon";

grant references on table "public"."PettyCashExpense" to "anon";

grant select on table "public"."PettyCashExpense" to "anon";

grant trigger on table "public"."PettyCashExpense" to "anon";

grant truncate on table "public"."PettyCashExpense" to "anon";

grant update on table "public"."PettyCashExpense" to "anon";

grant delete on table "public"."PettyCashExpense" to "authenticated";

grant insert on table "public"."PettyCashExpense" to "authenticated";

grant references on table "public"."PettyCashExpense" to "authenticated";

grant select on table "public"."PettyCashExpense" to "authenticated";

grant trigger on table "public"."PettyCashExpense" to "authenticated";

grant truncate on table "public"."PettyCashExpense" to "authenticated";

grant update on table "public"."PettyCashExpense" to "authenticated";

grant delete on table "public"."PettyCashExpense" to "service_role";

grant insert on table "public"."PettyCashExpense" to "service_role";

grant references on table "public"."PettyCashExpense" to "service_role";

grant select on table "public"."PettyCashExpense" to "service_role";

grant trigger on table "public"."PettyCashExpense" to "service_role";

grant truncate on table "public"."PettyCashExpense" to "service_role";

grant update on table "public"."PettyCashExpense" to "service_role";

grant delete on table "public"."PettyCashIncome" to "anon";

grant insert on table "public"."PettyCashIncome" to "anon";

grant references on table "public"."PettyCashIncome" to "anon";

grant select on table "public"."PettyCashIncome" to "anon";

grant trigger on table "public"."PettyCashIncome" to "anon";

grant truncate on table "public"."PettyCashIncome" to "anon";

grant update on table "public"."PettyCashIncome" to "anon";

grant delete on table "public"."PettyCashIncome" to "authenticated";

grant insert on table "public"."PettyCashIncome" to "authenticated";

grant references on table "public"."PettyCashIncome" to "authenticated";

grant select on table "public"."PettyCashIncome" to "authenticated";

grant trigger on table "public"."PettyCashIncome" to "authenticated";

grant truncate on table "public"."PettyCashIncome" to "authenticated";

grant update on table "public"."PettyCashIncome" to "authenticated";

grant delete on table "public"."PettyCashIncome" to "service_role";

grant insert on table "public"."PettyCashIncome" to "service_role";

grant references on table "public"."PettyCashIncome" to "service_role";

grant select on table "public"."PettyCashIncome" to "service_role";

grant trigger on table "public"."PettyCashIncome" to "service_role";

grant truncate on table "public"."PettyCashIncome" to "service_role";

grant update on table "public"."PettyCashIncome" to "service_role";

grant delete on table "public"."PettyCashPurchase" to "anon";

grant insert on table "public"."PettyCashPurchase" to "anon";

grant references on table "public"."PettyCashPurchase" to "anon";

grant select on table "public"."PettyCashPurchase" to "anon";

grant trigger on table "public"."PettyCashPurchase" to "anon";

grant truncate on table "public"."PettyCashPurchase" to "anon";

grant update on table "public"."PettyCashPurchase" to "anon";

grant delete on table "public"."PettyCashPurchase" to "authenticated";

grant insert on table "public"."PettyCashPurchase" to "authenticated";

grant references on table "public"."PettyCashPurchase" to "authenticated";

grant select on table "public"."PettyCashPurchase" to "authenticated";

grant trigger on table "public"."PettyCashPurchase" to "authenticated";

grant truncate on table "public"."PettyCashPurchase" to "authenticated";

grant update on table "public"."PettyCashPurchase" to "authenticated";

grant delete on table "public"."PettyCashPurchase" to "service_role";

grant insert on table "public"."PettyCashPurchase" to "service_role";

grant references on table "public"."PettyCashPurchase" to "service_role";

grant select on table "public"."PettyCashPurchase" to "service_role";

grant trigger on table "public"."PettyCashPurchase" to "service_role";

grant truncate on table "public"."PettyCashPurchase" to "service_role";

grant update on table "public"."PettyCashPurchase" to "service_role";

grant delete on table "public"."Product" to "anon";

grant insert on table "public"."Product" to "anon";

grant references on table "public"."Product" to "anon";

grant select on table "public"."Product" to "anon";

grant trigger on table "public"."Product" to "anon";

grant truncate on table "public"."Product" to "anon";

grant update on table "public"."Product" to "anon";

grant delete on table "public"."Product" to "authenticated";

grant insert on table "public"."Product" to "authenticated";

grant references on table "public"."Product" to "authenticated";

grant select on table "public"."Product" to "authenticated";

grant trigger on table "public"."Product" to "authenticated";

grant truncate on table "public"."Product" to "authenticated";

grant update on table "public"."Product" to "authenticated";

grant delete on table "public"."Product" to "service_role";

grant insert on table "public"."Product" to "service_role";

grant references on table "public"."Product" to "service_role";

grant select on table "public"."Product" to "service_role";

grant trigger on table "public"."Product" to "service_role";

grant truncate on table "public"."Product" to "service_role";

grant update on table "public"."Product" to "service_role";

grant delete on table "public"."RelationshipType" to "anon";

grant insert on table "public"."RelationshipType" to "anon";

grant references on table "public"."RelationshipType" to "anon";

grant select on table "public"."RelationshipType" to "anon";

grant trigger on table "public"."RelationshipType" to "anon";

grant truncate on table "public"."RelationshipType" to "anon";

grant update on table "public"."RelationshipType" to "anon";

grant delete on table "public"."RelationshipType" to "authenticated";

grant insert on table "public"."RelationshipType" to "authenticated";

grant references on table "public"."RelationshipType" to "authenticated";

grant select on table "public"."RelationshipType" to "authenticated";

grant trigger on table "public"."RelationshipType" to "authenticated";

grant truncate on table "public"."RelationshipType" to "authenticated";

grant update on table "public"."RelationshipType" to "authenticated";

grant delete on table "public"."RelationshipType" to "service_role";

grant insert on table "public"."RelationshipType" to "service_role";

grant references on table "public"."RelationshipType" to "service_role";

grant select on table "public"."RelationshipType" to "service_role";

grant trigger on table "public"."RelationshipType" to "service_role";

grant truncate on table "public"."RelationshipType" to "service_role";

grant update on table "public"."RelationshipType" to "service_role";

grant delete on table "public"."Role" to "anon";

grant insert on table "public"."Role" to "anon";

grant references on table "public"."Role" to "anon";

grant select on table "public"."Role" to "anon";

grant trigger on table "public"."Role" to "anon";

grant truncate on table "public"."Role" to "anon";

grant update on table "public"."Role" to "anon";

grant delete on table "public"."Role" to "authenticated";

grant insert on table "public"."Role" to "authenticated";

grant references on table "public"."Role" to "authenticated";

grant select on table "public"."Role" to "authenticated";

grant trigger on table "public"."Role" to "authenticated";

grant truncate on table "public"."Role" to "authenticated";

grant update on table "public"."Role" to "authenticated";

grant delete on table "public"."Role" to "service_role";

grant insert on table "public"."Role" to "service_role";

grant references on table "public"."Role" to "service_role";

grant select on table "public"."Role" to "service_role";

grant trigger on table "public"."Role" to "service_role";

grant truncate on table "public"."Role" to "service_role";

grant update on table "public"."Role" to "service_role";

grant delete on table "public"."Supplier" to "anon";

grant insert on table "public"."Supplier" to "anon";

grant references on table "public"."Supplier" to "anon";

grant select on table "public"."Supplier" to "anon";

grant trigger on table "public"."Supplier" to "anon";

grant truncate on table "public"."Supplier" to "anon";

grant update on table "public"."Supplier" to "anon";

grant delete on table "public"."Supplier" to "authenticated";

grant insert on table "public"."Supplier" to "authenticated";

grant references on table "public"."Supplier" to "authenticated";

grant select on table "public"."Supplier" to "authenticated";

grant trigger on table "public"."Supplier" to "authenticated";

grant truncate on table "public"."Supplier" to "authenticated";

grant update on table "public"."Supplier" to "authenticated";

grant delete on table "public"."Supplier" to "service_role";

grant insert on table "public"."Supplier" to "service_role";

grant references on table "public"."Supplier" to "service_role";

grant select on table "public"."Supplier" to "service_role";

grant trigger on table "public"."Supplier" to "service_role";

grant truncate on table "public"."Supplier" to "service_role";

grant update on table "public"."Supplier" to "service_role";

grant delete on table "public"."SupplierContact" to "anon";

grant insert on table "public"."SupplierContact" to "anon";

grant references on table "public"."SupplierContact" to "anon";

grant select on table "public"."SupplierContact" to "anon";

grant trigger on table "public"."SupplierContact" to "anon";

grant truncate on table "public"."SupplierContact" to "anon";

grant update on table "public"."SupplierContact" to "anon";

grant delete on table "public"."SupplierContact" to "authenticated";

grant insert on table "public"."SupplierContact" to "authenticated";

grant references on table "public"."SupplierContact" to "authenticated";

grant select on table "public"."SupplierContact" to "authenticated";

grant trigger on table "public"."SupplierContact" to "authenticated";

grant truncate on table "public"."SupplierContact" to "authenticated";

grant update on table "public"."SupplierContact" to "authenticated";

grant delete on table "public"."SupplierContact" to "service_role";

grant insert on table "public"."SupplierContact" to "service_role";

grant references on table "public"."SupplierContact" to "service_role";

grant select on table "public"."SupplierContact" to "service_role";

grant trigger on table "public"."SupplierContact" to "service_role";

grant truncate on table "public"."SupplierContact" to "service_role";

grant update on table "public"."SupplierContact" to "service_role";

grant delete on table "public"."SupplierPayment" to "anon";

grant insert on table "public"."SupplierPayment" to "anon";

grant references on table "public"."SupplierPayment" to "anon";

grant select on table "public"."SupplierPayment" to "anon";

grant trigger on table "public"."SupplierPayment" to "anon";

grant truncate on table "public"."SupplierPayment" to "anon";

grant update on table "public"."SupplierPayment" to "anon";

grant delete on table "public"."SupplierPayment" to "authenticated";

grant insert on table "public"."SupplierPayment" to "authenticated";

grant references on table "public"."SupplierPayment" to "authenticated";

grant select on table "public"."SupplierPayment" to "authenticated";

grant trigger on table "public"."SupplierPayment" to "authenticated";

grant truncate on table "public"."SupplierPayment" to "authenticated";

grant update on table "public"."SupplierPayment" to "authenticated";

grant delete on table "public"."SupplierPayment" to "service_role";

grant insert on table "public"."SupplierPayment" to "service_role";

grant references on table "public"."SupplierPayment" to "service_role";

grant select on table "public"."SupplierPayment" to "service_role";

grant trigger on table "public"."SupplierPayment" to "service_role";

grant truncate on table "public"."SupplierPayment" to "service_role";

grant update on table "public"."SupplierPayment" to "service_role";

grant delete on table "public"."SupplierTag" to "anon";

grant insert on table "public"."SupplierTag" to "anon";

grant references on table "public"."SupplierTag" to "anon";

grant select on table "public"."SupplierTag" to "anon";

grant trigger on table "public"."SupplierTag" to "anon";

grant truncate on table "public"."SupplierTag" to "anon";

grant update on table "public"."SupplierTag" to "anon";

grant delete on table "public"."SupplierTag" to "authenticated";

grant insert on table "public"."SupplierTag" to "authenticated";

grant references on table "public"."SupplierTag" to "authenticated";

grant select on table "public"."SupplierTag" to "authenticated";

grant trigger on table "public"."SupplierTag" to "authenticated";

grant truncate on table "public"."SupplierTag" to "authenticated";

grant update on table "public"."SupplierTag" to "authenticated";

grant delete on table "public"."SupplierTag" to "service_role";

grant insert on table "public"."SupplierTag" to "service_role";

grant references on table "public"."SupplierTag" to "service_role";

grant select on table "public"."SupplierTag" to "service_role";

grant trigger on table "public"."SupplierTag" to "service_role";

grant truncate on table "public"."SupplierTag" to "service_role";

grant update on table "public"."SupplierTag" to "service_role";

grant delete on table "public"."SupplierTagAssignment" to "anon";

grant insert on table "public"."SupplierTagAssignment" to "anon";

grant references on table "public"."SupplierTagAssignment" to "anon";

grant select on table "public"."SupplierTagAssignment" to "anon";

grant trigger on table "public"."SupplierTagAssignment" to "anon";

grant truncate on table "public"."SupplierTagAssignment" to "anon";

grant update on table "public"."SupplierTagAssignment" to "anon";

grant delete on table "public"."SupplierTagAssignment" to "authenticated";

grant insert on table "public"."SupplierTagAssignment" to "authenticated";

grant references on table "public"."SupplierTagAssignment" to "authenticated";

grant select on table "public"."SupplierTagAssignment" to "authenticated";

grant trigger on table "public"."SupplierTagAssignment" to "authenticated";

grant truncate on table "public"."SupplierTagAssignment" to "authenticated";

grant update on table "public"."SupplierTagAssignment" to "authenticated";

grant delete on table "public"."SupplierTagAssignment" to "service_role";

grant insert on table "public"."SupplierTagAssignment" to "service_role";

grant references on table "public"."SupplierTagAssignment" to "service_role";

grant select on table "public"."SupplierTagAssignment" to "service_role";

grant trigger on table "public"."SupplierTagAssignment" to "service_role";

grant truncate on table "public"."SupplierTagAssignment" to "service_role";

grant update on table "public"."SupplierTagAssignment" to "service_role";

grant delete on table "public"."User" to "anon";

grant insert on table "public"."User" to "anon";

grant references on table "public"."User" to "anon";

grant select on table "public"."User" to "anon";

grant trigger on table "public"."User" to "anon";

grant truncate on table "public"."User" to "anon";

grant update on table "public"."User" to "anon";

grant delete on table "public"."User" to "authenticated";

grant insert on table "public"."User" to "authenticated";

grant references on table "public"."User" to "authenticated";

grant select on table "public"."User" to "authenticated";

grant trigger on table "public"."User" to "authenticated";

grant truncate on table "public"."User" to "authenticated";

grant update on table "public"."User" to "authenticated";

grant delete on table "public"."User" to "service_role";

grant insert on table "public"."User" to "service_role";

grant references on table "public"."User" to "service_role";

grant select on table "public"."User" to "service_role";

grant trigger on table "public"."User" to "service_role";

grant truncate on table "public"."User" to "service_role";

grant update on table "public"."User" to "service_role";

grant delete on table "public"."Warehouse" to "anon";

grant insert on table "public"."Warehouse" to "anon";

grant references on table "public"."Warehouse" to "anon";

grant select on table "public"."Warehouse" to "anon";

grant trigger on table "public"."Warehouse" to "anon";

grant truncate on table "public"."Warehouse" to "anon";

grant update on table "public"."Warehouse" to "anon";

grant delete on table "public"."Warehouse" to "authenticated";

grant insert on table "public"."Warehouse" to "authenticated";

grant references on table "public"."Warehouse" to "authenticated";

grant select on table "public"."Warehouse" to "authenticated";

grant trigger on table "public"."Warehouse" to "authenticated";

grant truncate on table "public"."Warehouse" to "authenticated";

grant update on table "public"."Warehouse" to "authenticated";

grant delete on table "public"."Warehouse" to "service_role";

grant insert on table "public"."Warehouse" to "service_role";

grant references on table "public"."Warehouse" to "service_role";

grant select on table "public"."Warehouse" to "service_role";

grant trigger on table "public"."Warehouse" to "service_role";

grant truncate on table "public"."Warehouse" to "service_role";

grant update on table "public"."Warehouse" to "service_role";

grant delete on table "public"."Warehouse_Product" to "anon";

grant insert on table "public"."Warehouse_Product" to "anon";

grant references on table "public"."Warehouse_Product" to "anon";

grant select on table "public"."Warehouse_Product" to "anon";

grant trigger on table "public"."Warehouse_Product" to "anon";

grant truncate on table "public"."Warehouse_Product" to "anon";

grant update on table "public"."Warehouse_Product" to "anon";

grant delete on table "public"."Warehouse_Product" to "authenticated";

grant insert on table "public"."Warehouse_Product" to "authenticated";

grant references on table "public"."Warehouse_Product" to "authenticated";

grant select on table "public"."Warehouse_Product" to "authenticated";

grant trigger on table "public"."Warehouse_Product" to "authenticated";

grant truncate on table "public"."Warehouse_Product" to "authenticated";

grant update on table "public"."Warehouse_Product" to "authenticated";

grant delete on table "public"."Warehouse_Product" to "service_role";

grant insert on table "public"."Warehouse_Product" to "service_role";

grant references on table "public"."Warehouse_Product" to "service_role";

grant select on table "public"."Warehouse_Product" to "service_role";

grant trigger on table "public"."Warehouse_Product" to "service_role";

grant truncate on table "public"."Warehouse_Product" to "service_role";

grant update on table "public"."Warehouse_Product" to "service_role";

grant delete on table "public"."age_pricing_modular" to "anon";

grant insert on table "public"."age_pricing_modular" to "anon";

grant references on table "public"."age_pricing_modular" to "anon";

grant select on table "public"."age_pricing_modular" to "anon";

grant trigger on table "public"."age_pricing_modular" to "anon";

grant truncate on table "public"."age_pricing_modular" to "anon";

grant update on table "public"."age_pricing_modular" to "anon";

grant delete on table "public"."age_pricing_modular" to "authenticated";

grant insert on table "public"."age_pricing_modular" to "authenticated";

grant references on table "public"."age_pricing_modular" to "authenticated";

grant select on table "public"."age_pricing_modular" to "authenticated";

grant trigger on table "public"."age_pricing_modular" to "authenticated";

grant truncate on table "public"."age_pricing_modular" to "authenticated";

grant update on table "public"."age_pricing_modular" to "authenticated";

grant delete on table "public"."age_pricing_modular" to "service_role";

grant insert on table "public"."age_pricing_modular" to "service_role";

grant references on table "public"."age_pricing_modular" to "service_role";

grant select on table "public"."age_pricing_modular" to "service_role";

grant trigger on table "public"."age_pricing_modular" to "service_role";

grant truncate on table "public"."age_pricing_modular" to "service_role";

grant update on table "public"."age_pricing_modular" to "service_role";

grant delete on table "public"."companies" to "anon";

grant insert on table "public"."companies" to "anon";

grant references on table "public"."companies" to "anon";

grant select on table "public"."companies" to "anon";

grant trigger on table "public"."companies" to "anon";

grant truncate on table "public"."companies" to "anon";

grant update on table "public"."companies" to "anon";

grant delete on table "public"."companies" to "authenticated";

grant insert on table "public"."companies" to "authenticated";

grant references on table "public"."companies" to "authenticated";

grant select on table "public"."companies" to "authenticated";

grant trigger on table "public"."companies" to "authenticated";

grant truncate on table "public"."companies" to "authenticated";

grant update on table "public"."companies" to "authenticated";

grant delete on table "public"."companies" to "service_role";

grant insert on table "public"."companies" to "service_role";

grant references on table "public"."companies" to "service_role";

grant select on table "public"."companies" to "service_role";

grant trigger on table "public"."companies" to "service_role";

grant truncate on table "public"."companies" to "service_role";

grant update on table "public"."companies" to "service_role";

grant delete on table "public"."company_contacts" to "anon";

grant insert on table "public"."company_contacts" to "anon";

grant references on table "public"."company_contacts" to "anon";

grant select on table "public"."company_contacts" to "anon";

grant trigger on table "public"."company_contacts" to "anon";

grant truncate on table "public"."company_contacts" to "anon";

grant update on table "public"."company_contacts" to "anon";

grant delete on table "public"."company_contacts" to "authenticated";

grant insert on table "public"."company_contacts" to "authenticated";

grant references on table "public"."company_contacts" to "authenticated";

grant select on table "public"."company_contacts" to "authenticated";

grant trigger on table "public"."company_contacts" to "authenticated";

grant truncate on table "public"."company_contacts" to "authenticated";

grant update on table "public"."company_contacts" to "authenticated";

grant delete on table "public"."company_contacts" to "service_role";

grant insert on table "public"."company_contacts" to "service_role";

grant references on table "public"."company_contacts" to "service_role";

grant select on table "public"."company_contacts" to "service_role";

grant trigger on table "public"."company_contacts" to "service_role";

grant truncate on table "public"."company_contacts" to "service_role";

grant update on table "public"."company_contacts" to "service_role";

grant delete on table "public"."invoice_lines" to "anon";

grant insert on table "public"."invoice_lines" to "anon";

grant references on table "public"."invoice_lines" to "anon";

grant select on table "public"."invoice_lines" to "anon";

grant trigger on table "public"."invoice_lines" to "anon";

grant truncate on table "public"."invoice_lines" to "anon";

grant update on table "public"."invoice_lines" to "anon";

grant delete on table "public"."invoice_lines" to "authenticated";

grant insert on table "public"."invoice_lines" to "authenticated";

grant references on table "public"."invoice_lines" to "authenticated";

grant select on table "public"."invoice_lines" to "authenticated";

grant trigger on table "public"."invoice_lines" to "authenticated";

grant truncate on table "public"."invoice_lines" to "authenticated";

grant update on table "public"."invoice_lines" to "authenticated";

grant delete on table "public"."invoice_lines" to "service_role";

grant insert on table "public"."invoice_lines" to "service_role";

grant references on table "public"."invoice_lines" to "service_role";

grant select on table "public"."invoice_lines" to "service_role";

grant trigger on table "public"."invoice_lines" to "service_role";

grant truncate on table "public"."invoice_lines" to "service_role";

grant update on table "public"."invoice_lines" to "service_role";

grant delete on table "public"."invoice_payments" to "anon";

grant insert on table "public"."invoice_payments" to "anon";

grant references on table "public"."invoice_payments" to "anon";

grant select on table "public"."invoice_payments" to "anon";

grant trigger on table "public"."invoice_payments" to "anon";

grant truncate on table "public"."invoice_payments" to "anon";

grant update on table "public"."invoice_payments" to "anon";

grant delete on table "public"."invoice_payments" to "authenticated";

grant insert on table "public"."invoice_payments" to "authenticated";

grant references on table "public"."invoice_payments" to "authenticated";

grant select on table "public"."invoice_payments" to "authenticated";

grant trigger on table "public"."invoice_payments" to "authenticated";

grant truncate on table "public"."invoice_payments" to "authenticated";

grant update on table "public"."invoice_payments" to "authenticated";

grant delete on table "public"."invoice_payments" to "service_role";

grant insert on table "public"."invoice_payments" to "service_role";

grant references on table "public"."invoice_payments" to "service_role";

grant select on table "public"."invoice_payments" to "service_role";

grant trigger on table "public"."invoice_payments" to "service_role";

grant truncate on table "public"."invoice_payments" to "service_role";

grant update on table "public"."invoice_payments" to "service_role";

grant delete on table "public"."invoices" to "anon";

grant insert on table "public"."invoices" to "anon";

grant references on table "public"."invoices" to "anon";

grant select on table "public"."invoices" to "anon";

grant trigger on table "public"."invoices" to "anon";

grant truncate on table "public"."invoices" to "anon";

grant update on table "public"."invoices" to "anon";

grant delete on table "public"."invoices" to "authenticated";

grant insert on table "public"."invoices" to "authenticated";

grant references on table "public"."invoices" to "authenticated";

grant select on table "public"."invoices" to "authenticated";

grant trigger on table "public"."invoices" to "authenticated";

grant truncate on table "public"."invoices" to "authenticated";

grant update on table "public"."invoices" to "authenticated";

grant delete on table "public"."invoices" to "service_role";

grant insert on table "public"."invoices" to "service_role";

grant references on table "public"."invoices" to "service_role";

grant select on table "public"."invoices" to "service_role";

grant trigger on table "public"."invoices" to "service_role";

grant truncate on table "public"."invoices" to "service_role";

grant update on table "public"."invoices" to "service_role";

grant delete on table "public"."modular_reservations" to "anon";

grant insert on table "public"."modular_reservations" to "anon";

grant references on table "public"."modular_reservations" to "anon";

grant select on table "public"."modular_reservations" to "anon";

grant trigger on table "public"."modular_reservations" to "anon";

grant truncate on table "public"."modular_reservations" to "anon";

grant update on table "public"."modular_reservations" to "anon";

grant delete on table "public"."modular_reservations" to "authenticated";

grant insert on table "public"."modular_reservations" to "authenticated";

grant references on table "public"."modular_reservations" to "authenticated";

grant select on table "public"."modular_reservations" to "authenticated";

grant trigger on table "public"."modular_reservations" to "authenticated";

grant truncate on table "public"."modular_reservations" to "authenticated";

grant update on table "public"."modular_reservations" to "authenticated";

grant delete on table "public"."modular_reservations" to "service_role";

grant insert on table "public"."modular_reservations" to "service_role";

grant references on table "public"."modular_reservations" to "service_role";

grant select on table "public"."modular_reservations" to "service_role";

grant trigger on table "public"."modular_reservations" to "service_role";

grant truncate on table "public"."modular_reservations" to "service_role";

grant update on table "public"."modular_reservations" to "service_role";

grant delete on table "public"."package_products_modular" to "anon";

grant insert on table "public"."package_products_modular" to "anon";

grant references on table "public"."package_products_modular" to "anon";

grant select on table "public"."package_products_modular" to "anon";

grant trigger on table "public"."package_products_modular" to "anon";

grant truncate on table "public"."package_products_modular" to "anon";

grant update on table "public"."package_products_modular" to "anon";

grant delete on table "public"."package_products_modular" to "authenticated";

grant insert on table "public"."package_products_modular" to "authenticated";

grant references on table "public"."package_products_modular" to "authenticated";

grant select on table "public"."package_products_modular" to "authenticated";

grant trigger on table "public"."package_products_modular" to "authenticated";

grant truncate on table "public"."package_products_modular" to "authenticated";

grant update on table "public"."package_products_modular" to "authenticated";

grant delete on table "public"."package_products_modular" to "service_role";

grant insert on table "public"."package_products_modular" to "service_role";

grant references on table "public"."package_products_modular" to "service_role";

grant select on table "public"."package_products_modular" to "service_role";

grant trigger on table "public"."package_products_modular" to "service_role";

grant truncate on table "public"."package_products_modular" to "service_role";

grant update on table "public"."package_products_modular" to "service_role";

grant delete on table "public"."packages_modular" to "anon";

grant insert on table "public"."packages_modular" to "anon";

grant references on table "public"."packages_modular" to "anon";

grant select on table "public"."packages_modular" to "anon";

grant trigger on table "public"."packages_modular" to "anon";

grant truncate on table "public"."packages_modular" to "anon";

grant update on table "public"."packages_modular" to "anon";

grant delete on table "public"."packages_modular" to "authenticated";

grant insert on table "public"."packages_modular" to "authenticated";

grant references on table "public"."packages_modular" to "authenticated";

grant select on table "public"."packages_modular" to "authenticated";

grant trigger on table "public"."packages_modular" to "authenticated";

grant truncate on table "public"."packages_modular" to "authenticated";

grant update on table "public"."packages_modular" to "authenticated";

grant delete on table "public"."packages_modular" to "service_role";

grant insert on table "public"."packages_modular" to "service_role";

grant references on table "public"."packages_modular" to "service_role";

grant select on table "public"."packages_modular" to "service_role";

grant trigger on table "public"."packages_modular" to "service_role";

grant truncate on table "public"."packages_modular" to "service_role";

grant update on table "public"."packages_modular" to "service_role";

grant delete on table "public"."payments" to "anon";

grant insert on table "public"."payments" to "anon";

grant references on table "public"."payments" to "anon";

grant select on table "public"."payments" to "anon";

grant trigger on table "public"."payments" to "anon";

grant truncate on table "public"."payments" to "anon";

grant update on table "public"."payments" to "anon";

grant delete on table "public"."payments" to "authenticated";

grant insert on table "public"."payments" to "authenticated";

grant references on table "public"."payments" to "authenticated";

grant select on table "public"."payments" to "authenticated";

grant trigger on table "public"."payments" to "authenticated";

grant truncate on table "public"."payments" to "authenticated";

grant update on table "public"."payments" to "authenticated";

grant delete on table "public"."payments" to "service_role";

grant insert on table "public"."payments" to "service_role";

grant references on table "public"."payments" to "service_role";

grant select on table "public"."payments" to "service_role";

grant trigger on table "public"."payments" to "service_role";

grant truncate on table "public"."payments" to "service_role";

grant update on table "public"."payments" to "service_role";

grant delete on table "public"."product_components" to "anon";

grant insert on table "public"."product_components" to "anon";

grant references on table "public"."product_components" to "anon";

grant select on table "public"."product_components" to "anon";

grant trigger on table "public"."product_components" to "anon";

grant truncate on table "public"."product_components" to "anon";

grant update on table "public"."product_components" to "anon";

grant delete on table "public"."product_components" to "authenticated";

grant insert on table "public"."product_components" to "authenticated";

grant references on table "public"."product_components" to "authenticated";

grant select on table "public"."product_components" to "authenticated";

grant trigger on table "public"."product_components" to "authenticated";

grant truncate on table "public"."product_components" to "authenticated";

grant update on table "public"."product_components" to "authenticated";

grant delete on table "public"."product_components" to "service_role";

grant insert on table "public"."product_components" to "service_role";

grant references on table "public"."product_components" to "service_role";

grant select on table "public"."product_components" to "service_role";

grant trigger on table "public"."product_components" to "service_role";

grant truncate on table "public"."product_components" to "service_role";

grant update on table "public"."product_components" to "service_role";

grant delete on table "public"."product_package_linkage" to "anon";

grant insert on table "public"."product_package_linkage" to "anon";

grant references on table "public"."product_package_linkage" to "anon";

grant select on table "public"."product_package_linkage" to "anon";

grant trigger on table "public"."product_package_linkage" to "anon";

grant truncate on table "public"."product_package_linkage" to "anon";

grant update on table "public"."product_package_linkage" to "anon";

grant delete on table "public"."product_package_linkage" to "authenticated";

grant insert on table "public"."product_package_linkage" to "authenticated";

grant references on table "public"."product_package_linkage" to "authenticated";

grant select on table "public"."product_package_linkage" to "authenticated";

grant trigger on table "public"."product_package_linkage" to "authenticated";

grant truncate on table "public"."product_package_linkage" to "authenticated";

grant update on table "public"."product_package_linkage" to "authenticated";

grant delete on table "public"."product_package_linkage" to "service_role";

grant insert on table "public"."product_package_linkage" to "service_role";

grant references on table "public"."product_package_linkage" to "service_role";

grant select on table "public"."product_package_linkage" to "service_role";

grant trigger on table "public"."product_package_linkage" to "service_role";

grant truncate on table "public"."product_package_linkage" to "service_role";

grant update on table "public"."product_package_linkage" to "service_role";

grant delete on table "public"."product_sales_tracking" to "anon";

grant insert on table "public"."product_sales_tracking" to "anon";

grant references on table "public"."product_sales_tracking" to "anon";

grant select on table "public"."product_sales_tracking" to "anon";

grant trigger on table "public"."product_sales_tracking" to "anon";

grant truncate on table "public"."product_sales_tracking" to "anon";

grant update on table "public"."product_sales_tracking" to "anon";

grant delete on table "public"."product_sales_tracking" to "authenticated";

grant insert on table "public"."product_sales_tracking" to "authenticated";

grant references on table "public"."product_sales_tracking" to "authenticated";

grant select on table "public"."product_sales_tracking" to "authenticated";

grant trigger on table "public"."product_sales_tracking" to "authenticated";

grant truncate on table "public"."product_sales_tracking" to "authenticated";

grant update on table "public"."product_sales_tracking" to "authenticated";

grant delete on table "public"."product_sales_tracking" to "service_role";

grant insert on table "public"."product_sales_tracking" to "service_role";

grant references on table "public"."product_sales_tracking" to "service_role";

grant select on table "public"."product_sales_tracking" to "service_role";

grant trigger on table "public"."product_sales_tracking" to "service_role";

grant truncate on table "public"."product_sales_tracking" to "service_role";

grant update on table "public"."product_sales_tracking" to "service_role";

grant delete on table "public"."products_modular" to "anon";

grant insert on table "public"."products_modular" to "anon";

grant references on table "public"."products_modular" to "anon";

grant select on table "public"."products_modular" to "anon";

grant trigger on table "public"."products_modular" to "anon";

grant truncate on table "public"."products_modular" to "anon";

grant update on table "public"."products_modular" to "anon";

grant delete on table "public"."products_modular" to "authenticated";

grant insert on table "public"."products_modular" to "authenticated";

grant references on table "public"."products_modular" to "authenticated";

grant select on table "public"."products_modular" to "authenticated";

grant trigger on table "public"."products_modular" to "authenticated";

grant truncate on table "public"."products_modular" to "authenticated";

grant update on table "public"."products_modular" to "authenticated";

grant delete on table "public"."products_modular" to "service_role";

grant insert on table "public"."products_modular" to "service_role";

grant references on table "public"."products_modular" to "service_role";

grant select on table "public"."products_modular" to "service_role";

grant trigger on table "public"."products_modular" to "service_role";

grant truncate on table "public"."products_modular" to "service_role";

grant update on table "public"."products_modular" to "service_role";

grant delete on table "public"."reservation_comments" to "anon";

grant insert on table "public"."reservation_comments" to "anon";

grant references on table "public"."reservation_comments" to "anon";

grant select on table "public"."reservation_comments" to "anon";

grant trigger on table "public"."reservation_comments" to "anon";

grant truncate on table "public"."reservation_comments" to "anon";

grant update on table "public"."reservation_comments" to "anon";

grant delete on table "public"."reservation_comments" to "authenticated";

grant insert on table "public"."reservation_comments" to "authenticated";

grant references on table "public"."reservation_comments" to "authenticated";

grant select on table "public"."reservation_comments" to "authenticated";

grant trigger on table "public"."reservation_comments" to "authenticated";

grant truncate on table "public"."reservation_comments" to "authenticated";

grant update on table "public"."reservation_comments" to "authenticated";

grant delete on table "public"."reservation_comments" to "service_role";

grant insert on table "public"."reservation_comments" to "service_role";

grant references on table "public"."reservation_comments" to "service_role";

grant select on table "public"."reservation_comments" to "service_role";

grant trigger on table "public"."reservation_comments" to "service_role";

grant truncate on table "public"."reservation_comments" to "service_role";

grant update on table "public"."reservation_comments" to "service_role";

grant delete on table "public"."reservation_payments" to "anon";

grant insert on table "public"."reservation_payments" to "anon";

grant references on table "public"."reservation_payments" to "anon";

grant select on table "public"."reservation_payments" to "anon";

grant trigger on table "public"."reservation_payments" to "anon";

grant truncate on table "public"."reservation_payments" to "anon";

grant update on table "public"."reservation_payments" to "anon";

grant delete on table "public"."reservation_payments" to "authenticated";

grant insert on table "public"."reservation_payments" to "authenticated";

grant references on table "public"."reservation_payments" to "authenticated";

grant select on table "public"."reservation_payments" to "authenticated";

grant trigger on table "public"."reservation_payments" to "authenticated";

grant truncate on table "public"."reservation_payments" to "authenticated";

grant update on table "public"."reservation_payments" to "authenticated";

grant delete on table "public"."reservation_payments" to "service_role";

grant insert on table "public"."reservation_payments" to "service_role";

grant references on table "public"."reservation_payments" to "service_role";

grant select on table "public"."reservation_payments" to "service_role";

grant trigger on table "public"."reservation_payments" to "service_role";

grant truncate on table "public"."reservation_payments" to "service_role";

grant update on table "public"."reservation_payments" to "service_role";

grant delete on table "public"."reservation_products" to "anon";

grant insert on table "public"."reservation_products" to "anon";

grant references on table "public"."reservation_products" to "anon";

grant select on table "public"."reservation_products" to "anon";

grant trigger on table "public"."reservation_products" to "anon";

grant truncate on table "public"."reservation_products" to "anon";

grant update on table "public"."reservation_products" to "anon";

grant delete on table "public"."reservation_products" to "authenticated";

grant insert on table "public"."reservation_products" to "authenticated";

grant references on table "public"."reservation_products" to "authenticated";

grant select on table "public"."reservation_products" to "authenticated";

grant trigger on table "public"."reservation_products" to "authenticated";

grant truncate on table "public"."reservation_products" to "authenticated";

grant update on table "public"."reservation_products" to "authenticated";

grant delete on table "public"."reservation_products" to "service_role";

grant insert on table "public"."reservation_products" to "service_role";

grant references on table "public"."reservation_products" to "service_role";

grant select on table "public"."reservation_products" to "service_role";

grant trigger on table "public"."reservation_products" to "service_role";

grant truncate on table "public"."reservation_products" to "service_role";

grant update on table "public"."reservation_products" to "service_role";

grant delete on table "public"."reservations" to "anon";

grant insert on table "public"."reservations" to "anon";

grant references on table "public"."reservations" to "anon";

grant select on table "public"."reservations" to "anon";

grant trigger on table "public"."reservations" to "anon";

grant truncate on table "public"."reservations" to "anon";

grant update on table "public"."reservations" to "anon";

grant delete on table "public"."reservations" to "authenticated";

grant insert on table "public"."reservations" to "authenticated";

grant references on table "public"."reservations" to "authenticated";

grant select on table "public"."reservations" to "authenticated";

grant trigger on table "public"."reservations" to "authenticated";

grant truncate on table "public"."reservations" to "authenticated";

grant update on table "public"."reservations" to "authenticated";

grant delete on table "public"."reservations" to "service_role";

grant insert on table "public"."reservations" to "service_role";

grant references on table "public"."reservations" to "service_role";

grant select on table "public"."reservations" to "service_role";

grant trigger on table "public"."reservations" to "service_role";

grant truncate on table "public"."reservations" to "service_role";

grant update on table "public"."reservations" to "service_role";

grant delete on table "public"."rooms" to "anon";

grant insert on table "public"."rooms" to "anon";

grant references on table "public"."rooms" to "anon";

grant select on table "public"."rooms" to "anon";

grant trigger on table "public"."rooms" to "anon";

grant truncate on table "public"."rooms" to "anon";

grant update on table "public"."rooms" to "anon";

grant delete on table "public"."rooms" to "authenticated";

grant insert on table "public"."rooms" to "authenticated";

grant references on table "public"."rooms" to "authenticated";

grant select on table "public"."rooms" to "authenticated";

grant trigger on table "public"."rooms" to "authenticated";

grant truncate on table "public"."rooms" to "authenticated";

grant update on table "public"."rooms" to "authenticated";

grant delete on table "public"."rooms" to "service_role";

grant insert on table "public"."rooms" to "service_role";

grant references on table "public"."rooms" to "service_role";

grant select on table "public"."rooms" to "service_role";

grant trigger on table "public"."rooms" to "service_role";

grant truncate on table "public"."rooms" to "service_role";

grant update on table "public"."rooms" to "service_role";

grant delete on table "public"."sales_quote_lines" to "anon";

grant insert on table "public"."sales_quote_lines" to "anon";

grant references on table "public"."sales_quote_lines" to "anon";

grant select on table "public"."sales_quote_lines" to "anon";

grant trigger on table "public"."sales_quote_lines" to "anon";

grant truncate on table "public"."sales_quote_lines" to "anon";

grant update on table "public"."sales_quote_lines" to "anon";

grant delete on table "public"."sales_quote_lines" to "authenticated";

grant insert on table "public"."sales_quote_lines" to "authenticated";

grant references on table "public"."sales_quote_lines" to "authenticated";

grant select on table "public"."sales_quote_lines" to "authenticated";

grant trigger on table "public"."sales_quote_lines" to "authenticated";

grant truncate on table "public"."sales_quote_lines" to "authenticated";

grant update on table "public"."sales_quote_lines" to "authenticated";

grant delete on table "public"."sales_quote_lines" to "service_role";

grant insert on table "public"."sales_quote_lines" to "service_role";

grant references on table "public"."sales_quote_lines" to "service_role";

grant select on table "public"."sales_quote_lines" to "service_role";

grant trigger on table "public"."sales_quote_lines" to "service_role";

grant truncate on table "public"."sales_quote_lines" to "service_role";

grant update on table "public"."sales_quote_lines" to "service_role";

grant delete on table "public"."sales_quotes" to "anon";

grant insert on table "public"."sales_quotes" to "anon";

grant references on table "public"."sales_quotes" to "anon";

grant select on table "public"."sales_quotes" to "anon";

grant trigger on table "public"."sales_quotes" to "anon";

grant truncate on table "public"."sales_quotes" to "anon";

grant update on table "public"."sales_quotes" to "anon";

grant delete on table "public"."sales_quotes" to "authenticated";

grant insert on table "public"."sales_quotes" to "authenticated";

grant references on table "public"."sales_quotes" to "authenticated";

grant select on table "public"."sales_quotes" to "authenticated";

grant trigger on table "public"."sales_quotes" to "authenticated";

grant truncate on table "public"."sales_quotes" to "authenticated";

grant update on table "public"."sales_quotes" to "authenticated";

grant delete on table "public"."sales_quotes" to "service_role";

grant insert on table "public"."sales_quotes" to "service_role";

grant references on table "public"."sales_quotes" to "service_role";

grant select on table "public"."sales_quotes" to "service_role";

grant trigger on table "public"."sales_quotes" to "service_role";

grant truncate on table "public"."sales_quotes" to "service_role";

grant update on table "public"."sales_quotes" to "service_role";

grant delete on table "public"."sales_tracking" to "anon";

grant insert on table "public"."sales_tracking" to "anon";

grant references on table "public"."sales_tracking" to "anon";

grant select on table "public"."sales_tracking" to "anon";

grant trigger on table "public"."sales_tracking" to "anon";

grant truncate on table "public"."sales_tracking" to "anon";

grant update on table "public"."sales_tracking" to "anon";

grant delete on table "public"."sales_tracking" to "authenticated";

grant insert on table "public"."sales_tracking" to "authenticated";

grant references on table "public"."sales_tracking" to "authenticated";

grant select on table "public"."sales_tracking" to "authenticated";

grant trigger on table "public"."sales_tracking" to "authenticated";

grant truncate on table "public"."sales_tracking" to "authenticated";

grant update on table "public"."sales_tracking" to "authenticated";

grant delete on table "public"."sales_tracking" to "service_role";

grant insert on table "public"."sales_tracking" to "service_role";

grant references on table "public"."sales_tracking" to "service_role";

grant select on table "public"."sales_tracking" to "service_role";

grant trigger on table "public"."sales_tracking" to "service_role";

grant truncate on table "public"."sales_tracking" to "service_role";

grant update on table "public"."sales_tracking" to "service_role";

grant delete on table "public"."season_configurations" to "anon";

grant insert on table "public"."season_configurations" to "anon";

grant references on table "public"."season_configurations" to "anon";

grant select on table "public"."season_configurations" to "anon";

grant trigger on table "public"."season_configurations" to "anon";

grant truncate on table "public"."season_configurations" to "anon";

grant update on table "public"."season_configurations" to "anon";

grant delete on table "public"."season_configurations" to "authenticated";

grant insert on table "public"."season_configurations" to "authenticated";

grant references on table "public"."season_configurations" to "authenticated";

grant select on table "public"."season_configurations" to "authenticated";

grant trigger on table "public"."season_configurations" to "authenticated";

grant truncate on table "public"."season_configurations" to "authenticated";

grant update on table "public"."season_configurations" to "authenticated";

grant delete on table "public"."season_configurations" to "service_role";

grant insert on table "public"."season_configurations" to "service_role";

grant references on table "public"."season_configurations" to "service_role";

grant select on table "public"."season_configurations" to "service_role";

grant trigger on table "public"."season_configurations" to "service_role";

grant truncate on table "public"."season_configurations" to "service_role";

grant update on table "public"."season_configurations" to "service_role";

grant delete on table "public"."spa_products" to "anon";

grant insert on table "public"."spa_products" to "anon";

grant references on table "public"."spa_products" to "anon";

grant select on table "public"."spa_products" to "anon";

grant trigger on table "public"."spa_products" to "anon";

grant truncate on table "public"."spa_products" to "anon";

grant update on table "public"."spa_products" to "anon";

grant delete on table "public"."spa_products" to "authenticated";

grant insert on table "public"."spa_products" to "authenticated";

grant references on table "public"."spa_products" to "authenticated";

grant select on table "public"."spa_products" to "authenticated";

grant trigger on table "public"."spa_products" to "authenticated";

grant truncate on table "public"."spa_products" to "authenticated";

grant update on table "public"."spa_products" to "authenticated";

grant delete on table "public"."spa_products" to "service_role";

grant insert on table "public"."spa_products" to "service_role";

grant references on table "public"."spa_products" to "service_role";

grant select on table "public"."spa_products" to "service_role";

grant trigger on table "public"."spa_products" to "service_role";

grant truncate on table "public"."spa_products" to "service_role";

grant update on table "public"."spa_products" to "service_role";

create policy "Enable delete for admins"
on "public"."CashSession"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM ("User" u
     JOIN "Role" r ON ((u."roleId" = r.id)))
  WHERE ((u.id = auth.uid()) AND (r."roleName" = ANY (ARRAY['SUPER_USER'::text, 'ADMINISTRADOR'::text]))))));


create policy "Enable insert for authenticated users"
on "public"."CashSession"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for authenticated users"
on "public"."CashSession"
as permissive
for select
to authenticated
using (true);


create policy "Enable update for authenticated users"
on "public"."CashSession"
as permissive
for update
to authenticated
using (true)
with check (true);


create policy "Authenticated users can do everything on Category"
on "public"."Category"
as permissive
for all
to authenticated
using (true)
with check (true);


create policy "Enable all access for service role"
on "public"."Category"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Enable delete for authenticated users"
on "public"."Category"
as permissive
for delete
to public
using ((auth.role() = 'authenticated'::text));


create policy "Enable insert for authenticated users"
on "public"."Category"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "Enable read access for authenticated users"
on "public"."Category"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


create policy "Enable update for authenticated users"
on "public"."Category"
as permissive
for update
to public
using ((auth.role() = 'authenticated'::text));


create policy "Service role can do everything on Category"
on "public"."Category"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "Enable all for service role"
on "public"."Client"
as permissive
for all
to public
using (true);


create policy "Enable all for service role"
on "public"."ClientContact"
as permissive
for all
to public
using (true);


create policy "Enable all for service role"
on "public"."ClientTag"
as permissive
for all
to public
using (true);


create policy "Enable all for service role"
on "public"."ClientTagAssignment"
as permissive
for all
to public
using (true);


create policy "Enable all for service role"
on "public"."Country"
as permissive
for all
to public
using (true);


create policy "Enable all for service role"
on "public"."EconomicSector"
as permissive
for all
to public
using (true);


create policy "inventory_movement_delete_policy"
on "public"."InventoryMovement"
as permissive
for delete
to authenticated
using (true);


create policy "inventory_movement_insert_policy"
on "public"."InventoryMovement"
as permissive
for insert
to authenticated
with check (true);


create policy "inventory_movement_select_policy"
on "public"."InventoryMovement"
as permissive
for select
to authenticated
using (true);


create policy "inventory_movement_update_policy"
on "public"."InventoryMovement"
as permissive
for update
to authenticated
using (true);


create policy "Enable read access for authenticated users"
on "public"."POSTable"
as permissive
for select
to public
using ((auth.uid() IS NOT NULL));


create policy "Service role can do everything on POSTable"
on "public"."POSTable"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Enable delete for admins"
on "public"."PettyCashExpense"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM ("User" u
     JOIN "Role" r ON ((u."roleId" = r.id)))
  WHERE ((u.id = auth.uid()) AND (r."roleName" = ANY (ARRAY['SUPER_USER'::text, 'ADMINISTRADOR'::text]))))));


create policy "Enable insert for authenticated users"
on "public"."PettyCashExpense"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for authenticated users"
on "public"."PettyCashExpense"
as permissive
for select
to authenticated
using (true);


create policy "Enable update for authenticated users"
on "public"."PettyCashExpense"
as permissive
for update
to authenticated
using (true)
with check (true);


create policy "Enable delete for admins"
on "public"."PettyCashIncome"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM ("User" u
     JOIN "Role" r ON ((u."roleId" = r.id)))
  WHERE ((u.id = auth.uid()) AND (r."roleName" = ANY (ARRAY['SUPER_USER'::text, 'ADMINISTRADOR'::text]))))));


create policy "Enable insert for authenticated users"
on "public"."PettyCashIncome"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for authenticated users"
on "public"."PettyCashIncome"
as permissive
for select
to authenticated
using (true);


create policy "Enable update for authenticated users"
on "public"."PettyCashIncome"
as permissive
for update
to authenticated
using (true)
with check (true);


create policy "Enable delete for admins"
on "public"."PettyCashPurchase"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM ("User" u
     JOIN "Role" r ON ((u."roleId" = r.id)))
  WHERE ((u.id = auth.uid()) AND (r."roleName" = ANY (ARRAY['SUPER_USER'::text, 'ADMINISTRADOR'::text]))))));


create policy "Enable insert for authenticated users"
on "public"."PettyCashPurchase"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for authenticated users"
on "public"."PettyCashPurchase"
as permissive
for select
to authenticated
using (true);


create policy "Enable update for authenticated users"
on "public"."PettyCashPurchase"
as permissive
for update
to authenticated
using (true)
with check (true);


create policy "Authenticated users can do everything on Product"
on "public"."Product"
as permissive
for all
to authenticated
using (true)
with check (true);


create policy "Service role can do everything on Product"
on "public"."Product"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "Enable all for service role"
on "public"."RelationshipType"
as permissive
for all
to public
using (true);


create policy "Allow authenticated users to read roles"
on "public"."Role"
as permissive
for select
to authenticated
using (true);


create policy "Allow delete suppliers for admin only"
on "public"."Supplier"
as permissive
for delete
to authenticated
using ((get_user_role() = ANY (ARRAY['SUPER_USER'::text, 'ADMINISTRADOR'::text])));


create policy "Allow insert suppliers for admin and jefe"
on "public"."Supplier"
as permissive
for insert
to authenticated
with check ((get_user_role() = ANY (ARRAY['SUPER_USER'::text, 'ADMINISTRADOR'::text, 'JEFE_SECCION'::text])));


create policy "Allow read suppliers for authenticated users"
on "public"."Supplier"
as permissive
for select
to authenticated
using (true);


create policy "Allow update suppliers for admin and jefe"
on "public"."Supplier"
as permissive
for update
to authenticated
using ((get_user_role() = ANY (ARRAY['SUPER_USER'::text, 'ADMINISTRADOR'::text, 'JEFE_SECCION'::text])))
with check ((get_user_role() = ANY (ARRAY['SUPER_USER'::text, 'ADMINISTRADOR'::text, 'JEFE_SECCION'::text])));


create policy "Authenticated users can do everything on Supplier"
on "public"."Supplier"
as permissive
for all
to authenticated
using (true)
with check (true);


create policy "Enable all for service role on Supplier"
on "public"."Supplier"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "Service role can do everything on Supplier"
on "public"."Supplier"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "supplier_delete_all"
on "public"."Supplier"
as permissive
for delete
to public
using ((auth.uid() IS NOT NULL));


create policy "supplier_insert_all"
on "public"."Supplier"
as permissive
for insert
to public
with check ((auth.uid() IS NOT NULL));


create policy "supplier_read_all"
on "public"."Supplier"
as permissive
for select
to public
using (true);


create policy "supplier_update_all"
on "public"."Supplier"
as permissive
for update
to public
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));


create policy "Allow delete for authenticated users"
on "public"."SupplierContact"
as permissive
for delete
to authenticated
using (true);


create policy "Allow insert for authenticated users"
on "public"."SupplierContact"
as permissive
for insert
to authenticated
with check (true);


create policy "Allow read access for authenticated users"
on "public"."SupplierContact"
as permissive
for select
to authenticated
using (true);


create policy "Allow update for authenticated users"
on "public"."SupplierContact"
as permissive
for update
to authenticated
using (true)
with check (true);


create policy "Allow individual users to insert their own profile"
on "public"."User"
as permissive
for insert
to authenticated
with check ((auth.uid() = id));


create policy "Allow individual users to read their own profile"
on "public"."User"
as permissive
for select
to authenticated
using ((auth.uid() = id));


create policy "Enable delete for service role"
on "public"."User"
as permissive
for delete
to public
using ((auth.role() = 'service_role'::text));


create policy "Enable insert for authenticated users"
on "public"."User"
as permissive
for insert
to authenticated
with check ((id = auth.uid()));


create policy "Enable insert for service role"
on "public"."User"
as permissive
for insert
to public
with check ((auth.role() = 'service_role'::text));


create policy "Enable read access for authenticated users"
on "public"."User"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


create policy "Enable update for own profile"
on "public"."User"
as permissive
for update
to authenticated
using ((id = auth.uid()))
with check ((id = auth.uid()));


create policy "Enable update for service role"
on "public"."User"
as permissive
for update
to public
using ((auth.role() = 'service_role'::text));


create policy "Allow all operations on Warehouse"
on "public"."Warehouse"
as permissive
for all
to authenticated
using (true)
with check (true);


create policy "Allow authenticated read"
on "public"."Warehouse"
as permissive
for select
to authenticated
using (true);


create policy "Allow read Warehouse to authenticated"
on "public"."Warehouse"
as permissive
for select
to authenticated
using (true);


create policy "Authenticated users can do everything on Warehouse"
on "public"."Warehouse"
as permissive
for all
to authenticated
using (true)
with check (true);


create policy "Enable all for service role on Warehouse"
on "public"."Warehouse"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "Service role can do everything on Warehouse"
on "public"."Warehouse"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "Allow all insert for service role"
on "public"."Warehouse_Product"
as permissive
for insert
to service_role
with check (true);


create policy "Allow all update for service role"
on "public"."Warehouse_Product"
as permissive
for update
to service_role
using (true)
with check (true);


create policy "Allow authenticated insert"
on "public"."Warehouse_Product"
as permissive
for insert
to authenticated
with check (true);


create policy "Allow authenticated read"
on "public"."Warehouse_Product"
as permissive
for select
to authenticated
using (true);


create policy "Authenticated users can do everything on Warehouse_Product"
on "public"."Warehouse_Product"
as permissive
for all
to authenticated
using (true)
with check (true);


create policy "Service role can do everything on Warehouse_Product"
on "public"."Warehouse_Product"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "Allow all operations on age_pricing_modular"
on "public"."age_pricing_modular"
as permissive
for all
to public
using (true);


create policy "Enable all for service role on age_pricing_modular"
on "public"."age_pricing_modular"
as permissive
for all
to public
using (true);


create policy "Allow all operations on companies"
on "public"."companies"
as permissive
for all
to public
using (true);


create policy "Enable all for service role on companies"
on "public"."companies"
as permissive
for all
to public
using (true);


create policy "Allow all operations on company_contacts"
on "public"."company_contacts"
as permissive
for all
to public
using (true);


create policy "Enable all for service role on company_contacts"
on "public"."company_contacts"
as permissive
for all
to public
using (true);


create policy "Allow all operations on modular_reservations"
on "public"."modular_reservations"
as permissive
for all
to public
using (true);


create policy "Enable all for service role on modular_reservations"
on "public"."modular_reservations"
as permissive
for all
to public
using (true);


create policy "Allow all operations on package_products_modular"
on "public"."package_products_modular"
as permissive
for all
to public
using (true);


create policy "Enable all for service role on package_products_modular"
on "public"."package_products_modular"
as permissive
for all
to public
using (true);


create policy "Allow all operations on packages_modular"
on "public"."packages_modular"
as permissive
for all
to public
using (true);


create policy "Enable all for service role on packages_modular"
on "public"."packages_modular"
as permissive
for all
to public
using (true);


create policy "Allow all operations on payments"
on "public"."payments"
as permissive
for all
to public
using (true);


create policy "Enable all for service role on payments"
on "public"."payments"
as permissive
for all
to public
using (true);


create policy "Users can delete product components"
on "public"."product_components"
as permissive
for delete
to public
using ((auth.role() = 'authenticated'::text));


create policy "Users can insert product components"
on "public"."product_components"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "Users can update product components"
on "public"."product_components"
as permissive
for update
to public
using ((auth.role() = 'authenticated'::text));


create policy "Users can view product components"
on "public"."product_components"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


create policy "Allow all for anon"
on "public"."product_package_linkage"
as permissive
for all
to anon
using (true)
with check (true);


create policy "Allow read product_package_linkage"
on "public"."product_package_linkage"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


create policy "Allow update product_package_linkage"
on "public"."product_package_linkage"
as permissive
for update
to public
using ((auth.role() = 'authenticated'::text));


create policy "Authenticated users can do everything on product_package_linkag"
on "public"."product_package_linkage"
as permissive
for all
to authenticated
using (true)
with check (true);


create policy "Service role can do everything on product_package_linkage"
on "public"."product_package_linkage"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "Administradores pueden gestionar todas las ventas"
on "public"."product_sales_tracking"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM ("User" u
     JOIN "Role" r ON ((u."roleId" = r.id)))
  WHERE ((u.id = auth.uid()) AND (r."roleName" = 'ADMINISTRADOR'::text)))));


create policy "Allow insert product_sales_tracking"
on "public"."product_sales_tracking"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "Allow read product_sales_tracking"
on "public"."product_sales_tracking"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


create policy "Jefes de sección pueden crear ventas mejorada"
on "public"."product_sales_tracking"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM ("User" u
     JOIN "Role" r ON ((u."roleId" = r.id)))
  WHERE ((u.id = auth.uid()) AND (r."roleName" = ANY (ARRAY['ADMINISTRADOR'::text, 'JEFE_SECCION'::text]))))));


create policy "Jefes de sección pueden ver ventas mejorada"
on "public"."product_sales_tracking"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM ("User" u
     JOIN "Role" r ON ((u."roleId" = r.id)))
  WHERE ((u.id = auth.uid()) AND (r."roleName" = ANY (ARRAY['ADMINISTRADOR'::text, 'JEFE_SECCION'::text]))))));


create policy "Usuarios pueden ver sus propias ventas mejorada"
on "public"."product_sales_tracking"
as permissive
for select
to public
using (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM ("User" u
     JOIN "Role" r ON ((u."roleId" = r.id)))
  WHERE ((u.id = auth.uid()) AND (r."roleName" = ANY (ARRAY['ADMINISTRADOR'::text, 'JEFE_SECCION'::text])))))));


create policy "Allow all operations on products_modular"
on "public"."products_modular"
as permissive
for all
to public
using (true);


create policy "Enable all for service role on products_modular"
on "public"."products_modular"
as permissive
for all
to public
using (true);


create policy "Allow all operations on reservation_comments"
on "public"."reservation_comments"
as permissive
for all
to public
using (true);


create policy "Enable all for service role on reservation_comments"
on "public"."reservation_comments"
as permissive
for all
to public
using (true);


create policy "Allow all operations on reservation_payments"
on "public"."reservation_payments"
as permissive
for all
to authenticated
using (true)
with check (true);


create policy "Enable all for service role on reservation_payments"
on "public"."reservation_payments"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "Allow all operations on reservation_products"
on "public"."reservation_products"
as permissive
for all
to public
using (true);


create policy "Enable all for service role on reservation_products"
on "public"."reservation_products"
as permissive
for all
to public
using (true);


create policy "Allow all operations on reservations"
on "public"."reservations"
as permissive
for all
to public
using (true);


create policy "Enable all for service role on reservations"
on "public"."reservations"
as permissive
for all
to public
using (true);


create policy "Allow all operations on rooms"
on "public"."rooms"
as permissive
for all
to public
using (true);


create policy "Enable all for service role on rooms"
on "public"."rooms"
as permissive
for all
to public
using (true);


create policy "sales_tracking_delete_policy"
on "public"."sales_tracking"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((auth.uid() = users.id) AND ((users.raw_user_meta_data ->> 'role'::text) = ANY (ARRAY['ADMINISTRADOR'::text, 'SUPER_USER'::text]))))));


create policy "sales_tracking_insert_policy"
on "public"."sales_tracking"
as permissive
for insert
to public
with check (true);


create policy "sales_tracking_select_policy"
on "public"."sales_tracking"
as permissive
for select
to public
using (true);


create policy "sales_tracking_update_policy"
on "public"."sales_tracking"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((auth.uid() = users.id) AND ((users.raw_user_meta_data ->> 'role'::text) = ANY (ARRAY['ADMINISTRADOR'::text, 'SUPER_USER'::text]))))));


create policy "season_configurations_select_policy"
on "public"."season_configurations"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


create policy "season_configurations_write_policy"
on "public"."season_configurations"
as permissive
for all
to public
using ((auth.role() = 'authenticated'::text));


create policy "Allow all operations on spa_products"
on "public"."spa_products"
as permissive
for all
to public
using (true);


create policy "Enable all for service role on spa_products"
on "public"."spa_products"
as permissive
for all
to public
using (true);


CREATE TRIGGER trigger_update_client_modified_on_image_change BEFORE UPDATE ON public."Client" FOR EACH ROW EXECUTE FUNCTION update_client_modified_on_image_change();

CREATE TRIGGER trigger_inventory_movement_updated_at BEFORE UPDATE ON public."InventoryMovement" FOR EACH ROW EXECUTE FUNCTION update_inventory_movement_updated_at();

CREATE TRIGGER update_petty_cash_income_updated_at BEFORE UPDATE ON public."PettyCashIncome" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_final_price_with_vat BEFORE INSERT OR UPDATE ON public."Product" FOR EACH ROW EXECUTE FUNCTION update_final_price_with_vat();

CREATE TRIGGER trigger_update_supplier_contact_updated_at BEFORE UPDATE ON public."SupplierContact" FOR EACH ROW EXECUTE FUNCTION update_supplier_contact_updated_at();

CREATE TRIGGER trigger_update_supplier_payment_updated_at BEFORE UPDATE ON public."SupplierPayment" FOR EACH ROW EXECUTE FUNCTION update_supplier_payment_updated_at();

CREATE TRIGGER update_supplier_tag_updated_at BEFORE UPDATE ON public."SupplierTag" FOR EACH ROW EXECUTE FUNCTION update_supplier_tag_updated_at();

CREATE TRIGGER trigger_update_warehouse_updated_at BEFORE UPDATE ON public."Warehouse" FOR EACH ROW EXECUTE FUNCTION update_warehouse_updated_at();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modular_reservations_updated_at BEFORE UPDATE ON public.modular_reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_product_components_updated_at BEFORE UPDATE ON public.product_components FOR EACH ROW EXECUTE FUNCTION update_product_components_updated_at();

CREATE TRIGGER trg_validate_combo_component_types BEFORE INSERT OR UPDATE ON public.product_components FOR EACH ROW EXECUTE FUNCTION validate_combo_component_types();

CREATE TRIGGER trg_create_modular_product AFTER INSERT ON public.product_package_linkage FOR EACH ROW EXECUTE FUNCTION create_modular_product_if_not_exists();

CREATE TRIGGER trigger_crear_modular_al_vincular BEFORE INSERT ON public.product_package_linkage FOR EACH ROW EXECUTE FUNCTION crear_modular_al_vincular_producto();

CREATE TRIGGER trigger_update_product_sales_tracking_updated_at BEFORE UPDATE ON public.product_sales_tracking FOR EACH ROW EXECUTE FUNCTION update_product_sales_tracking_updated_at();

CREATE TRIGGER validate_product_reference_trigger BEFORE INSERT OR UPDATE ON public.reservation_products FOR EACH ROW EXECUTE FUNCTION validate_product_reference();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_tracking_updated_at_trigger BEFORE UPDATE ON public.sales_tracking FOR EACH ROW EXECUTE FUNCTION update_sales_tracking_updated_at();

CREATE TRIGGER update_season_configurations_updated_at BEFORE UPDATE ON public.season_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


