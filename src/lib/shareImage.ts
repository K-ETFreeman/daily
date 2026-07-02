import type { Unit } from './units';
import { compareRow } from './compare';
import { iconUrl, FACTION_COLOR } from './units';
import { puzzleNumber } from './daily';

// Palette mirrors the app.
const C = {
  bg: '#0f131c',
  panel: '#1a2233',
  hit: '#34d399',
  partial: '#fbbf24',
  miss: '#38415a',
  text: '#e8eef7',
  dim: '#8a97ad',
  accent: '#f47b3f',
};

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

interface Opts {
  /** Hide all unit identity — draw only the match squares (safe to post). */
  spoilerFree?: boolean;
}

/**
 * Render a share card of your run.
 *  - default: one row per guess = portrait + name + 11 attribute-match squares,
 *    with the winning guess redacted so the answer is never shown.
 *  - spoilerFree: only the squares (no portraits, no names) — reveals nothing.
 * Both carry a "try it yourself" + site link footer.
 */
export async function buildShareImage(
  guesses: Unit[],
  answer: Unit,
  opts: Opts = {}
): Promise<Blob | null> {
  try {
    await (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready;
  } catch {
    /* fonts optional */
  }

  const spoilerFree = !!opts.spoilerFree;
  const scale = 2;
  const W = 680;
  const pad = 26;
  const headerH = 92;
  const rowH = spoilerFree ? 34 : 56;
  const footerH = 54;
  const H = headerH + guesses.length * rowH + footerH;

  const canvas = document.createElement('canvas');
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(scale, scale);

  // preload portraits only when we actually draw them
  const imgs = spoilerFree
    ? []
    : await Promise.all(
        guesses.map((g) => (g.id === answer.id ? Promise.resolve(null) : loadImg(iconUrl(g.id))))
      );

  // background
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // title
  ctx.textAlign = 'left';
  ctx.fillStyle = C.text;
  ctx.font = '800 28px "Martian Mono", monospace';
  ctx.fillText(`FAF DAILY #${puzzleNumber()}`, pad, 46);
  ctx.fillStyle = C.dim;
  ctx.font = '600 15px Inter, sans-serif';
  ctx.fillText(`Solved in ${guesses.length} ${guesses.length === 1 ? 'try' : 'tries'}`, pad, 72);

  // rows
  const sq = 16;
  const gap = 4;
  const squaresW = 11 * (sq + gap) - gap;
  const squaresX = spoilerFree ? pad + 32 : W - pad - squaresW;

  guesses.forEach((g, i) => {
    const y = headerH + i * rowH;
    const win = g.id === answer.id;
    const cells = compareRow(g, answer);

    // try number
    ctx.fillStyle = C.dim;
    ctx.font = '700 12px "Martian Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(String(i + 1).padStart(2, '0'), pad, y + rowH / 2 + 4);

    if (!spoilerFree) {
      // portrait
      const ps = 34;
      const px = pad + 26;
      const py = y + (rowH - ps) / 2;
      ctx.fillStyle = C.panel;
      ctx.fillRect(px, py, ps, ps);
      if (win) {
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px + 0.75, py + 0.75, ps - 1.5, ps - 1.5);
        ctx.fillStyle = C.accent;
        ctx.font = '800 20px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('?', px + ps / 2, py + ps / 2 + 7);
        ctx.textAlign = 'left';
      } else if (imgs[i]) {
        ctx.drawImage(imgs[i] as HTMLImageElement, px, py, ps, ps);
      } else {
        ctx.fillStyle = FACTION_COLOR[g.faction];
        ctx.fillRect(px, py, 3, ps);
      }
      // name
      ctx.font = '700 15px Inter, sans-serif';
      ctx.fillStyle = win ? C.accent : C.text;
      ctx.fillText(win ? '█████  (hidden)' : g.name, px + ps + 12, y + rowH / 2 + 5);
    }

    // squares
    cells.forEach((c, j) => {
      ctx.fillStyle = c.state === 'hit' ? C.hit : c.state === 'partial' ? C.partial : C.miss;
      ctx.fillRect(squaresX + j * (sq + gap), y + (rowH - sq) / 2, sq, sq);
    });
  });

  // footer — try it yourself + link
  const host = (typeof location !== 'undefined' && location.host) || 'FAF Daily';
  ctx.textAlign = 'center';
  ctx.font = '700 13px "Martian Mono", monospace';
  ctx.fillStyle = C.accent;
  const label = 'TRY IT YOURSELF  ·  ';
  const labelW = ctx.measureText(label).width;
  ctx.fillStyle = C.dim;
  const hostW = ctx.measureText(host).width;
  const startX = W / 2 - (labelW + hostW) / 2;
  ctx.textAlign = 'left';
  ctx.fillStyle = C.accent;
  ctx.fillText(label, startX, H - 22);
  ctx.fillStyle = C.dim;
  ctx.fillText(host, startX + labelW, H - 22);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}
