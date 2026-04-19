import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

export interface ConfirmDialog {
  message: string;
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();

  private confirmSubject = new BehaviorSubject<ConfirmDialog | null>(null);
  confirm$ = this.confirmSubject.asObservable();

  private add(type: ToastType, message: string, duration = 4000) {
    const id = ++this.counter;
    const toast: Toast = { id, type, message };
    this.toastsSubject.next([...this.toastsSubject.value, toast]);
    setTimeout(() => this.dismiss(id), duration);
  }

  success(message: string) { this.add('success', message); }
  error(message: string)   { this.add('error', message, 6000); }
  warning(message: string) { this.add('warning', message, 5000); }
  info(message: string)    { this.add('info', message); }

  dismiss(id: number) {
    this.toastsSubject.next(this.toastsSubject.value.filter(t => t.id !== id));
  }

  confirm(message: string): Promise<boolean> {
    return new Promise(resolve => {
      this.confirmSubject.next({ message, resolve });
    });
  }

  resolveConfirm(value: boolean) {
    const dialog = this.confirmSubject.value;
    if (dialog) {
      dialog.resolve(value);
      this.confirmSubject.next(null);
    }
  }
}
