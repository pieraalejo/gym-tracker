import React from 'react';
import type { BearState } from '../../types';

interface BearAvatarProps {
  state: BearState;
  size?: number;
  className?: string;
}

type Px = [number, number, string];

// ─── Color palette ────────────────────────────────────────────────────────────
const B  = '#8B5E3C';   // brown fur
const Bd = '#5C3D1E';   // dark brown
const Bm = '#9B6E44';   // mid brown (snout)
const W  = '#F5E6C8';   // cream belly
const Ei = '#1a1a1a';   // eye dark
const Ws = '#ffffff';   // white shine
const Gy = '#6b7280';   // gray metal
const GD = '#374151';   // dark metal
const Gn = '#39ff14';   // neon green
const Yw = '#fbbf24';   // yellow
const Bl = '#93c5fd';   // blue (tears)

function px(x: number, y: number, c: string): Px { return [x, y, c]; }

function rect(x1: number, y1: number, x2: number, y2: number, c: string): Px[] {
  const out: Px[] = [];
  for (let y = y1; y <= y2; y++)
    for (let x = x1; x <= x2; x++)
      out.push([x, y, c]);
  return out;
}

// ─── Base body (no arms — added per state) ───────────────────────────────────
function getBasePixels(): Px[] {
  return [
    // Ears
    ...rect(2, 0, 4, 1, B),
    ...rect(15, 0, 17, 1, B),
    px(3, 0, Bd), px(16, 0, Bd),

    // Head
    ...rect(2, 1, 17, 1, B),
    ...rect(1, 2, 18, 10, B),
    ...rect(2, 11, 17, 11, B),

    // Snout area (slightly lighter)
    ...rect(6, 6, 13, 10, Bm),

    // Torso
    ...rect(3, 12, 16, 17, B),

    // Belly
    ...rect(5, 13, 14, 16, W),

    // Legs
    ...rect(3, 18, 7, 22, B),
    ...rect(12, 18, 16, 22, B),

    // Feet (darker)
    ...rect(2, 23, 8, 23, Bd),
    ...rect(11, 23, 17, 23, Bd),
  ];
}

// ─── Face pixels — vary by state ─────────────────────────────────────────────
function getFacePixels(state: BearState): Px[] {
  const isSad   = state === 'sad';
  const isHappy = state === 'fresh' || state === 'happy';
  const isWork  = state.startsWith('workout_');

  const out: Px[] = [];

  // Nose (always the same)
  out.push(
    ...rect(8, 7, 11, 8, Bd),
    px(9, 7, '#2a1a0d'), px(10, 7, '#2a1a0d'),
  );

  if (isHappy) {
    // Squinted happy eyes (thin bars)
    out.push(
      ...rect(3, 5, 5, 5, Ei),
      ...rect(14, 5, 16, 5, Ei),
      // Star sparkles
      px(2, 4, Yw), px(17, 4, Yw),
      px(1, 3, Yw), px(18, 3, Yw),
      // Big U-shaped smile
      px(5, 9, Bd), px(14, 9, Bd),
      ...rect(6, 10, 13, 10, Bd),
      // Rosy cheeks
      px(3, 8, '#f9a8d4'), px(4, 8, '#f9a8d4'),
      px(15, 8, '#f9a8d4'), px(16, 8, '#f9a8d4'),
    );
  } else if (isSad) {
    // Sad eyes (normal size, lower position)
    out.push(
      ...rect(3, 5, 5, 7, Ei),
      ...rect(14, 5, 16, 7, Ei),
      px(3, 5, Bl), px(14, 5, Bl), // blue tint shine (sad)
      // Sad angled brows
      px(3, 3, Bd), px(4, 3, Bd), px(5, 4, Bd),
      px(16, 3, Bd), px(15, 3, Bd), px(14, 4, Bd),
      // Frown (n-shape = goes up at sides, down in middle)
      px(5, 8, Bd), px(14, 8, Bd),
      ...rect(6, 9, 13, 9, Bd),
      // Tear drops
      px(4, 9, Bl), px(4, 10, Bl), px(3, 11, Bl),
      px(15, 9, Bl), px(15, 10, Bl), px(16, 11, Bl),
    );
  } else if (isWork) {
    // Determined eyes (squinted concentration)
    out.push(
      ...rect(3, 4, 5, 5, Ei),
      ...rect(14, 4, 16, 5, Ei),
      px(3, 4, Ws), px(14, 4, Ws),
      // Sweat drop
      px(18, 5, Bl), px(18, 6, Bl),
      // Gritted mouth (determined)
      ...rect(6, 9, 13, 9, Bd),
      px(6, 9, W), px(8, 9, W), px(10, 9, W), px(12, 9, W), // teeth
    );
  } else {
    // Neutral eyes (2×3 squares with white shine)
    out.push(
      ...rect(3, 4, 5, 6, Ei),
      ...rect(14, 4, 16, 6, Ei),
      px(3, 4, Ws), px(14, 4, Ws),
      // Neutral straight mouth
      ...rect(6, 9, 13, 9, Bd),
    );
  }

  return out;
}

// ─── Arms — vary by state ─────────────────────────────────────────────────────
function getArmPixels(state: BearState): Px[] {
  const out: Px[] = [];

  if (state === 'fresh') {
    // Both arms raised — FLEXING with dumbbells
    out.push(
      ...rect(0, 6, 2, 11, B),
      ...rect(17, 6, 19, 11, B),
      // Dumbbells
      ...rect(0, 4, 3, 5, GD),
      ...rect(16, 4, 19, 5, GD),
      px(0, 4, Gy), px(3, 4, Gy), px(16, 4, Gy), px(19, 4, Gy),
      // Neon sparkles around dumbbells
      px(0, 3, Gn), px(4, 3, Gn), px(15, 3, Gn), px(19, 3, Gn),
    );
  } else if (state === 'happy') {
    // Arms slightly raised, thumbs up
    out.push(
      ...rect(0, 8, 2, 13, B),
      ...rect(17, 8, 19, 13, B),
      // Thumbs up shape
      px(0, 7, B), px(19, 7, B),
    );
  } else if (state === 'sad') {
    // Arms drooping very low
    out.push(
      ...rect(0, 15, 2, 20, B),
      ...rect(17, 15, 19, 20, B),
    );
  } else if (state.startsWith('workout_')) {
    // Specific exercise poses
    const muscle = state.replace('workout_', '') as string;

    if (muscle === 'pecho') {
      // Chest press — arms extended forward-ish (shown out to sides)
      out.push(
        ...rect(0, 10, 2, 14, B),
        ...rect(17, 10, 19, 14, B),
        // Barbell
        ...rect(0, 13, 19, 13, GD),
        px(0, 13, Gy), px(19, 13, Gy),
      );
    } else if (muscle === 'piernas') {
      // Squat — arms extended forward
      out.push(
        ...rect(0, 11, 2, 15, B),
        ...rect(17, 11, 19, 15, B),
        // Bar on shoulders
        ...rect(1, 11, 18, 11, GD),
        px(0, 11, Gy), px(19, 11, Gy),
      );
    } else if (muscle === 'biceps') {
      // Curl — one arm raised, one low
      out.push(
        ...rect(0, 7, 2, 12, B),
        ...rect(17, 11, 19, 16, B),
        // Dumbbell in raised arm
        ...rect(0, 5, 2, 6, GD),
        px(0, 5, Gy), px(2, 5, Gy),
      );
    } else if (muscle === 'espalda') {
      // Row — arms pulling back
      out.push(
        ...rect(0, 12, 3, 15, B),
        ...rect(16, 12, 19, 15, B),
      );
    } else if (muscle === 'hombros') {
      // Overhead press — arms up straight
      out.push(
        ...rect(0, 5, 2, 13, B),
        ...rect(17, 5, 19, 13, B),
        ...rect(0, 3, 19, 4, GD),
        px(0, 3, Gy), px(19, 3, Gy),
      );
    } else if (muscle === 'triceps') {
      // Pushdown — arms near body, angled down
      out.push(
        ...rect(0, 13, 2, 17, B),
        ...rect(17, 13, 19, 17, B),
      );
    } else {
      // Generic workout
      out.push(
        ...rect(0, 10, 2, 15, B),
        ...rect(17, 10, 19, 15, B),
      );
    }
  } else {
    // Normal resting arms
    out.push(
      ...rect(0, 12, 2, 16, B),
      ...rect(17, 12, 19, 16, B),
    );
  }

  return out;
}

// ─── Effect pixels (sparkles, etc.) ──────────────────────────────────────────
function getEffectPixels(state: BearState): Px[] {
  const out: Px[] = [];
  if (state === 'fresh') {
    out.push(
      px(0, 1, Gn), px(19, 1, Gn),
      px(0, 13, Gn), px(19, 13, Gn),
    );
  }
  if (state === 'sad') {
    // Rain drops on the ground
    out.push(
      px(5, 24, Bl), px(10, 25, Bl), px(14, 24, Bl),
    );
  }
  return out;
}

// ─── Component ────────────────────────────────────────────────────────────────
const BearAvatar: React.FC<BearAvatarProps> = ({ state, size = 100, className = '' }) => {
  const GRID_W = 20;
  const GRID_H = 24;

  const allPixels: Px[] = [
    ...getBasePixels(),
    ...getFacePixels(state),
    ...getArmPixels(state),
    ...getEffectPixels(state),
  ];

  // Deduplicate: later pixels override earlier ones at same position
  const pixelMap = new Map<string, string>();
  for (const [x, y, c] of allPixels) {
    pixelMap.set(`${x},${y}`, c);
  }

  const isSad   = state === 'sad';
  const isHappy = state === 'fresh' || state === 'happy';
  const isWork  = state.startsWith('workout_');

  const animClass = isHappy
    ? 'bear-bounce'
    : isSad
    ? 'bear-sway'
    : isWork
    ? 'bear-pump'
    : '';

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
};

export default BearAvatar;
