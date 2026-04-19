import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Toast notifications -->
    <div class="toast-container" aria-live="polite">
      <div
        *ngFor="let toast of toastService.toasts$ | async; trackBy: trackById"
        class="toast toast--{{ toast.type }}"
        role="alert"
      >
        <span class="toast__icon">{{ iconFor(toast.type) }}</span>
        <span class="toast__message">{{ toast.message }}</span>
        <button class="toast__close" (click)="toastService.dismiss(toast.id)" aria-label="Cerrar">✕</button>
      </div>
    </div>

    <!-- Confirm dialog -->
    <ng-container *ngIf="toastService.confirm$ | async as dialog">
      <div class="confirm-overlay" (click)="toastService.resolveConfirm(false)">
        <div class="confirm-box" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <div class="confirm-icon">⚠</div>
          <p class="confirm-message">{{ dialog.message }}</p>
          <div class="confirm-actions">
            <button class="confirm-btn confirm-btn--cancel" (click)="toastService.resolveConfirm(false)">Cancelar</button>
            <button class="confirm-btn confirm-btn--ok" (click)="toastService.resolveConfirm(true)">Confirmar</button>
          </div>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    /* ── Toast ─────────────────────────────────── */
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 300px;
      max-width: 420px;
      padding: 14px 16px;
      border-radius: 14px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08);
      font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 500;
      line-height: 1.4;
      pointer-events: all;
      animation: toastSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      border-left: 4px solid transparent;
    }

    @keyframes toastSlideIn {
      from { opacity: 0; transform: translateX(60px) scale(0.95); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }

    .toast--success { background: #f0fdf4; color: #166534; border-left-color: #22c55e; }
    .toast--error   { background: #fef2f2; color: #991b1b; border-left-color: #ef4444; }
    .toast--warning { background: #fffbeb; color: #92400e; border-left-color: #f59e0b; }
    .toast--info    { background: #F0EDFF; color: #3b1fa8; border-left-color: #6C5ECF; }

    .toast__icon    { font-size: 18px; flex-shrink: 0; }
    .toast__message { flex: 1; }

    .toast__close {
      background: none;
      border: none;
      cursor: pointer;
      opacity: 0.45;
      font-size: 13px;
      padding: 2px 4px;
      border-radius: 4px;
      line-height: 1;
      flex-shrink: 0;
      color: inherit;
      transition: opacity 0.15s;
    }
    .toast__close:hover { opacity: 1; }

    /* ── Confirm dialog ─────────────────────────── */
    .confirm-overlay {
      position: fixed;
      inset: 0;
      z-index: 100000;
      background: rgba(26, 26, 46, 0.55);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    .confirm-box {
      background: #fff;
      border-radius: 20px;
      padding: 32px 28px 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 24px 60px rgba(0,0,0,0.18);
      text-align: center;
      animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .confirm-icon {
      font-size: 40px;
      margin-bottom: 16px;
    }

    .confirm-message {
      font-size: 15px;
      color: #374151;
      margin: 0 0 24px;
      line-height: 1.5;
      font-weight: 500;
    }

    .confirm-actions {
      display: flex;
      gap: 10px;
      justify-content: center;
    }

    .confirm-btn {
      padding: 10px 24px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
    }

    .confirm-btn--cancel { background: #f3f4f6; color: #374151; }
    .confirm-btn--cancel:hover { background: #e5e7eb; }

    .confirm-btn--ok { background: #6C5ECF; color: #fff; }
    .confirm-btn--ok:hover { background: #5a4dbf; }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);

  trackById(_: number, t: Toast) { return t.id; }

  iconFor(type: string): string {
    const icons: Record<string, string> = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] ?? 'ℹ';
  }
}

