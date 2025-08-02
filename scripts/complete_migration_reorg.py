#!/usr/bin/env python3
"""
Script completo para reorganizar migraciones de Supabase
Consolida archivos desde backup y los reorganiza en orden cronológico
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

def get_all_migration_files():
    """Obtiene todas las migraciones de ambos directorios"""
    migrations_dir = Path('supabase/migrations')
    backup_dir = Path('supabase/migrations_backup_20250709')
    
    all_files = []
    
    # Procesar directorio principal
    if migrations_dir.exists():
        for file in os.listdir(migrations_dir):
            if file.endswith('.sql') and not file.startswith('.'):
                date = parse_migration_date(file)
                if date:
                    all_files.append((date, file, migrations_dir / file))
    
    # Procesar directorio de backup
    if backup_dir.exists():
        for file in os.listdir(backup_dir):
            if file.endswith('.sql') and not file.startswith('.'):
                date = parse_migration_date(file)
                if date:
                    all_files.append((date, file, backup_dir / file))
    
    return all_files

def consolidate_and_reorganize():
    """Consolida y reorganiza todas las migraciones"""
    print("=== CONSOLIDACIÓN Y REORGANIZACIÓN COMPLETA DE MIGRACIONES ===")
    
    # Obtener todos los archivos
    all_files = get_all_migration_files()
    print(f"Total de archivos encontrados: {len(all_files)}")
    
    # Crear respaldo
    backup_name = f"migrations_backup_$(date +%Y%m%d_%H%M%S)"
    print(f"Creando respaldo: supabase/{backup_name}")
    
    migrations_dir = Path('supabase/migrations')
    if migrations_dir.exists():
        shutil.copytree(migrations_dir, f"supabase/{backup_name}")
    
    # Consolidar archivos únicos
    unique_files = {}
    for date, filename, filepath in all_files:
        if filename not in unique_files:
            unique_files[filename] = (date, filepath)
    
    print(f"Archivos únicos después de consolidación: {len(unique_files)}")
    
    # Ordenar por fecha
    sorted_files = sorted(unique_files.values(), key=lambda x: x[0])
    
    # Crear nuevo esquema de nombres
    reorganized_files = []
    counter = 1
    
    for date, filepath in sorted_files:
        # Crear nueva fecha secuencial
        from datetime import timedelta
        base_date = datetime(2024, 1, 1, 0, 0, 0)
        new_date = base_date + timedelta(days=counter-1)
        
        # Extraer el nombre descriptivo del archivo
        filename = filepath.name
        descriptive_name = '_'.join(filename.split('_')[1:])
        new_filename = f"{new_date.strftime('%Y%m%d%H%M%S')}_{descriptive_name}"
        
        reorganized_files.append((new_filename, filepath))
        counter += 1
    
    # Mostrar plan
    print("\n=== PLAN DE REORGANIZACIÓN ===")
    for i, (new_name, old_path) in enumerate(reorganized_files, 1):
        print(f"{i:3d}. {old_path.name}")
        print(f"     → {new_name}")
    
    # Crear script de aplicación
    script_content = """#!/bin/bash
# Script de reorganización completa de migraciones
# Generado automáticamente

set -e  # Salir en caso de error

echo "=== REORGANIZACIÓN COMPLETA DE MIGRACIONES ==="

# Crear respaldo
BACKUP_NAME="migrations_backup_$(date +%Y%m%d_%H%M%S)"
echo "Creando respaldo: supabase/$BACKUP_NAME"
cp -r supabase/migrations supabase/$BACKUP_NAME

# Limpiar directorio de migraciones
echo "Limpiando directorio de migraciones..."
cd supabase/migrations
rm -f *.sql

"""
    
    # Agregar comandos de copia y renombrado
    for new_name, old_path in reorganized_files:
        script_content += f'cp "{old_path}" "{new_name}"\n'
    
    script_content += """
echo "Migraciones reorganizadas exitosamente!"
echo "Total de migraciones procesadas: """ + str(len(reorganized_files)) + """"
echo "Verificar que todo funcione correctamente antes de continuar."
"""
    
    # Guardar script
    script_path = Path('scripts/apply_complete_reorg.sh')
    with open(script_path, 'w', newline='\n') as f:
        f.write(script_content)
    
    # Hacer el script ejecutable
    os.chmod(script_path, 0o755)
    
    print(f"\nScript de aplicación guardado en: {script_path}")
    print(f"Total de migraciones a procesar: {len(reorganized_files)}")
    
    # Crear reporte
    report_path = Path('scripts/complete_reorg_report.md')
    with open(report_path, 'w', newline='\n') as f:
        f.write("# Reporte de Reorganización Completa de Migraciones\n\n")
        f.write(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"Total de migraciones procesadas: {len(reorganized_files)}\n\n")
        f.write("## Mapeo de archivos:\n\n")
        f.write("| # | Archivo Original | Archivo Nuevo | Origen |\n")
        f.write("|---|------------------|---------------|--------|\n")
        
        for i, (new_name, old_path) in enumerate(reorganized_files, 1):
            origen = "backup" if "backup" in str(old_path) else "main"
            f.write(f"| {i} | `{old_path.name}` | `{new_name}` | {origen} |\n")
    
    print(f"Reporte detallado guardado en: {report_path}")
    
    return script_path

if __name__ == "__main__":
    script_path = consolidate_and_reorganize()
    print(f"\nPara aplicar la reorganización completa:")
    print(f"1. Revisar el plan anterior")
    print(f"2. Ejecutar: bash {script_path}")
    print(f"3. Verificar que las migraciones funcionen correctamente") 