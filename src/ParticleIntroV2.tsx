import { useEffect, useRef } from "react";

type ParticleIntroV2Props = {
  onDone: () => void;
};

type Particle = {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  lift: number;
  phase: number;
  size: number;
};

export default function ParticleIntroV2({ onDone }: ParticleIntroV2Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let frame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    const startedAt = performance.now();
    const particles: Particle[] = [];

    const easeOut = (value: number) => 1 - Math.pow(1 - value, 3);

    const createCrowPoints = () => {
      const source = document.createElement("canvas");
      source.width = 520;
      source.height = 300;
      const sourceContext = source.getContext("2d");
      if (!sourceContext) return [];

      sourceContext.fillStyle = "#fff";
      sourceContext.beginPath();
      sourceContext.moveTo(38, 180);
      sourceContext.quadraticCurveTo(105, 107, 216, 119);
      sourceContext.quadraticCurveTo(270, 72, 344, 87);
      sourceContext.lineTo(414, 53);
      sourceContext.lineTo(392, 106);
      sourceContext.lineTo(481, 129);
      sourceContext.lineTo(394, 149);
      sourceContext.quadraticCurveTo(363, 205, 280, 197);
      sourceContext.lineTo(214, 256);
      sourceContext.lineTo(229, 193);
      sourceContext.quadraticCurveTo(132, 224, 38, 180);
      sourceContext.fill();

      sourceContext.beginPath();
      sourceContext.moveTo(135, 157);
      sourceContext.quadraticCurveTo(180, 48, 319, 77);
      sourceContext.quadraticCurveTo(258, 126, 206, 183);
      sourceContext.fill();

      const pixels = sourceContext.getImageData(0, 0, 520, 300).data;
      const points: Array<{ x: number; y: number }> = [];

      for (let y = 0; y < 300; y += 4) {
        for (let x = 0; x < 520; x += 4) {
          if (pixels[(y * 520 + x) * 4 + 3] > 100 && Math.random() > 0.5) {
            points.push({ x, y });
          }
        }
      }
      return points;
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles.length = 0;
      const scale = Math.min(width / 760, height / 480);
      const offsetX = width / 2 - 260 * scale;
      const offsetY = height / 2 - 150 * scale;

      createCrowPoints().slice(0, 2500).forEach((point, index) => {
        const side = index % 4;
        particles.push({
          sx: side === 0 ? -50 : side === 1 ? width + 50 : Math.random() * width,
          sy: side === 2 ? -40 : side === 3 ? height + 40 : Math.random() * height,
          tx: offsetX + point.x * scale,
          ty: offsetY + point.y * scale,
          lift: height * (0.7 + Math.random() * 0.35),
          phase: Math.random() * Math.PI * 2,
          size: 0.6 + Math.random() * 1.35,
        });
      });
    };

    const render = (now: number) => {
      const elapsed = (now - startedAt) / 1000;
      const gather = easeOut(Math.min(1, elapsed / 1.45));
      const release = easeOut(Math.max(0, Math.min(1, (elapsed - 2.05) / 1.05)));

      context.clearRect(0, 0, width, height);
      particles.forEach((particle) => {
        let x = particle.sx + (particle.tx - particle.sx) * gather;
        let y = particle.sy + (particle.ty - particle.sy) * gather;

        x += Math.sin(elapsed * 2.3 + particle.phase) * (1 - gather) * 18;
        if (release > 0) {
          x += Math.sin(release * 9 + particle.phase) * 32 * release;
          y -= particle.lift * release;
        }

        const alpha = (1 - release) * (0.35 + particle.size * 0.32);
        context.fillStyle = `rgba(128, 174, 185, ${alpha})`;
        context.beginPath();
        context.arc(x, y, particle.size, 0, Math.PI * 2);
        context.fill();
      });

      if (elapsed < 3.35) {
        frame = requestAnimationFrame(render);
      } else {
        onDone();
      }
    };

    resize();
    window.addEventListener("resize", resize);
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [onDone]);

  return (
    <div className="crow-v2-intro" aria-label="까마귀 파티클 인트로">
      <canvas ref={canvasRef} />
      <p>WE WERE BORN HUNGRY.</p>
    </div>
  );
}
