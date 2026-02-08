<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Collection;
use App\Models\Modulo;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'is_admin',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
        ];
    }

    /**
     * Check if user is admin
     */
    public function isAdmin(): bool
    {
        return $this->is_admin === true;
    }

    /**
     * Módulos asignados directamente al usuario.
     */
    public function modulos()
    {
        return $this->belongsToMany(Modulo::class, 'modulo_user', 'user_id', 'modulo_id')
                    ->select(['modulos.id', 'modulos.modulo', 'modulos.descripción', 'modulos.id_padre', 'modulos.icono']);
    }

    /**
     * IDs de módulos permitidos (asignados + todos sus descendientes).
     */
    public function permittedModuloIds(): array
    {
        $directos = $this->modulos()->pluck('id')->toArray();

        if ($this->isAdmin()) {
            return Modulo::pluck('id')->toArray();
        }

        if (empty($directos)) {
            return [];
        }

        $todos = Modulo::all();
        $childrenByParent = [];

        foreach ($todos as $modulo) {
            $parentKey = $modulo->idpadre ?? 'root';
            $childrenByParent[$parentKey][] = $modulo->id;
        }

        $allowed = collect($directos);
        $queue = new Collection($directos);

        while ($queue->isNotEmpty()) {
            $current = $queue->shift();
            $children = $childrenByParent[$current] ?? [];
            foreach ($children as $childId) {
                if (!$allowed->contains($childId)) {
                    $allowed->push($childId);
                    $queue->push($childId);
                }
            }
        }

        return $allowed->unique()->values()->all();
    }

    /**
     * Verifica si el usuario puede gestionar un módulo específico.
     */
    public function canManageModulo(int $moduloId): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        return in_array($moduloId, $this->permittedModuloIds(), true);
    }
}
