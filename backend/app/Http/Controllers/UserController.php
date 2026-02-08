<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
    * Lista todos los usuarios con sus módulos asignados.
    */
    public function index(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $users = User::with('modulos')->get()->map(fn (User $user) => $this->transformUser($user));

        return response()->json($users, 200);
    }

    /**
    * Crea un nuevo usuario y asigna módulos.
    */
    public function store(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'is_admin' => 'boolean',
            'modulos' => 'array',
            'modulos.*' => 'integer|exists:modulos,id',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_admin' => $validated['is_admin'] ?? false,
        ]);

        $user->modulos()->sync($validated['modulos'] ?? []);

        return response()->json($this->transformUser($user->load('modulos')), 201);
    }

    /**
    * Muestra un usuario concreto.
    */
    public function show(Request $request, User $user): JsonResponse
    {
        $this->ensureAdmin($request);

        return response()->json($this->transformUser($user->load('modulos')), 200);
    }

    /**
    * Actualiza datos y módulos de un usuario.
    */
    public function update(Request $request, User $user): JsonResponse
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => 'sometimes|nullable|string|min:8',
            'is_admin' => 'boolean',
            'modulos' => 'array',
            'modulos.*' => 'integer|exists:modulos,id',
        ]);

        $payload = collect($validated)->only(['name', 'email', 'is_admin'])->toArray();

        if (!empty($validated['password'])) {
            $payload['password'] = Hash::make($validated['password']);
        }

        $user->update($payload);

        if ($request->has('modulos')) {
            $user->modulos()->sync($validated['modulos'] ?? []);
        }

        return response()->json($this->transformUser($user->load('modulos')), 200);
    }

    /**
    * Elimina un usuario.
    */
    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->ensureAdmin($request);

        if ($request->user()->id === $user->id) {
            return response()->json(['message' => 'No puedes eliminar tu propio usuario'], 409);
        }

        $user->delete();

        return response()->json(['message' => 'Usuario eliminado'], 200);
    }

    private function ensureAdmin(Request $request): void
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            abort(403, 'Solo los administradores pueden gestionar usuarios');
        }
    }

    private function transformUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'is_admin' => $user->is_admin,
            'modulos' => $user->modulos,
            'permitted_modulos' => $user->permittedModuloIds(),
        ];
    }
}
