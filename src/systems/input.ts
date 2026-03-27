export interface InputCallbacks {
  onTap?: () => void;
  onChargeStart?: () => void;
  onChargeRelease?: () => void;
  onChargeCancel?: () => void;
}

export class InputSystem {
  private element: HTMLElement;
  private handlers: (() => void)[] = [];

  constructor(element: HTMLElement, callbacks: InputCallbacks, chargeEnabled: boolean) {
    this.element = element;

    // Check if a UI overlay is on top (any element with zIndex >= 100)
    const isOverlayBlocking = (e: PointerEvent): boolean => {
      const target = e.target as HTMLElement;
      if (!target || target === element) return false;
      // Walk up from the event target to see if it (or a parent) is a high-z overlay
      let el: HTMLElement | null = target;
      while (el && el !== element) {
        const z = parseInt(el.style.zIndex || '0', 10);
        if (z >= 100) return true;
        el = el.parentElement;
      }
      return false;
    };

    if (chargeEnabled && callbacks.onChargeStart && callbacks.onChargeRelease && callbacks.onChargeCancel) {
      const onDown = (e: PointerEvent) => {
        e.preventDefault();
        if (isOverlayBlocking(e)) return;
        callbacks.onChargeStart!();
      };
      const onUp = (e: PointerEvent) => {
        e.preventDefault();
        callbacks.onChargeRelease!();
      };
      const onCancel = (e: PointerEvent) => {
        e.preventDefault();
        callbacks.onChargeCancel!();
      };

      element.addEventListener('pointerdown', onDown, { passive: false });
      element.addEventListener('pointerup', onUp, { passive: false });
      element.addEventListener('pointercancel', onCancel, { passive: false });
      element.addEventListener('pointerleave', onCancel, { passive: false });

      this.handlers.push(
        () => element.removeEventListener('pointerdown', onDown),
        () => element.removeEventListener('pointerup', onUp),
        () => element.removeEventListener('pointercancel', onCancel),
        () => element.removeEventListener('pointerleave', onCancel),
      );
    } else if (callbacks.onTap) {
      const onTap = callbacks.onTap;
      const handler = (e: PointerEvent) => {
        e.preventDefault();
        if (isOverlayBlocking(e)) return;
        onTap();
      };
      element.addEventListener('pointerdown', handler, { passive: false });
      this.handlers.push(() => element.removeEventListener('pointerdown', handler));
    }
  }

  dispose(): void {
    this.handlers.forEach(fn => fn());
    this.handlers.length = 0;
  }
}
