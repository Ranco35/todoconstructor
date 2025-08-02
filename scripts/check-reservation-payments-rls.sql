-- ================================================
-- SCRIPT DE DIAGNÓSTICO RÁPIDO - reservation_payments RLS
-- ================================================
-- Uso: Ejecutar en Supabase Studio > SQL Editor para diagnosticar políticas RLS

-- 1. VERIFICAR SI EXISTE LA TABLA
SELECT 'VERIFICANDO EXISTENCIA DE TABLA...' as info;
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'reservation_payments'
) as tabla_existe;

-- 2. VERIFICAR ESTADO DE RLS
SELECT 'ESTADO DE ROW LEVEL SECURITY:' as info;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'reservation_payments';

-- 3. LISTAR POLÍTICAS ACTUALES
SELECT 'POLÍTICAS RLS ACTUALES:' as info;
SELECT 
    schemaname,
    tablename, 
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
        WHEN qual = 'true' THEN 'PERMISIVA (true)'
        ELSE 'RESTRICTIVA'
    END as tipo_politica
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'reservation_payments'
ORDER BY policyname;

-- 4. VERIFICAR PERMISOS DE TABLA
SELECT 'PERMISOS DE TABLA:' as info;
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' AND table_name = 'reservation_payments';

-- 5. CONTAR REGISTROS EXISTENTES
SELECT 'REGISTROS EN LA TABLA:' as info;
SELECT COUNT(*) as total_pagos FROM reservation_payments;

-- 6. DIAGNÓSTICO RÁPIDO
SELECT 'DIAGNÓSTICO RÁPIDO:' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'reservation_payments' 
            AND qual = 'true'
        ) THEN '✅ POLÍTICAS PERMISIVAS DETECTADAS'
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'reservation_payments'
        ) THEN '❌ POLÍTICAS RESTRICTIVAS DETECTADAS - NECESITA CORRECCIÓN'
        ELSE '⚠️ NO HAY POLÍTICAS RLS - NECESITA CONFIGURACIÓN'
    END as estado_rls;

-- 7. RECOMENDACIÓN
SELECT 'RECOMENDACIÓN:' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'reservation_payments' 
            AND policyname = 'Allow all operations on reservation_payments'
            AND qual = 'true'
        ) THEN '✅ CONFIGURACIÓN CORRECTA - No se requiere acción'
        ELSE '🔧 EJECUTAR: scripts/fix-reservation-payments-rls-policies.sql'
    END as accion_requerida; 