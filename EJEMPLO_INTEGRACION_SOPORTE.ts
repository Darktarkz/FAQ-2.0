// EJEMPLO DE INTEGRACIÓN DEL SISTEMA DE SOPORTE
// ================================================

// 1. Importar el componente de botón de soporte
import { BotonSoporteComponent } from '../boton-soporte/boton-soporte.component';

@Component({
  selector: 'app-faq-preguntas',
  standalone: true,
  // 2. Agregar el componente a los imports
  imports: [CommonModule, RouterModule, LoadingComponent, BotonSoporteComponent],
  template: `
    <div class="faq-preguntas-container">
      <header class="faq-top-bar">
        <div class="top-bar-content">
          <a [routerLink]="['/faq']" class="logo">
            <span class="icon">❓</span> FAQ
          </a>
          <a [routerLink]="['/login']" class="btn-login">
            Iniciar sesión
          </a>
        </div>
      </header>

      <header class="faq-breadcrumb">
        <a [routerLink]="['/faq']" class="btn-back">← Volver al inicio</a>
      </header>

      <main class="faq-main">
        <h1>{{ moduloNombre }}</h1>

        <div class="faqs" *ngIf="!loading && preguntas.length > 0">
          <div class="faq-item" *ngFor="let pregunta of preguntas">
            <div class="faq-question" (click)="toggleRespuesta(pregunta.id)">
              <span class="icon">{{ pregunta.abierta ? '−' : '+' }}</span>
              <h3>{{ pregunta.Pregunta }}</h3>
            </div>
            <div class="faq-respuesta" *ngIf="pregunta.abierta" [innerHTML]="pregunta.Respuesta">
            </div>
          </div>
        </div>

        <div class="empty-state" *ngIf="!loading && preguntas.length === 0">
          <p>No hay preguntas disponibles para este módulo</p>
        </div>

        <app-loading *ngIf="loading"></app-loading>
      </main>

      <!-- 3. AGREGAR EL BOTÓN DE SOPORTE FLOTANTE -->
      <app-boton-soporte 
        [moduloId]="moduloId"
        [moduloNombre]="moduloNombre"
        posicion="fixed">
      </app-boton-soporte>
    </div>
  `,
  // ... resto del código
})
export class FaqPreguntasComponent implements OnInit {
  preguntas: any[] = [];
  loading = false;
  
  // 4. Agregar propiedades del módulo
  moduloId: number = 0;
  moduloNombre: string = '';

  constructor(
    private preguntaService: PreguntaService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // 5. Obtener el ID y nombre del módulo desde la ruta o servicio
    this.route.params.subscribe(params => {
      this.moduloId = +params['id'] || 0;
      this.cargarDatosModulo();
      this.cargarPreguntas();
    });
  }

  cargarDatosModulo(): void {
    // Obtener información del módulo
    // Esto puede venir de un servicio, parámetros de ruta, etc.
    // Ejemplo:
    // this.moduloService.getModulo(this.moduloId).subscribe(modulo => {
    //   this.moduloNombre = modulo.nombre;
    // });
  }

  cargarPreguntas(): void {
    this.loading = true;
    this.preguntaService.getPorModulo(this.moduloId).subscribe({
      next: (data) => {
        this.preguntas = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar preguntas:', err);
        this.loading = false;
      }
    });
  }

  toggleRespuesta(id: number): void {
    const pregunta = this.preguntas.find(p => p.id === id);
    if (pregunta) {
      pregunta.abierta = !pregunta.abierta;
    }
  }
}

// ============================================================
// ALTERNATIVA: Botón integrado en el header (no flotante)
// ============================================================

/*
template: `
  <div class="faq-preguntas-container">
    <header class="faq-top-bar">
      <div class="top-bar-content">
        <a [routerLink]="['/faq']" class="logo">
          <span class="icon">❓</span> FAQ
        </a>
        
        <!-- Botón de soporte en el header -->
        <div class="header-actions">
          <app-boton-soporte 
            [moduloId]="moduloId"
            [moduloNombre]="moduloNombre"
            posicion="static">
          </app-boton-soporte>
          
          <a [routerLink]="['/login']" class="btn-login">
            Iniciar sesión
          </a>
        </div>
      </div>
    </header>
    
    <!-- resto del template -->
  </div>
`

// CSS adicional para el header con múltiples acciones:
styles: [`
  .header-actions {
    display: flex;
    gap: 15px;
    align-items: center;
  }
  
  @media (max-width: 768px) {
    .header-actions {
      gap: 10px;
    }
  }
`]
*/

// ============================================================
// ALTERNATIVA: Mostrar formulario completo en la misma página
// ============================================================

/*
import { FormularioSoporteComponent } from '../formulario-soporte/formulario-soporte.component';

@Component({
  imports: [CommonModule, RouterModule, LoadingComponent, FormularioSoporteComponent],
  template: `
    <div class="faq-preguntas-container">
      <!-- header y preguntas -->
      
      <!-- Sección de soporte al final de la página -->
      <section class="seccion-soporte">
        <h2>¿No encontraste lo que buscabas?</h2>
        <p>Reporta tu problema y te ayudaremos a resolverlo</p>
        
        <app-formulario-soporte 
          [moduloId]="moduloId"
          [moduloNombre]="moduloNombre">
        </app-formulario-soporte>
      </section>
    </div>
  `
})
*/

// ============================================================
// NOTAS IMPORTANTES:
// ============================================================

// 1. El botón flotante (posicion="fixed") aparece en la esquina inferior derecha
//    y siempre está visible mientras el usuario navega por la página.

// 2. El botón estático (posicion="static") se integra en el layout normal
//    de la página, útil para headers o footers.

// 3. El moduloId debe ser el ID real del módulo en la base de datos.

// 4. El moduloNombre es el texto que aparecerá en el formulario para
//    identificar desde qué módulo se está reportando el problema.

// 5. El sistema funciona sin autenticación para crear tickets,
//    pero requiere admin para ver/gestionar tickets existentes.
