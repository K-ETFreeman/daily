import type { Unit } from './units';
import { compareRow } from './compare';
import { iconUrl, FACTION_COLOR } from './units';
import { puzzleNumber } from './daily';

// Palette mirrors the app.
const C = {
  bg: '#0f131c',
  panel: '#1a2233',
  line: '#2a3346',
  hit: '#34d399',
  partial: '#fbbf24',
  miss: '#38415a',
  text: '#e8eef7',
  dim: '#8a97ad',
  accent: '#f47b3f',
  warnBg: 'rgba(244, 63, 94, 0.16)',
  warn: '#fb7185',
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

/**
 * Render the "how you got there" share card:
 *  - a baked-in SPOILER warning banner,
 *  - one row per guess (portrait + name + the 11 attribute-match squares),
 *  - the winning guess redacted so the answer itself is never shown.
 */
export async function buildShareImage(guesses: Unit[], answer: Unit): Promise<Blob | null> {
  try {
    await (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready;
  } catch {
    /* fonts optional */
  }

  const scale = 2;
  const W = 680;
  const bannerH = 46;
  const headerH = bannerH + 92;
  const rowH = 56;
  const footerH = 52;
  const H = headerH + guesses.length * rowH + footerH;
  const pad = 26;

  const canvas = document.createElement('canvas');
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(scale, scale);

  // preload portraits (skip the winning guess — it stays hidden)
  const imgs = await Promise.all(
    guesses.map((g) => (g.id === answer.id ? Promise.resolve(null) : loadImg(iconUrl(g.id))))
  );

  // background
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // spoiler banner
  ctx.fillStyle = C.warnBg;
  ctx.fillRect(0, 0, W, bannerH);
  ctx.fillStyle = C.warn;
  ctx.font = '800 19px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚠️  SPOILERS AHEAD  ⚠️', W / 2, bannerH / 2 + 7);

  // title
  ctx.textAlign = 'left';
  ctx.fillStyle = C.text;
  ctx.font = '800 28px "Martian Mono", monospace';
  ctx.fillText(`FAF DAILY #${puzzleNumber()}`, pad, bannerH + 46);
  ctx.fillStyle = C.dim;
  ctx.font = '600 15px Inter, sans-serif';
  ctx.fillText(
    `Solved in ${guesses.length} ${guesses.length === 1 ? 'try' : 'tries'}`,
    pad,
    bannerH + 72
  );

  // rows
  const sq = 15;
  const gap = 4;
  const squaresW = 11 * (sq + gap) - gap;
  const squaresX = W - pad - squaresW;

  guesses.forEach((g, i) => {
    const y = headerH + i * rowH;
    const win = g.id === answer.id;
    const cells = compareRow(g, answer);

    // try number
    ctx.fillStyle = C.dim;
    ctx.font = '700 12px "Martian Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(String(i + 1).padStart(2, '0'), pad, y + rowH / 2 + 4);

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

    // 11 attribute squares
    cells.forEach((c, j) => {
      ctx.fillStyle = c.state === 'hit' ? C.hit : c.state === 'partial' ? C.partial : C.miss;
      ctx.fillRect(squaresX + j * (sq + gap), y + (rowH - sq) / 2, sq, sq);
    });
  });

  // footer
  ctx.fillStyle = C.dim;
  ctx.font = '600 12px "Martian Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText((typeof location !== 'undefined' && location.host) || 'FAF Daily', W / 2, H - 22);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}
