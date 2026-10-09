import { useEffect } from 'react';

export function ObsidianCursor() {
  useEffect(() => {
    const enabled = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const root = document.documentElement;
    let timer: number | undefined;

    function clearFlash() {
      window.clearTimeout(timer);
      root.removeAttribute('data-cursor-pressed');
    }

    function flash(event: PointerEvent) {
      if (!enabled.matches || event.pointerType !== 'mouse' || event.button !== 0) return;
      clearFlash();
      root.setAttribute('data-cursor-pressed', '');
      timer = window.setTimeout(clearFlash, 160);
    }

    // Native cursors also work inside top-layer dialogs and never lag behind the mouse.
    document.addEventListener('pointerdown', flash);
    document.addEventListener('pointercancel', clearFlash);
    window.addEventListener('blur', clearFlash);
    enabled.addEventListener('change', clearFlash);

    return () => {
      clearFlash();
      document.removeEventListener('pointerdown', flash);
      document.removeEventListener('pointercancel', clearFlash);
      window.removeEventListener('blur', clearFlash);
      enabled.removeEventListener('change', clearFlash);
    };
  }, []);

  return null;
}
