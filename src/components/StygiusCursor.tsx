import { useEffect, useRef } from 'react';
import slashArtwork from '../assets/cursors/slash.svg?raw';

const interactiveSelector = 'a[href], button, summary, [role="button"], input[type="button"], input[type="submit"], input[type="reset"], input[type="checkbox"], input[type="radio"], select';

export function StygiusCursor() {
  const effects = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = effects.current;
    if (!layer) return;
    const enabled = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const root = document.documentElement;
    const animations = new Map<Animation, HTMLElement>();
    let activeTarget: Element | null = null;
    let swordVisible = false;
    let previous: { x: number; y: number; time: number } | null = null;
    let timer: number | undefined;
    let artworkId = 0;
    let lastStrike = -Infinity;
    let reverseStrike = false;

    // Effects decorate the native cursor; they never move or replace its click point.
    function emit(className: string, x: number, y: number, frames: Keyframe[], duration: number, artwork?: string) {
      if (!layer || typeof Element.prototype.animate !== 'function') return;
      if (animations.size >= 40) {
        const oldest = animations.keys().next().value;
        if (oldest) {
          oldest.cancel();
          oldest.oncancel = null;
          animations.get(oldest)?.remove();
          animations.delete(oldest);
        }
      }
      const particle = document.createElement('span');
      particle.className = className;
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      // Artwork is our bundled SVG, with unique gradient IDs for overlapping strikes.
      if (artwork) {
        const id = artworkId++;
        particle.innerHTML = artwork
          .replaceAll('stygius-cut-gradient', `stygius-cut-gradient-${id}`)
          .replaceAll('stygius-edge-gradient', `stygius-edge-gradient-${id}`);
      }
      layer.append(particle);
      const animation = particle.animate(frames, { duration, easing: artwork ? 'linear' : 'ease-out' });
      animations.set(animation, particle);
      const remove = () => {
        animations.delete(animation);
        particle.remove();
      };
      animation.onfinish = remove;
      animation.oncancel = remove;
    }

    function spark(x: number, y: number, dx: number, dy: number, gold = false) {
      emit(`stygius-mote${gold ? ' stygius-mote-gold' : ''}`, x, y, [
        { opacity: 0, transform: 'translate(-50%, -50%) scale(.5)' },
        { opacity: .8, offset: .15 },
        { opacity: 0, transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0)` },
      ], 340 + Math.random() * 160);
    }

    function clearFlash() {
      window.clearTimeout(timer);
      root.removeAttribute('data-cursor-pressed');
    }

    function reset() {
      clearFlash();
      animations.forEach((_particle, animation) => animation.cancel());
      animations.clear();
      // Cancellation callbacks are asynchronous; remove the pixels immediately too.
      layer?.replaceChildren();
      previous = null;
      activeTarget = null;
      swordVisible = false;
      lastStrike = -Infinity;
      reverseStrike = false;
    }

    function hover(event: PointerEvent) {
      if (!enabled.matches || event.pointerType !== 'mouse') return;
      const target = event.target instanceof Element ? event.target : null;
      swordVisible = !!target && getComputedStyle(target).cursor.includes('/cursors/stygius');
      if (!swordVisible) {
        reset();
        return;
      }
      const control = target?.closest(interactiveSelector) ?? null;
      const next = control?.closest(':disabled, [aria-disabled="true"]') ? null : control;
      if (next && next !== activeTarget && event.buttons === 0) {
        emit('stygius-hover-pulse', event.clientX, event.clientY, [
          { opacity: .65, transform: 'translate(-50%, -50%) scale(.35) rotate(-45deg)' },
          { opacity: 0, transform: 'translate(-50%, -50%) scale(1.3) rotate(-45deg)' },
        ], 300);
      }
      activeTarget = next;
    }

    function move(event: PointerEvent) {
      if (!enabled.matches || event.pointerType !== 'mouse' || event.buttons !== 0) {
        previous = null;
        return;
      }
      // Scrolling or a media preference change may reset us without a pointerover.
      if (!swordVisible) hover(event);
      if (!swordVisible) return;
      const { clientX: x, clientY: y, timeStamp: time } = event;
      if (!previous) {
        previous = { x, y, time };
        return;
      }
      const dx = x - previous.x;
      const dy = y - previous.y;
      const distance = Math.hypot(dx, dy);
      if (time - previous.time < 24 || distance < 7) return;
      // A few green motes shed from the runes rather than painting a solid trail.
      spark(x + 13, y + 13, -dx / distance * 10 + Math.random() * 8 - 4, -dy / distance * 10 - 7, !!activeTarget);
      previous = { x, y, time };
    }

    function slash(x: number, y: number) {
      const now = performance.now();
      reverseStrike = now - lastStrike < 560 ? !reverseStrike : false;
      lastStrike = now;
      const angle = reverseStrike ? 142 : 38;
      const pose = (rotation: number, scaleX: number, scaleY: number) =>
        `translate(-50%, -50%) rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`;

      // The echo starts behind the cutting edge and survives it by a few frames.
      emit('stygius-slash stygius-slash-echo', x, y, [
        { opacity: 0, clipPath: 'inset(0 100% 0 0)', transform: pose(angle - 18, .86, .75) },
        { opacity: 0, clipPath: 'inset(0 100% 0 0)', offset: .1 },
        { opacity: .32, clipPath: 'inset(0 0% 0 0)', transform: pose(angle - 4, 1.04, 1), offset: .38 },
        { opacity: 0, clipPath: 'inset(0 0% 0 100%)', transform: pose(angle + 7, 1.12, .6) },
      ], 400, slashArtwork);

      // A short anticipation, an accelerating cut, then a longer tail erosion.
      emit('stygius-slash stygius-slash-blade', x, y, [
        { opacity: 0, clipPath: 'inset(0 100% 0 0)', transform: pose(angle - 12, .82, .58) },
        { opacity: .8, clipPath: 'inset(0 92% 0 0)', transform: pose(angle - 16, .88, .68), offset: .06, easing: 'cubic-bezier(.12,.85,.2,1)' },
        { opacity: 1, clipPath: 'inset(0 0% 0 0)', transform: pose(angle, 1, 1), offset: .28 },
        { opacity: .85, clipPath: 'inset(0 0% 0 0)', transform: pose(angle + 5, 1.04, .92), offset: .46 },
        { opacity: 0, clipPath: 'inset(0 0% 0 100%)', transform: pose(angle + 9, 1.09, .38) },
      ], 340, slashArtwork);

      emit('stygius-impact', x, y, [
        { opacity: 0, transform: 'translate(-50%, -50%) rotate(45deg) scale(.2)' },
        { opacity: 1, transform: 'translate(-50%, -50%) rotate(45deg) scale(1)', offset: .08 },
        { opacity: .6, transform: 'translate(-50%, -50%) rotate(60deg) scale(.75)', offset: .3 },
        { opacity: 0, transform: 'translate(-50%, -50%) rotate(80deg) scale(.1)' },
      ], 210);

      // Streaks follow the blade's exit direction instead of forming a radial burst.
      for (let index = 0; index < 6; index++) {
        const direction = (angle + 30 + (index - 2.5) * 13) * Math.PI / 180;
        const distance = 24 + index % 3 * 10;
        const start = `translate(-50%, -50%) rotate(${direction}rad)`;
        const end = `translate(calc(-50% + ${Math.cos(direction) * distance}px), calc(-50% + ${Math.sin(direction) * distance}px)) rotate(${direction}rad)`;
        emit(`stygius-strike-spark${index % 3 === 0 ? ' stygius-strike-spark-gold' : ''}`, x, y, [
          { opacity: 0, transform: `${start} scaleX(.2)` },
          { opacity: 0, transform: `${start} scaleX(.2)`, offset: .12 },
          { opacity: .95, offset: .2 },
          { opacity: .55, transform: `${end} scaleX(1)`, offset: .65 },
          { opacity: 0, transform: `${end} scaleX(0)` },
        ], 270 + index * 21);
      }
    }

    function flash(event: PointerEvent) {
      if (!enabled.matches || event.pointerType !== 'mouse' || event.button !== 0) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target || !getComputedStyle(target).cursor.includes('/cursors/stygius')) return;
      clearFlash();
      previous = null;
      root.setAttribute('data-cursor-pressed', '');
      timer = window.setTimeout(clearFlash, 160);
      slash(event.clientX, event.clientY);
    }

    function visibility() {
      if (document.hidden) reset();
    }

    // Native cursors also work inside top-layer dialogs and never lag behind the mouse.
    document.addEventListener('pointerover', hover, { passive: true });
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerdown', flash, { passive: true });
    document.addEventListener('pointercancel', reset);
    document.addEventListener('pointerleave', reset);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('blur', reset);
    window.addEventListener('scroll', reset, { passive: true });
    enabled.addEventListener('change', reset);

    return () => {
      reset();
      document.removeEventListener('pointerover', hover);
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerdown', flash);
      document.removeEventListener('pointercancel', reset);
      document.removeEventListener('pointerleave', reset);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('blur', reset);
      window.removeEventListener('scroll', reset);
      enabled.removeEventListener('change', reset);
    };
  }, []);

  return <div ref={effects} className="stygius-effects" aria-hidden="true" />;
}
