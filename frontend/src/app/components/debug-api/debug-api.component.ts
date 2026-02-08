import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-debug-api',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="padding: 20px; background: #f5f5f5; border-radius: 8px; margin: 20px; font-family: monospace;">
      <h2>🔍 DEBUG - Prueba de API</h2>
      
      <div style="margin: 20px 0;">
        <h3>Base URL:</h3>
        <input [(ngModel)]="apiBaseUrl" style="width: 100%; padding: 8px; font-family: monospace;" />
      </div>

      <button (click)="testCategorias()" style="margin: 5px; padding: 10px 15px; cursor: pointer; background: #667eea; color: white; border: none; border-radius: 5px; font-weight: 600;">
        GET /api/categorias
      </button>
      
      <button (click)="testModulos()" style="margin: 5px; padding: 10px 15px; cursor: pointer; background: #667eea; color: white; border: none; border-radius: 5px; font-weight: 600;">
        GET /api/modulos
      </button>
      
      <button (click)="testModulosPorCategoria(1)" style="margin: 5px; padding: 10px 15px; cursor: pointer; background: #667eea; color: white; border: none; border-radius: 5px; font-weight: 600;">
        GET /api/modulos (filtrar Categoría 1)
      </button>

      <h3>📊 Resultados:</h3>
      <div style="background: white; padding: 15px; border-radius: 5px; overflow-x: auto; border: 2px solid #ddd; min-height: 200px;">
        <pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word;">{{ results }}</pre>
      </div>

      <h3>📋 Información de la respuesta:</h3>
      <div style="background: #e8f4f8; padding: 15px; border-radius: 5px; border: 1px solid #b3d9e8;">
        <pre style="margin: 0;">{{ responseInfo }}</pre>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class DebugApiComponent implements OnInit {
  results: string = 'Haz clic en un botón para probar los endpoints...';
  responseInfo: string = '';
  apiBaseUrl: string = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {}

  private extractFieldInfo(obj: any): string {
    if (!obj || typeof obj !== 'object') return 'No es un objeto';
    
    const keys = Object.keys(obj);
    return `Campos: ${keys.join(', ')}\nValores: ${keys.map(k => `${k}=${obj[k]}`).join(', ')}`;
  }

  testCategorias(): void {
    const url = `${this.apiBaseUrl}/categorias`;
    this.results = `Cargando desde: ${url}...`;
    this.responseInfo = '';
    
    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        this.results = JSON.stringify(data, null, 2);
        if (data && data.length > 0) {
          this.responseInfo = `Total: ${data.length}\n\nPrimer elemento:\n${this.extractFieldInfo(data[0])}`;
        }
        console.log('Categorías:', data);
      },
      error: (err) => {
        this.results = `ERROR: ${err.status} ${err.statusText}\n\n${err.error ? JSON.stringify(err.error, null, 2) : err.message}`;
        this.responseInfo = `Error: ${err.message}`;
        console.error('Error en categorías:', err);
      }
    });
  }

  testModulos(): void {
    const url = `${this.apiBaseUrl}/modulos`;
    this.results = `Cargando desde: ${url}...`;
    this.responseInfo = '';
    
    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        const preview = data.slice(0, 5);
        this.results = `Total de módulos: ${data.length}\n\n${JSON.stringify(preview, null, 2)}\n\n... (mostrando primeros 5)`;
        if (data && data.length > 0) {
          this.responseInfo = `Total: ${data.length}\n\nPrimer elemento:\n${this.extractFieldInfo(data[0])}`;
        }
        console.log('Módulos:', data);
      },
      error: (err) => {
        this.results = `ERROR: ${err.status} ${err.statusText}\n\n${err.error ? JSON.stringify(err.error, null, 2) : err.message}`;
        this.responseInfo = `Error: ${err.message}`;
        console.error('Error en módulos:', err);
      }
    });
  }

  testModulosPorCategoria(id: number): void {
    const url = `${this.apiBaseUrl}/modulos`;
    this.results = `Cargando desde: ${url}...\n\nFiltrando módulos raíz (idpadre = NULL)...`;
    this.responseInfo = '';
    
    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        // Mostrar todos los módulos primero
        const preview = data.slice(0, 10);
        this.results = `Total de módulos en BD: ${data.length}\n\nPrimeros 10:\n${JSON.stringify(preview, null, 2)}`;
        
        // Filtrar módulos raíz
        const modulosRaiz = data.filter((m: any) => !m.idpadre);
        const modulosConPadre = data.filter((m: any) => m.idpadre);
        
        this.responseInfo = `Total: ${data.length}\nMódulos raíz (idpadre = NULL): ${modulosRaiz.length}\nSubmódulos (idpadre != NULL): ${modulosConPadre.length}\n\nPrimer elemento:\n${this.extractFieldInfo(data[0])}`;
        
        console.log('Módulos:', data);
        console.log('Módulos raíz:', modulosRaiz);
      },
      error: (err) => {
        this.results = `ERROR: ${err.status} ${err.statusText}\n\n${err.error ? JSON.stringify(err.error, null, 2) : err.message}`;
        this.responseInfo = `Error: ${err.message}`;
        console.error(`Error en módulos:`, err);
      }
    });
  }
}
