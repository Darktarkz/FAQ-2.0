// ESTRUCTURA JERÁRQUICA DE MÓDULOS
// ================================

/**
 * La base de datos tiene la siguiente estructura:
 * 
 * Tabla: modulos
 * ├── id: number (PK)
 * ├── nombre: string
 * ├── descripcion: string (opcional)
 * ├── idpadre: number (FK, puede ser NULL)
 * └── idCategoria: number (FK)
 * 
 * REGLAS:
 * -------
 * - Si idpadre es NULL → Es un módulo RAÍZ (padre)
 * - Si idpadre tiene valor → Es un SUBMÓDULO (hijo)
 * 
 * EJEMPLO DE JERARQUÍA:
 * 
 * Categoría: MISIONAL (id=1)
 * ├── Módulo Raíz: "Gestión de Usuarios" (id=1, idpadre=NULL)
 * │   ├── Submódulo: "Crear Usuario" (id=5, idpadre=1)
 * │   ├── Submódulo: "Editar Usuario" (id=6, idpadre=1)
 * │   └── Submódulo: "Eliminar Usuario" (id=7, idpadre=1)
 * │
 * └── Módulo Raíz: "Gestión de Permisos" (id=2, idpadre=NULL)
 *     ├── Submódulo: "Asignar Permisos" (id=8, idpadre=2)
 *     └── Submódulo: "Revocar Permisos" (id=9, idpadre=2)
 * 
 * FLUJO DE NAVEGACIÓN EN LA APP:
 * ==============================
 * 
 * 1. Usuario selecciona categoría
 *    ↓
 * 2. Se cargan módulos raíz (donde idpadre IS NULL)
 *    ↓
 * 3. Usuario hace clic en un módulo raíz
 *    ↓
 * 4. Se cargan submódulos (donde idpadre = id del módulo raíz)
 *    ↓
 * 5. Usuario hace clic en un submódulo
 *    ↓
 * 6. Se cargan las preguntas relacionadas a ese submódulo
 * 
 * ENDPOINTS DE LA API:
 * ====================
 * 
 * GET /api/categorias/{id}/modulos
 *   - Obtiene módulos de una categoría
 *   - Retorna módulos raíz (idpadre IS NULL)
 * 
 * GET /api/modulos/{id}/submodulos
 *   - Obtiene submódulos de un módulo padre
 *   - Retorna módulos donde idpadre = id
 * 
 * GET /api/preguntas?moduloId={id}
 *   - Obtiene preguntas de un módulo específico
 * 
 */
