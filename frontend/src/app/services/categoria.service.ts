import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  icono?: string | null;
  idpadre?: number | null;
  [key: string]: any;
}

export interface Modulo {
  id: number;
  nombre: string;
  descripcion?: string;
  idpadre?: number | null;
  icono?: string | null;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private modulosUrl = 'http://localhost:8000/api/modulos';

  constructor(private http: HttpClient) {}

  /**
   * Normaliza un objeto para manejar diferentes convenciones de nombres
   * Convierte snake_case a camelCase si es necesario y convierte tipos
   */
  private normalizarObjeto(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    const normalizado: any = { ...obj };
    
    // Mapeo de aliases de campos
    const aliasMap: { [key: string]: string[] } = {
      'id': ['id', 'idMODULOS', 'id_modulo', 'moduloId', 'idModulo'],
      'nombre': ['nombre', 'name', 'MODULOS'],
      'descripcion': ['descripcion', 'description', 'desc', 'DESCRIPCION'],
      'idpadre': ['idpadre', 'id_padre', 'padre_id', 'padreId', 'parent_id', 'IDPADRE'],
      'icono': ['icono', 'icon', 'ICONO']
    };
    
    // Intentar encontrar y normalizar cada campo
    for (const [camelCase, aliases] of Object.entries(aliasMap)) {
      for (const alias of aliases) {
        if (alias in normalizado && !(camelCase in normalizado)) {
          normalizado[camelCase] = normalizado[alias];
          delete normalizado[alias];
        }
      }
    }
    
    // Convertir campos numéricos a números
    if (normalizado.id && typeof normalizado.id === 'string') {
      normalizado.id = Number(normalizado.id);
    }
    if (normalizado.idpadre && typeof normalizado.idpadre === 'string' && normalizado.idpadre !== 'null') {
      normalizado.idpadre = Number(normalizado.idpadre);
    }
    
    return normalizado;
  }

  /**
   * Normaliza un array de objetos
   */
  private normalizarArray(arr: any[]): any[] {
    if (!Array.isArray(arr)) return arr;
    return arr.map(item => this.normalizarObjeto(item));
  }

  // Obtener todas las categorías (módulos raíz con idpadre = NULL)
  getCategorias(): Observable<Categoria[]> {
    return this.http.get<any[]>(this.modulosUrl).pipe(
      tap(data => console.log('Raw módulos desde API:', data)),
      map(data => {
        const normalizados = this.normalizarArray(data) as Modulo[];
        console.log('Módulos normalizados:', normalizados);
        
        // Filtrar solo los módulos raíz (idpadre = null, undefined)
        const categorias = normalizados.filter(m => {
          const esRaiz = !m.idpadre || m.idpadre === null;
          console.log(`Módulo ${m.id} (${m.nombre}): idpadre=${m.idpadre} → esRaiz=${esRaiz}`);
          return esRaiz;
        }) as Categoria[];
        
        return categorias;
      }),
      tap(data => console.log('Categorías finales (raíces):', data)),
      catchError(err => {
        console.error('Error al obtener categorías:', err);
        return of([]);
      })
    );
  }

  // Obtener una categoría por ID
  getCategoria(id: number): Observable<Categoria> {
    return this.http.get<any>(`${this.modulosUrl}/${id}`).pipe(
      tap(data => console.log('Raw categoría:', data)),
      map(data => this.normalizarObjeto(data) as Categoria),
      tap(data => console.log('Categoría normalizada:', data)),
      catchError(err => {
        console.error('Error al obtener categoría:', err);
        return of({} as Categoria);
      })
    );
  }

  // Obtener módulos (submódulos) de una categoría - Obtiene módulos donde idpadre = categoriaId
  getModulosPorCategoria(categoriaId: number): Observable<Modulo[]> {
    return this.http.get<any[]>(this.modulosUrl).pipe(
      map(data => {
        const normalizados = this.normalizarArray(data) as Modulo[];
        
        // Filtrar módulos que tengan idpadre = categoriaId
        const filtrados = normalizados.filter(m => m.idpadre === categoriaId);
        
        return filtrados;
      }),
      catchError(err => {
        console.error('Error al cargar módulos por categoría:', err);
        return of([]);
      })
    );
  }

  // Obtener todos los módulos
  getModulos(): Observable<Modulo[]> {
    return this.http.get<any[]>(this.modulosUrl).pipe(
      tap(data => console.log('Raw módulos:', data)),
      map(data => this.normalizarArray(data) as Modulo[]),
      tap(data => console.log('Módulos normalizados:', data)),
      catchError(err => {
        console.error('Error al obtener módulos:', err);
        return of([]);
      })
    );
  }

  // Obtener un módulo por ID
  getModulo(id: number): Observable<Modulo> {
    return this.http.get<any>(`${this.modulosUrl}/${id}`).pipe(
      tap(data => console.log('Raw módulo:', data)),
      map(data => this.normalizarObjeto(data) as Modulo),
      tap(data => console.log('Módulo normalizado:', data)),
      catchError(err => {
        console.error('Error al obtener módulo:', err);
        return of({} as Modulo);
      })
    );
  }

  // Obtener submódulos (módulos hijos) de un módulo padre
  getSubmodulos(moduloPadreId: number): Observable<Modulo[]> {
    return this.http.get<any[]>(this.modulosUrl).pipe(
      tap(data => console.log(`Raw submódulos de ${moduloPadreId}:`, data)),
      map(data => {
        const normalizados = this.normalizarArray(data) as Modulo[];
        
        // Filtrar módulos que tengan idpadre = moduloPadreId
        const filtrados = normalizados.filter(m => {
          // Convertir idpadre a número de forma segura
          let idpadreNum = null;
          if (m.idpadre !== null && m.idpadre !== undefined) {
            idpadreNum = Number(m.idpadre);
          }
          
          return idpadreNum === moduloPadreId;
        });
        
        return filtrados;
      }),
      tap(data => console.log(`Submódulos filtrados de ${moduloPadreId}:`, data)),
      catchError(err => {
        console.error('Error al cargar submódulos:', err);
        return of([]);
      })
    );
  }

  // Obtener solo módulos raíz (sin padre)
  getModulosRaiz(): Observable<Modulo[]> {
    return this.getModulos().pipe(
      map(modulos => modulos.filter(m => !m.idpadre)),
      tap(data => console.log('Módulos raíz:', data)),
      catchError(err => {
        console.error('Error al obtener módulos raíz:', err);
        return of([]);
      })
    );
  }

  /**
   * Crear un nuevo módulo
   * POST /api/modulos
   */
  createModulo(modulo: any): Observable<Modulo> {
    return this.http.post<any>(`${this.modulosUrl}`, modulo).pipe(
      tap(data => console.log('Módulo creado:', data)),
      map(data => this.normalizarObjeto(data) as Modulo),
      tap(data => console.log('Módulo normalizado:', data)),
      catchError(err => {
        console.error('Error al crear módulo:', err);
        throw err;
      })
    );
  }

  /**
   * Crear un nuevo módulo con archivo
   * POST /api/modulos
   */
  createModuloWithFile(formData: FormData): Observable<Modulo> {
    return this.http.post<any>(`${this.modulosUrl}`, formData).pipe(
      tap(data => console.log('Módulo creado con archivo:', data)),
      map(data => this.normalizarObjeto(data) as Modulo),
      catchError(err => {
        console.error('Error al crear módulo con archivo:', err);
        throw err;
      })
    );
  }

  /**
   * Actualizar un módulo
   * PUT /api/modulos/{id}
   */
  updateModulo(id: number, modulo: any): Observable<Modulo> {
    return this.http.put<any>(`${this.modulosUrl}/${id}`, modulo).pipe(
      tap(data => console.log('Módulo actualizado:', data)),
      map(data => this.normalizarObjeto(data) as Modulo),
      catchError(err => {
        console.error('Error al actualizar módulo:', err);
        throw err;
      })
    );
  }

  /**
   * Actualizar un módulo con archivo
   * POST /api/modulos/{id} (Laravel usa POST con _method=PUT para archivos)
   */
  updateModuloWithFile(id: number, formData: FormData): Observable<Modulo> {
    formData.append('_method', 'PUT');
    return this.http.post<any>(`${this.modulosUrl}/${id}`, formData).pipe(
      tap(data => console.log('Módulo actualizado con archivo:', data)),
      map(data => this.normalizarObjeto(data) as Modulo),
      catchError(err => {
        console.error('Error al actualizar módulo con archivo:', err);
        throw err;
      })
    );
  }

  /**
   * Eliminar un módulo
   * DELETE /api/modulos/{id}
   */
  deleteModulo(id: number): Observable<any> {
    return this.http.delete<any>(`${this.modulosUrl}/${id}`).pipe(
      tap(() => console.log('Módulo eliminado:', id)),
      catchError(err => {
        console.error('Error al eliminar módulo:', err);
        throw err;
      })
    );
  }

  // Aliases para Categorías (son módulos sin padre)
  createCategoria(categoria: any): Observable<Categoria> {
    return this.createModulo(categoria);
  }

  updateCategoria(id: number, categoria: any): Observable<Categoria> {
    return this.updateModulo(id, categoria);
  }

  deleteCategoria(id: number): Observable<any> {
    return this.deleteModulo(id);
  }
}
