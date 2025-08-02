with open('scripts/apply_migration_reorg.sh', 'rb') as f:
    content = f.read().replace(b'\r\n', b'\n')

with open('scripts/apply_migration_reorg_fixed.sh', 'wb') as f:
    f.write(content) 