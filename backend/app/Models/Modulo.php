<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Modulo extends Model
{
    protected $table = 'modulos';
    protected $primaryKey = 'id';
    public $incrementing = true;
    protected $keyType = 'int';

    // Columnas reales en la BD: nombre, descripcion, icono, idpadre
    protected $fillable = ['nombre', 'descripcion', 'icono', 'idpadre'];

    public $timestamps = true;

    protected $casts = [
        'idpadre' => 'integer',
    ];
}
