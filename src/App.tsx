import { useCallback, useEffect, useRef, useState } from "react";

type Scene = "naming" | "machine" | "result";
type FateKey = "LUCK" | "BAD LUCK" | "OMEN" | "GLOW" | "NEST" | "CROWN" | "STORM";

interface Fate {
  key: FateKey;
  ko: string;
  line: string;
}

const FATES: Fate[] = [
  { key: "LUCK", ko: "행운은 잠시 머물다 지나갔다.", line: "LUCK PASSES. HUNGER REMAINS." },
  { key: "BAD LUCK", ko: "불운은 너를 흔들었지만 부수지는 못했다.", line: "WE WERE NEVER EASY TO BREAK." },
  { key: "OMEN", ko: "징조가 지나갔다. 너는 남았다.", line: "LET THE OMEN DO ITS WORST." },
  { key: "GLOW", ko: "작은 빛이 스쳤다. 계속 쫓아가라.", line: "KEEP CHASING THE GLOW." },
  { key: "NEST", ko: "무너진 둥지가 조금 더 단단해졌다.", line: "BORN IN THE NEST OF THE CROW." },
  { key: "CROWN", ko: "왕관은 아직 멀지만, 방향은 틀리지 않았다.", line: "WE WANT THE CROWN." },
  { key: "STORM", ko: "태풍은 지나가고, 중심은 남았다.", line: "THE STORM PASSED. WE REMAINED." },
];

function Logo({ large = false }: { large?: boolean }) {
  return (
    <div className={`crow-logo ${large ? "crow-logo--large" : ""}`} aria-label="CROW">
      <img src="/assets/crow-logo-v2.png" alt="" />
    </div>
  );
}

function ParticleIntro({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    const started = performance.now();
    const particles: Array<{
      x: number; y: number; z: number;
      sx: number; sy: number;
      tx: number; ty: number;
      drift: number; seed: number;
    }> = [];

    const ease = (value: number) => 1 - Math.pow(1 - value, 3);

    const createTargets = () => {
      const off = document.createElement("canvas");
      off.width = 500;
      off.height = 300;
      const octx = off.getContext("2d");
      if (!octx) return [];
      octx.fillStyle = "#fff";
      octx.beginPath();
      octx.moveTo(65, 185);
      octx.quadraticCurveTo(112, 112, 208, 116);
      octx.quadraticCurveTo(262, 75, 323, 91);
      octx.lineTo(397, 67);
      octx.lineTo(370, 112);
      octx.lineTo(446, 132);
      octx.lineTo(370, 146);
      octx.quadraticCurveTo(340, 196, 270, 196);
      octx.lineTo(213, 245);
      octx.lineTo(224, 193);
      octx.quadraticCurveTo(144, 219, 65, 185);
      octx.fill();
      octx.beginPath();
      octx.moveTo(145, 153);
      octx.quadraticCurveTo(177, 56, 301, 80);
      octx.quadraticCurveTo(249, 124, 207, 175);
      octx.fill();
      const data = octx.getImageData(0, 0, 500, 300).data;
      const targets: Array<{ x: number; y: number }> = [];
      for (let y = 0; y < 300; y += 4) {
        for (let x = 0; x < 500; x += 4) {
          if (data[(y * 500 + x) * 4 + 3] > 100 && Math.random() > .44) {
            targets.push({ x, y });
          }
        }
      }
      return targets;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles.length = 0;
      const targets = createTargets();
      const scale = Math.min(width / 760, height / 480);
      const ox = width / 2 - 250 * scale;
      const oy = height / 2 - 150 * scale;
      targets.slice(0, 2700).forEach((target, index) => {
        const edge = index % 4;
        const sx = edge === 0 ? -50 : edge === 1 ? width + 50 : Math.random() * width;
        const sy = edge === 2 ? -40 : edge === 3 ? height + 40 : Math.random() * height;
        particles.push({
          x: sx, y: sy, sx, sy,
          tx: ox + target.x * scale,
          ty: oy + target.y * scale,
          z: .3 + Math.random() * 1.2,
          drift: (Math.random() - .5) * 120,
          seed: Math.random() * Math.PI * 2,
        });
      });
    };

    const draw = (now: number) => {
      const elapsed = (now - started) / 1000;
      ctx.clearRect(0, 0, width, height);
      const gather = Math.min(1, elapsed / 1.55);
      const disperse = Math.max(0, Math.min(1, (elapsed - 2.15) / 1.05));
      const g = ease(gather);
      const d = ease(disperse);

      particles.forEach((particle) => {
        let x = particle.sx + (particle.tx - particle.sx) * g;
        let y = particle.sy + (particle.ty - particle.sy) * g;
        x += Math.sin(elapsed * 2 + particle.seed) * (1 - g) * 16;
        if (d > 0) {
          x += particle.drift * d;
          y -= (height * .72 + particle.z * 120) * d;
          x += Math.sin(d * 8 + particle.seed) * 35 * d;
        }
        const alpha = (1 - d) * (.3 + particle.z * .45);
        const size = .55 + particle.z * 1.2;
        ctx.fillStyle = `rgba(137, 188, 201, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      if (elapsed < 3.4) {
        raf = requestAnimationFrame(draw);
      } else {
        onComplete();
      }
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [onComplete]);

  return (
    <div className="particle-intro" aria-label="까마귀 파티클 인트로">
      <canvas ref={canvasRef} />
      <p>WE WERE BORN HUNGRY.</p>
    </div>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="site-frame" aria-hidden="true"><i /><i /><i /><i /></div>
      {children}
    </>
  );
}

function Header() {
  return (
    <header className="site-header" id="playlist">
      <Logo />
      <a href="#playlist">PLAYLIST <span>↗</span></a>
    </header>
  );
}

function Egg({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <div className={`egg ${small ? "egg--small" : ""}`}>
      <i />
      {name && <span>{name}</span>}
    </div>
  );
}

function Plinko({
  active,
  run,
  name,
  onLand,
}: {
  active: boolean;
  run: number;
  name: string;
  onLand: (fate: Fate) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let previous = performance.now();
    let done = false;
    let pegs: Array<{ x: number; y: number; r: number; branch: boolean }> = [];
    const ball = { x: 0, y: 0, vx: (Math.random() - .5) * 80, vy: 0, r: 11 };

    const layout = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ball.r = width < 600 ? 8 : 11;
      ball.x = width / 2;
      ball.y = height * .08;
      const rows = width < 600 ? 6 : 7;
      const cols = width < 600 ? 5 : 7;
      const left = width * .14;
      const usable = width * .72;
      pegs = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const unit = usable / (cols - 1);
          const x = left + col * unit + (row % 2 ? unit / 2 : 0);
          if (x < width * .88) {
            pegs.push({ x, y: height * .2 + row * height * .082, r: width < 600 ? 4 : 5, branch: (row + col) % 3 === 0 });
          }
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      pegs.forEach((peg, index) => {
        ctx.save();
        ctx.translate(peg.x, peg.y);
        ctx.rotate((index % 2 ? 1 : -1) * .34);
        ctx.strokeStyle = peg.branch ? "rgba(14,21,23,.78)" : "rgba(35,48,51,.46)";
        ctx.lineWidth = peg.branch ? 1.8 : 1;
        ctx.beginPath();
        ctx.moveTo(peg.branch ? -18 : -9, 0);
        ctx.lineTo(peg.branch ? 18 : 9, 0);
        if (peg.branch) {
          ctx.moveTo(-8, 0); ctx.lineTo(-13, -6);
          ctx.moveTo(9, 0); ctx.lineTo(15, 6);
        }
        ctx.stroke();
        const metal = ctx.createRadialGradient(-2, -2, 0, 0, 0, peg.r + 2);
        metal.addColorStop(0, "#b9c7ca");
        metal.addColorStop(.3, "#566568");
        metal.addColorStop(1, "#111719");
        ctx.fillStyle = metal;
        ctx.beginPath();
        ctx.arc(0, 0, peg.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      if (!active && !done) return;
      const egg = ctx.createRadialGradient(ball.x - 3, ball.y - 5, 1, ball.x, ball.y, ball.r * 1.2);
      egg.addColorStop(0, "#6f7c7f");
      egg.addColorStop(.25, "#171d1f");
      egg.addColorStop(1, "#020303");
      ctx.fillStyle = egg;
      ctx.beginPath();
      ctx.ellipse(ball.x, ball.y, ball.r * .82, ball.r * 1.08, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(226,237,239,.7)";
      ctx.font = `${width < 600 ? 4 : 6}px Archivo`;
      ctx.textAlign = "center";
      ctx.fillText(name.slice(0, 8), ball.x, ball.y + 2);
    };

    const tick = (now: number) => {
      const dt = Math.min((now - previous) / 1000, .025);
      previous = now;
      if (active && !done) {
        ball.vy += 405 * dt;
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
        const left = width * .1 + ball.r;
        const right = width * .9 - ball.r;
        if (ball.x < left || ball.x > right) {
          ball.x = Math.max(left, Math.min(right, ball.x));
          ball.vx *= -.68;
        }
        pegs.forEach((peg) => {
          const dx = ball.x - peg.x;
          const dy = ball.y - peg.y;
          const dist = Math.hypot(dx, dy);
          const min = ball.r + peg.r;
          if (dist < min && dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;
            const dot = ball.vx * nx + ball.vy * ny;
            ball.x = peg.x + nx * min;
            ball.y = peg.y + ny * min;
            ball.vx -= 1.62 * dot * nx;
            ball.vy -= 1.48 * dot * ny;
            ball.vx += (Math.random() - .5) * 44;
            ball.vx = Math.max(-165, Math.min(165, ball.vx));
          }
        });
        if (ball.y >= height * .8) {
          done = true;
          const slotLeft = width * .1;
          const slotWidth = width * .8 / FATES.length;
          const index = Math.max(0, Math.min(6, Math.floor((ball.x - slotLeft) / slotWidth)));
          window.setTimeout(() => onLand(FATES[index]), 550);
        }
      }
      draw();
      raf = requestAnimationFrame(tick);
    };

    layout();
    window.addEventListener("resize", layout);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", layout);
    };
  }, [active, run, name, onLand]);

  return <canvas ref={ref} className="plinko" aria-label={`${name}의 운명 장치`} />;
}

function Naming({
  name,
  setName,
  enter,
}: {
  name: string;
  setName: (value: string) => void;
  enter: () => void;
}) {
  return (
    <section className="page page--naming">
      <Frame>
        <Header />
        <div className="hero">
          <p className="album-copy">WE WANT THE CROWN.<br />BORN AS HUNGRY CROWS.</p>
          <div className="hero-logo"><Logo large /></div>
          <div className="egg-ritual">
            <div className="orbit"><i /><i /><i /></div>
            <Egg name={name} />
            <span className="egg-caption">OBJECT 01 / BLACK EGG</span>
          </div>
          <div className="naming-copy">
            <span className="section-index">01 — NAME THE UNKNOWN</span>
            <h1>검은 알에게<br />이름을 붙여주세요</h1>
          </div>
          <p className="hero-sub">불운과 행운은 지나간다.<br />우리는 어떤 운에도 흔들리지 않는다.</p>
          <label className="name-field">
            <span>NAME THE BLACK EGG</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && name.trim() && enter()}
              placeholder="이름을 붙여주세요"
              maxLength={18}
              autoFocus
            />
          </label>
          <button className="fortune-button" disabled={!name.trim()} onClick={enter}>
            <span>운 보러가기</span><b>↗</b>
          </button>
        </div>
        <div className="crow-shadow" aria-hidden="true" />
        <div className="metal-mark" aria-hidden="true"><i /><i /><i /></div>
        <p className="side-copy">HUNGER / OMEN / CROWN / 2026</p>
        <p className="edition">THE 1ST FORTUNE DEVICE · CROW</p>
        <div id="playlist" className="playlist-anchor" />
      </Frame>
    </section>
  );
}

function Machine({
  name,
  dropping,
  run,
  drop,
  back,
  onLand,
}: {
  name: string;
  dropping: boolean;
  run: number;
  drop: () => void;
  back: () => void;
  onLand: (fate: Fate) => void;
}) {
  return (
    <section className="page page--machine">
      <Frame>
        <Header />
        <div className="machine-copy">
          <span>THE FALL / 02</span>
          <p>{name}의 운은 이미 떨어지고 있다.</p>
        </div>
        <div className="device">
          <Plinko active={dropping} run={run} name={name} onLand={onLand} />
          <div className="slots">
            {FATES.map((fate, index) => (
              <div key={fate.key}><i>{String(index + 1).padStart(2, "0")}</i><span>{fate.key}</span></div>
            ))}
          </div>
        </div>
        {!dropping && (
          <button className="drop-button" onClick={drop}>
            <i>RELEASE</i><span>떨어뜨리기</span><b>↓</b>
          </button>
        )}
        <div className={`device-state ${dropping ? "is-active" : ""}`}><i />{dropping ? "FORTUNE IS FALLING" : "DEVICE READY"}</div>
        <button className="back-button" onClick={back}>이름 다시 붙이기</button>
      </Frame>
    </section>
  );
}

function Result({
  name,
  fate,
  again,
  reset,
}: {
  name: string;
  fate: Fate;
  again: () => void;
  reset: () => void;
}) {
  return (
    <section className="page page--result">
      <Frame>
        <Header />
        <div className="result-copy">
          <p className="result-label">{name}에게 도착한 징조</p>
          <h1>{fate.key}</h1>
          <p className="result-ko">{fate.ko}</p>
          <p className="result-line">{fate.line}</p>
          <div className="declaration">
            <span>우리는 왕관을 원해.</span>
            <strong>배고픈 까마귀로 태어났으니까.</strong>
          </div>
          <div className="result-actions">
            <button className="fortune-button" onClick={again}><span>다시 떨어뜨리기</span><b>↗</b></button>
            <button className="text-button" onClick={reset}>새 이름 붙이기</button>
          </div>
        </div>
        <div className="result-egg"><Egg name={name} small /></div>
      </Frame>
    </section>
  );
}

function App() {
  const [intro, setIntro] = useState(true);
  const [scene, setScene] = useState<Scene>("naming");
  const [name, setName] = useState("");
  const [dropping, setDropping] = useState(false);
  const [run, setRun] = useState(0);
  const [fate, setFate] = useState<Fate>(FATES[5]);

  const enterMachine = () => {
    if (!name.trim()) return;
    setDropping(false);
    setRun((value) => value + 1);
    setScene("machine");
  };

  const land = useCallback((next: Fate) => {
    setFate(next);
    setDropping(false);
    setScene("result");
  }, []);

  return (
    <main>
      {intro && <ParticleIntro onComplete={() => setIntro(false)} />}
      <div className={intro ? "site is-hidden" : "site is-visible"}>
        {scene === "naming" && <Naming name={name} setName={setName} enter={enterMachine} />}
        {scene === "machine" && (
          <Machine
            name={name}
            dropping={dropping}
            run={run}
            drop={() => setDropping(true)}
            back={() => setScene("naming")}
            onLand={land}
          />
        )}
        {scene === "result" && (
          <Result
            name={name}
            fate={fate}
            again={enterMachine}
            reset={() => {
              setName("");
              setScene("naming");
            }}
          />
        )}
      </div>
    </main>
  );
}

export default App;
