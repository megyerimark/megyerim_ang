import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/toast.service';

@Component({
    selector: 'app-toast-host',
    standalone: true,
    template: `
      <div class="toast-stack" aria-live="polite" aria-atomic="false">
        @for (t of toasts.toasts(); track t.id) {
          <div class="toast" [class]="'toast toast--' + t.kind" [attr.role]="t.kind === 'error' ? 'alert' : 'status'">
            <span class="toast__icon" aria-hidden="true">{{ t.kind === 'success' ? '✓' : t.kind === 'error' ? '!' : 'i' }}</span>
            <span class="toast__text">{{ t.text }}</span>
            <button type="button" class="toast__close" aria-label="Értesítés bezárása" (click)="toasts.dismiss(t.id)">×</button>
          </div>
        }
      </div>
    `,
    styles: [`
      .toast-stack{position:fixed;z-index:1000;right:18px;bottom:18px;display:flex;flex-direction:column;gap:10px;width:min(380px,calc(100vw - 24px));pointer-events:none}
      .toast{pointer-events:auto;display:grid;grid-template-columns:28px minmax(0,1fr) 26px;align-items:start;gap:10px;padding:13px 12px 13px 14px;border-radius:14px;border:1px solid #ffffff24;background:linear-gradient(150deg,var(--k-161f43-f7),var(--k-0c1430-f7));color:var(--k-eef0ff);box-shadow:0 18px 50px #0009;backdrop-filter:blur(18px);font-size:13.5px;line-height:1.45;animation:toast-in .28s cubic-bezier(.2,.9,.25,1.2)}
      .toast__icon{display:grid;place-items:center;width:28px;height:28px;border-radius:9px;font-weight:800;font-size:14px}
      .toast--success .toast__icon{background:#2fd6a426;color:#55e5c7;border:1px solid #55e5c766}
      .toast--error{border-color:#ff7a8f66}
      .toast--error .toast__icon{background:#ff5d7a26;color:#ff8da0;border:1px solid #ff8da066}
      .toast--info .toast__icon{background:var(--k-8b7cff-26);color:var(--k-c4b5fd);border:1px solid var(--k-c4b5fd-66)}
      .toast__text{padding-top:4px;overflow-wrap:anywhere}
      .toast__close{width:26px;height:26px;border:0;border-radius:8px;background:transparent;color:var(--k-aeb6d6);font-size:19px;line-height:1;cursor:pointer}
      .toast__close:hover,.toast__close:focus-visible{background:#ffffff14;color:#fff}
      :host-context([data-theme='light']) .toast{background:#ffffffef;color:var(--k-191e28);border-color:var(--k-1d2340-1f);box-shadow:0 14px 40px var(--k-1b2040-2b)}
      @media (max-width:600px){.toast-stack{left:12px;right:12px;top:calc(env(safe-area-inset-top) + 10px);bottom:auto;width:auto}}
      @keyframes toast-in{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}
      @media (prefers-reduced-motion:reduce){.toast{animation:none}}
    `]
})
export class ToastHost {
    readonly toasts = inject(ToastService);
}
