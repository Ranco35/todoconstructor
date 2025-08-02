# Reporte de Reorganización de Migraciones

Fecha: 2025-07-10 20:40:24

Total de migraciones procesadas: 85

## Mapeo de archivos:

| # | Archivo Original | Archivo Nuevo |
|---|------------------|---------------|
| 1 | `20240630164639_fix_product_rls_policies.sql` | `20240101000000_fix_product_rls_policies.sql` |
| 2 | `20240706000000_create_reservations_module.sql` | `20240102000000_create_reservations_module.sql` |
| 3 | `20240706000001_add_payment_method_to_petty_cash.sql` | `20240103000000_add_payment_method_to_petty_cash.sql` |
| 4 | `20240706000013_add_parent_id_to_warehouse.sql` | `20240104000000_add_parent_id_to_warehouse.sql` |
| 5 | `20240706000014_create_supplier_payment_table.sql` | `20240105000000_create_supplier_payment_table.sql` |
| 6 | `20240706000015_create_storage_buckets.sql` | `20240106000000_create_storage_buckets.sql` |
| 7 | `20240706000018_add_type_and_equipment_fields_to_product.sql` | `20240107000000_add_type_and_equipment_fields_to_product.sql` |
| 8 | `20240706000019_add_service_counter_to_product.sql` | `20240108000000_add_service_counter_to_product.sql` |
| 9 | `20240706000020_create_inventory_physical_history_table.sql` | `20240109000000_create_inventory_physical_history_table.sql` |
| 10 | `20240706000020_modular_products_system.sql` | `20240110000000_modular_products_system.sql` |
| 11 | `20240706000021_create_product_package_linkage.sql` | `20240111000000_create_product_package_linkage.sql` |
| 12 | `20240706000022_create_supplier_tags.sql` | `20240112000000_create_supplier_tags.sql` |
| 13 | `20240706000041_update_supplier_rank_constraint.sql` | `20240113000000_update_supplier_rank_constraint.sql` |
| 14 | `20240706000050_fix_supplier_rank_constraint.sql` | `20240114000000_fix_supplier_rank_constraint.sql` |
| 15 | `20240706000052_use_final_price_with_vat.sql` | `20240115000000_use_final_price_with_vat.sql` |
| 16 | `20240706000053_create_modular_reservations.sql` | `20240116000000_create_modular_reservations.sql` |
| 17 | `20240706000053_fix_final_price_with_vat_correct.sql` | `20240117000000_fix_final_price_with_vat_correct.sql` |
| 18 | `20250101000000_create_reservations_module.sql` | `20240118000000_create_reservations_module.sql` |
| 19 | `20250101000001_add_payment_method_to_petty_cash.sql` | `20240119000000_add_payment_method_to_petty_cash.sql` |
| 20 | `20250101000013_add_parent_id_to_warehouse.sql` | `20240120000000_add_parent_id_to_warehouse.sql` |
| 21 | `20250101000014_create_supplier_payment_table.sql` | `20240121000000_create_supplier_payment_table.sql` |
| 22 | `20250101000015_create_storage_buckets.sql` | `20240122000000_create_storage_buckets.sql` |
| 23 | `20250101000018_add_type_and_equipment_fields_to_product.sql` | `20240123000000_add_type_and_equipment_fields_to_product.sql` |
| 24 | `20250101000019_add_service_counter_to_product.sql` | `20240124000000_add_service_counter_to_product.sql` |
| 25 | `20250101000020_create_inventory_physical_history_table.sql` | `20240125000000_create_inventory_physical_history_table.sql` |
| 26 | `20250101000020_make_client_id_required_reservations.sql` | `20240126000000_make_client_id_required_reservations.sql` |
| 27 | `20250101000020_modular_products_system.sql` | `20240127000000_modular_products_system.sql` |
| 28 | `20250101000021_create_product_package_linkage.sql` | `20240128000000_create_product_package_linkage.sql` |
| 29 | `20250101000022_create_supplier_tags.sql` | `20240129000000_create_supplier_tags.sql` |
| 30 | `20250101000023_fix_reservation_products_references.sql` | `20240130000000_fix_reservation_products_references.sql` |
| 31 | `20250101000040_update_supplier_rank_types.sql` | `20240131000000_update_supplier_rank_types.sql` |
| 32 | `20250101000041_update_supplier_rank_constraint.sql` | `20240201000000_update_supplier_rank_constraint.sql` |
| 33 | `20250101000050_fix_supplier_rank_constraint.sql` | `20240202000000_fix_supplier_rank_constraint.sql` |
| 34 | `20250101000052_use_final_price_with_vat.sql` | `20240203000000_use_final_price_with_vat.sql` |
| 35 | `20250101000053_create_modular_reservations.sql` | `20240204000000_create_modular_reservations.sql` |
| 36 | `20250101000053_fix_final_price_with_vat_correct.sql` | `20240205000000_fix_final_price_with_vat_correct.sql` |
| 37 | `20250102000001_add_modular_reservations_rls_policies.sql` | `20240206000000_add_modular_reservations_rls_policies.sql` |
| 38 | `20250109000001_fix_sales_client_references.sql` | `20240207000000_fix_sales_client_references.sql` |
| 39 | `20250109000002_create_budget_lines_function.sql` | `20240208000000_create_budget_lines_function.sql` |
| 40 | `20250109000003_create_product_components_table.sql` | `20240209000000_create_product_components_table.sql` |
| 41 | `20250110000001_create_sales_discounts.sql` | `20240210000000_create_sales_discounts.sql` |
| 42 | `20250110000002_add_facturada_status_to_reservations.sql` | `20240211000000_add_facturada_status_to_reservations.sql` |
| 43 | `20250115000000_add_pos_enabled_to_product.sql` | `20240212000000_add_pos_enabled_to_product.sql` |
| 44 | `20250115000001_create_reservation_payments_table.sql` | `20240213000000_create_reservation_payments_table.sql` |
| 45 | `20250127000000_create_petty_cash_income.sql` | `20240214000000_create_petty_cash_income.sql` |
| 46 | `20250623003309_initial_schema.sql` | `20240215000000_initial_schema.sql` |
| 47 | `20250623174020_create_client_tables.sql` | `20240216000000_create_client_tables.sql` |
| 48 | `20250626000000_add_read_policy_to_roles.sql` | `20240217000000_add_read_policy_to_roles.sql` |
| 49 | `20250627000000_add_user_policies.sql` | `20240218000000_add_user_policies.sql` |
| 50 | `20250627000001_add_isCashier_to_user.sql` | `20240219000000_add_isCashier_to_user.sql` |
| 51 | `20250627000002_add_client_tables.sql` | `20240220000000_add_client_tables.sql` |
| 52 | `20250627000003_add_client_tables_interface.sql` | `20240221000000_add_client_tables_interface.sql` |
| 53 | `20250627000004_add_economic_sector_hierarchy.sql` | `20240222000000_add_economic_sector_hierarchy.sql` |
| 54 | `20250627000005_add_cash_register_table.sql` | `20240223000000_add_cash_register_table.sql` |
| 55 | `20250627000006_add_user_policies.sql` | `20240224000000_add_user_policies.sql` |
| 56 | `20250627000007_enable_user_read_for_all.sql` | `20240225000000_enable_user_read_for_all.sql` |
| 57 | `20250627000008_add_user_id_to_petty_cash_tables.sql` | `20240226000000_add_user_id_to_petty_cash_tables.sql` |
| 58 | `20250627000010_add_active_to_supplier.sql` | `20240227000000_add_active_to_supplier.sql` |
| 59 | `20250627230000_add_session_number_to_cash_session.sql` | `20240228000000_add_session_number_to_cash_session.sql` |
| 60 | `20250628000000_add_vat_to_supplier.sql` | `20240229000000_add_vat_to_supplier.sql` |
| 61 | `20250628000001_add_supplier_rls_policies.sql` | `20240301000000_add_supplier_rls_policies.sql` |
| 62 | `20250628000002_implement_supplier_role_based_permissions.sql` | `20240302000000_implement_supplier_role_based_permissions.sql` |
| 63 | `20250628000004_fix_user_role_function_properly.sql` | `20240303000000_fix_user_role_function_properly.sql` |
| 64 | `20250628000005_setup_client_images_storage.sql` | `20240304000000_setup_client_images_storage.sql` |
| 65 | `20250628000010_create_supplier_contact_table.sql` | `20240305000000_create_supplier_contact_table.sql` |
| 66 | `20250628000011_create_supplier_contact_table_safe.sql` | `20240306000000_create_supplier_contact_table_safe.sql` |
| 67 | `20250628000012_enhance_rooms_system.sql` | `20240307000000_enhance_rooms_system.sql` |
| 68 | `20250628000014_fix_reservations_triggers.sql` | `20240308000000_fix_reservations_triggers.sql` |
| 69 | `20250629000030_add_supplierrank_column.sql` | `20240309000000_add_supplierrank_column.sql` |
| 70 | `20250629202802_fix_cash_session_rls_policies.sql` | `20240310000000_fix_cash_session_rls_policies.sql` |
| 71 | `20250629204218_fix_petty_cash_transactions_rls_policies.sql` | `20240311000000_fix_petty_cash_transactions_rls_policies.sql` |
| 72 | `20250630000001_add_client_integration_to_reservations.sql` | `20240312000000_add_client_integration_to_reservations.sql` |
| 73 | `20250630000002_add_icono_to_supplier_tags.sql` | `20240313000000_add_icono_to_supplier_tags.sql` |
| 74 | `20250630164638_fix_product_creation_rls.sql` | `20240314000000_fix_product_creation_rls.sql` |
| 75 | `20250630170600_fix_all_rls_policies.sql` | `20240315000000_fix_all_rls_policies.sql` |
| 76 | `20250701120000_fix_warehouse_product_rls.sql` | `20240316000000_fix_warehouse_product_rls.sql` |
| 77 | `20250703000001_add_category_id_to_spa_products.sql` | `20240317000000_add_category_id_to_spa_products.sql` |
| 78 | `20250703000003_create_programas_alojamiento_category.sql` | `20240318000000_create_programas_alojamiento_category.sql` |
| 79 | `20250703000004_create_season_configuration.sql` | `20240319000000_create_season_configuration.sql` |
| 80 | `20250704000001_fix_price_function_final.sql` | `20240320000000_fix_price_function_final.sql` |
| 81 | `20250705000001_add_final_price_with_vat_to_product.sql` | `20240321000000_add_final_price_with_vat_to_product.sql` |
| 82 | `20250705002042_create_inventory_movements_table.sql` | `20240322000000_create_inventory_movements_table.sql` |
| 83 | `20250709151437_20250708_create_sales_module.sql` | `20240323000000_20250708_create_sales_module.sql` |
| 84 | `20250710145222_final_pos_system.sql` | `20240324000000_final_pos_system.sql` |
| 85 | `20250710150000_add_generate_sale_number_function.sql` | `20240325000000_add_generate_sale_number_function.sql` |
