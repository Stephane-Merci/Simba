import { useCallback, type MouseEvent } from 'react';

/** Effet 3D : la carte s'incline légèrement en suivant la souris (classe CSS `.tilt`). */
export function useTilt(force = 8) {
    const onMouseMove = useCallback(
        (e: MouseEvent<HTMLElement>) => {
            const el = e.currentTarget;
            const r = el.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            el.style.setProperty('--rx', `${(-y * force).toFixed(2)}deg`);
            el.style.setProperty('--ry', `${(x * force).toFixed(2)}deg`);
        },
        [force],
    );
    const onMouseLeave = useCallback((e: MouseEvent<HTMLElement>) => {
        e.currentTarget.style.setProperty('--rx', '0deg');
        e.currentTarget.style.setProperty('--ry', '0deg');
    }, []);
    return { onMouseMove, onMouseLeave };
}
