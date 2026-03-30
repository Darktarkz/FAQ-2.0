<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DependenciaSeeder extends Seeder
{
    public function run(): void
    {
        $dependencias = [
            'Dirección General',
            'Subdirección de las Artes',
            'Subdirección de Formación Artística',
            'Subdirección de Equipamientos Culturales',
            'Subdirección Administrativa y Financiera',
            'Oficina Asesora Planeación y tecnologías de la información',
            'Subdirección Jurídica',
            'Asesoría de Comunicaciones',
            'Asesoría de Control Interno',
            'Gerencia de Danza',
            'Gerencia de Artes Audiovisuales',
            'Gerencia de Escenarios',
            'Gerencia de Arte Dramático',
            'Gerencia de Artes Plásticas y Visuales',
            'Gerencia de Música',
            'Gerencia de Literatura',
            'Talento Humano',
            'Gerencia Nidos',
            'Gerencia Crea',
            'Línea Estratégica Arte Ciencia y Tecnología',
            'Línea Estratégica Emprendimiento',
            'Convocatorias',
            'Teatro Mayor Julio Mario Santo Domingo',
            'Planetario de Bogotá',
            'Área de Producción',
            'Servicios Generales',
            'Gestión Documental',
            'Culturas en Común',
            'Linea Arte y Memoria sin Fronteras',
            'GALERÍA Santa Fe',
            'Gerencia de Contratación',
            'Subdirección de Infraestructura',
            'Gerencia de Escenarios Territoriales',
        ];

        $now = now();
        $rows = array_map(fn($nombre) => [
            'nombre'     => $nombre,
            'activo'     => true,
            'created_at' => $now,
            'updated_at' => $now,
        ], $dependencias);

        DB::table('dependencias')->insertOrIgnore($rows);
    }
}
