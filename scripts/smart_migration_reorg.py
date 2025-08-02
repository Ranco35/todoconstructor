#!/usr/bin/env python3
"""
Script inteligente para reorganizar migraciones
Solo procesa archivos que realmente existen
"""

import os
from pathlib import Path

def find_existing_migrations():
    """Encuentra todas las migraciones que realmente existen"""
    migrations_dir = Path('supabase/migrations')
    backup_dir = Path('supabase/migrations_backup_20250709')
    
    existing_files = {}
    
    # Buscar en directorio principal
    if migrations_dir.exists():
        for file in os.listdir(migrations_dir):
            if file.endswith('.sql'):
                existing_files[file] = migrations_dir / file
    
    # Buscar en directorio de backup
    if backup_dir.exists():
        for file in os.listdir(backup_dir):
            if file.endswith('.sql'):
                if file not in existing_files:  # No sobrescribir si ya existe en principal
                    existing_files[file] = backup_dir / file
    
    return existing_files

def generate_smart_script():
    """Genera un script bash solo con archivos existentes"""
    existing_files = find_existing_migrations()
    
    print(f"Archivos encontrados: {len(existing_files)}")
    
    # Crear script bash
    script_content = """#!/bin/bash
# Script inteligente de reorganización de migraciones
# Solo procesa archivos que realmente existen

set -e

echo "=== REORGANIZACIÓN INTELIGENTE DE MIGRACIONES ==="

# Crear respaldo
BACKUP_NAME="migrations_backup_$(date +%Y%m%d_%H%M%S)"
echo "Creando respaldo: supabase/$BACKUP_NAME"
cp -r supabase/migrations supabase/$BACKUP_NAME

# Crear directorio temporal
echo "Creando directorio temporal..."
mkdir -p temp_migrations_reorg

# Copiar todos los archivos existentes
echo "Copiando archivos existentes..."
"""
    
    # Copiar archivos existentes
    for filename, filepath in existing_files.items():
        script_content += f'cp "{filepath}" temp_migrations_reorg/\n'
    
    script_content += """
# Limpiar directorio de migraciones
echo "Limpiando directorio de migraciones..."
cd supabase/migrations
rm -f *.sql

# Reorganizar archivos
echo "Reorganizando archivos..."
cd ../../temp_migrations_reorg

# Lista de archivos a renombrar (solo los que existen)
"""
    
    # Mapeo de archivos existentes a nuevos nombres
    counter = 1
    for filename in sorted(existing_files.keys()):
        # Extraer nombre descriptivo
        parts = filename.split('_', 1)
        if len(parts) > 1:
            descriptive_name = parts[1]
        else:
            descriptive_name = filename
        
        # Crear nueva fecha
        from datetime import datetime, timedelta
        base_date = datetime(2024, 1, 1, 0, 0, 0)
        new_date = base_date + timedelta(days=counter-1)
        new_filename = f"{new_date.strftime('%Y%m%d%H%M%S')}_{descriptive_name}"
        
        script_content += f'cp "{filename}" "../supabase/migrations/{new_filename}"\n'
        counter += 1
    
    script_content += """
# Limpiar directorio temporal
cd ..
rm -rf temp_migrations_reorg

echo "Migraciones reorganizadas exitosamente!"
echo "Total de migraciones procesadas: """ + str(len(existing_files)) + """"
echo "Verificar que todo funcione correctamente antes de continuar."
"""
    
    # Guardar script
    script_path = Path('scripts/smart_reorg.sh')
    with open(script_path, 'w', newline='\n') as f:
        f.write(script_content)
    
    print(f"Script generado: {script_path}")
    print(f"Archivos a procesar: {len(existing_files)}")
    
    # Mostrar lista de archivos
    print("\nArchivos encontrados:")
    for i, filename in enumerate(sorted(existing_files.keys()), 1):
        print(f"{i:3d}. {filename}")
    
    return script_path

if __name__ == "__main__":
    script_path = generate_smart_script()
    print(f"\nPara aplicar la reorganización:")
    print(f"bash {script_path}") 