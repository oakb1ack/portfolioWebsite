import { useEffect, useRef, useState } from 'react';

export default function AnimatedCounter({ target, suffix = '', decimals = 0 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const fired = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || fired.current) return;
      fired.current = true;
      const start = performance.now();
      const duration = 1400;
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        setCount(Number((easedProgress * target).toFixed(decimals)));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });

    observer.observe(element);
    return () => observer.disconnect();
  }, [target, decimals]);

  return <span ref={ref}>{decimals > 0 ? count.toFixed(decimals) : Math.round(count)}{suffix}</span>;
}
