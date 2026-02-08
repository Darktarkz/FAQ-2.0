<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Categoria extends Model
{
    protected $fillable = ['nombre', 'descripcion', 'icono'];
    
    public $timestamps = true;
    
    public function modulos()
    {
        return $this->hasMany(Modulo::class, 'id_categoria');
    }
}
