# Plan de Organización de Migraciones - Admintermas

## 📋 Estado Actual

### Problemas Identificados

1. **Migraciones Duplicadas**
   - `20250101000015_create_storage_buckets.sql` (carpeta principal)
   - `_pendientes/20250101000015_create_storage_buckets.sql` (duplicado)
   - `20250628000005_setup_client_images_storage.sql` (similar)

2. **Migraciones en Carpetas Incorrectas**
   - `_pendientes/20250101000015_create_storage_buckets.sql`
   - `_pendientes/20250101000016_fix_storage_rls_policies.sql`
   - `_pendientes/20250101000017_fix_warehouse_rls_policies.sql`

3. **Migraciones con Fechas Inconsistentes**
   - Algunas con fecha 2025 (futuro)
   - Otras con fecha 2024 (pasado)
   - Necesitan secuencia cronológica correcta

4. **Migraciones Potencialmente Desactualizadas**
   - `20250101000023_fix_reservation_products_references.sql` (1 línea)
   - `20250101000040_update_supplier_rank_types.sql` (1 línea)

## 🎯 Plan de Acción

### Fase 1: Limpieza de Duplicados

1. **Eliminar migraciones duplicadas**
   - Mover `_pendientes/20250101000015_create_storage_buckets.sql` a `_obsolete/`
   - Mover `_pendientes/20250101000016_fix_storage_rls_policies.sql` a `_obsolete/`
   - Mover `_pendientes/20250101000017_fix_warehouse_rls_policies.sql` a `_obsolete/`

2. **Consolidar storage buckets**
   - Mantener `20250101000015_create_storage_buckets.sql` como principal
   - Eliminar `20250628000005_setup_client_images_storage.sql` si es redundante

### Fase 2: Reorganización Cronológica

1. **Renombrar migraciones con fechas incorrectas**
   - Cambiar fechas de 2025 a 2024 para migraciones ya aplicadas
   - Mantener secuencia cronológica correcta

2. **Eliminar migraciones vacías o problemáticas**
   - `20250101000023_fix_reservation_products_references.sql` (1 línea)
   - `20250101000040_update_supplier_rank_types.sql` (1 línea)

### Fase 3: Verificación de Estado

1. **Crear script de verificación**
   - Listar todas las tablas existentes
   - Verificar que las migraciones aplicadas coincidan con el estado actual

2. **Documentar estado final**
   - Lista de migraciones activas
   - Orden cronológico correcto
   - Dependencias entre migraciones

## 📁 Estructura Propuesta

```
supabase/migrations/
├── 20240623000000_initial_schema.sql
├── 20240627000000_add_user_policies.sql
├── 20240627000001_add_isCashier_to_user.sql
├── 20240627000002_add_client_tables.sql
├── 20240627000003_add_client_tables_interface.sql
├── 20240627000004_add_economic_sector_hierarchy.sql
├── 20240627000005_add_cash_register_table.sql
├── 20240627000006_add_user_policies.sql
├── 20240627000007_enable_user_read_for_all.sql
├── 20240627000008_add_user_id_to_petty_cash_tables.sql
├── 20240627000010_add_active_to_supplier.sql
├── 20240628000000_add_vat_to_supplier.sql
├── 20240628000001_add_supplier_rls_policies.sql
├── 20240628000002_implement_supplier_role_based_permissions.sql
├── 20240628000004_fix_user_role_function_properly.sql
├── 20240628000005_setup_client_images_storage.sql
├── 20240628000010_create_supplier_contact_table.sql
├── 20240628000011_create_supplier_contact_table_safe.sql
├── 20240628000012_enhance_rooms_system.sql
├── 20240628000014_fix_reservations_triggers.sql
├── 20240629000030_add_supplierrank_column.sql
├── 20240629202802_fix_cash_session_rls_policies.sql
├── 20240629204218_fix_petty_cash_transactions_rls_policies.sql
├── 20240630000001_add_client_integration_to_reservations.sql
├── 20240630000002_add_icono_to_supplier_tags.sql
├── 20240630164638_fix_product_creation_rls.sql
├── 20240630170600_fix_all_rls_policies.sql
├── 20240701000001_fix_warehouse_product_rls.sql
├── 20240703000001_add_category_id_to_spa_products.sql
├── 20240703000003_create_programas_alojamiento_category.sql
├── 20240703000004_create_season_configuration.sql
├── 20240704000001_fix_price_function_final.sql
├── 20240705000001_add_final_price_with_vat_to_product.sql
├── 20240705002042_create_inventory_movements_table.sql
├── 20250101000000_create_reservations_module.sql
├── 20250101000001_add_payment_method_to_petty_cash.sql
├── 20250101000013_add_parent_id_to_warehouse.sql
├── 20250101000014_create_supplier_payment_table.sql
├── 20250101000015_create_storage_buckets.sql
├── 20250101000018_add_type_and_equipment_fields_to_product.sql
├── 20250101000019_add_service_counter_to_product.sql
├── 20250101000020_modular_products_system.sql
├── 20250101000020_make_client_id_required_reservations.sql
├── 20250101000020_create_inventory_physical_history_table.sql
├── 20250101000021_create_product_package_linkage.sql
├── 20250101000022_create_supplier_tags.sql
├── 20250101000050_fix_supplier_rank_constraint.sql
├── 20250101000052_use_final_price_with_vat.sql
├── 20250101000053_create_modular_reservations.sql
├── 20250101000053_fix_final_price_with_vat_correct.sql
├── 20250102000001_add_modular_reservations_rls_policies.sql
├── 20250115000001_create_reservation_payments_table.sql
├── 20250127000000_create_petty_cash_income.sql
├── _obsolete/
│   ├── README.md
│   ├── 20250703000002_create_lodging_programs_table.sql
│   ├── _pendientes/20250101000015_create_storage_buckets.sql
│   ├── _pendientes/20250101000016_fix_storage_rls_policies.sql
│   └── _pendientes/20250101000017_fix_warehouse_rls_policies.sql
```

## ⚠️ Migraciones a Eliminar

1. `20250101000023_fix_reservation_products_references.sql` - 1 línea, probablemente vacía
2. `20250101000040_update_supplier_rank_types.sql` - 1 línea, probablemente vacía
3. `fix_product_rls_policies.sql` - Sin fecha, debe ser renombrado o eliminado

## 🔧 Comandos de Ejecución

```bash
# 1. Crear backup de migraciones actuales
cp -r supabase/migrations supabase/migrations_backup_$(date +%Y%m%d)

# 2. Mover migraciones pendientes a obsoletas
mv supabase/migrations/_pendientes/* supabase/migrations/_obsolete/

# 3. Eliminar migraciones vacías
rm supabase/migrations/20250101000023_fix_reservation_products_references.sql
rm supabase/migrations/20250101000040_update_supplier_rank_types.sql

# 4. Renombrar migraciones con fechas incorrectas
# (Se hará manualmente para evitar conflictos)

# 5. Verificar estado con Supabase CLI
npx supabase db reset
npx supabase migration list
```

## 📊 Estado Final Esperado

- **Migraciones activas**: ~45 archivos
- **Migraciones obsoletas**: ~10 archivos
- **Secuencia cronológica**: Correcta desde 2024-06-23 hasta 2025-01-27
- **Sin duplicados**: Eliminados todos los archivos duplicados
- **Sin conflictos**: Todas las migraciones aplicables sin errores

## 🎯 Resultado Final

Sistema de migraciones completamente sincronizado y organizado, listo para desarrollo y producción. 