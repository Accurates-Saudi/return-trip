import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily: FONT } = loadFont("normal", { weights: ["500", "600", "700", "800"] });

const C = {
  bg: "#f5f7fb",
  surface: "#ffffff",
  ink: "#0f1b2d",
  cab: "#1f2d44",
  muted: "#6b7a90",
  line: "#e2e7ef",
  road: "#dfe5ee",
  teal: "#0fa37f",
  coral: "#f0643c",
  blue: "#2f7cf6",
  violet: "#7b61ff",
  amber: "#f5a524",
};
const SHADOW = "0 10px 30px rgba(15,27,45,0.08), 0 2px 6px rgba(15,27,45,0.06)";

const SCENES: { d: number; el: React.FC }[] = [];
const scene = (d: number, el: React.FC) => SCENES.push({ d, el });

/* ---------- math ---------- */
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ramp = (f: number, a: number, b: number, e = ease) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: e });

type P = { x: number; y: number };
// Quadratic curve between a and b, bowed sideways by `bend` px
const ctrl = (a: P, b: P, bend: number): P => {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  return { x: (a.x + b.x) / 2 - (dy / len) * bend, y: (a.y + b.y) / 2 + (dx / len) * bend };
};
const pathD = (a: P, b: P, bend = 0) => {
  const c = ctrl(a, b, bend);
  return `M${a.x} ${a.y} Q${c.x} ${c.y} ${b.x} ${b.y}`;
};

const usePop = (delay = 0, damping = 14) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping, mass: 0.7, stiffness: 140 } });
};

/* ---------- primitives ---------- */
const Backdrop: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(1200px 700px at 75% 15%, #e8f6f1 0%, transparent 60%), radial-gradient(900px 600px at 10% 90%, #eaf1ff 0%, transparent 60%), ${C.bg}`,
    }}
  >
    <AbsoluteFill
      style={{ backgroundImage: `radial-gradient(#d6dde8 1.5px, transparent 1.5px)`, backgroundSize: "40px 40px", opacity: 0.6 }}
    />
  </AbsoluteFill>
);

const Caption: React.FC<{ text: string; from?: number; to?: number; accent?: string }> = ({
  text, from = 0, to = 99999, accent,
}) => {
  const f = useCurrentFrame();
  const out = interpolate(f, [to - 12, to], [1, 0], clamp);
  return (
    <div style={{
      position: "absolute", bottom: 96, left: 0, right: 0, textAlign: "center", fontFamily: FONT,
      fontSize: 64, fontWeight: 800, letterSpacing: -1.5, color: C.ink, opacity: out,
    }}>
      {text.split(" ").map((w, i) => {
        const p = ramp(f, from + i * 3, from + i * 3 + 16, Easing.out(Easing.cubic));
        const last = i === text.split(" ").length - 1;
        return (
          <span key={i} style={{
            display: "inline-block", marginRight: 18, opacity: p, color: last && accent ? accent : undefined,
            transform: `translateY(${(1 - p) * 24}px)`, filter: `blur(${(1 - p) * 6}px)`,
          }}>{w}</span>
        );
      })}
    </div>
  );
};

const Truck: React.FC<{
  p: P; color: string; loaded: boolean; flip?: boolean; scale?: number; opacity?: number; angle?: number; moving?: boolean;
}> = ({ p, color, loaded, flip, scale = 1, opacity = 1, angle = 0, moving = true }) => {
  const f = useCurrentFrame();
  const spin = moving ? f * 14 : 0;
  const bob = moving ? Math.sin(f / 2.2) * 0.8 : 0;
  const wheel = (cx: number) => (
    <g transform={`rotate(${spin} ${cx} 80)`}>
      <circle cx={cx} cy={80} r={12} fill={C.cab} />
      <circle cx={cx} cy={80} r={5} fill="#e8edf3" />
      <rect x={cx - 1.5} y={70} width={3} height={6} rx={1.5} fill="#e8edf3" />
    </g>
  );
  return (
    <svg
      width={200 * scale} height={100 * scale} viewBox="0 0 200 100"
      style={{
        position: "absolute", left: p.x, top: p.y, opacity, overflow: "visible",
        transform: `translate(-50%,-80%) rotate(${angle}deg) ${flip ? "scaleX(-1)" : ""}`,
      }}
    >
      <ellipse cx={100} cy={93} rx={92} ry={6} fill="rgba(15,27,45,0.10)" />
      <g transform={`translate(0 ${bob})`}>
        {loaded ? (
          <>
            <rect x={6} y={14} width={126} height={56} rx={9} fill={color} />
            <rect x={6} y={14} width={126} height={14} rx={9} fill="#fff" opacity={0.18} />
            <rect x={20} y={50} width={42} height={6} rx={3} fill="#fff" opacity={0.45} />
          </>
        ) : (
          <rect x={7.5} y={15.5} width={123} height={53} rx={8} fill="#fff" stroke={color} strokeWidth={3} strokeDasharray="9 7" />
        )}
        <path d="M138 30 h26 q7 0 11 6 l13 17 q4 5 4 11 v8 h-54 z" fill={C.cab} />
        <path d="M147 37 h16 q3 0 5 3 l9 12 h-30 z" fill="#cfe2ff" />
        <rect x={6} y={70} width={186} height={6} rx={3} fill="#2a3850" />
      </g>
      {wheel(34)}
      {wheel(108)}
      {wheel(166)}
    </svg>
  );
};

const Road: React.FC<{ a: P; b: P; bend?: number; progress?: number; width?: number; tint?: string }> = ({
  a, b, bend = 0, progress = 1, width = 22, tint,
}) => (
  <svg style={{ position: "absolute", inset: 0 }} width={1920} height={1080}>
    <path d={pathD(a, b, bend)} fill="none" stroke={tint ?? C.road} strokeWidth={width} strokeLinecap="round"
      pathLength={1} strokeDasharray={`${progress} 1`} />
    {width >= 16 && (
      <path d={pathD(a, b, bend)} fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round"
        strokeDasharray="14 16" opacity={progress >= 1 ? 0.9 : 0} />
    )}
  </svg>
);

const Link: React.FC<{ a: P; b: P; bend?: number; color: string; progress?: number; flow?: number }> = ({
  a, b, bend = 0, color, progress = 1, flow = 0,
}) => (
  <svg style={{ position: "absolute", inset: 0 }} width={1920} height={1080}>
    <path d={pathD(a, b, bend)} fill="none" stroke={color} strokeOpacity={0.25} strokeWidth={4} pathLength={1} strokeDasharray={`${progress} 1`} />
    <path d={pathD(a, b, bend)} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round"
      strokeDasharray="6 18" strokeDashoffset={-flow} opacity={progress >= 1 ? 1 : 0} />
  </svg>
);

const Pin: React.FC<{ p: P; label?: string; color?: string; size?: number; pulse?: boolean; scale?: number }> = ({
  p, label, color = C.blue, size = 34, pulse, scale = 1,
}) => {
  const f = useCurrentFrame();
  const k = (f % 50) / 50;
  return (
    <div style={{ position: "absolute", left: p.x, top: p.y, transform: `translate(-50%,-50%) scale(${scale})`, fontFamily: FONT }}>
      {pulse && [0, 0.5].map((o) => {
        const kk = (k + o) % 1;
        return (
          <div key={o} style={{
            position: "absolute", left: size / 2, top: size / 2, width: size * 4 * kk, height: size * 4 * kk,
            transform: "translate(-50%,-50%)", borderRadius: "50%", background: color, opacity: 0.25 * (1 - kk),
          }} />
        );
      })}
      <div style={{
        width: size, height: size, borderRadius: "50%", background: C.surface, border: `${size * 0.22}px solid ${color}`,
        boxSizing: "border-box", boxShadow: SHADOW, position: "relative",
      }} />
      {label && (
        <div style={{
          position: "absolute", top: size + 12, left: size / 2, transform: "translateX(-50%)", padding: "6px 14px",
          background: C.surface, borderRadius: 999, boxShadow: SHADOW, fontSize: 24, fontWeight: 700, color: C.ink, whiteSpace: "nowrap",
        }}>{label}</div>
      )}
    </div>
  );
};

const Parcel: React.FC<{ p: P; scale?: number }> = ({ p, scale = 1 }) => (
  <svg width={70} height={70} viewBox="0 0 70 70" style={{
    position: "absolute", left: p.x, top: p.y, transform: `translate(-50%,-50%) scale(${scale})`, overflow: "visible",
  }}>
    <ellipse cx={35} cy={66} rx={26} ry={4} fill="rgba(15,27,45,0.12)" />
    <path d="M35 6 L62 19 V50 L35 63 L8 50 V19 Z" fill="#f7b545" />
    <path d="M35 6 L62 19 L35 32 L8 19 Z" fill="#ffd27a" />
    <path d="M35 32 V63 L8 50 V19 Z" fill="#e59a24" />
    <path d="M21 12.5 L48 25.5 V36" stroke="#fff" strokeOpacity={0.7} strokeWidth={4} fill="none" />
  </svg>
);

/* line icons, 48x48 */
const ICON: Record<string, React.ReactNode> = {
  doc: (<><path d="M14 6h14l10 10v24a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" /><path d="M28 6v10h10M18 24h12M18 31h12" /></>),
  gps: (<><path d="M24 43s13-12.5 13-23a13 13 0 0 0-26 0c0 10.5 13 23 13 23z" /><circle cx={24} cy={20} r={5} /></>),
  ai: (<><rect x={12} y={12} width={24} height={24} rx={5} /><path d="M19 4v8M29 4v8M19 36v8M29 36v8M4 19h8M4 29h8M36 19h8M36 29h8" /><path d="M20 28l4-9 4 9M21.5 25h5" /></>),
  match: (<><path d="M8 16h26l-6-6M40 32H14l6 6" /></>),
  truck: (<><rect x={4} y={12} width={24} height={20} rx={3} /><path d="M28 18h8l6 7v7H28z" /><circle cx={13} cy={36} r={4} /><circle cx={35} cy={36} r={4} /></>),
  box: (<><path d="M24 4l18 9v22l-18 9-18-9V13z" /><path d="M6 13l18 9 18-9M24 22v22" /></>),
  chart: (<><path d="M6 40h36" /><path d="M10 32l9-10 7 6 14-16" /><path d="M32 12h8v8" /></>),
};
const Icon: React.FC<{ name: string; color: string; size?: number }> = ({ name, color, size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    {ICON[name]}
  </svg>
);

const Node: React.FC<{ p: P; icon: string; label: string; color: string; scale?: number; size?: number }> = ({
  p, icon, label, color, scale = 1, size = 132,
}) => (
  <div style={{ position: "absolute", left: p.x, top: p.y, transform: `translate(-50%,-50%) scale(${scale})`, textAlign: "center", fontFamily: FONT }}>
    <div style={{
      width: size, height: size, borderRadius: 34, background: C.surface, boxShadow: SHADOW, margin: "0 auto",
      display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${C.line}`,
    }}>
      <div style={{
        width: size * 0.7, height: size * 0.7, borderRadius: 24, background: `${color}14`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name={icon} color={color} />
      </div>
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, marginTop: 16, color: C.ink, whiteSpace: "nowrap" }}>{label}</div>
  </div>
);

/* ---------- 1. Intro ---------- */
scene(130, () => {
  const f = useCurrentFrame();
  const a = { x: 380, y: 700 }, b = { x: 1540, y: 700 };
  const draw = ramp(f, 0, 40);
  const t = ramp(f, 25, 110);
  const title = usePop(45, 18);
  const sub = ramp(f, 65, 85);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop />
      <Road a={a} b={b} progress={draw} width={26} />
      <Pin p={a} color={C.teal} scale={usePop(5)} />
      <Pin p={b} color={C.teal} scale={usePop(30)} />
      <Truck p={{ x: lerp(a.x, b.x, t), y: a.y }} color={C.teal} loaded moving={t > 0 && t < 1} />
      <div style={{
        position: "absolute", top: 270, width: "100%", textAlign: "center", fontSize: 128, fontWeight: 800,
        letterSpacing: -4, color: C.ink, opacity: title, transform: `translateY(${(1 - title) * 30}px)`,
      }}>
        No more <span style={{ color: C.teal }}>empty miles</span>
      </div>
      <div style={{ position: "absolute", top: 440, width: "100%", textAlign: "center", fontSize: 34, fontWeight: 600, color: C.muted, opacity: sub }}>
        AI-powered freight matching for Saudi Arabia
      </div>
    </AbsoluteFill>
  );
});

/* ---------- 2. Deliver, then return empty ---------- */
const LANES: [string, string][] = [["Dammam", "Riyadh"], ["Jeddah", "Madinah"], ["Abha", "Jeddah"]];
scene(260, () => {
  const f = useCurrentFrame();
  const L = 520, R = 1400;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop />
      {LANES.map(([a, b], i) => {
        const y = 230 + i * 210;
        const d = i * 6; // slight stagger
        const go = ramp(f, 25 + d, 105 + d);
        const drop = ramp(f, 108 + d, 128 + d, Easing.out(Easing.cubic));
        const back = ramp(f, 135 + d, 215 + d);
        const returning = f >= 132 + d;
        const x = returning ? lerp(R - 30, L + 30, back) : lerp(L + 30, R - 30, go);
        const tag = usePop(140 + d, 12);
        return (
          <React.Fragment key={a}>
            <Road a={{ x: L, y }} b={{ x: R, y }} progress={ramp(f, i * 5, 30 + i * 5)} />
            <Pin p={{ x: L - 90, y: y + 10 }} label={a} size={28} scale={usePop(i * 5)} />
            <Pin p={{ x: R + 90, y: y + 10 }} label={b} size={28} scale={usePop(8 + i * 5)} />
            {f >= 108 + d && <Parcel p={{ x: lerp(R - 60, R + 90, drop), y: y - 60 - Math.sin(drop * Math.PI) * 40 }} scale={0.8} />}
            <Truck p={{ x, y }} color={returning ? C.coral : C.teal} loaded={!returning} flip={returning} scale={0.75}
              moving={(go > 0 && go < 1) || (back > 0 && back < 1)} />
            {returning && (
              <div style={{
                position: "absolute", left: x, top: y - 105, transform: `translate(-50%,-50%) scale(${tag})`, padding: "6px 16px",
                background: C.coral, color: "#fff", borderRadius: 999, fontSize: 22, fontWeight: 800,
              }}>Empty</div>
            )}
          </React.Fragment>
        );
      })}
      <Caption text="Deliver the load…" from={30} to={130} accent={C.teal} />
      <Caption text="…then drive back empty" from={140} accent={C.coral} />
    </AbsoluteFill>
  );
});

/* ---------- 3. Same road, two trucks ---------- */
scene(220, () => {
  const f = useCurrentFrame();
  const R = { x: 460, y: 500 }, D = { x: 1460, y: 500 };
  const empty = ramp(f, 20, 160);
  const second = ramp(f, 75, 205);
  const badge = usePop(130, 12);
  const parcelIn = usePop(30);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop />
      <Road a={{ x: R.x, y: R.y - 60 }} b={{ x: D.x, y: D.y - 60 }} width={26} />
      <Road a={{ x: R.x, y: R.y + 90 }} b={{ x: D.x, y: D.y + 90 }} width={26} />
      <Pin p={{ x: R.x - 90, y: R.y + 15 }} label="Riyadh" />
      <Pin p={{ x: D.x + 90, y: D.y + 15 }} label="Dammam" />
      <Truck p={{ x: lerp(R.x, D.x, empty), y: R.y - 60 }} color={C.coral} loaded={false} moving={empty > 0 && empty < 1} />
      {f < 75 && <Parcel p={{ x: R.x + 40, y: R.y + 80 }} scale={parcelIn} />}
      {f >= 75 && <Truck p={{ x: lerp(R.x, D.x, second), y: R.y + 90 }} color={C.blue} loaded moving={second < 1} />}
      <div style={{
        position: "absolute", left: 960, top: 230, transform: `translate(-50%,-50%) scale(${badge})`, padding: "16px 34px",
        background: C.surface, borderRadius: 999, boxShadow: SHADOW, fontSize: 46, fontWeight: 800, color: C.coral,
      }}>
        2× the trucks · 2× the cost
      </div>
      <Caption text="Same road. Two trucks. One empty." from={20} accent={C.coral} />
    </AbsoluteFill>
  );
});

/* ---------- 4. One platform ---------- */
const NODES = [
  { icon: "doc", label: "Free waybills", color: C.teal },
  { icon: "gps", label: "Live GPS", color: C.blue },
  { icon: "ai", label: "AI predictions", color: C.violet },
  { icon: "match", label: "Marketplace", color: C.amber },
];
scene(240, () => {
  const f = useCurrentFrame();
  const hub = { x: 960, y: 450 };
  const hubIn = usePop(5, 12);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop />
      {NODES.map((n, i) => {
        const ang = (i / NODES.length) * Math.PI * 2 - Math.PI / 4 + f / 400;
        const s = usePop(25 + i * 14);
        const p = { x: hub.x + Math.cos(ang) * 420, y: hub.y + Math.sin(ang) * 260 };
        return (
          <React.Fragment key={n.label}>
            <Link a={p} b={hub} bend={40} color={n.color} progress={ramp(f, 35 + i * 14, 60 + i * 14)} flow={f * 1.6} />
            <Node p={p} icon={n.icon} label={n.label} color={n.color} scale={s} />
          </React.Fragment>
        );
      })}
      <div style={{
        position: "absolute", left: hub.x, top: hub.y, width: 200, height: 200, borderRadius: 60,
        background: `linear-gradient(145deg, #16c095, ${C.teal})`, transform: `translate(-50%,-50%) scale(${hubIn})`,
        boxShadow: "0 24px 60px rgba(15,163,127,0.35)", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name="truck" color="#fff" size={110} />
      </div>
      <Caption text="One platform connects it all" from={95} accent={C.teal} />
    </AbsoluteFill>
  );
});

/* ---------- 5. Predict, match, drive back full ---------- */
scene(340, () => {
  const f = useCurrentFrame();
  const D = { x: 380, y: 560 }, R = { x: 1540, y: 560 };
  const go = ramp(f, 10, 115);
  const ring = ramp(f, 115, 150, Easing.out(Easing.cubic));
  const parcelIn = usePop(145);
  const link = ramp(f, 165, 195);
  const fly = ramp(f, 200, 232);
  const back = ramp(f, 245, 330);
  const returning = f >= 240;
  const truckX = returning ? lerp(R.x - 110, D.x + 90, back) : lerp(D.x + 90, R.x - 110, go);
  const pStart = { x: R.x - 40, y: R.y + 200 };
  const lift = Math.sin(fly * Math.PI) * 120;
  const pP = { x: lerp(pStart.x, R.x - 140, fly), y: lerp(pStart.y, R.y - 50, fly) - lift };
  // ETA card
  const cardIn = usePop(8);
  const pct = go;
  const card = { x: 960, y: 250 };
  const status = f < 115 ? `Arriving in ${Math.max(0, Math.round((1 - go) * 4 * 60))} min` : f < 240 ? "Free at 14:30" : "Return load booked";
  const statusColor = f < 115 ? C.blue : f < 240 ? C.teal : C.amber;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop />
      <Road a={D} b={R} width={26} />
      <Pin p={{ x: D.x - 70, y: D.y + 10 }} label="Dammam" />
      <div style={{
        position: "absolute", left: R.x - 110, top: R.y - 20, width: 380 * ring, height: 380 * ring, borderRadius: "50%",
        background: `${C.teal}18`, border: `3px solid ${C.teal}55`, transform: "translate(-50%,-50%)", opacity: returning ? 0 : 1,
      }} />
      <Pin p={{ x: R.x + 70, y: R.y + 10 }} label="Riyadh" color={f > 115 ? C.teal : C.blue} pulse={f > 115 && f < 240} />
      {f > 145 && !returning && <Link a={pStart} b={{ x: R.x - 140, y: R.y - 40 }} bend={-60} color={C.amber} progress={link} flow={f * 1.6} />}
      {f > 145 && fly < 1 && <Parcel p={pP} scale={parcelIn * (1 - fly * 0.3)} />}
      <Truck p={{ x: truckX, y: R.y }} color={C.teal} loaded={!(f >= 115 && fly < 1)} flip={returning}
        moving={(go > 0 && go < 1) || (back > 0 && back < 1)} />
      <div style={{
        position: "absolute", left: card.x, top: card.y, transform: `translate(-50%,-50%) scale(${cardIn})`, width: 520,
        padding: "26px 32px", background: C.surface, borderRadius: 28, boxShadow: SHADOW, display: "flex", alignItems: "center", gap: 24,
      }}>
        <svg width={86} height={86} viewBox="0 0 86 86">
          <circle cx={43} cy={43} r={36} stroke={C.line} strokeWidth={9} fill="none" />
          <circle cx={43} cy={43} r={36} stroke={statusColor} strokeWidth={9} fill="none" strokeLinecap="round"
            pathLength={1} strokeDasharray={`${returning ? 1 : pct} 1`} transform="rotate(-90 43 43)" />
        </svg>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, color: C.muted }}>Truck 214 · Dammam → Riyadh</div>
          <div style={{ fontSize: 38, fontWeight: 800, color: statusColor, marginTop: 4 }}>{status}</div>
        </div>
      </div>
      <Caption text="AI predicts when it's free" from={15} to={140} accent={C.blue} />
      <Caption text="Finds a load for the way back" from={150} to={242} accent={C.amber} />
      <Caption text="Drives back full" from={250} accent={C.teal} />
    </AbsoluteFill>
  );
});

/* ---------- 6. Flywheel ---------- */
const WHEEL = [
  { icon: "truck", label: "More trucks", color: C.teal },
  { icon: "box", label: "More loads", color: C.amber },
  { icon: "chart", label: "Smarter matches", color: C.violet },
];
scene(210, () => {
  const f = useCurrentFrame();
  const c = { x: 960, y: 450 };
  const rot = f * 0.6;
  const r = 270;
  const ringIn = ramp(f, 0, 40);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop />
      <svg style={{ position: "absolute", inset: 0 }} width={1920} height={1080}>
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX={6} refY={5} markerWidth={5} markerHeight={5} orient="auto">
            <path d="M0 0L10 5L0 10z" fill={C.muted} />
          </marker>
        </defs>
        <g transform={`rotate(${rot} ${c.x} ${c.y})`}>
          {[0, 1, 2].map((i) => {
            const a0 = ((i * 120 - 90 + 28) * Math.PI) / 180, a1 = ((i * 120 + 30 - 28) * Math.PI) / 180;
            return (
              <path key={i} d={`M${c.x + Math.cos(a0) * r} ${c.y + Math.sin(a0) * r} A${r} ${r} 0 0 1 ${c.x + Math.cos(a1) * r} ${c.y + Math.sin(a1) * r}`}
                fill="none" stroke={C.muted} strokeOpacity={0.5} strokeWidth={5} strokeLinecap="round"
                pathLength={1} strokeDasharray={`${ringIn} 1`} markerEnd={ringIn > 0.95 ? "url(#arr)" : undefined} />
            );
          })}
        </g>
      </svg>
      {WHEEL.map((n, i) => {
        const ang = ((rot + i * 120 - 90) * Math.PI) / 180;
        return <Node key={n.label} p={{ x: c.x + Math.cos(ang) * r, y: c.y + Math.sin(ang) * r }} icon={n.icon} label={n.label} color={n.color} scale={usePop(10 + i * 12)} size={120} />;
      })}
      <Caption text="Every trip makes the network smarter" from={60} accent={C.violet} />
    </AbsoluteFill>
  );
});

/* ---------- 7. Revenue ---------- */
const STREAMS = [
  { label: "Setup", value: "SAR 40K", h: 400, color: C.blue },
  { label: "Subscription", value: "SAR 1K/mo", h: 290, color: C.violet },
  { label: "Commission", value: "3% per trip", h: 350, color: C.teal },
];
const Coin: React.FC<{ p: P; o: number }> = ({ p, o }) => (
  <svg width={52} height={52} viewBox="0 0 52 52" style={{ position: "absolute", left: p.x, top: p.y, transform: "translate(-50%,-50%)", opacity: o }}>
    <circle cx={26} cy={26} r={24} fill="#f7b545" />
    <circle cx={26} cy={26} r={17} fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={3} />
  </svg>
);
scene(220, () => {
  const f = useCurrentFrame();
  const base = 800;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop />
      <div style={{ position: "absolute", left: 340, right: 340, top: base, height: 3, background: C.line, borderRadius: 2 }} />
      {STREAMS.map((s, i) => {
        const x = 560 + i * 400;
        const g = ramp(f, 15 + i * 18, 115 + i * 18);
        const h = s.h * g;
        const lbl = usePop(105 + i * 18);
        return (
          <React.Fragment key={s.label}>
            {[0, 1, 2, 3].map((k) => {
              const st = 8 + i * 18 + k * 22;
              const tt = ramp(f, st, st + 26, Easing.in(Easing.quad));
              return <Coin key={k} p={{ x, y: lerp(60, base - h - 10, tt) }} o={f > st && tt < 1 ? 1 : 0} />;
            })}
            <div style={{
              position: "absolute", left: x - 95, top: base - h, width: 190, height: h, borderRadius: "22px 22px 6px 6px",
              background: `linear-gradient(180deg, ${s.color}, ${s.color}cc)`, boxShadow: `0 20px 40px ${s.color}33`,
            }} />
            <div style={{
              position: "absolute", left: x, top: base - h - 50, transform: `translate(-50%,-50%) scale(${lbl})`, padding: "12px 24px",
              background: C.surface, borderRadius: 999, boxShadow: SHADOW, fontSize: 38, fontWeight: 800, color: C.ink, whiteSpace: "nowrap",
            }}>{s.value}</div>
            <div style={{ position: "absolute", left: x, top: base + 24, transform: "translateX(-50%)", fontSize: 30, fontWeight: 700, color: C.muted }}>{s.label}</div>
          </React.Fragment>
        );
      })}
      <Caption text="Three ways to earn" from={130} accent={C.teal} />
    </AbsoluteFill>
  );
});

/* ---------- 8. Expansion ---------- */
const GCC: { n: string; p: P; bend: number }[] = [
  { n: "Kuwait", p: { x: 1080, y: 210 }, bend: -60 },
  { n: "Bahrain", p: { x: 1300, y: 370 }, bend: -50 },
  { n: "Qatar", p: { x: 1420, y: 490 }, bend: -40 },
  { n: "UAE", p: { x: 1560, y: 620 }, bend: 40 },
  { n: "Oman", p: { x: 1640, y: 790 }, bend: 60 },
];
scene(190, () => {
  const f = useCurrentFrame();
  const ksa = { x: 720, y: 520 };
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop />
      {GCC.map((g, i) => (
        <Link key={g.n} a={ksa} b={g.p} bend={g.bend} color={C.teal} progress={ramp(f, 35 + i * 12, 70 + i * 12)} flow={f * 1.6} />
      ))}
      {GCC.map((g, i) => <Pin key={g.n} p={g.p} label={g.n} color={C.teal} size={28} scale={usePop(60 + i * 12)} />)}
      <Pin p={ksa} label="Saudi Arabia" color={C.teal} size={56} pulse scale={usePop(5, 10)} />
      <Caption text="Saudi Arabia first. Then the GCC." from={20} accent={C.teal} />
    </AbsoluteFill>
  );
});

/* ---------- 9. Outro ---------- */
scene(190, () => {
  const f = useCurrentFrame();
  const a = { x: 420, y: 740 }, b = { x: 1500, y: 740 };
  const cyc = (f % 130) / 130;
  const going = cyc < 0.5;
  const t = going ? ease(cyc * 2) : 1 - ease((cyc - 0.5) * 2);
  const words = ["Visible.", "Predictable.", "Productive."];
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop />
      <Road a={a} b={b} width={26} />
      <Pin p={{ x: a.x - 70, y: a.y + 10 }} color={C.teal} />
      <Pin p={{ x: b.x + 70, y: b.y + 10 }} color={C.teal} />
      <Truck p={{ x: lerp(a.x, b.x, t), y: a.y }} color={C.teal} loaded flip={!going} />
      <div style={{ position: "absolute", top: 290, width: "100%", display: "flex", justifyContent: "center", gap: 34 }}>
        {words.map((w, i) => {
          const s = ramp(f, 10 + i * 12, 34 + i * 12, Easing.out(Easing.cubic));
          return (
            <div key={w} style={{
              fontSize: 104, fontWeight: 800, letterSpacing: -3, color: i === 2 ? C.teal : C.ink,
              opacity: s, transform: `translateY(${(1 - s) * 30}px)`, filter: `blur(${(1 - s) * 8}px)`,
            }}>{w}</div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 450, width: "100%", textAlign: "center", fontSize: 38, fontWeight: 600, color: C.muted, opacity: ramp(f, 60, 85) }}>
        Full trucks, both ways.
      </div>
    </AbsoluteFill>
  );
});

/* ---------- assembly ---------- */
const XF = 14; // crossfade overlap in frames
export const TOTAL_FRAMES = SCENES.reduce((s, x) => s + x.d, 0) - XF * (SCENES.length - 1);

const Transition: React.FC<{ dur: number; first: boolean; last: boolean; children: React.ReactNode }> = ({ dur, first, last, children }) => {
  const f = useCurrentFrame();
  const i = first ? 1 : ramp(f, 0, XF, Easing.out(Easing.cubic));
  const o = last ? 1 : 1 - ramp(f, dur - XF, dur, Easing.in(Easing.cubic));
  return (
    <AbsoluteFill style={{ opacity: Math.min(i, o), transform: `scale(${1.03 - 0.03 * i})`, filter: `blur(${(1 - Math.min(i, o)) * 6}px)` }}>
      {children}
    </AbsoluteFill>
  );
};

export const BusinessPlanVideo: React.FC = () => {
  let from = 0;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {SCENES.map(({ d, el: El }, i) => {
        const s = (
          <Sequence key={i} from={from} durationInFrames={d}>
            <Transition dur={d} first={i === 0} last={i === SCENES.length - 1}><El /></Transition>
          </Sequence>
        );
        from += d - XF;
        return s;
      })}
    </AbsoluteFill>
  );
};
