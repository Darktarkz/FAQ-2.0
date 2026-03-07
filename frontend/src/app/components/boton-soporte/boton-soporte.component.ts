import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-boton-soporte',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './boton-soporte.component.html',
  styleUrls: ['./boton-soporte.component.css']
})
export class BotonSoporteComponent implements OnInit, OnDestroy {
  @Input() moduloId!: number;
  @Input() moduloNombre!: string;
  @Input() preguntaNombre: string = '';
  @Input() posicion: 'fixed' | 'static' = 'fixed';

  countdown = 30;
  timerVisible = false;
  isDisabled = false;

  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
    if (this.posicion === 'static') {
      this.isDisabled = true;
      this.timerVisible = true;
      this.intervalId = setInterval(() => {
        this.countdown--;
        if (this.countdown <= 0) {
          this.clearTimer();
          this.isDisabled = false;
          this.timerVisible = false;
        }
      }, 1000);
    }
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  abrirFormularioSoporte(): void {
    if (this.isDisabled) return;
    this.router.navigate(['/soporte'], {
      queryParams: {
        modulo_id: this.moduloId,
        modulo_nombre: this.moduloNombre,
        pregunta_nombre: this.preguntaNombre
      }
    });
  }
}
