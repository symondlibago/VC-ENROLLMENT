import React, { useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { saveAs } from 'file-saver';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HOME_CITY, prettyPlace } from '@/lib/addressResolver';

/**
 * Where the students come from, and how many of them live outside the city.
 *
 * Drawn as one SVG rather than as HTML, for one reason: the whole figure —
 * heading, the inside/outside split, the ranked towns, the date it was taken —
 * can then be handed over as a single PNG, which is what gets pasted into the
 * president's report. An HTML chart would need a screenshot library to do the
 * same, and would still lose the heading.
 *
 * The home city is deliberately kept out of the ranked bars. Four hundred
 * students against a next-largest of forty-nine flattens every other bar to a
 * stub, and those bars are the half of the answer in question — the split at
 * the top already carries that comparison.
 *
 * Blue is this city, orange is outside it, the same two hues throughout, both
 * validated for colour-vision deficiency. Every bar carries its number, so the
 * fill is never the only thing to read.
 */

const HOME = '#257de0';
const AWAY = '#f47230';
const INK = '#111827';
const INK_SOFT = '#4b5563';
const INK_FAINT = '#9ca3af';
const GRID = '#e5e7eb';
const FONT = 'Inter, "Segoe UI", Roboto, system-ui, -apple-system, sans-serif';

const W = 900;
const M = 36;

const STAT_LABEL_Y = 112;
const STAT_VALUE_Y = 142;
const SPLIT_BAR_Y = 160;
const SPLIT_BAR_H = 14;
const CAPTION_Y = 194;
const DIVIDER_Y = 214;
const SECTION_Y = 244;
const ROWS_TOP = 264;
const ROW_H = 34;
const BAR_H = 16;

const PLOT_X0 = M + 168;
const COUNT_X = W - M;
const PLOT_X1 = COUNT_X - 52;

const pct = (part, whole) => (whole > 0 ? (part / whole) * 100 : 0);
const share = (part, whole) => `${Math.round(pct(part, whole))}%`;

/** The next round number at or above v, so the axis ends somewhere sensible. */
const niceMax = (v) => {
  if (v <= 4) return Math.max(1, v);
  const base = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8]) {
    if (v <= m * base) return m * base;
  }
  return 10 * base;
};

/** A bar anchored square to the baseline, rounded only at the data end. */
const barPath = (x, y, w, h, r = 4) => {
  if (w <= r) return `M${x},${y} h${Math.max(w, 2)} v${h} h${-Math.max(w, 2)} Z`;
  return `M${x},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r}`
    + ` V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x} Z`;
};

/** The name gutter holds about twenty characters at 13.5px. */
const clip = (text, max = 20) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

const StudentOriginChart = ({ origin, typeLabel, scopeLabel }) => {
  const svgRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const { unknown, known, places, top } = origin;
  if (known === 0) return null;

  // Two questions, one drawing. By city: how many live outside it. By
  // barangay: where inside it they live.
  const isCity = origin.view !== 'barangay';
  const CITY = prettyPlace(HOME_CITY);

  const heading = isCity ? 'Where students come from' : `Where students live in ${CITY}`;
  const barsTitle = isCity ? 'TOWNS OUTSIDE THE CITY' : 'BARANGAYS IN THE CITY';
  const BAR = isCity ? AWAY : HOME;

  const stats = isCity
    ? [
      { color: HOME, label: `In ${CITY}`, value: origin.home, share: share(origin.home, known) },
      { color: AWAY, label: 'Outside the city', value: origin.outside, share: share(origin.outside, known) },
    ]
    : [
      { label: `Students in ${CITY}`, value: origin.students },
      { label: 'Barangays they live in', value: origin.areas },
    ];

  // Without the split bar everything below it moves up by its height.
  const SHIFT = isCity ? 0 : -34;
  const captionY = CAPTION_Y + SHIFT;
  const dividerY = DIVIDER_Y + SHIFT;
  const sectionY = SECTION_Y + SHIFT;
  const rowsTop = ROWS_TOP + SHIFT;

  const rows = top;
  const axisMax = niceMax(Math.max(0, ...rows.map((r) => r.count)));
  // Deduplicated, so a tiny axis (max 3) reads 0 1 2 3 rather than 0 1 2 2 3.
  const ticks = [...new Set([0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(axisMax * f)))];
  const tickX = (v) => PLOT_X0 + (v / axisMax) * (PLOT_X1 - PLOT_X0);

  const rowsBottom = rowsTop + rows.length * ROW_H;
  const axisY = rows.length ? rowsBottom + 6 : dividerY;
  const footerY = rows.length ? axisY + 44 : dividerY + 26;
  const H = footerY + 14;

  const innerW = W - M * 2;
  const homeW = isCity ? Math.max(0, ((innerW - 3) * pct(origin.home, known)) / 100) : 0;
  const awayW = Math.max(0, innerW - 3 - homeW);

  const today = new Date();
  const stamp = today.toLocaleDateString('en-PH', { day: 'numeric', month: 'long', year: 'numeric' });

  const downloadPng = async () => {
    const svg = svgRef.current;
    if (!svg || saving) return;
    setSaving(true);
    try {
      // The live <svg> is sized by CSS; the clone is given real pixels so the
      // browser has something to rasterise.
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

      const scale = 2; // readable when dropped into a slide or printed
      const canvas = document.createElement('canvas');
      canvas.width = W * scale;
      canvas.height = H * scale;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
      if (blob) {
        const iso = today.toISOString().slice(0, 10);
        const stem = isCity ? 'where-students-come-from' : 'students-by-barangay';
        saveAs(blob, `${stem}-${typeLabel.toLowerCase()}-${iso}.png`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0 relative">
        {/* The heading lives inside the SVG, so a downloaded PNG carries it.
            Only the button is HTML, floated over the chart's own title row. */}
        <Button
          variant="outline"
          size="sm"
          onClick={downloadPng}
          disabled={saving}
          className="absolute right-4 top-4 z-10 bg-white"
        >
          {saving
            ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            : <Download className="w-4 h-4 mr-2" />}
          Download PNG
        </Button>

        <div className="px-2 py-2 sm:px-4">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            style={{ height: 'auto', display: 'block' }}
            fontFamily={FONT}
            role="img"
            aria-label={isCity
              ? `${origin.home} students from ${CITY} and ${origin.outside} from outside it`
              : `${origin.students} students across ${origin.areas} barangays of ${CITY}`}
          >
            <rect x="0" y="0" width={W} height={H} fill="#ffffff" />

            {/* ---- Heading ---- */}
            <text x={M} y="52" fontSize="22" fontWeight="700" fill={INK}>
              {heading}
            </text>
            <text x={M} y="76" fontSize="13" fill={INK_SOFT}>
              {scopeLabel || `${typeLabel} students`}
            </text>

            {/* ---- The headline figures ---- */}
            {stats.map((stat, i) => {
              const x = i === 0 ? M : W / 2 + 6;
              return (
                <g key={stat.label}>
                  {/* A swatch only where the figure keys to the bar below it */}
                  {stat.color && (
                    <rect x={x} y={STAT_LABEL_Y - 9} width="10" height="10" rx="3" fill={stat.color} />
                  )}
                  <text
                    x={stat.color ? x + 17 : x}
                    y={STAT_LABEL_Y}
                    fontSize="11.5"
                    fontWeight="600"
                    fill={INK_SOFT}
                    letterSpacing="0.6"
                  >
                    {stat.label.toUpperCase()}
                  </text>
                  {/* One <text>: the share flows after the number, so neither
                      has to be positioned by guessing at its width. */}
                  <text x={x} y={STAT_VALUE_Y}>
                    <tspan fontSize="27" fontWeight="700" fill={INK}>{stat.value.toLocaleString()}</tspan>
                    {stat.share && (
                      <tspan dx="9" fontSize="14.5" fontWeight="600" fill={INK_SOFT}>{stat.share}</tspan>
                    )}
                  </text>
                </g>
              );
            })}

            {isCity && (
              <>
                <rect x={M} y={SPLIT_BAR_Y} width={homeW} height={SPLIT_BAR_H} rx="7" fill={HOME} />
                <rect x={M + homeW + 3} y={SPLIT_BAR_Y} width={awayW} height={SPLIT_BAR_H} rx="7" fill={AWAY} />
              </>
            )}

            <text x={M} y={captionY} fontSize="12" fill={INK_FAINT}>
              {`${known.toLocaleString()} students placed to a ${isCity ? 'town' : 'barangay'}`}
              {!isCity && origin.elsewhere > 0 && ` · ${origin.elsewhere} live outside the city`}
              {unknown > 0 && (isCity
                ? ` · ${unknown} ${unknown === 1 ? 'address names' : 'addresses name'} none and are left out of this split`
                : ` · ${unknown} ${unknown === 1 ? 'address names' : 'addresses name'} no barangay`)}
            </text>

            {rows.length > 0 && (
              <>
                <line x1={M} y1={dividerY} x2={COUNT_X} y2={dividerY} stroke={GRID} strokeWidth="1" />

                <text x={M} y={sectionY} fontSize="11.5" fontWeight="700" fill={INK_SOFT} letterSpacing="0.8">
                  {barsTitle}
                </text>
                <text x={COUNT_X} y={sectionY} fontSize="11.5" fill={INK_FAINT} textAnchor="end">
                  {rows.length < places ? `top ${rows.length} of ${places}` : `all ${places}`}
                </text>

                {/* Gridlines sit behind the bars and stay recessive */}
                {ticks.map((t) => (
                  <line
                    key={`grid-${t}`}
                    x1={tickX(t)}
                    y1={rowsTop - 10}
                    x2={tickX(t)}
                    y2={axisY}
                    stroke={GRID}
                    strokeWidth="1"
                  />
                ))}

                {rows.map((row, i) => {
                  const barTop = rowsTop + i * ROW_H;
                  const mid = barTop + BAR_H / 2 + 4.5;
                  const width = (row.count / axisMax) * (PLOT_X1 - PLOT_X0);
                  const name = prettyPlace(row.short || row.label);
                  return (
                    <g key={row.label}>
                      <title>{`${name}: ${row.count} students`}</title>
                      <text x={PLOT_X0 - 16} y={mid} fontSize="13.5" fill={INK_SOFT} textAnchor="end">
                        {clip(name)}
                      </text>
                      <path d={barPath(PLOT_X0, barTop, width, BAR_H)} fill={BAR} />
                      <text x={COUNT_X} y={mid} fontSize="13.5" fontWeight="700" fill={INK} textAnchor="end">
                        {row.count}
                      </text>
                    </g>
                  );
                })}

                <line x1={PLOT_X0} y1={axisY} x2={PLOT_X1} y2={axisY} stroke={GRID} strokeWidth="1" />
                {ticks.map((t) => (
                  <text
                    key={`tick-${t}`}
                    x={tickX(t)}
                    y={axisY + 18}
                    fontSize="11"
                    fill={INK_FAINT}
                    textAnchor="middle"
                  >
                    {t}
                  </text>
                ))}
              </>
            )}

            <text x={M} y={footerY} fontSize="11" fill={INK_FAINT}>
              VIPC Enroll · Students by address
            </text>
            <text x={COUNT_X} y={footerY} fontSize="11" fill={INK_FAINT} textAnchor="end">
              {stamp}
            </text>
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentOriginChart;
