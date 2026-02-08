-- Script SQL para verificar y crear la jerarquía correcta
-- Ejecutar en phpMyAdmin o cliente MySQL

-- 1. Ver la estructura actual de INFORME DE PAGO
SELECT 
    m1.id as 'ID Padre',
    m1.nombre as 'Nombre Padre',
    m1.idpadre as 'ID Abuelo',
    m2.id as 'ID Hijo',
    m2.nombre as 'Nombre Hijo',
    m2.idpadre as 'Apunta a Padre'
FROM modulos m1
LEFT JOIN modulos m2 ON m2.idpadre = m1.id
WHERE m1.nombre LIKE '%INFORME%PAGO%'
ORDER BY m1.id, m2.id;

-- 2. Verificar si existen los submódulos "eres supervisor" y "eres contratista"
SELECT * FROM modulos 
WHERE nombre LIKE '%supervisor%' OR nombre LIKE '%contratista%';

-- 3. Encontrar el ID de INFORME DE PAGO
SELECT id, nombre, idpadre FROM modulos WHERE nombre LIKE '%INFORME%PAGO%';

-- 4. Si necesitas crearlos (SOLO SI NO EXISTEN), usar algo como:
-- IMPORTANTE: Reemplaza XX con el ID real de INFORME DE PAGO

-- INSERT INTO modulos (nombre, descripcion, idpadre) 
-- VALUES ('ERES SUPERVISOR', 'Opciones para supervisores en informes de pago', XX);

-- INSERT INTO modulos (nombre, descripcion, idpadre) 
-- VALUES ('ERES CONTRATISTA', 'Opciones para contratistas en informes de pago', XX);
