<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VotoPregunta extends Model
{
    protected $table = 'votos_preguntas';

    protected $fillable = [
        'pregunta_id',
        'voto',
        'session_id',
        'ip',
    ];
}
