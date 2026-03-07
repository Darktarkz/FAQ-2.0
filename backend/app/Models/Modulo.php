<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Modulo extends Model
{
    protected $table = 'modulos';
    protected $primaryKey = 'id';
    public $incrementing = true;
    protected $keyType = 'int';

    // Columnas reales en la BD: modulo, id_padre, descripción, icono
    protected $fillable = ['nombre', 'descripcion', 'idpadre', 'icono'];

    public $timestamps = true;

    // Exponer nombres normalizados en el JSON de respuesta
    protected $appends = ['nombre', 'idpadre', 'descripcion'];

    // Ocultar las columnas con nombres originales de la BD
    protected $hidden = ['modulo', 'id_padre', 'descripción'];

    protected function nombre(): Attribute
    {
        return Attribute::make(
            get: fn ($value, array $attributes) => $attributes['modulo'] ?? null,
            set: fn ($value) => ['modulo' => $value],
        );
    }

    protected function idpadre(): Attribute
    {
        return Attribute::make(
            get: fn ($value, array $attributes) => isset($attributes['id_padre']) ? (int) $attributes['id_padre'] : null,
            set: fn ($value) => ['id_padre' => $value],
        );
    }

    protected function descripcion(): Attribute
    {
        return Attribute::make(
            get: fn ($value, array $attributes) => $attributes['descripción'] ?? null,
            set: fn ($value) => ['descripción' => $value],
        );
    }
}
