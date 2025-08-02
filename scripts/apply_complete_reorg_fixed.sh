#!/bin/bash
# Script de reorganización completa de migraciones
# Generado automáticamente

set -e  # Salir en caso de error

echo "=== REORGANIZACIÓN COMPLETA DE MIGRACIONES ==="

# Crear respaldo
BACKUP_NAME="migrations_backup_$(date +%Y%m%d_%H%M%S)"
echo "Creando respaldo: supabase/$BACKUP_NAME"
cp -r supabase/migrations supabase/$BACKUP_NAME

# Crear directorio temporal para las nuevas migraciones
echo "Creando directorio temporal..."
mkdir -p temp_migrations_reorg

# Copiar archivos desde ubicaciones originales
echo "Copiando archivos desde ubicaciones originales..."

# Desde el directorio principal
if [ -d "supabase/migrations" ]; then
    for file in supabase/migrations/*.sql; do
        if [ -f "$file" ]; then
            cp "$file" temp_migrations_reorg/
        fi
    done
fi

# Desde el directorio de backup
if [ -d "supabase/migrations_backup_20250709" ]; then
    for file in supabase/migrations_backup_20250709/*.sql; do
        if [ -f "$file" ]; then
            cp "$file" temp_migrations_reorg/
        fi
    done
fi

# Limpiar directorio de migraciones
echo "Limpiando directorio de migraciones..."
cd supabase/migrations
rm -f *.sql

# Copiar archivos reorganizados
echo "Copiando archivos reorganizados..."
cd ../../temp_migrations_reorg

# Lista de archivos a copiar con nuevos nombres
cp "20240630164639_fix_product_rls_policies.sql" "../supabase/migrations/20240101000000_fix_product_rls_policies.sql"
cp "20240706000000_create_reservations_module.sql" "../supabase/migrations/20240102000000_create_reservations_module.sql"
cp "20240706000001_add_payment_method_to_petty_cash.sql" "../supabase/migrations/20240103000000_add_payment_method_to_petty_cash.sql"
cp "20240706000013_add_parent_id_to_warehouse.sql" "../supabase/migrations/20240104000000_add_parent_id_to_warehouse.sql"
cp "20240706000014_create_supplier_payment_table.sql" "../supabase/migrations/20240105000000_create_supplier_payment_table.sql"
cp "20240706000015_create_storage_buckets.sql" "../supabase/migrations/20240106000000_create_storage_buckets.sql"
cp "20240706000018_add_type_and_equipment_fields_to_product.sql" "../supabase/migrations/20240107000000_add_type_and_equipment_fields_to_product.sql"
cp "20240706000019_add_service_counter_to_product.sql" "../supabase/migrations/20240108000000_add_service_counter_to_product.sql"
cp "20240706000020_create_inventory_physical_history_table.sql" "../supabase/migrations/20240109000000_create_inventory_physical_history_table.sql"
cp "20240706000020_modular_products_system.sql" "../supabase/migrations/20240110000000_modular_products_system.sql"
cp "20240706000021_create_product_package_linkage.sql" "../supabase/migrations/20240111000000_create_product_package_linkage.sql"
cp "20240706000022_create_supplier_tags.sql" "../supabase/migrations/20240112000000_create_supplier_tags.sql"
cp "20240706000041_update_supplier_rank_constraint.sql" "../supabase/migrations/20240113000000_update_supplier_rank_constraint.sql"
cp "20240706000050_fix_supplier_rank_constraint.sql" "../supabase/migrations/20240114000000_fix_supplier_rank_constraint.sql"
cp "20240706000052_use_final_price_with_vat.sql" "../supabase/migrations/20240115000000_use_final_price_with_vat.sql"
cp "20240706000053_create_modular_reservations.sql" "../supabase/migrations/20240116000000_create_modular_reservations.sql"
cp "20240706000053_fix_final_price_with_vat_correct.sql" "../supabase/migrations/20240117000000_fix_final_price_with_vat_correct.sql"
cp "20250102000001_add_modular_reservations_rls_policies.sql" "../supabase/migrations/20240118000000_add_modular_reservations_rls_policies.sql"
cp "20250109000001_fix_sales_client_references.sql" "../supabase/migrations/20240119000000_fix_sales_client_references.sql"
cp "20250109000002_create_budget_lines_function.sql" "../supabase/migrations/20240120000000_create_budget_lines_function.sql"
cp "20250109000003_create_product_components_table.sql" "../supabase/migrations/20240121000000_create_product_components_table.sql"
cp "20250110000001_create_sales_discounts.sql" "../supabase/migrations/20240122000000_create_sales_discounts.sql"
cp "20250110000002_add_facturada_status_to_reservations.sql" "../supabase/migrations/20240123000000_add_facturada_status_to_reservations.sql"
cp "20250115000000_add_pos_enabled_to_product.sql" "../supabase/migrations/20240124000000_add_pos_enabled_to_product.sql"
cp "20250115000001_create_reservation_payments_table.sql" "../supabase/migrations/20240125000000_create_reservation_payments_table.sql"
cp "20250127000000_create_petty_cash_income.sql" "../supabase/migrations/20240126000000_create_petty_cash_income.sql"
cp "20250623003309_initial_schema.sql" "../supabase/migrations/20240127000000_initial_schema.sql"
cp "20250623174020_create_client_tables.sql" "../supabase/migrations/20240128000000_create_client_tables.sql"
cp "20250626000000_add_read_policy_to_roles.sql" "../supabase/migrations/20240129000000_add_read_policy_to_roles.sql"
cp "20250627000000_add_user_policies.sql" "../supabase/migrations/20240130000000_add_user_policies.sql"
cp "20250627000001_add_isCashier_to_user.sql" "../supabase/migrations/20240131000000_add_isCashier_to_user.sql"
cp "20250627000002_add_client_tables.sql" "../supabase/migrations/20240201000000_add_client_tables.sql"
cp "20250627000003_add_client_tables_interface.sql" "../supabase/migrations/20240202000000_add_client_tables_interface.sql"
cp "20250627000004_add_economic_sector_hierarchy.sql" "../supabase/migrations/20240203000000_add_economic_sector_hierarchy.sql"
cp "20250627000005_add_cash_register_table.sql" "../supabase/migrations/20240204000000_add_cash_register_table.sql"
cp "20250627000006_add_user_policies.sql" "../supabase/migrations/20240205000000_add_user_policies.sql"
cp "20250627000007_enable_user_read_for_all.sql" "../supabase/migrations/20240206000000_enable_user_read_for_all.sql"
cp "20250627000008_add_user_id_to_petty_cash_tables.sql" "../supabase/migrations/20240207000000_add_user_id_to_petty_cash_tables.sql"
cp "20250627000010_add_active_to_supplier.sql" "../supabase/migrations/20240208000000_add_active_to_supplier.sql"
cp "20250627230000_add_session_number_to_cash_session.sql" "../supabase/migrations/20240209000000_add_session_number_to_cash_session.sql"
cp "20250628000000_add_vat_to_supplier.sql" "../supabase/migrations/20240210000000_add_vat_to_supplier.sql"
cp "20250628000001_add_supplier_rls_policies.sql" "../supabase/migrations/20240211000000_add_supplier_rls_policies.sql"
cp "20250628000002_implement_supplier_role_based_permissions.sql" "../supabase/migrations/20240212000000_implement_supplier_role_based_permissions.sql"
cp "20250628000004_fix_user_role_function_properly.sql" "../supabase/migrations/20240213000000_fix_user_role_function_properly.sql"
cp "20250628000005_setup_client_images_storage.sql" "../supabase/migrations/20240214000000_setup_client_images_storage.sql"
cp "20250628000010_create_supplier_contact_table.sql" "../supabase/migrations/20240215000000_create_supplier_contact_table.sql"
cp "20250628000011_create_supplier_contact_table_safe.sql" "../supabase/migrations/20240216000000_create_supplier_contact_table_safe.sql"
cp "20250628000012_enhance_rooms_system.sql" "../supabase/migrations/20240217000000_enhance_rooms_system.sql"
cp "20250628000014_fix_reservations_triggers.sql" "../supabase/migrations/20240218000000_fix_reservations_triggers.sql"
cp "20250629000030_add_supplierrank_column.sql" "../supabase/migrations/20240219000000_add_supplierrank_column.sql"
cp "20250629202802_fix_cash_session_rls_policies.sql" "../supabase/migrations/20240220000000_fix_cash_session_rls_policies.sql"
cp "20250629204218_fix_petty_cash_transactions_rls_policies.sql" "../supabase/migrations/20240221000000_fix_petty_cash_transactions_rls_policies.sql"
cp "20250630000001_add_client_integration_to_reservations.sql" "../supabase/migrations/20240222000000_add_client_integration_to_reservations.sql"
cp "20250630000002_add_icono_to_supplier_tags.sql" "../supabase/migrations/20240223000000_add_icono_to_supplier_tags.sql"
cp "20250630164638_fix_product_creation_rls.sql" "../supabase/migrations/20240224000000_fix_product_creation_rls.sql"
cp "20250630170600_fix_all_rls_policies.sql" "../supabase/migrations/20240225000000_fix_all_rls_policies.sql"
cp "20250701120000_fix_warehouse_product_rls.sql" "../supabase/migrations/20240226000000_fix_warehouse_product_rls.sql"
cp "20250703000001_add_category_id_to_spa_products.sql" "../supabase/migrations/20240227000000_add_category_id_to_spa_products.sql"
cp "20250703000003_create_programas_alojamiento_category.sql" "../supabase/migrations/20240228000000_create_programas_alojamiento_category.sql"
cp "20250703000004_create_season_configuration.sql" "../supabase/migrations/20240229000000_create_season_configuration.sql"
cp "20250704000001_fix_price_function_final.sql" "../supabase/migrations/20240301000000_fix_price_function_final.sql"
cp "20250705000001_add_final_price_with_vat_to_product.sql" "../supabase/migrations/20240302000000_add_final_price_with_vat_to_product.sql"
cp "20250705002042_create_inventory_movements_table.sql" "../supabase/migrations/20240303000000_create_inventory_movements_table.sql"
cp "20250709151437_20250708_create_sales_module.sql" "../supabase/migrations/20240304000000_20250708_create_sales_module.sql"
cp "20250710145222_final_pos_system.sql" "../supabase/migrations/20240305000000_final_pos_system.sql"
cp "20250710150000_add_generate_sale_number_function.sql" "../supabase/migrations/20240306000000_add_generate_sale_number_function.sql"

# Limpiar directorio temporal
cd ..
rm -rf temp_migrations_reorg

echo "Migraciones reorganizadas exitosamente!"
echo "Total de migraciones procesadas: 66"
echo "Verificar que todo funcione correctamente antes de continuar." 