<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PreguntaController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\ModuloController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\FormularioTemplateController;
use App\Http\Controllers\ModuloFormularioConfigController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Rutas públicas de autenticación
Route::post('/login', [AuthController::class, 'login']);

// Rutas públicas de categorías y módulos (solo lectura)
Route::prefix('categorias')->group(function () {
    Route::get('/', [CategoriaController::class, 'index']);              // GET /api/categorias
    Route::get('/{id}', [CategoriaController::class, 'show']);           // GET /api/categorias/{id}
    Route::get('/{id}/modulos', [ModuloController::class, 'porCategoria']); // GET /api/categorias/{id}/modulos
});

Route::prefix('modulos')->group(function () {
    Route::get('/', [ModuloController::class, 'index']);                 // GET /api/modulos
    Route::get('/{id}', [ModuloController::class, 'show']);              // GET /api/modulos/{id}
    Route::get('/{id}/submodulos', [ModuloController::class, 'submodulos']); // GET /api/modulos/{id}/submodulos
});

// Rutas públicas de preguntas (solo lectura)
Route::prefix('preguntas')->group(function () {
    Route::get('/', [PreguntaController::class, 'index']);          // GET /api/preguntas
    Route::get('/search', [PreguntaController::class, 'search']);   // GET /api/preguntas/search?q=término
    Route::get('/debug', [PreguntaController::class, 'debug']);     // GET /api/preguntas/debug
    Route::get('/{id}', [PreguntaController::class, 'show']);       // GET /api/preguntas/{id}
    Route::post('/limpiar-numeros', [PreguntaController::class, 'limpiarNumeros']); // POST /api/preguntas/limpiar-numeros (temporal: testing)
    Route::post('/upload-image', [PreguntaController::class, 'uploadImage']); // POST /api/preguntas/upload-image (temporal: testing sin auth)
});

// Rutas públicas de tickets (para crear tickets de soporte)
Route::prefix('tickets')->group(function () {
    Route::post('/', [TicketController::class, 'store']);           // POST /api/tickets (crear ticket sin autenticación)
});

// Rutas públicas de formularios (obtener formulario por módulo)
Route::prefix('formularios')->group(function () {
    Route::get('/modulo/{moduloId}', [FormularioTemplateController::class, 'porModulo']); // GET /api/formularios/modulo/{id}
});

// Rutas públicas de configuración de formulario por módulo
Route::prefix('formulario-config')->group(function () {
    Route::get('/modulo/{moduloId}', [ModuloFormularioConfigController::class, 'getPorModulo']); // GET /api/formulario-config/modulo/{id}
});

// Rutas protegidas (requieren autenticación)
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    
    // CRUD de preguntas (solo admin)
    Route::prefix('preguntas')->group(function () {
        Route::post('/', [PreguntaController::class, 'store']);         // POST /api/preguntas
        Route::put('/{id}', [PreguntaController::class, 'update']);     // PUT /api/preguntas/{id}
        Route::delete('/{id}', [PreguntaController::class, 'destroy']); // DELETE /api/preguntas/{id}
        Route::put('/reordenar/batch', [PreguntaController::class, 'reordenar']); // PUT /api/preguntas/reordenar/batch
    });
    
    // CRUD de categorías (solo admin)
    Route::prefix('categorias')->group(function () {
        Route::post('/', [CategoriaController::class, 'store']);        // POST /api/categorias
        Route::put('/{id}', [CategoriaController::class, 'update']);    // PUT /api/categorias/{id}
        Route::delete('/{id}', [CategoriaController::class, 'destroy']); // DELETE /api/categorias/{id}
    });
    
    // CRUD de módulos (solo admin)
    Route::prefix('modulos')->group(function () {
        Route::post('/', [ModuloController::class, 'store']);           // POST /api/modulos
        Route::put('/{id}', [ModuloController::class, 'update']);       // PUT /api/modulos/{id}
        Route::delete('/{id}', [ModuloController::class, 'destroy']);   // DELETE /api/modulos/{id}
    });

    // Gestión de usuarios (solo admin)
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
        Route::get('/{user}', [UserController::class, 'show']);
        Route::put('/{user}', [UserController::class, 'update']);
        Route::delete('/{user}', [UserController::class, 'destroy']);
    });

    // Gestión de tickets (solo admin)

    // Gestión de formularios (solo admin)
    Route::prefix('formularios')->group(function () {
        Route::get('/', [FormularioTemplateController::class, 'index']);            // GET /api/formularios (listar todos)
        Route::post('/', [FormularioTemplateController::class, 'store']);           // POST /api/formularios (crear)
        Route::get('/{id}', [FormularioTemplateController::class, 'show']);         // GET /api/formularios/{id} (ver detalle)
        Route::put('/{id}', [FormularioTemplateController::class, 'update']);       // PUT /api/formularios/{id} (actualizar)
        Route::delete('/{id}', [FormularioTemplateController::class, 'destroy']);   // DELETE /api/formularios/{id} (eliminar)
        Route::post('/{id}/duplicate', [FormularioTemplateController::class, 'duplicate']); // POST /api/formularios/{id}/duplicate (duplicar)
    });

    // Gestión de configuración de formularios por módulo (solo admin)
    Route::prefix('formulario-config')->group(function () {
        Route::get('/', [ModuloFormularioConfigController::class, 'index']);           // GET /api/formulario-config (listar todos)
        Route::post('/', [ModuloFormularioConfigController::class, 'store']);          // POST /api/formulario-config (guardar/actualizar)
        Route::delete('/{moduloId}', [ModuloFormularioConfigController::class, 'reset']); // DELETE /api/formulario-config/{moduloId} (restablecer)
    });
    Route::prefix('tickets')->group(function () {
        Route::get('/', [TicketController::class, 'index']);                // GET /api/tickets (listar todos)
        Route::get('/{id}', [TicketController::class, 'show']);             // GET /api/tickets/{id} (ver detalle)
        Route::put('/{id}/estado', [TicketController::class, 'updateEstado']); // PUT /api/tickets/{id}/estado (actualizar estado)
    });
});