/**
 * BearAvatarV2 — OSO pixel art con poses de ejercicio bien visibles.
 * Grid 28×34. Equipamiento (barra, mancuernas, discos) prominente.
 */
import type { BearState } from '../../types';

interface Props {
  state: BearState;
  size?: number;
  className?: string;
}

type Px = [number, number, string];

const GRID_W = 28;
const GRID_H = 34;

// ── Paleta ────────────────────────────────────────────────────────────────────
const F   = '#c87941';  // fur warm golden
const FS  = '#8b4f22';  // fur shadow
const FD  = '#5c2f0a';  // fur dark / outline
const W   = '#f5deb3';  // belly / snout
const EI  = '#1a0a00';  // eye dark
const WS  = '#ffffff';  // shine
const ST  = '#94a3b8';  // steel bar
const PL  = '#1e293b';  // weight plate dark
const PR  = '#94a3b8';  // weight plate ring / shine
const DU  = '#475569';  // dumbbell handle
const GN  = '#39ff14';  // neon green
const BL  = '#93c5fd';  // blue (tears)
const YW  = '#fbbf24';  // yellow (sparkle)
const PK  = '#f9a8d4';  // pink cheeks

function px(x: number, y: number, c: string): Px { return [x, y, c]; }
function rect(x1: number, y1: number, x2: number, y2: number, c: string): Px[] {
  const out: Px[] = [];
  for (let y = y1; y <= y2; y++)
    for (let x = x1; x <= x2; x++)
      out.push([x, y, c]);
  return out;
}

// ── Cabeza (siempre igual) ────────────────────────────────────────────────────
function getHead(): Px[] {
  return [
    // Orejas
    ...rect(4, 0, 8, 3, F),
    ...rect(19, 0, 23, 3, F),
    px(5, 1, FS), px(6, 1, FS), px(20, 1, FS), px(21, 1, FS),
    // Cabeza
    ...rect(3, 2, 24, 14, F),
    // Hocico más claro
    ...rect(9, 8, 18, 13, W),
  ];
}

// ── Torso (siempre igual) ─────────────────────────────────────────────────────
function getTorso(): Px[] {
  return [
    ...rect(5, 15, 22, 23, F),
    ...rect(8, 16, 19, 22, W),
  ];
}

// ── Piernas (varía en sentadilla) ─────────────────────────────────────────────
function getLegs(state: BearState): Px[] {
  if (state === 'workout_piernas') {
    // Postura ancha de sentadilla
    return [
      ...rect(0, 24, 11, 33, F),
      ...rect(16, 24, 27, 33, F),
      ...rect(0, 32, 12, 33, FD),
      ...rect(15, 32, 27, 33, FD),
    ];
  }
  if (state === 'sad') {
    // Ligeramente encorvado, rodillas juntas
    return [
      ...rect(7, 24, 12, 33, F),
      ...rect(15, 24, 20, 33, F),
      ...rect(6, 32, 13, 33, FD),
      ...rect(14, 32, 21, 33, FD),
    ];
  }
  return [
    ...rect(6, 24, 12, 33, F),
    ...rect(15, 24, 21, 33, F),
    ...rect(5, 32, 13, 33, FD),
    ...rect(14, 32, 22, 33, FD),
  ];
}

// ── Cara (varía por estado) ───────────────────────────────────────────────────
function getFace(state: BearState): Px[] {
  const out: Px[] = [];

  // Nariz siempre igual
  out.push(
    ...rect(11, 9, 16, 10, FD),
    px(12, 9, '#6b3a1f'), px(13, 9, '#6b3a1f'), px(14, 9, '#6b3a1f'),
  );

  const isSad   = state === 'sad';
  const isHappy = state === 'fresh' || state === 'happy';
  const isWork  = state.startsWith('workout_');

  if (isHappy) {
    out.push(
      // Ojos achinados / felices
      ...rect(7, 7, 11, 7, EI),
      ...rect(16, 7, 20, 7, EI),
      // Estrellas
      px(4, 4, YW), px(5, 5, YW), px(22, 4, YW), px(23, 5, YW),
      // Sonrisa grande
      px(8, 12, FD), px(9, 13, FD),
      ...rect(10, 13, 17, 13, FD),
      px(18, 13, FD), px(19, 12, FD),
      // Mejillas
      px(6, 10, PK), px(7, 10, PK),
      px(20, 10, PK), px(21, 10, PK),
    );
  } else if (isSad) {
    out.push(
      // Ojos caídos
      ...rect(7, 7, 11, 9, EI),
      ...rect(16, 7, 20, 9, EI),
      px(7, 7, BL), px(16, 7, BL),
      // Cejas tristes
      px(7, 5, FD), px(8, 5, FD), px(9, 6, FD),
      px(19, 5, FD), px(20, 5, FD), px(18, 6, FD),
      // Boca caída
      px(8, 12, FD), px(9, 11, FD),
      ...rect(10, 11, 17, 11, FD),
      px(18, 11, FD), px(19, 12, FD),
      // Lágrimas grandes
      px(8, 10, BL), px(8, 11, BL), px(7, 12, BL),
      px(19, 10, BL), px(19, 11, BL), px(20, 12, BL),
    );
  } else if (isWork) {
    out.push(
      // Ojos entornados / concentración
      ...rect(7, 6, 11, 7, EI),
      ...rect(16, 6, 20, 7, EI),
      px(7, 6, WS), px(16, 6, WS),
      // Dientes apretados
      ...rect(9, 12, 18, 12, FD),
      px(10, 12, WS), px(12, 12, WS), px(14, 12, WS), px(16, 12, WS),
      // Gota de sudor
      px(24, 5, BL), px(24, 6, BL), px(25, 7, BL),
    );
  } else {
    out.push(
      ...rect(7, 5, 11, 8, EI),
      ...rect(16, 5, 20, 8, EI),
      px(7, 5, WS), px(16, 5, WS),
      ...rect(9, 12, 18, 12, FD),
    );
  }

  return out;
}

// ── Brazos + equipamiento (el corazón del v2) ─────────────────────────────────
function getArms(state: BearState): Px[] {
  const out: Px[] = [];

  switch (state) {

    case 'fresh':
      out.push(
        // Ambos brazos arriba con mancuernas — celebración
        ...rect(0, 7, 4, 14, F),
        ...rect(23, 7, 27, 14, F),
        // Mancuernas
        ...rect(0, 3, 4, 6, PL),
        ...rect(23, 3, 27, 6, PL),
        px(1, 3, PR), px(2, 3, PR), px(3, 3, PR),
        px(24, 3, PR), px(25, 3, PR), px(26, 3, PR),
        // Destellos neon
        px(0, 1, GN), px(2, 0, GN), px(4, 1, GN),
        px(23, 1, GN), px(25, 0, GN), px(27, 1, GN),
      );
      break;

    case 'happy':
      out.push(
        ...rect(0, 10, 5, 15, F),
        ...rect(22, 10, 27, 15, F),
      );
      break;

    case 'sad':
      out.push(
        ...rect(0, 19, 5, 28, F),
        ...rect(22, 19, 27, 28, F),
      );
      break;

    case 'neutral':
    case 'workout_abdomen':
      out.push(
        ...rect(0, 15, 4, 22, F),
        ...rect(23, 15, 27, 22, F),
      );
      break;

    // ── PECHO: barra horizontal, forma de T muy visible ─────────────────────
    case 'workout_pecho':
      out.push(
        // Brazos extendidos horizontal
        ...rect(0, 15, 4, 17, F),
        ...rect(23, 15, 27, 17, F),
        // BARRA — 3 px de alto, toda la anchura
        ...rect(0, 14, 27, 16, ST),
        // DISCOS GRANDES en los extremos (5×10 px)
        ...rect(0, 11, 4, 21, PL),
        ...rect(23, 11, 27, 21, PL),
        // Brillo en discos
        px(1, 12, PR), px(2, 12, PR), px(1, 13, PR), px(2, 13, PR),
        px(25, 12, PR), px(26, 12, PR), px(25, 13, PR), px(26, 13, PR),
        // Agujero central del disco
        px(2, 16, DU), px(25, 16, DU),
      );
      break;

    // ── HOMBROS: barra sobre la cabeza ───────────────────────────────────────
    case 'workout_hombros':
      out.push(
        // Brazos rectos hacia arriba
        ...rect(4, 2, 8, 14, F),
        ...rect(19, 2, 23, 14, F),
        // BARRA overhead (por encima de la cabeza)
        ...rect(4, 0, 23, 2, ST),
        // DISCOS overhead
        ...rect(0, 0, 4, 7, PL),
        ...rect(23, 0, 27, 7, PL),
        px(1, 1, PR), px(2, 1, PR), px(1, 2, PR), px(2, 2, PR),
        px(25, 1, PR), px(26, 1, PR), px(25, 2, PR), px(26, 2, PR),
        px(2, 4, DU), px(25, 4, DU),
      );
      break;

    // ── PIERNAS: barra en espalda, postura ancha (piernas en getLegs) ────────
    case 'workout_piernas':
      out.push(
        // Brazos sosteniendo la barra en hombros
        ...rect(0, 14, 5, 16, F),
        ...rect(22, 14, 27, 16, F),
        // BARRA TRASERA
        ...rect(0, 13, 27, 14, ST),
        // Discos
        ...rect(0, 10, 3, 18, PL),
        ...rect(24, 10, 27, 18, PL),
        px(1, 11, PR), px(2, 11, PR),
        px(25, 11, PR), px(26, 11, PR),
        px(1, 14, DU), px(26, 14, DU),
      );
      break;

    // ── BÍCEPS: curl con mancuerna, un brazo arriba ──────────────────────────
    case 'workout_biceps':
      out.push(
        // Brazo izquierdo abajo
        ...rect(0, 15, 4, 23, F),
        // Brazo derecho curvado arriba
        ...rect(23, 15, 27, 19, F),  // parte inferior
        ...rect(22, 10, 26, 15, F),  // parte superior curvada
        // MANCUERNA en la cima del curl (grande y visible)
        ...rect(18, 4, 27, 9, PL),   // disco izquierdo grande
        ...rect(21, 3, 25, 11, DU),  // mango
        px(19, 5, PR), px(20, 5, PR), px(19, 6, PR), px(20, 6, PR),
        px(25, 5, PR), px(26, 5, PR), px(25, 6, PR), px(26, 6, PR),
        // Efecto de movimiento
        px(22, 3, YW), px(27, 4, YW),
      );
      break;

    // ── ESPALDA: remo, brazos tirando hacia atrás ────────────────────────────
    case 'workout_espalda':
      out.push(
        // Brazos tirados hacia atrás/abajo (efecto de tirón)
        ...rect(0, 17, 5, 22, F),
        ...rect(22, 17, 27, 22, F),
        // BARRA EN LA CINTURA
        ...rect(4, 19, 23, 21, ST),
        // Discos al frente de la barra
        ...rect(3, 17, 6, 23, PL),
        ...rect(21, 17, 24, 23, PL),
        px(4, 18, PR), px(5, 18, PR),
        px(22, 18, PR), px(23, 18, PR),
        // Líneas de tensión/cable
        px(0, 20, DU), px(1, 20, DU), px(2, 20, DU),
        px(25, 20, DU), px(26, 20, DU), px(27, 20, DU),
      );
      break;

    // ── TRÍCEPS: extensión bajada ─────────────────────────────────────────────
    case 'workout_triceps':
      out.push(
        ...rect(1, 15, 5, 23, F),
        ...rect(22, 15, 26, 23, F),
        // Cuerda/barra abajo
        ...rect(5, 22, 22, 23, ST),
        px(5, 22, PL), px(6, 22, PL),
        px(21, 22, PL), px(22, 22, PL),
      );
      break;

    // ── CARDIO: postura de carrera ────────────────────────────────────────────
    case 'workout_cardio':
      out.push(
        // Un brazo adelante, uno atrás (carrera)
        ...rect(0, 11, 5, 17, F),
        ...rect(22, 17, 27, 22, F),
      );
      break;

    default:
      out.push(
        ...rect(0, 15, 4, 22, F),
        ...rect(23, 15, 27, 22, F),
      );
  }

  return out;
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function BearAvatarV2({ state, size = 100, className = '' }: Props) {
  const allPixels: Px[] = [
    ...getHead(),
    ...getTorso(),
    ...getLegs(state),
    ...getFace(state),
    ...getArms(state),
  ];

  // Map para deduplicar: los píxeles más tardíos sobreescriben los anteriores
  const pixelMap = new Map<string, string>();
  for (const [x, y, c] of allPixels) {
    pixelMap.set(`${x},${y}`, c);
  }

  const isSad   = state === 'sad';
  const isHappy = state === 'fresh' || state === 'happy';
  const isWork  = state.startsWith('workout_');

  const animClass = isHappy ? 'bear-bounce'
    : isSad   ? 'bear-sway'
    : isWork  ? 'bear-pump'
    : 'bear-idle';

  return (
    <svg
      viewBox={`0 0 ${GRID_W} ${GRID_H}`}
      width={size}
      height={size * (GRID_H / GRID_W)}
      style={{ imageRendering: 'pixelated' }}
      className={`${animClass} ${className}`}
    >
      {[...pixelMap.entries()].map(([key, color]) => {
        const [x, y] = key.split(',').map(Number);
        return <rect key={key} x={x} y={y} width={1} height={1} fill={color} />;
      })}
    </svg>
  );
}
