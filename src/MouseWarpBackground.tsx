import { useEffect, useRef } from "react";

const WIDTH = 390;
const HEIGHT = 693;
const OVERSCAN = 1.18;
const WARP_STRENGTH = 15;
const AUTO_WARP_STRENGTH = 0.28;

export default function MouseWarpBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(WIDTH * dpr);
    const pixelHeight = Math.round(HEIGHT * dpr);
    const bufferWidth = Math.round(pixelWidth * OVERSCAN);
    const bufferHeight = Math.round(pixelHeight * OVERSCAN);

    canvas.width = pixelWidth;
    canvas.height = pixelHeight;

    const baseCanvas = document.createElement("canvas");
    const passCanvas = document.createElement("canvas");
    const resultCanvas = document.createElement("canvas");
    baseCanvas.width = passCanvas.width = resultCanvas.width = bufferWidth;
    baseCanvas.height = passCanvas.height = resultCanvas.height = bufferHeight;

    const baseContext = baseCanvas.getContext("2d");
    const passContext = passCanvas.getContext("2d");
    const resultContext = resultCanvas.getContext("2d");
    if (!baseContext || !passContext || !resultContext) return;

    const autoMotionQuery = window.matchMedia("(hover: none), (pointer: coarse)");
    const isAutoMotion = autoMotionQuery.matches;
    const image = new Image();
    let loaded = false;
    let animationFrame = 0;
    let mouseX = .5;
    let mouseY = .5;
    let targetX = .5;
    let targetY = .5;
    let lastX = .5;
    let lastY = .5;
    let velocityX = 0;
    let velocityY = 0;
    let energy = 0;
    let smoothEnergy = 0;
    let time = 0;
    let wasIdle = true;

    const offsetX = (bufferWidth - pixelWidth) / 2;
    const offsetY = (bufferHeight - pixelHeight) / 2;

    const drawBase = () => {
      const imageRatio = image.width / image.height;
      const bufferRatio = bufferWidth / bufferHeight;
      let drawWidth = bufferWidth;
      let drawHeight = bufferHeight;
      let drawX = 0;
      let drawY = 0;

      if (imageRatio > bufferRatio) {
        drawHeight = bufferHeight;
        drawWidth = drawHeight * imageRatio;
        drawX = (bufferWidth - drawWidth) / 2;
      } else {
        drawWidth = bufferWidth;
        drawHeight = drawWidth / imageRatio;
        drawY = (bufferHeight - drawHeight) / 2;
      }

      baseContext.clearRect(0, 0, bufferWidth, bufferHeight);
      baseContext.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      context.clearRect(0, 0, pixelWidth, pixelHeight);
      context.drawImage(baseCanvas, -offsetX, -offsetY);
    };

    const updatePointer = (clientX: number, clientY: number) => {
      const bounds = canvas.getBoundingClientRect();
      const nextX = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width));
      const nextY = Math.max(0, Math.min(1, (clientY - bounds.top) / bounds.height));
      const deltaX = nextX - lastX;
      const deltaY = nextY - lastY;
      lastX = nextX;
      lastY = nextY;
      targetX = nextX;
      targetY = nextY;
      energy = Math.min(1, energy + Math.hypot(deltaX, deltaY) * 17);
    };

    const onPointerMove = (event: PointerEvent) => updatePointer(event.clientX, event.clientY);

    const render = () => {
      animationFrame = requestAnimationFrame(render);
      if (!loaded) return;

      if (isAutoMotion) {
        const drift = performance.now() * 0.00018;
        targetX = 0.5 + Math.sin(drift * 1.4) * 0.23 + Math.sin(drift * 3.2) * 0.055;
        targetY = 0.5 + Math.cos(drift * 1.1) * 0.2 + Math.sin(drift * 2.6) * 0.045;
        energy += (AUTO_WARP_STRENGTH - energy) * 0.045;
      } else {
        energy *= .93;
      }
      if (energy < .002) energy = 0;
      smoothEnergy += (energy - smoothEnergy) * .18;
      if (smoothEnergy < .001) smoothEnergy = 0;

      if (!isAutoMotion && smoothEnergy === 0) {
        if (!wasIdle) {
          drawBase();
          wasIdle = true;
        }
        return;
      }
      wasIdle = false;

      velocityX += (targetX - mouseX) * .22;
      velocityY += (targetY - mouseY) * .22;
      velocityX *= .78;
      velocityY *= .78;
      mouseX += velocityX;
      mouseY += velocityY;
      time += .022 * (.5 + smoothEnergy);

      const normalizedX = (mouseX - .5) * 2;
      const normalizedY = (mouseY - .5) * 2;
      const amplitude = WARP_STRENGTH * dpr * smoothEnergy;

      passContext.clearRect(0, 0, bufferWidth, bufferHeight);
      const sliceHeight = 3;
      for (let sourceY = 0; sourceY < bufferHeight; sourceY += sliceHeight) {
        const height = Math.min(sliceHeight, bufferHeight - sourceY);
        const position = sourceY / bufferHeight;
        const falloff = Math.max(0, 1 - Math.pow(Math.abs(position - mouseY) * 1.1, 1.5));
        const shiftX =
          Math.sin(position * 7.5 + time * 1.3) * amplitude * .9 +
          Math.cos(position * 4.1 - time * .9) * amplitude * .6 +
          Math.sin(position * 14 + time * 2.1) * amplitude * .35 +
          normalizedX * amplitude * .7 * falloff;
        passContext.drawImage(baseCanvas, 0, sourceY, bufferWidth, height, shiftX, sourceY, bufferWidth, height);
      }

      resultContext.clearRect(0, 0, bufferWidth, bufferHeight);
      const sliceWidth = 3;
      for (let sourceX = 0; sourceX < bufferWidth; sourceX += sliceWidth) {
        const width = Math.min(sliceWidth, bufferWidth - sourceX);
        const position = sourceX / bufferWidth;
        const falloff = Math.max(0, 1 - Math.pow(Math.abs(position - mouseX) * 1.1, 1.5));
        const shiftY =
          Math.sin(position * 8.2 + time * 1.5) * amplitude * .5 +
          Math.cos(position * 3.6 - time * 1.1) * amplitude * .4 +
          Math.sin(position * 15.5 - time * 2.3) * amplitude * .22 +
          normalizedY * amplitude * .55 * falloff;
        resultContext.drawImage(passCanvas, sourceX, 0, width, bufferHeight, sourceX, shiftY, width, bufferHeight);
      }

      context.clearRect(0, 0, pixelWidth, pixelHeight);
      context.drawImage(resultCanvas, -offsetX, -offsetY);
    };

    image.onload = () => {
      loaded = true;
      drawBase();
      animationFrame = requestAnimationFrame(render);
    };
    image.src = "/assets/crow-main-visual.png";
    if (!isAutoMotion) {
      window.addEventListener("pointermove", onPointerMove);
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      if (!isAutoMotion) {
        window.removeEventListener("pointermove", onPointerMove);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="crow-v2-warp-canvas" aria-hidden="true" />;
}
