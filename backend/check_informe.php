<?php
$conn = new mysqli('localhost', 'root', '', 'faqv2');
if ($conn->connect_error) die('Error: ' . $conn->connect_error);

echo "=== JERARQUÍA DE MÓDULOS ===\n\n";

// Buscar INFORME DE PAGO
$result = $conn->query("SELECT * FROM modulos WHERE nombre LIKE '%INFORME%PAGO%'");
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        echo "Módulo encontrado: ID={$row['id']}, Nombre={$row['nombre']}, idpadre={$row['idpadre']}\n";
        $informeId = $row['id'];
        
        // Buscar sus hijos
        echo "\nBuscando hijos de ID $informeId:\n";
        $hijos = $conn->query("SELECT * FROM modulos WHERE idpadre = $informeId");
        if ($hijos->num_rows > 0) {
            while ($hijo = $hijos->fetch_assoc()) {
                echo "  - Hijo: ID={$hijo['id']}, Nombre={$hijo['nombre']}, idpadre={$hijo['idpadre']}\n";
            }
        } else {
            echo "  (No tiene hijos)\n";
        }
    }
} else {
    echo "No se encontró INFORME DE PAGO\n";
}

$conn->close();
