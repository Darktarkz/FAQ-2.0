<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Modulo extends Model
{
    protected $table = 'modulos';
    // PK real en BD: id (auto_increment)
    protected $primaryKey = 'id';
    public $incrementing = true;
    protected $keyType = 'int';
    
    // Permitimos tanto los nombres de base de datos como los nombres normalizados
    protected $fillable = ['modulo', 'descripción', 'id_padre', 'icono', 'nombre', 'descripcion', 'idpadre'];
    
    public $timestamps = false;
    
    // Mapear los nombres de las columnas de la BD a los nombres que usa la aplicación
    protected $casts = [
        'id_padre' => 'integer',
    ];
    
    // Accessor para 'nombre' que mapea a 'modulo'
    public function getNombreAttribute()
    {
        return $this->attributes['modulo'] ?? null;
    }
    
    // Mutator para 'nombre' que guarda en 'modulo'
    public function setNombreAttribute($value)
    {
        $this->attributes['modulo'] = $value;
    }
    
    // Accessor para 'descripcion' que mapea a 'descripción'
    public function getDescripcionAttribute()
    {
        return $this->attributes['descripción'] ?? null;
    }
    
    // Mutator para 'descripcion' que guarda en 'descripción'
    public function setDescripcionAttribute($value)
    {
        $this->attributes['descripción'] = $value;
    }
    
    // Accessor para 'idpadre' que mapea a 'id_padre'
    public function getIdpadreAttribute()
    {
        return $this->attributes['id_padre'] ?? null;
    }
    
    // Mutator para 'idpadre' que guarda en 'id_padre'
    public function setIdpadreAttribute($value)
    {
        $this->attributes['id_padre'] = $value;
    }
    
    // Asegurar que estos atributos aparezcan en el JSON
    protected $appends = ['nombre', 'descripcion', 'idpadre'];
    
    // Ocultar los nombres originales de la BD en el JSON
    protected $hidden = ['modulo', 'descripción', 'id_padre'];
}
