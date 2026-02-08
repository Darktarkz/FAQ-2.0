import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { PreguntaService } from '../../services/pregunta.service';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-faq-preguntas',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingComponent],
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
        <h1>Preguntas Frecuentes</h1>

        <div class="faqs" *ngIf="!loading && preguntas.length > 0">
          <div class="faq-item" *ngFor="let pregunta of preguntas">
            <div class="faq-question" (click)="toggleRespuesta(pregunta.id)">
              <span class="icon">{{ pregunta.abierta ? '−' : '+' }}</span>
              <h3>{{ pregunta.Pregunta }}</h3>
            </div>
            <div class="faq-respuesta" *ngIf="pregunta.abierta">
              <p>{{ pregunta.Respuesta }}</p>
            </div>
          </div>
        </div>

        <div class="empty-state" *ngIf="!loading && preguntas.length === 0">
          <p>No hay preguntas disponibles</p>
        </div>

        <app-loading *ngIf="loading"></app-loading>
      </main>
    </div>
  `,
  styles: [`
    .faq-preguntas-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .faq-top-bar {
      background: rgba(0, 0, 0, 0.3);
      padding: 15px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .top-bar-content {
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      color: white;
      text-decoration: none;
      font-size: 1.3em;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 8px;

      .icon {
        font-size: 1.3em;
      }

      &:hover {
        opacity: 0.8;
      }
    }

    .btn-login {
      display: inline-block;
      background: white;
      color: #667eea;
      padding: 8px 20px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: bold;
      transition: all 0.3s ease;

      &:hover {
        background: #f0f0f0;
        transform: translateY(-2px);
      }
    }

    .faq-breadcrumb {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;

      .btn-back {
        display: inline-block;
        color: white;
        text-decoration: none;
        padding: 8px 15px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      }
    }

    .faq-main {
      padding: 40px 20px;
      max-width: 800px;
      margin: 0 auto;

      h1 {
        color: white;
        text-align: center;
        margin-bottom: 40px;
      }
    }

    .faqs {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .faq-item {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .faq-question {
      padding: 20px;
      cursor: pointer;
      display: flex;
      align-items: flex-start;
      gap: 15px;
      user-select: none;
      transition: background 0.3s ease;

      &:hover {
        background: #f5f5f5;
      }

      .icon {
        font-weight: bold;
        color: #667eea;
        font-size: 1.2em;
        flex-shrink: 0;
        width: 30px;
        text-align: center;
      }

      h3 {
        margin: 0;
        color: #333;
        font-size: 1em;
        line-height: 1.5;
      }
    }

    .faq-respuesta {
      padding: 20px;
      background: #f9f9f9;
      border-top: 1px solid #eee;
      line-height: 1.6;
      color: #555;
      animation: slideDown 0.3s ease;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .empty-state {
      text-align: center;
      color: white;
      padding: 40px;
      font-size: 1.2em;
    }
  `]
})
export class FaqPreguntasComponent implements OnInit {
  preguntas: any[] = [];
  loading = true;
  moduloId: number = 0;

  constructor(
    private preguntaService: PreguntaService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.moduloId = parseInt(params['moduloId']);
      this.cargarPreguntas();
    });
  }

  cargarPreguntas() {
    if (!this.moduloId) return;

    const observable = this.moduloId
      ? this.preguntaService.getPreguntasPorModulo(this.moduloId)
      : this.preguntaService.getPreguntas();

    observable.subscribe({
      next: (data: any[]) => {
        this.preguntas = data.map((p: any) => ({ ...p, abierta: false }));
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error:', error);
        this.loading = false;
      }
    });
  }

  toggleRespuesta(id: any) {
    const pregunta = this.preguntas.find(p => p.id === id);
    if (pregunta) {
      pregunta.abierta = !pregunta.abierta;
    }
  }
}
