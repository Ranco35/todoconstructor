# Esquema de Base de Datos

## 📊 Resumen General
La base de datos está diseñada para un sistema integral de gestión hotelera y termal con los siguientes módulos principales:

## 🏗️ Modelos Principales

### 🏢 **GESTIÓN EMPRESARIAL**

#### Account (Cuentas)
```prisma
model Account {
  id   Int    @id @default(autoincrement())
  name String
  Role Role[]
  User User[]
}
```

#### User (Usuarios)
```prisma
model User {
  id        Int     @id @default(autoincrement())
  email     String  @unique
  password  String
  name      String
  accountId Int
  Account   Account @relation(fields: [accountId], references: [id])
}
```

#### Role (Roles)
```prisma
model Role {
  id          Int           @id @default(autoincrement())
  name        String
  accountId   Int
  Permission  Permission[]
  Account     Account       @relation(fields: [accountId], references: [id])
  Cost_Center Cost_Center[] @relation("RoleCost_Centers")
}
```

### 🏪 **PRODUCTOS Y CATEGORÍAS**

#### Category (Categorías) ✅ IMPLEMENTADO
```prisma
model Category {
  id          Int       @id @default(autoincrement())
  name        String
  description String?
  Product     Product[]
}
```

#### Product (Productos) - MODELO PRINCIPAL
```prisma
model Product {
  id               Int     @id @default(autoincrement())
  name             String
  barcode          String?
  description      String?
  brand            String?
  image            String?
  costprice        Float?
  saleprice        Float?
  vat              Float?
  categoryid       Int?
  supplierid       Int?
  // ... más campos de relaciones
}
```

### 🏭 **INVENTARIO Y ALMACENES**

#### Warehouse (Bodegas)
```prisma
model Warehouse {
  id                Int                 @id @default(autoincrement())
  name              String
  description       String
  location          String
  Inventory         Inventory[]
  Warehouse_Product Warehouse_Product[]
}
```

#### Supplier (Proveedores)
```prisma
model Supplier {
  id          Int           @id @default(autoincrement())
  name        String
  logo        String?
  Product     Product[]
  Cost_Center Cost_Center[] @relation("SupplierCost_Centers")
}
```

### 👥 **CLIENTES Y VENTAS**

#### Client (Clientes)
```prisma
model Client {
  id    Int    @id @default(autoincrement())
  name  String
  email String
  phone String
  Reservation Reservation[]
  Sale        Sale[]
}
```

#### Sale (Ventas)
```prisma
model Sale {
  id             Int            @id @default(autoincrement())
  date           DateTime       @default(now())
  Cost_CenterId  Int
  cashRegisterId Int
  invoiceId      Int
  collaboratorId Int
  clientId       Int
  Sale_Product   Sale_Product[]
}
```

### 📅 **RESERVAS**

#### Reservation (Reservas)
```prisma
model Reservation {
  id                    Int                   @id @default(autoincrement())
  createdAt             DateTime              @default(now())
  requester             String
  status                String
  titularId             Int
  Reservation_Product   Reservation_Product[]
}
```

## 🔗 Relaciones Importantes

### Relaciones Principales:
1. **Product ↔ Category**: Un producto pertenece a una categoría
2. **Product ↔ Supplier**: Un producto tiene un proveedor
3. **Sale ↔ Client**: Una venta pertenece a un cliente
4. **Reservation ↔ Client**: Una reserva pertenece a un cliente
5. **Warehouse ↔ Product**: Productos distribuidos en bodegas

### Tablas de Unión:
- **Sale_Product**: Productos por venta
- **Reservation_Product**: Productos por reserva
- **Warehouse_Product**: Productos por bodega
- **Product_Component**: Componentes de productos

## 📈 Estadísticas del Esquema
- **Total de modelos**: 25+
- **Modelos implementados**: 1 (Category)
- **Modelos por implementar**: 24
- **Relaciones**: 50+ entre modelos

## 🎯 Estado de Implementación

### ✅ Completamente Implementado:
- **Category**: CRUD completo con paginación

### 🚧 En Desarrollo:
- Dashboard con estadísticas
- Páginas placeholder para módulos

### 📋 Por Implementar:
1. **Product** - Gestión de productos
2. **Supplier** - Proveedores
3. **Client** - Clientes
4. **Warehouse** - Bodegas
5. **Sale** - Ventas
6. **Reservation** - Reservas
7. **User** - Usuarios y autenticación

## 🔍 Consultas Comunes

### Obtener productos por categoría:
```sql
SELECT p.*, c.name as category_name 
FROM Product p 
JOIN Category c ON p.categoryid = c.id 
WHERE c.id = ?
```

### Ventas por período:
```sql
SELECT * FROM Sale 
WHERE date BETWEEN ? AND ?
ORDER BY date DESC
```

### Stock por bodega:
```sql
SELECT p.name, w.name as warehouse, wp.* 
FROM Warehouse_Product wp
JOIN Product p ON wp.productId = p.id
JOIN Warehouse w ON wp.warehouseId = w.id
``` 