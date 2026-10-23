import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private containerElement: HTMLElement | null = null;

  private initContainer(): HTMLElement {
    if (!this.containerElement || !document.body.contains(this.containerElement)) {
      this.containerElement = document.createElement('div');
      this.containerElement.id = 'global-toast-container';
      this.containerElement.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 420px;
        width: calc(100vw - 48px);
        pointer-events: none;
      `;
      document.body.appendChild(this.containerElement);
    }
    return this.containerElement;
  }

  public show(message: string, type: 'warning' | 'error' | 'success' | 'info' = 'warning', durationMs: number = 5000): void {
    const container = this.initContainer();

    const toast = document.createElement('div');
    toast.style.cssText = `
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      border-radius: 10px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      line-height: 1.4;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      transform: translateX(100%);
      opacity: 0;
    `;

    let bgColor = '#1f2937';
    let textColor = '#ffffff';
    let borderColor = 'transparent';
    let iconSvg = '';

    if (type === 'warning') {
      bgColor = '#fffbebf0';
      textColor = '#92400e';
      borderColor = '#fde68a';
      iconSvg = `<svg width="20" height="20" fill="none" stroke="#d97706" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;
    } else if (type === 'error') {
      bgColor = '#fef2f2f0';
      textColor = '#991b1b';
      borderColor = '#fecaca';
      iconSvg = `<svg width="20" height="20" fill="none" stroke="#dc2626" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
    } else if (type === 'success') {
      bgColor = '#f0fdf4f0';
      textColor = '#166534';
      borderColor = '#bbf7d0';
      iconSvg = `<svg width="20" height="20" fill="none" stroke="#16a34a" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`;
    } else {
      bgColor = '#eff6fff0';
      textColor = '#1e40af';
      borderColor = '#bfdbfe';
      iconSvg = `<svg width="20" height="20" fill="none" stroke="#2563eb" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
    }

    toast.style.backgroundColor = bgColor;
    toast.style.color = textColor;
    toast.style.border = `1px solid ${borderColor}`;
    toast.style.backdropFilter = 'blur(8px)';

    toast.innerHTML = `
      <div style="flex-shrink: 0;">${iconSvg}</div>
      <div style="flex: 1;">${message}</div>
      <button style="background: none; border: none; cursor: pointer; color: ${textColor}; opacity: 0.6; padding: 2px; font-size: 16px; line-height: 1;" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    });

    // Auto dismiss
    setTimeout(() => {
      if (document.body.contains(toast)) {
        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
      }
    }, durationMs);
  }
}
