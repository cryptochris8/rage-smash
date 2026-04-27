/**
 * Single-active-modal coordinator.
 *
 * Game modals (Settings, Shop, Leaderboard, Collection, Achievements,
 * Daily, LoginReward, StarterPack) are mutually exclusive by intent —
 * opening one while another is open today produces overlapping backdrops
 * with confused pointer events. This singleton enforces "one at a time":
 * opening B auto-closes A.
 *
 * Adoption is incremental: a modal opts in by calling `register()` in its
 * constructor and routing its open/close calls through the manager. UIs
 * that haven't migrated still work as before.
 */

export interface ModalHandle {
  /** Stable identifier — also used as data-modal-id for debugging. */
  id: string;
  show: () => void;
  hide: () => void;
  isOpen: () => boolean;
  /** Tap on backdrop closes the modal. */
  dismissOnBackdrop?: boolean;
  /** ESC key closes the modal. Defaults to true. */
  dismissOnEsc?: boolean;
}

class ModalManager {
  private modals: Map<string, ModalHandle> = new Map();
  private current: string | null = null;
  /** Element that had focus when the modal opened — restored on close. */
  private prevFocus: Element | null = null;
  private escHandlerInstalled = false;

  register(handle: ModalHandle): () => void {
    this.modals.set(handle.id, handle);
    this.ensureEscHandler();
    return () => {
      if (this.current === handle.id) this.current = null;
      this.modals.delete(handle.id);
    };
  }

  open(id: string): void {
    const next = this.modals.get(id);
    if (!next) {
      console.warn(`[modalManager] unknown modal: ${id}`);
      return;
    }
    if (this.current && this.current !== id) {
      const prev = this.modals.get(this.current);
      try { prev?.hide(); } catch (err) {
        console.warn(`[modalManager] hide(${this.current}) threw:`, err);
      }
    }
    this.prevFocus = document.activeElement;
    this.current = id;
    try {
      next.show();
    } catch (err) {
      console.warn(`[modalManager] show(${id}) threw:`, err);
      this.current = null;
    }
  }

  close(id?: string): void {
    const target = id ?? this.current;
    if (!target) return;
    const handle = this.modals.get(target);
    if (handle) {
      try { handle.hide(); } catch (err) {
        console.warn(`[modalManager] hide(${target}) threw:`, err);
      }
    }
    if (this.current === target) {
      this.current = null;
      // Restore focus to the element that opened the modal (if still alive).
      if (this.prevFocus instanceof HTMLElement && document.body.contains(this.prevFocus)) {
        try { this.prevFocus.focus(); } catch { /* ignore */ }
      }
      this.prevFocus = null;
    }
  }

  closeAll(): void {
    if (this.current) this.close(this.current);
  }

  /** Currently visible modal id, or null. */
  getCurrent(): string | null {
    return this.current;
  }

  isOpen(id: string): boolean {
    return this.current === id;
  }

  private ensureEscHandler(): void {
    if (this.escHandlerInstalled) return;
    this.escHandlerInstalled = true;
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !this.current) return;
      const handle = this.modals.get(this.current);
      if (handle && handle.dismissOnEsc !== false) {
        this.close(this.current);
      }
    });
  }
}

export const modalManager = new ModalManager();
