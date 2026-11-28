export interface StagePalette {
  name: string;
  accent: string;
  soft: string;
  border: string;
  glow: string;
  pillText: string;
  ink: string;
}

export interface PipelineStageData {
  step: string;
  tag: string;
  title: string;
  shortTitle: string;
  summary: string;
  specs: string[];
  accentNote: string;
  palette: StagePalette;
  docsHref: string;
  docsLabel: string;
  details: string[];
  command: string;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Fake 3D in 2D canvas: ~20 lines of cylindrical trig project a flat caption label
 * right around a curved dark-glass visor across the stage card (0 KB 3D models).
 */
function drawBentGlassLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  radiusX: number,
  radiusY: number,
  palette: StagePalette
) {
  const chars = [...text];
  ctx.save();
  ctx.font = '700 17px "Inter", "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const widths = chars.map((ch) => ctx.measureText(ch).width + 2.6);
  const totalW = widths.reduce((sum, w) => sum + w, 0);
  let cursor = -totalW / 2;

  for (let i = 0; i < chars.length; i++) {
    const w = widths[i];
    const localX = cursor + w * 0.5;
    cursor += w;
    const theta = (localX / Math.max(radiusX, 1)) * 0.92;
    const px = cx + Math.sin(theta) * radiusX;
    const py = cy + (1 - Math.cos(theta)) * radiusY;
    const foreshorten = Math.max(0.55, Math.cos(theta * 0.9));

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(theta * 0.34);
    ctx.scale(foreshorten, 1);
    ctx.globalAlpha = 0.45 + 0.55 * foreshorten;
    ctx.fillStyle = palette.pillText;
    ctx.fillText(chars[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

function drawDiagram(
  ctx: CanvasRenderingContext2D,
  stage: PipelineStageData,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const { step, palette } = stage;
  ctx.save();
  roundRectPath(ctx, x, y, w, h, 24);
  ctx.fillStyle = "rgba(7, 7, 9, 0.9)";
  ctx.fill();
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (step === "01") {
    const labels = ["YT", "TWITCH", "KICK", "MP4"];
    labels.forEach((lbl, idx) => {
      const bx = x + 32 + idx * 156;
      const by = y + 36;
      roundRectPath(ctx, bx, by, 140, 48, 12);
      ctx.fillStyle = idx === 0 ? palette.soft : "rgba(255, 255, 255, 0.04)";
      ctx.fill();
      ctx.strokeStyle = idx === 0 ? palette.border : "rgba(255, 255, 255, 0.1)";
      ctx.stroke();
      ctx.fillStyle = idx === 0 ? palette.pillText : "#d7cbc0";
      ctx.font = '600 20px "Inter", "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(lbl, bx + 70, by + 24);
    });

    const bars = [18, 34, 58, 40, 78, 92, 62, 44, 86, 70, 32, 54, 80, 48, 28, 66, 90, 52, 36, 22];
    bars.forEach((bh, i) => {
      const bx = x + 64 + i * 28;
      const by = y + 178 - bh / 2;
      roundRectPath(ctx, bx, by, 14, bh, 7);
      ctx.fillStyle = i >= 4 && i <= 9 ? palette.accent : "rgba(255, 255, 255, 0.24)";
      ctx.fill();
    });

    const tokens = ["00:12", "clip", "hook", "detected", "99.2%"];
    let tx = x + 32;
    ctx.font = '500 18px "Inter", "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = "left";
    tokens.forEach((tok, idx) => {
      const tw = ctx.measureText(tok).width + 32;
      if (tx + tw > x + w - 32) return;
      roundRectPath(ctx, tx, y + 258, tw, 40, 10);
      ctx.fillStyle = idx === 0 ? palette.soft : "rgba(255, 255, 255, 0.05)";
      ctx.fill();
      ctx.fillStyle = idx === 0 ? palette.pillText : "#e4dad0";
      ctx.fillText(tok, tx + 16, y + 279);
      tx += tw + 12;
    });
  } else if (step === "02") {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    for (let row = 1; row <= 3; row++) {
      ctx.beginPath();
      ctx.moveTo(x + 32, y + row * 72);
      ctx.lineTo(x + w - 32, y + row * 72);
      ctx.stroke();
    }

    const pts = [0.22, 0.28, 0.2, 0.38, 0.3, 0.85, 0.96, 0.65, 0.34, 0.48, 0.78, 0.42, 0.24];
    ctx.beginPath();
    pts.forEach((v, i) => {
      const px = x + 38 + (i / (pts.length - 1)) * (w - 76);
      const py = y + h - 54 - v * (h - 120);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 4;
    ctx.stroke();

    const peakX = x + 38 + (6 / (pts.length - 1)) * (w - 76);
    const peakY = y + h - 54 - 0.96 * (h - 120);
    ctx.beginPath();
    ctx.arc(peakX, peakY, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#fbf7f2";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(peakX, peakY, 20, 0, Math.PI * 2);
    ctx.strokeStyle = palette.glow;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    roundRectPath(ctx, peakX - 66, peakY - 56, 132, 36, 18);
    ctx.fillStyle = palette.accent;
    ctx.fill();
    ctx.fillStyle = palette.ink;
    ctx.font = '700 18px "Inter", "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PEAK 98", peakX, peakY - 38);
  } else if (step === "03") {
    const words = ["Wait", "for", "the", "exact", "moment", "it", "drops"];
    let wx = x + 36;
    let wy = y + 48;
    words.forEach((word, idx) => {
      const ww = word.length * 15 + 34;
      if (wx + ww > x + w - 36) {
        wx = x + 36;
        wy += 56;
      }
      const active = idx === 3 || idx === 4;
      roundRectPath(ctx, wx, wy, ww, 42, 10);
      ctx.fillStyle = active ? palette.soft : "rgba(255, 255, 255, 0.05)";
      ctx.fill();
      if (active) {
        ctx.strokeStyle = palette.accent;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.fillStyle = active ? "#fbf7f2" : "#b5a79c";
      ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(word, wx + ww / 2, wy + 22);
      wx += ww + 12;
    });

    roundRectPath(ctx, x + 36, y + 220, w - 72, 74, 16);
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.fill();
    ctx.fillStyle = palette.accent;
    ctx.font = '800 32px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("BOUNCE  ·  HYPE  ·  CLEAN", x + w / 2, y + 258);
  } else if (step === "04") {
    ctx.fillStyle = "#b5a79c";
    ctx.font = '600 18px "Inter", "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("VOICE TRACK", x + 36, y + 48);
    for (let i = 0; i < 24; i++) {
      const active = i >= 5 && i <= 17;
      const bh = active ? 26 + ((i * 19) % 42) : 12;
      roundRectPath(ctx, x + 36 + i * 24, y + 104 - bh / 2, 14, bh, 7);
      ctx.fillStyle = active ? "#fbf7f2" : "rgba(255, 255, 255, 0.2)";
      ctx.fill();
    }

    ctx.fillStyle = palette.pillText;
    ctx.fillText("BGM SIDECHAIN DUCK (-14 LUFS)", x + 36, y + 190);
    ctx.beginPath();
    ctx.moveTo(x + 36, y + 228);
    ctx.lineTo(x + 146, y + 228);
    ctx.lineTo(x + 186, y + 286);
    ctx.lineTo(x + 448, y + 286);
    ctx.lineTo(x + 488, y + 228);
    ctx.lineTo(x + w - 36, y + 228);
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 4;
    ctx.stroke();
  } else if (step === "05") {
    const fw = 176;
    const fh = 276;
    const fx = x + 44;
    const fy = y + 28;
    roundRectPath(ctx, fx, fy, fw, fh, 18);
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.fill();
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    roundRectPath(ctx, fx + 14, fy + 14, fw - 28, 84, 12);
    ctx.fillStyle = palette.soft;
    ctx.fill();
    ctx.fillStyle = palette.pillText;
    ctx.font = '600 16px "Inter", "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("FACECAM", fx + fw / 2, fy + 58);

    roundRectPath(ctx, fx + 14, fy + 110, fw - 28, 152, 12);
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fill();
    ctx.fillStyle = "#d7cbc0";
    ctx.fillText("GAMEPLAY", fx + fw / 2, fy + 188);

    const signals = ["LIVE MONITOR: ON", "UNIQUE CHAT: 4.2x", "GAME: VALORANT"];
    signals.forEach((sig, i) => {
      roundRectPath(ctx, fx + fw + 34, fy + 26 + i * 78, w - fw - 114, 54, 14);
      ctx.fillStyle = i === 0 ? palette.soft : "rgba(255, 255, 255, 0.05)";
      ctx.fill();
      ctx.fillStyle = i === 0 ? palette.pillText : "#fbf7f2";
      ctx.font = '600 18px "Inter", "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(sig, fx + fw + 54, fy + 55 + i * 78);
    });
  } else {
    const nodes = [
      { label: "FAIR JOB QUEUE", sub: "FastAPI + Multi-user", x: x + 44, y: y + 40, w: w - 88 },
      { label: "SQLITE / POSTGRES", sub: "Persistent state", x: x + 44, y: y + 140, w: (w - 108) / 2 },
      { label: "GPU ASR WORKER", sub: "Optional offload", x: x + 64 + (w - 108) / 2, y: y + 140, w: (w - 108) / 2 },
      { label: "DOCKER + CADDY", sub: "Zero-config HTTPS", x: x + 44, y: y + 236, w: w - 88 },
    ];
    nodes.forEach((n, idx) => {
      roundRectPath(ctx, n.x, n.y, n.w, 72, 16);
      ctx.fillStyle = idx === 0 ? palette.soft : "rgba(255, 255, 255, 0.04)";
      ctx.fill();
      ctx.strokeStyle = idx === 0 ? palette.border : "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#fbf7f2";
      ctx.font = '700 19px "Inter", "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(n.label, n.x + 22, n.y + 30);
      ctx.fillStyle = "#b5a79c";
      ctx.font = '500 17px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(n.sub, n.x + 22, n.y + 54);
    });
  }

  ctx.restore();
}

export function renderPipelineCardTexture(stage: PipelineStageData): string {
  if (typeof document === "undefined") return "";

  const { palette } = stage;
  const width = 780;
  const height = 1000;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Deep pure-black obsidian glass base with subtle top stage-hue aura
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#0a0a0c");
  bg.addColorStop(0.55, "#050506");
  bg.addColorStop(1, "#000000");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const aura = ctx.createRadialGradient(width * 0.5, 40, 20, width * 0.5, 160, 520);
  aura.addColorStop(0, palette.soft);
  aura.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, width, height);

  // Crisp subtle precision lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.025)";
  ctx.lineWidth = 1;
  for (let gx = 48; gx < width; gx += 48) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, height);
    ctx.stroke();
  }
  for (let gy = 48; gy < height; gy += 48) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(width, gy);
    ctx.stroke();
  }

  // Subtle tinted glass edge without heavy outer border box
  roundRectPath(ctx, 14, 14, width - 28, height - 28, 32);
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Stage palette badge
  roundRectPath(ctx, 52, 52, 152, 44, 22);
  ctx.fillStyle = palette.soft;
  ctx.fill();
  ctx.strokeStyle = palette.border;
  ctx.stroke();

  ctx.fillStyle = palette.pillText;
  ctx.font = '700 20px "Inter", "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`STAGE ${stage.step}`, 128, 74);

  // Cylindrical 2D-projected glass label at top-right
  drawBentGlassLabel(
    ctx,
    stage.accentNote.toUpperCase(),
    width - 196,
    68,
    240,
    24,
    palette
  );

  // Stage Title
  ctx.fillStyle = "#fbf7f2";
  ctx.font = '700 44px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const titleLines = wrapLines(ctx, stage.shortTitle, width - 104);
  titleLines.slice(0, 2).forEach((line, idx) => {
    ctx.fillText(line, 52, 128 + idx * 52);
  });

  // Mini diagram
  drawDiagram(ctx, stage, 52, 260, width - 104, 336);

  // Summary text
  ctx.fillStyle = "#c8bbb0";
  ctx.font = '400 26px "Plus Jakarta Sans", sans-serif';
  const summaryLines = wrapLines(ctx, stage.summary, width - 104);
  summaryLines.slice(0, 4).forEach((line, idx) => {
    ctx.fillText(line, 52, 636 + idx * 38);
  });

  // Stage-specific action pill + spec chips (unique per-stage palette)
  let sx = 52;
  let sy = 838;
  ctx.font = '600 18px "Inter", "Plus Jakarta Sans", sans-serif';
  ctx.textBaseline = "middle";
  stage.specs.forEach((spec) => {
    const sw = ctx.measureText(spec).width + 34;
    if (sx + sw > width - 52) {
      sx = 52;
      sy += 52;
    }
    roundRectPath(ctx, sx, sy, sw, 40, 12);
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.fill();
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = "#efe9e3";
    ctx.fillText(spec, sx + 17, sy + 20);
    sx += sw + 10;
  });

  // Bent glass CTA whisper at bottom of card
  drawBentGlassLabel(
    ctx,
    `CLICK TO EXPAND · ${stage.tag.toUpperCase()}`,
    width / 2,
    height - 34,
    380,
    18,
    palette
  );

  return canvas.toDataURL("image/png");
}
