import { useEffect, useRef, useState } from "react";
import { RESULT_KEYS, ResultKey } from "./resultData";
import { playButtonSound, playDropSound, playPassSound, playPinHitSound } from "./soundEffects";

const SLOT_NAMES = RESULT_KEYS;

type PinballBoardV2Props = {
  tag: string;
  onComplete: (result: ResultKey) => void;
};

export default function PinballBoardV2({ tag, onComplete }: PinballBoardV2Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dropId, setDropId] = useState(0);
  const [dropping, setDropping] = useState(false);
  const [result, setResult] = useState<string>("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let previous = performance.now();
    let resolved = false;
    let resultTriggered = false;
    let impactTime = 0;
    let tunnelSlot = -1;
    let lastPinHitSound = 0;
    const ball = { x: 0, y: 0, vx: (Math.random() - .5) * 65, vy: 0, r: 7 };
    let pins: Array<{ x: number; y: number; r: number; angle: number; speed: number; phase: number }> = [];

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      ball.r = width < 420 ? 6 : 8;
      ball.x = width / 2;
      ball.y = height * 0.04;
      pins = [];

      const rowCounts = [3, 4, 5, 6, 7, 7, 7];
      for (let row = 0; row < rowCounts.length; row += 1) {
        const count = rowCounts[row];
        const usable = width * (row > 4 ? 0.68 : 0.72);
        const start = (width - usable) / 2;
        for (let column = 0; column < count; column += 1) {
          pins.push({
            x: start + (usable / Math.max(1, count - 1)) * column,
            y: height * 0.15 + row * height * 0.074,
            r: width < 420 ? 4 : 5,
            angle: (row + column) % 2 ? Math.PI / 4 : 0,
            speed: ((row + column) % 2 ? 1 : -1) * (.28 + ((row * 3 + column) % 4) * .06),
            phase: (row * .7 + column * 1.15) % (Math.PI * 2),
          });
        }
      }
    };

    const drawPin = (pin: (typeof pins)[number], now: number) => {
      context.save();
      context.translate(pin.x, pin.y);
      context.rotate(pin.angle + pin.phase + now * .001 * pin.speed);
      const metal = context.createLinearGradient(-7, -7, 7, 7);
      metal.addColorStop(0, "#eef4f5");
      metal.addColorStop(0.35, "#8d9ca0");
      metal.addColorStop(0.7, "#38464a");
      metal.addColorStop(1, "#dce5e7");
      context.fillStyle = metal;
      context.beginPath();
      context.moveTo(0, -pin.r * 2.35);
      context.lineTo(pin.r * .58, -pin.r * .35);
      context.lineTo(pin.r * .82, 0);
      context.lineTo(pin.r * .58, pin.r * .35);
      context.lineTo(0, pin.r * 2.35);
      context.lineTo(-pin.r * .58, pin.r * .35);
      context.lineTo(-pin.r * .82, 0);
      context.lineTo(-pin.r * .58, -pin.r * .35);
      context.closePath();
      context.fill();
      context.strokeStyle = "rgba(235,244,246,.52)";
      context.lineWidth = 0.7;
      context.stroke();
      context.restore();
    };

    const drawBall = (now: number, clipY = height) => {
      context.save();
      context.beginPath();
      context.rect(0, 0, width, clipY);
      context.clip();
      const pulse = .78 + Math.sin(now * .006) * .18;
      const halo = context.createRadialGradient(ball.x, ball.y, ball.r * .25, ball.x, ball.y, ball.r * 4.8);
      halo.addColorStop(0, `rgba(242,247,255,${.72 * pulse})`);
      halo.addColorStop(.28, `rgba(167,188,255,${.42 * pulse})`);
      halo.addColorStop(1, "rgba(106,123,216,0)");
      context.fillStyle = halo;
      context.beginPath();
      context.arc(ball.x, ball.y, ball.r * 4.8, 0, Math.PI * 2);
      context.fill();

      const gradient = context.createRadialGradient(ball.x - 3, ball.y - 4, 1, ball.x, ball.y, ball.r * 1.3);
      gradient.addColorStop(0, "#d9e3ee");
      gradient.addColorStop(0.24, "#192124");
      gradient.addColorStop(1, "#010203");
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = `rgba(223,233,255,${.55 * pulse})`;
      context.lineWidth = .8;
      context.stroke();

      const sparkle = .55 + Math.sin(now * .011) * .45;
      context.save();
      context.translate(ball.x - ball.r * .55, ball.y - ball.r * .72);
      context.strokeStyle = `rgba(255,255,255,${sparkle})`;
      context.lineWidth = .75;
      context.beginPath();
      context.moveTo(-ball.r * .85, 0);
      context.lineTo(ball.r * .85, 0);
      context.moveTo(0, -ball.r * .85);
      context.lineTo(0, ball.r * .85);
      context.stroke();
      context.restore();
      context.restore();
    };

    const drawImpact = (now: number, dividerLine: number) => {
      if (!impactTime || tunnelSlot < 0) return;
      const progress = Math.min(1, (now - impactTime) / 720);
      if (progress >= 1) return;
      const centerX = ((tunnelSlot + .5) / SLOT_NAMES.length) * width;
      const glow = context.createRadialGradient(centerX, dividerLine, 0, centerX, dividerLine, 36 + progress * 22);
      glow.addColorStop(0, `rgba(236,235,255,${.75 * (1 - progress)})`);
      glow.addColorStop(.3, `rgba(176,157,255,${.42 * (1 - progress)})`);
      glow.addColorStop(1, "rgba(128,112,238,0)");
      context.fillStyle = glow;
      context.beginPath();
      context.ellipse(centerX, dividerLine, 40 + progress * 24, 11 + progress * 6, 0, 0, Math.PI * 2);
      context.fill();
    };

    const render = (now: number) => {
      const delta = Math.min((now - previous) / 1000, 0.025);
      previous = now;
      context.clearRect(0, 0, width, height);
      pins.forEach((pin) => drawPin(pin, now));
      const tunnelStart = height * .64;
      const dividerLine = height * .805;
      const tunnelEnd = height * .9;
      drawImpact(now, dividerLine);

      if (dropId > 0 && !resolved) {
        ball.vy += 360 * delta;
        ball.x += ball.vx * delta;
        ball.y += ball.vy * delta;

        const wallLeft = width * 0.08 + ball.r;
        const wallRight = width * 0.92 - ball.r;
        if (ball.x < wallLeft || ball.x > wallRight) {
          ball.x = Math.max(wallLeft, Math.min(wallRight, ball.x));
          ball.vx *= -0.72;
        }

        if (ball.y < tunnelStart) {
          pins.forEach((pin) => {
            const dx = ball.x - pin.x;
            const dy = ball.y - pin.y;
            const distance = Math.hypot(dx, dy);
            const minimum = ball.r + pin.r * 1.15;
            if (distance < minimum && distance > 0) {
              const nx = dx / distance;
              const ny = dy / distance;
              const dot = ball.vx * nx + ball.vy * ny;
              const force = Math.min(1.35, Math.max(0.4, Math.abs(dot) / 260));
              ball.x = pin.x + nx * minimum;
              ball.y = pin.y + ny * minimum;
              ball.vx -= 1.58 * dot * nx;
              ball.vy -= 1.43 * dot * ny;
              ball.vx += (Math.random() - 0.5) * 42;
              if (now - lastPinHitSound > 135) {
                lastPinHitSound = now;
                playPinHitSound(force);
              }
            }
          });
        } else {
          if (tunnelSlot < 0) {
            tunnelSlot = Math.max(0, Math.min(6, Math.floor((ball.x / width) * 7)));
          }
          const targetX = ((tunnelSlot + .5) / 7) * width;
          ball.vx += (targetX - ball.x) * delta * 8;
          ball.vx *= .91;
          ball.vy = ball.y > dividerLine ? 54 : 76;
        }

        if (!resultTriggered && ball.y + ball.r >= dividerLine) {
          resultTriggered = true;
          impactTime = now;
          playPassSound();
          setResult(SLOT_NAMES[tunnelSlot]);
        }

        if (ball.y > tunnelEnd) {
          resolved = true;
          setDropping(false);
          onComplete(SLOT_NAMES[tunnelSlot]);
        }
        drawBall(now, dividerLine);
      } else if (dropId === 0) {
        drawBall(now);
      }

      frame = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [dropId, onComplete]);

  const drop = () => {
    if (dropping) return;
    playButtonSound();
    playDropSound();
    setResult("");
    setDropping(true);
    setDropId((value) => value + 1);
  };

  return (
    <section className="crow-v2-device">
      <div className="crow-v2-device-head">
        <p>TAGGED: {tag.toUpperCase()}</p>
      </div>

      <div className="crow-v2-board">
        <div className="crow-v2-board-circles" />
        <div className="crow-v2-board-shadow" />
        <canvas ref={canvasRef} />
        <div className="crow-v2-slots">
          {SLOT_NAMES.map((slot) => (
            <div className={result === slot ? "is-selected" : ""} key={slot}>
              <span>{slot}</span>
            </div>
          ))}
        </div>
      </div>

      <button className="crow-v2-drop" disabled={dropping} onClick={drop}>
        <i />
        <span>{dropping ? "FALLING" : "DROP"}</span>
      </button>

    </section>
  );
}
