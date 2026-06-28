import { useEffect, useRef } from "react";

export default function FeatherCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!canHover) return;

    let raf = 0;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    let lastX = targetX;
    let lastY = targetY;
    let angle = -24;

    const move = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      cursor.classList.add("is-visible");
    };

    const leave = () => {
      cursor.classList.remove("is-visible");
    };

    const tick = () => {
      x += (targetX - x) * 0.22;
      y += (targetY - y) * 0.22;
      const dx = x - lastX;
      const dy = y - lastY;
      if (Math.hypot(dx, dy) > 0.05) {
        angle = Math.atan2(dy, dx) * (180 / Math.PI) - 14;
      }
      lastX = x;
      lastY = y;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${angle}deg)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerleave", leave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div className="crow-feather-cursor" ref={cursorRef} aria-hidden="true">
      <svg viewBox="0 0 34 92" focusable="false">
        <path
          className="crow-feather-cursor__spine"
          d="M18 6 C14 28 13 51 16 86"
        />
        <path
          className="crow-feather-cursor__left"
          d="M18 7 C5 19 2 39 4 58 C6 74 12 84 17 87 C14 62 15 32 18 7Z"
        />
        <path
          className="crow-feather-cursor__right"
          d="M19 8 C31 23 33 42 28 59 C25 72 21 82 17 87 C14 60 16 31 19 8Z"
        />
        <path
          className="crow-feather-cursor__cut"
          d="M10 39 L17 34 M23 49 L16 45 M8 58 L16 54 M25 66 L17 61"
        />
      </svg>
    </div>
  );
}
