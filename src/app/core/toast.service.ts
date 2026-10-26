import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';
export interface Toast { id: number; kind: ToastKind; text: string; }

/**
 * Globális toast-értesítések. Bárhonnan hívható: `inject(ToastService).success('Mentve.')`.
 * A sikeres/infó üzenet 4,5 mp, a hiba 8 mp után tűnik el (vagy kattintásra).
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
    readonly toasts = signal<Toast[]>([]);
    private seq = 0;

    success(text: string): void { this.show('success', text); }
    error(text: string): void { this.show('error', text); }
    info(text: string): void { this.show('info', text); }

    show(kind: ToastKind, text: string): void {
        const clean = text.trim();
        if (!clean) return;
        // Ugyanaz az üzenet ne halmozódjon (pl. dupla kattintás).
        if (this.toasts().some(t => t.text === clean && t.kind === kind)) return;
        const id = ++this.seq;
        this.toasts.update(list => [...list.slice(-3), { id, kind, text: clean }]);
        setTimeout(() => this.dismiss(id), kind === 'error' ? 8000 : 4500);
    }

    dismiss(id: number): void { this.toasts.update(list => list.filter(t => t.id !== id)); }
}
