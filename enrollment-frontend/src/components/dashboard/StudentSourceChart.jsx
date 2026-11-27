import React, { useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { saveAs } from 'file-saver';

import { Button } from '@/components/ui/button';

/**
 * How students first heard about the school, as a pie with depth.
 *
 * Drawn by hand in SVG rather than with the chart library: the library has no
 * third dimension, and keeping the whole figure — heading, slices, legend and
 * the date — inside one SVG means it can be handed over as a single PNG.
 *
 * A tilted pie flatters the slices nearest the viewer, so every slice carries
 * its own percentage and the legend beside it carries the counts. Nothing here
 * has to be judged by the size of a wedge.
 *
 * Students who were never asked are deliberately NOT a slice. Four in five
 * have no answer on file, and as a wedge that fact would swallow the question
 * the chart exists to answer; it is stated under the legend instead.
 */

const W = 900;
const M = 36;

const CX = 232;
const CY = 208;
const RX = 176;
const RY = 76;
const DEPTH = 30;

const LEGEND_X = 476;
const LEGEND_ROW = 38;

const INK = '#111827';
const INK_SOFT = '#4b5563';
const INK_FAINT = '#9ca3af';
const GRID = '#e5e7eb';
const FONT = 'Inter, "Segoe UI", Roboto, system-ui, -apple-system, sans-serif';

const TAU = Math.PI * 2;
const START = -Math.PI / 2; // twelve o'clock

/** The same hue, walked towards black, for the side of the slice. */
const shade = (hex, f) => {
  const n = parseInt(hex.slice(1), 16);
  const part = (shift) => Math.round(((n >> shift) & 255) * f);
  return `#${((1 << 24) | (part(16) << 16) | (part(8) << 8) | part(0)).toString(16).slice(1)}`;
};

const px = (a) => CX + RX * Math.cos(a);
const py = (a) => CY + RY * Math.sin(a);

/** The lit top of a slice. */
const topPath = (a0, a1) =>
  `M${CX},${CY} L${px(a0)},${py(a0)}`
  + ` A${RX},${RY} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${px(a1)},${py(a1)} Z`;

/**
 * The side wall, which exists only where the rim faces the viewer — the lower
 * half of the ellipse, angles 0 to pi.
 */
const wallPath = (a0, a1) => {
  const w0 = Math.max(a0, 0);
  const w1 = Math.min(a1, Math.PI);
  if (w1 <= w0) return null;
  return `M${px(w0)},${py(w0)} A${RX},${RY} 0 0 1 ${px(w1)},${py(w1)}`
    + ` L${px(w1)},${py(w1) + DEPTH} A${RX},${RY} 0 0 0 ${px(w0)},${py(w0) + DEPTH} Z`;
};

const StudentSourceChart = ({ sources, unknown = 0, scopeLabel }) => {
  const svgRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const answered = sources.reduce((n, s) => n + s.value, 0);
  if (answered === 0) return null;

  // Slices run clockwise from twelve o'clock, largest first.
  let cursor = START;
  const slices = sources.map((s) => {
    const sweep = (s.value / answered) * TAU;
    const slice = { ...s, a0: cursor, a1: cursor + sweep, pct: (s.value / answered) * 100 };
    cursor += sweep;
    return slice;
  });

  const whole = slices.length === 1;

  // Walls are painted back to front: the slice nearest the viewer sits at the
  // bottom of the ellipse, at an angle of pi/2.
  const walls = [...slices].sort((a, b) =>
    Math.abs((b.a0 + b.a1) / 2 - Math.PI / 2) - Math.abs((a.a0 + a.a1) / 2 - Math.PI / 2));

  const pieBottom = CY + RY + DEPTH;
  const legendTop = Math.max(132, CY - (slices.length * LEGEND_ROW) / 2);
  const legendBottom = legendTop + slices.length * LEGEND_ROW;
  const captionY = Math.max(pieBottom, legendBottom) + 34;
  const H = captionY + 30;

  const today = new Date();
  const stamp = today.toLocaleDateString('en-PH', { day: 'numeric', month: 'long', year: 'numeric' });

  const downloadPng = async () => {
    const svg = svgRef.current;
    if (!svg || saving) return;
    setSaving(true);
    try {
      const clone = svg.cloneNode(true);
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.setAttribute('width', String(W));
      clone.setAttribute('height', String(H));

      const source = new XMLSerializer().serializeToString(clone);
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
      });

      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = W * scale;
      canvas.height = H * scale;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
      if (blob) saveAs(blob, `how-students-heard-about-us-${today.toISOString().slice(0, 10)}.png`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={downloadPng}
        disabled={saving}
        className="absolute right-0 top-0 z-10 bg-white"
      >
        {saving
          ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          : <Download className="w-4 h-4 mr-2" />}
        Download PNG
      </Button>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ height: 'auto', display: 'block' }}
        fontFamily={FONT}
        role="img"
        aria-label={`How students heard about the school: ${slices.map((s) => `${s.name} ${s.value}`).join(', ')}`}
      >
        <rect x="0" y="0" width={W} height={H} fill="#ffffff" />

        <text x={M} y="48" fontSize="22" fontWeight="700" fill={INK}>
          How students heard about us
        </text>
        <text x={M} y="72" fontSize="13" fill={INK_SOFT}>
          {scopeLabel}
        </text>

        {/* ---- The pie ---- */}
        {whole ? (
          <>
            <path
              d={`M${CX - RX},${CY} A${RX},${RY} 0 0 0 ${CX + RX},${CY}`
                + ` L${CX + RX},${CY + DEPTH} A${RX},${RY} 0 0 1 ${CX - RX},${CY + DEPTH} Z`}
              fill={shade(slices[0].color, 0.68)}
            />
            <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill={slices[0].color} />
          </>
        ) : (
          <>
            {walls.map((s) => {
              const d = wallPath(s.a0, s.a1);
              return d ? <path key={`wall-${s.name}`} d={d} fill={shade(s.color, 0.68)} /> : null;
            })}
            {slices.map((s) => (
              <path
                key={`top-${s.name}`}
                d={topPath(s.a0, s.a1)}
                fill={s.color}
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            ))}
          </>
        )}

        {/* The share, written on the slice. A dark halo keeps it readable on
            every one of them rather than only the dark ones. */}
        {slices.filter((s) => s.pct >= 7).map((s) => {
          const mid = whole ? START + Math.PI : (s.a0 + s.a1) / 2;
          return (
            <text
              key={`pct-${s.name}`}
              x={CX + RX * 0.62 * Math.cos(mid)}
              y={CY + RY * 0.62 * Math.sin(mid) + 5}
              fontSize="15"
              fontWeight="700"
              fill="#ffffff"
              stroke="rgba(0,0,0,0.38)"
              strokeWidth="3"
              strokeLinejoin="round"
              paintOrder="stroke"
              textAnchor="middle"
            >
              {Math.round(s.pct)}%
            </text>
          );
        })}

        {/* ---- Legend: the figures themselves ---- */}
        {slices.map((s, i) => {
          const y = legendTop + i * LEGEND_ROW;
          return (
            <g key={`key-${s.name}`}>
              <rect x={LEGEND_X} y={y - 11} width="13" height="13" rx="4" fill={s.color} />
              <text x={LEGEND_X + 24} y={y} fontSize="14.5" fill={INK_SOFT}>{s.name}</text>
              <text x={W - M - 62} y={y} fontSize="15" fontWeight="700" fill={INK} textAnchor="end">
                {s.value.toLocaleString()}
              </text>
              <text x={W - M} y={y} fontSize="13.5" fontWeight="600" fill={INK_FAINT} textAnchor="end">
                {Math.round(s.pct)}%
              </text>
              <line
                x1={LEGEND_X}
                y1={y + 13}
                x2={W - M}
                y2={y + 13}
                stroke={GRID}
                strokeWidth="1"
              />
            </g>
          );
        })}

        <text x={M} y={captionY} fontSize="12" fill={INK_FAINT}>
          {answered.toLocaleString()} students told us how they heard about the school
          {unknown > 0 && ` · ${unknown.toLocaleString()} have no answer on file and are not counted here`}
        </text>
        <text x={W - M} y={captionY} fontSize="11" fill={INK_FAINT} textAnchor="end">
          {stamp}
        </text>
      </svg>
    </div>
  );
};

export default StudentSourceChart;
