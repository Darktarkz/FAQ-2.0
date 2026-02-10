<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pregunta extends Model
{
    use HasFactory;

    protected $table = 'preguntas';

    // La columna PK en BD es "ID" (mayúsculas)
    protected $primaryKey = 'ID';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'Idmodulo',
        'orden',
        'Aplicativo',
        'Pregunta',
        'Respuesta',
        'Modulo',
        'Submodulo',
    ];

    // Si tu tabla no tiene timestamps (created_at, updated_at)
    public $timestamps = false;
}
