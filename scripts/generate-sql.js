// Script para generar SQL basado en el schema de Prisma
// Este script creará las sentencias SQL para todas las tablas

const fs = require('fs');
const path = require('path');

// Leer el schema de Prisma
const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Extraer los modelos del schema
const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
const models = [];
let match;

while ((match = modelRegex.exec(schemaContent)) !== null) {
  const modelName = match[1];
  const modelContent = match[2];
  models.push({ name: modelName, content: modelContent });
}

// Generar SQL para cada modelo
let sqlOutput = `-- Script SQL generado automáticamente desde Prisma Schema
-- Para ejecutar en Supabase SQL Editor

`;

models.forEach(model => {
  sqlOutput += `-- Tabla: ${model.name}\n`;
  sqlOutput += `CREATE TABLE IF NOT EXISTS "${model.name}" (\n`;
  
  // Extraer campos del modelo
  const fieldRegex = /(\w+)\s+(\w+)(\?)?(\s+@[^@\n]+)?/g;
  const fields = [];
  let fieldMatch;
  
  while ((fieldMatch = fieldRegex.exec(model.content)) !== null) {
    const fieldName = fieldMatch[1];
    const fieldType = fieldMatch[2];
    const isOptional = fieldMatch[3] === '?';
    
    // Mapear tipos de Prisma a PostgreSQL
    let pgType = 'TEXT';
    if (fieldType === 'Int') pgType = 'INTEGER';
    else if (fieldType === 'Float') pgType = 'REAL';
    else if (fieldType === 'Boolean') pgType = 'BOOLEAN';
    else if (fieldType === 'DateTime') pgType = 'TIMESTAMP';
    else if (fieldType === 'String') pgType = 'TEXT';
    
    const nullable = isOptional ? '' : ' NOT NULL';
    fields.push(`  "${fieldName}" ${pgType}${nullable}`);
  }
  
  sqlOutput += fields.join(',\n');
  sqlOutput += '\n);\n\n';
});

// Escribir el archivo SQL
const outputPath = path.join(__dirname, '../database-schema.sql');
fs.writeFileSync(outputPath, sqlOutput);

console.log('✅ SQL generado exitosamente en: database-schema.sql');
console.log('📋 Copia y pega este contenido en el SQL Editor de Supabase'); 