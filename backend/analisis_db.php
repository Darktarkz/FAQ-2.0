<?php
// Configuración de conexión
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "faqv2";

// Crear conexión
$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}

echo "=== ANÁLISIS DE ESTRUCTURA DE BASES DE DATOS ===\n\n";

// 1. Estructura de tabla PREGUNTAS
echo "1. TABLA: preguntas\n";
echo "===================\n";
$result = $conn->query("DESCRIBE preguntas");
while ($row = $result->fetch_assoc()) {
    echo sprintf("%-20s %-20s %-20s %-10s\n", 
        $row['Field'], $row['Type'], $row['Null'], $row['Key']);
}

echo "\n2. TABLA: categorias (alias para MODULOS PADRES)\n";
echo "================================================\n";
$result = $conn->query("DESCRIBE categorias");
while ($row = $result->fetch_assoc()) {
    echo sprintf("%-20s %-20s %-20s %-10s\n", 
        $row['Field'], $row['Type'], $row['Null'], $row['Key']);
}

echo "\n3. TABLA: modulos (TABLA JERÁRQUICA)\n";
echo "====================================\n";
$result = $conn->query("DESCRIBE modulos");
while ($row = $result->fetch_assoc()) {
    echo sprintf("%-20s %-20s %-20s %-10s\n", 
        $row['Field'], $row['Type'], $row['Null'], $row['Key']);
}

echo "\n4. RELACIÓN ENTRE TABLAS\n";
echo "=======================\n";

// Información sobre el contenido
echo "\n5. DATOS DE EJEMPLO:\n";
echo "===================\n";

echo "\nCategorias (Módulos Padres):\n";
$result = $conn->query("SELECT id, nombre FROM categorias LIMIT 5");
while ($row = $result->fetch_assoc()) {
    echo "  ID: {$row['id']}, Nombre: {$row['nombre']}\n";
}

echo "\nModulos (Submódulos):\n";
$result = $conn->query("SELECT id, nombre, id_padre FROM modulos LIMIT 5");
while ($row = $result->fetch_assoc()) {
    echo "  ID: {$row['id']}, Nombre: {$row['nombre']}, ID_Padre: {$row['id_padre']}\n";
}

echo "\nPreguntas:\n";
$result = $conn->query("SELECT id, Pregunta, Idmodulo, Modulo, Submodulo FROM preguntas LIMIT 3");
while ($row = $result->fetch_assoc()) {
    echo "  ID: {$row['id']}\n";
    echo "    Pregunta: {$row['Pregunta']}\n";
    echo "    Idmodulo: {$row['Idmodulo']}\n";
    echo "    Modulo: {$row['Modulo']}\n";
    echo "    Submodulo: {$row['Submodulo']}\n";
}

echo "\n6. RESUMEN DE INTERCONEXIÓN:\n";
echo "===========================\n";
echo "- PREGUNTAS.Idmodulo → MODULOS.id (relación de N:1)\n";
echo "- MODULOS.id_padre → MODULOS.id (relación jerárquica auto-referenciada)\n";
echo "- MODULOS.id_categoria → CATEGORIAS.id (relación de N:1)\n";
echo "- CATEGORIAS es la tabla BASE para los módulos padres\n";
echo "- MODULOS puede tener submódulos (cuando id_padre NO es NULL)\n";

$conn->close();
?>
