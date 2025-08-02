# ================================================
# SCRIPT DE REORGANIZACIÓN DE MIGRACIONES
# Admintermas - Reorganización Cronológica
# ================================================

Write-Host "=== REORGANIZACIÓN DE MIGRACIONES ADMINTERMAS ===" -ForegroundColor Green
Write-Host "Iniciando proceso de reorganización..." -ForegroundColor Yellow

# 1. CREAR LISTA DE MIGRACIONES ACTUALES
Write-Host "1. Analizando migraciones actuales..." -ForegroundColor Cyan

$migrations = @(
    # Migraciones base (mantener fechas originales)
    @{ File = "20250623003309_initial_schema.sql"; KeepDate = $true },
    @{ File = "20250626000000_add_read_policy_to_roles.sql"; KeepDate = $true },
    @{ File = "20250627000000_add_user_policies.sql"; KeepDate = $true },
    @{ File = "20250627000001_add_isCashier_to_user.sql"; KeepDate = $true },
    @{ File = "20250627000002_add_client_tables.sql"; KeepDate = $true },
    @{ File = "20250627000003_add_client_tables_interface.sql"; KeepDate = $true },
    @{ File = "20250627000004_add_economic_sector_hierarchy.sql"; KeepDate = $true },
    @{ File = "20250627000005_add_cash_register_table.sql"; KeepDate = $true },
    @{ File = "20250627000006_add_user_policies.sql"; KeepDate = $true },
    @{ File = "20250627000007_enable_user_read_for_all.sql"; KeepDate = $true },
    @{ File = "20250627000008_add_user_id_to_petty_cash_tables.sql"; KeepDate = $true },
    @{ File = "20250627000010_add_active_to_supplier.sql"; KeepDate = $true },
    @{ File = "20250627230000_add_session_number_to_cash_session.sql"; KeepDate = $true },
    @{ File = "20250628000000_add_vat_to_supplier.sql"; KeepDate = $true },
    @{ File = "20250628000001_add_supplier_rls_policies.sql"; KeepDate = $true },
    @{ File = "20250628000002_implement_supplier_role_based_permissions.sql"; KeepDate = $true },
    @{ File = "20250628000004_fix_user_role_function_properly.sql"; KeepDate = $true },
    @{ File = "20250628000005_setup_client_images_storage.sql"; KeepDate = $true },
    @{ File = "20250628000010_create_supplier_contact_table.sql"; KeepDate = $true },
    @{ File = "20250628000011_create_supplier_contact_table_safe.sql"; KeepDate = $true },
    @{ File = "20250628000012_enhance_rooms_system.sql"; KeepDate = $true },
    @{ File = "20250628000014_fix_reservations_triggers.sql"; KeepDate = $true },
    @{ File = "20250629000030_add_supplierrank_column.sql"; KeepDate = $true },
    @{ File = "20250629202802_fix_cash_session_rls_policies.sql"; KeepDate = $true },
    @{ File = "20250629204218_fix_petty_cash_transactions_rls_policies.sql"; KeepDate = $true },
    @{ File = "20250630000001_add_client_integration_to_reservations.sql"; KeepDate = $true },
    @{ File = "20250630000002_add_icono_to_supplier_tags.sql"; KeepDate = $true },
    @{ File = "20250630164638_fix_product_creation_rls.sql"; KeepDate = $true },
    @{ File = "20250630164639_fix_product_rls_policies.sql"; KeepDate = $true },
    @{ File = "20250630170600_fix_all_rls_policies.sql"; KeepDate = $true },
    @{ File = "20250701120000_fix_warehouse_product_rls.sql"; KeepDate = $true },
    @{ File = "20250703000001_add_category_id_to_spa_products.sql"; KeepDate = $true },
    @{ File = "20250703000003_create_programas_alojamiento_category.sql"; KeepDate = $true },
    @{ File = "20250703000004_create_season_configuration.sql"; KeepDate = $true },
    @{ File = "20250704000001_fix_price_function_final.sql"; KeepDate = $true },
    @{ File = "20250705000001_add_final_price_with_vat_to_product.sql"; KeepDate = $true },
    @{ File = "20250705002042_create_inventory_movements_table.sql"; KeepDate = $true },
    
    # Migraciones que necesitan fecha corregida (cambiar de 2025 a 2024)
    @{ File = "20250101000000_create_reservations_module.sql"; NewDate = "20240706000000" },
    @{ File = "20250101000001_add_payment_method_to_petty_cash.sql"; NewDate = "20240706000001" },
    @{ File = "20250101000013_add_parent_id_to_warehouse.sql"; NewDate = "20240706000002" },
    @{ File = "20250101000014_create_supplier_payment_table.sql"; NewDate = "20240706000003" },
    @{ File = "20250101000015_create_storage_buckets.sql"; NewDate = "20240706000004" },
    @{ File = "20250101000018_add_type_and_equipment_fields_to_product.sql"; NewDate = "20240706000005" },
    @{ File = "20250101000019_add_service_counter_to_product.sql"; NewDate = "20240706000006" },
    @{ File = "20250101000020_modular_products_system.sql"; NewDate = "20240706000007" },
    @{ File = "20250101000020_make_client_id_required_reservations.sql"; NewDate = "20240706000008" },
    @{ File = "20250101000020_create_inventory_physical_history_table.sql"; NewDate = "20240706000009" },
    @{ File = "20250101000021_create_product_package_linkage.sql"; NewDate = "20240706000010" },
    @{ File = "20250101000022_create_supplier_tags.sql"; NewDate = "20240706000011" },
    @{ File = "20250101000041_update_supplier_rank_constraint.sql"; NewDate = "20240706000012" },
    @{ File = "20250101000050_fix_supplier_rank_constraint.sql"; NewDate = "20240706000013" },
    @{ File = "20250101000052_use_final_price_with_vat.sql"; NewDate = "20240706000014" },
    @{ File = "20250101000053_create_modular_reservations.sql"; NewDate = "20240706000015" },
    @{ File = "20250101000053_fix_final_price_with_vat_correct.sql"; NewDate = "20240706000016" },
    @{ File = "20250102000001_add_modular_reservations_rls_policies.sql"; NewDate = "20240706000017" },
    @{ File = "20250115000001_create_reservation_payments_table.sql"; NewDate = "20240706000018" },
    @{ File = "20250127000000_create_petty_cash_income.sql"; NewDate = "20240706000019" }
)

# 2. PROCESAR MIGRACIONES
Write-Host "2. Procesando migraciones..." -ForegroundColor Cyan

foreach ($migration in $migrations) {
    $file = $migration.File
    $fullPath = "supabase/migrations/$file"
    
    if (Test-Path $fullPath) {
        if ($migration.KeepDate) {
            Write-Host "✓ Manteniendo: $file" -ForegroundColor Green
        } else {
            $newDate = $migration.NewDate
            $newFileName = $file -replace "^20250101", $newDate.Substring(0, 8)
            $newFullPath = "supabase/migrations/$newFileName"
            
            if ($newFileName -ne $file) {
                Write-Host "🔄 Renombrando: $file → $newFileName" -ForegroundColor Yellow
                try {
                    Rename-Item -Path $fullPath -NewName $newFileName -Force
                    Write-Host "  ✓ Renombrado exitosamente" -ForegroundColor Green
                } catch {
                    Write-Host "  ✗ Error al renombrar: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
    } else {
        Write-Host "⚠️  Archivo no encontrado: $file" -ForegroundColor Yellow
    }
}

# 3. VERIFICAR RESULTADO
Write-Host "3. Verificando resultado..." -ForegroundColor Cyan

$finalMigrations = Get-ChildItem -Path "supabase/migrations" -Filter "*.sql" | 
    Where-Object { $_.Name -notlike "*_obsolete*" -and $_.Name -notlike "*_pendientes*" } |
    Sort-Object Name

Write-Host "`n=== MIGRACIONES FINALES ===" -ForegroundColor Green
foreach ($migration in $finalMigrations) {
    Write-Host "  $($migration.Name)" -ForegroundColor White
}

Write-Host "`n=== RESUMEN ===" -ForegroundColor Green
Write-Host "Total de migraciones activas: $($finalMigrations.Count)" -ForegroundColor White
Write-Host "Migraciones obsoletas: $(Get-ChildItem -Path 'supabase/migrations/_obsolete' -Filter '*.sql').Count" -ForegroundColor White

Write-Host "`n✅ Reorganización completada exitosamente!" -ForegroundColor Green
Write-Host "📝 Revisa el archivo docs/database/plan-organizacion-migraciones.md para más detalles" -ForegroundColor Cyan 