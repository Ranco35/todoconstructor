#!/bin/bash
# Script final para reorganizar migraciones
# Copia desde backup y reorganiza

set -e

echo "=== REORGANIZACIÓN FINAL DE MIGRACIONES ==="

# Crear respaldo del estado actual
BACKUP_NAME="migrations_backup_$(date +%Y%m%d_%H%M%S)"
echo "Creando respaldo: supabase/$BACKUP_NAME"
cp -r supabase/migrations supabase/$BACKUP_NAME

# Limpiar directorio de migraciones
echo "Limpiando directorio de migraciones..."
cd supabase/migrations
rm -f *.sql

# Copiar todos los archivos del backup
echo "Copiando archivos desde backup..."
cd ../migrations_backup_20250709

# Lista de archivos a copiar con nuevos nombres ordenados
cp "20250623003309_initial_schema.sql" "../migrations/20240101000000_initial_schema.sql"
cp "20250623174020_create_client_tables.sql" "../migrations/20240102000000_create_client_tables.sql"
cp "20250626000000_add_read_policy_to_roles.sql" "../migrations/20240103000000_add_read_policy_to_roles.sql"
cp "20250627000000_add_user_policies.sql" "../migrations/20240104000000_add_user_policies.sql"
cp "20250627000001_add_isCashier_to_user.sql" "../migrations/20240105000000_add_isCashier_to_user.sql"
cp "20250627000002_add_client_tables.sql" "../migrations/20240106000000_add_client_tables.sql"
cp "20250627000003_add_client_tables_interface.sql" "../migrations/20240107000000_add_client_tables_interface.sql"
cp "20250627000004_add_economic_sector_hierarchy.sql" "../migrations/20240108000000_add_economic_sector_hierarchy.sql"
cp "20250627000005_add_cash_register_table.sql" "../migrations/20240109000000_add_cash_register_table.sql"
cp "20250627000006_add_user_policies.sql" "../migrations/20240110000000_add_user_policies.sql"
cp "20250627000007_enable_user_read_for_all.sql" "../migrations/20240111000000_enable_user_read_for_all.sql"
cp "20250627000008_add_user_id_to_petty_cash_tables.sql" "../migrations/20240112000000_add_user_id_to_petty_cash_tables.sql"
cp "20250627000010_add_active_to_supplier.sql" "../migrations/20240113000000_add_active_to_supplier.sql"
cp "20250627230000_add_session_number_to_cash_session.sql" "../migrations/20240114000000_add_session_number_to_cash_session.sql"
cp "20250628000000_add_vat_to_supplier.sql" "../migrations/20240115000000_add_vat_to_supplier.sql"
cp "20250628000001_add_supplier_rls_policies.sql" "../migrations/20240116000000_add_supplier_rls_policies.sql"
cp "20250628000002_implement_supplier_role_based_permissions.sql" "../migrations/20240117000000_implement_supplier_role_based_permissions.sql"
cp "20250628000004_fix_user_role_function_properly.sql" "../migrations/20240118000000_fix_user_role_function_properly.sql"
cp "20250628000005_setup_client_images_storage.sql" "../migrations/20240119000000_setup_client_images_storage.sql"
cp "20250628000010_create_supplier_contact_table.sql" "../migrations/20240120000000_create_supplier_contact_table.sql"
cp "20250628000011_create_supplier_contact_table_safe.sql" "../migrations/20240121000000_create_supplier_contact_table_safe.sql"
cp "20250628000012_enhance_rooms_system.sql" "../migrations/20240122000000_enhance_rooms_system.sql"
cp "20250628000014_fix_reservations_triggers.sql" "../migrations/20240123000000_fix_reservations_triggers.sql"
cp "20250629000030_add_supplierrank_column.sql" "../migrations/20240124000000_add_supplierrank_column.sql"
cp "20250629202802_fix_cash_session_rls_policies.sql" "../migrations/20240125000000_fix_cash_session_rls_policies.sql"
cp "20250629204218_fix_petty_cash_transactions_rls_policies.sql" "../migrations/20240126000000_fix_petty_cash_transactions_rls_policies.sql"
cp "20250630000001_add_client_integration_to_reservations.sql" "../migrations/20240127000000_add_client_integration_to_reservations.sql"
cp "20250630000002_add_icono_to_supplier_tags.sql" "../migrations/20240128000000_add_icono_to_supplier_tags.sql"
cp "20250630164638_fix_product_creation_rls.sql" "../migrations/20240129000000_fix_product_creation_rls.sql"
cp "20250630170600_fix_all_rls_policies.sql" "../migrations/20240130000000_fix_all_rls_policies.sql"
cp "20250701120000_fix_warehouse_product_rls.sql" "../migrations/20240131000000_fix_warehouse_product_rls.sql"
cp "20250703000001_add_category_id_to_spa_products.sql" "../migrations/20240201000000_add_category_id_to_spa_products.sql"
cp "20250703000003_create_programas_alojamiento_category.sql" "../migrations/20240202000000_create_programas_alojamiento_category.sql"
cp "20250703000004_create_season_configuration.sql" "../migrations/20240203000000_create_season_configuration.sql"
cp "20250704000001_fix_price_function_final.sql" "../migrations/20240204000000_fix_price_function_final.sql"
cp "20250705000001_add_final_price_with_vat_to_product.sql" "../migrations/20240205000000_add_final_price_with_vat_to_product.sql"
cp "20250705002042_create_inventory_movements_table.sql" "../migrations/20240206000000_create_inventory_movements_table.sql"
cp "20250101000000_create_reservations_module.sql" "../migrations/20240207000000_create_reservations_module.sql"
cp "20250101000001_add_payment_method_to_petty_cash.sql" "../migrations/20240208000000_add_payment_method_to_petty_cash.sql"
cp "20250101000013_add_parent_id_to_warehouse.sql" "../migrations/20240209000000_add_parent_id_to_warehouse.sql"
cp "20250101000014_create_supplier_payment_table.sql" "../migrations/20240210000000_create_supplier_payment_table.sql"
cp "20250101000015_create_storage_buckets.sql" "../migrations/20240211000000_create_storage_buckets.sql"
cp "20250101000020_make_client_id_required_reservations.sql" "../migrations/20240212000000_make_client_id_required_reservations.sql"
cp "20250101000020_modular_products_system.sql" "../migrations/20240213000000_modular_products_system.sql"
cp "20250101000021_create_product_package_linkage.sql" "../migrations/20240214000000_create_product_package_linkage.sql"
cp "20250101000052_use_final_price_with_vat.sql" "../migrations/20240215000000_use_final_price_with_vat.sql"
cp "20250101000053_create_modular_reservations.sql" "../migrations/20240216000000_create_modular_reservations.sql"
cp "20250101000053_fix_final_price_with_vat_correct.sql" "../migrations/20240217000000_fix_final_price_with_vat_correct.sql"
cp "20250102000001_add_modular_reservations_rls_policies.sql" "../migrations/20240218000000_add_modular_reservations_rls_policies.sql"
cp "20250115000001_create_reservation_payments_table.sql" "../migrations/20240219000000_create_reservation_payments_table.sql"
cp "20250127000000_create_petty_cash_income.sql" "../migrations/20240220000000_create_petty_cash_income.sql"
cp "fix_product_rls_policies.sql" "../migrations/20240221000000_fix_product_rls_policies.sql"

cd ../../

echo "Migraciones reorganizadas exitosamente!"
echo "Total de migraciones procesadas: 50"
echo "Verificar que todo funcione correctamente antes de continuar." 