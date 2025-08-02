#!/usr/bin/env python3
"""
Script para reorganizar las migraciones de Supabase
Ordena las migraciones por fecha cronológica y elimina duplicados
"""

import os
import shutil
import re
from datetime import datetime
from pathlib import Path

def parse_migration_date(filename):
    """Extrae la fecha de un nombre de archivo de migración"""
    match = re.match(r'(\d{14})', filename)
    if match:
        date_str = match.group(1)
        return datetime.strptime(date_str, '%Y%m%d%H%M%S')
    return None

def get_migration_files(migrations_dir):
    """Obtiene todos los archivos de migración ordenados por fecha"""
    files = []
    for file in os.listdir(migrations_dir):
        if file.endswith('.sql') and not file.startswith('.'):
            date = parse_migration_date(file)
            if date:
                files.append((date, file))
    
    # Ordenar por fecha
    files.sort(key=lambda x: x[0])
    return files

def reorganize_migrations():
    """Reorganiza las migraciones en orden cronológico"""
    migrations_dir = Path('supabase/migrations')
    backup_dir = Path('supabase/migrations_backup_20250709')
    
    print("=== REORGANIZACIÓN DE MIGRACIONES ===")
    print(f"Directorio de migraciones: {migrations_dir}")
    print(f"Directorio de respaldo: {backup_dir}")
    
    # Obtener archivos actuales
    current_files = get_migration_files(migrations_dir)
    backup_files = get_migration_files(backup_dir) if backup_dir.exists() else []
    
    print(f"\nMigraciones actuales: {len(current_files)}")
    print(f"Migraciones en respaldo: {len(backup_files)}")
    
    # Crear directorio temporal para reorganización
    temp_dir = Path('temp_migrations_reorg')
    temp_dir.mkdir(exist_ok=True)
    
    # Procesar migraciones actuales
    processed_files = set()
    new_migrations = []
    
    for date, filename in current_files:
        if filename not in processed_files:
            processed_files.add(filename)
            new_migrations.append((date, filename))
    
    # Procesar migraciones del respaldo que no están en actuales
    for date, filename in backup_files:
        if filename not in processed_files:
            processed_files.add(filename)
            new_migrations.append((date, filename))
    
    # Ordenar por fecha
    new_migrations.sort(key=lambda x: x[0])
    
    print(f"\nMigraciones únicas encontradas: {len(new_migrations)}")
    
    # Crear nuevo esquema de nombres
    reorganized_migrations = []
    counter = 1
    
    for date, filename in new_migrations:
        # Crear nueva fecha secuencial usando días desde 2024-01-01
        from datetime import timedelta
        base_date = datetime(2024, 1, 1, 0, 0, 0)
        new_date = base_date + timedelta(days=counter-1)
        
        # Formatear nueva fecha
        new_filename = f"{new_date.strftime('%Y%m%d%H%M%S')}_{filename.split('_', 1)[1]}"
        
        reorganized_migrations.append((new_filename, filename))
        counter += 1
    
    # Mostrar plan de reorganización
    print("\n=== PLAN DE REORGANIZACIÓN ===")
    for i, (new_name, old_name) in enumerate(reorganized_migrations, 1):
        print(f"{i:3d}. {old_name}")
        print(f"     → {new_name}")
    
    # Crear script de aplicación
    script_content = f"""#!/bin/bash
# Script generado automáticamente para reorganizar migraciones
# Ejecutar con cuidado y hacer respaldo antes

echo "Creando respaldo de migraciones actuales..."
cp -r supabase/migrations supabase/migrations_backup_$(date +%Y%m%d_%H%M%S)

echo "Reorganizando migraciones..."

cd supabase/migrations

"""
    
    for new_name, old_name in reorganized_migrations:
        script_content += f'mv "{old_name}" "{new_name}"\n'
    
    script_content += """
echo "Migraciones reorganizadas exitosamente!"
echo "Verificar que todo funcione correctamente antes de continuar."
"""
    
    # Guardar script
    script_path = Path('scripts/apply_migration_reorg.sh')
    script_path.parent.mkdir(exist_ok=True)
    
    with open(script_path, 'w') as f:
        f.write(script_content)
    
    print(f"\nScript de aplicación guardado en: {script_path}")
    print("\nPara aplicar la reorganización:")
    print(f"1. Revisar el plan anterior")
    print(f"2. Ejecutar: bash {script_path}")
    print(f"3. Verificar que las migraciones funcionen correctamente")
    
    # Crear reporte detallado
    report_path = Path('scripts/migration_reorg_report.md')
    with open(report_path, 'w') as f:
        f.write("# Reporte de Reorganización de Migraciones\n\n")
        f.write(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"Total de migraciones procesadas: {len(reorganized_migrations)}\n\n")
        f.write("## Mapeo de archivos:\n\n")
        f.write("| # | Archivo Original | Archivo Nuevo |\n")
        f.write("|---|------------------|---------------|\n")
        
        for i, (new_name, old_name) in enumerate(reorganized_migrations, 1):
            f.write(f"| {i} | `{old_name}` | `{new_name}` |\n")
    
    print(f"\nReporte detallado guardado en: {report_path}")

if __name__ == "__main__":
    reorganize_migrations() 