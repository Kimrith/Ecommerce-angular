import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
    @if (isVisible) {
      <div class="fixed bottom-6 right-6 z-50 flex items-center gap-3.5 rounded-xl bg-slate-900/95 px-5 py-3.5 text-white shadow-xl backdrop-blur-md transition-all duration-300 animate-slide-up overflow-hidden border border-slate-800">
        <!-- Minimal Success Dot/Icon -->
        <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <!-- Message -->
        <span class="text-sm font-medium tracking-wide pr-2">{{ message }}</span>

        <!-- Close Button -->
        <button (click)="close()" class="cursor-pointer text-slate-400 hover:text-white transition-colors">
          ✕
        </button>

        <!-- Subtle Progress Line -->
        <div class="absolute bottom-0 left-0 h-[2px] bg-emerald-500 transition-all linear opacity-75" [style.width.%]="progress"></div>
      </div>
    }
  `,
    styles: [`
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(12px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .animate-slide-up {
      animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class ToastComponent implements OnInit {
    @Input() message = 'Operation completed successfully!';
    @Input() duration = 3000;
    @Output() dismissed = new EventEmitter<void>();

    isVisible = true;
    progress = 100;
    private timer: any;
    private progressInterval: any;

    ngOnInit() {
        const step = 10;
        const decrement = (step / this.duration) * 100;

        this.progressInterval = setInterval(() => {
            this.progress -= decrement;
            if (this.progress <= 0) {
                this.progress = 0;
                clearInterval(this.progressInterval);
            }
        }, step);

        this.timer = setTimeout(() => {
            this.close();
        }, this.duration);
    }

    close() {
        this.isVisible = false;
        clearTimeout(this.timer);
        clearInterval(this.progressInterval);
        this.dismissed.emit();
    }
}