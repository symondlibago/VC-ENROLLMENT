import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, AlertTriangle, Trash2, X } from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { instructorAPI } from "@/services/api";
import ValidationErrorModal from "../components/../modals/ValidationErrorModal";
import circleLogoUrl from "../../assets/circlelogo.jpg";

const uid = () => Math.random().toString(36).slice(2, 9);

const SS_KEY = "classrecord_terms_v1";
function ssLoad() {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}
function ssSave(terms) {
  try {
    // Save only categories + term name (NOT students — they reload from API)
    const slim = terms.map(t => ({ id: t.id, name: t.name, categories: t.categories }));
    sessionStorage.setItem(SS_KEY, JSON.stringify(slim));
  } catch {}
}
function ssClear() {
  try { sessionStorage.removeItem(SS_KEY); } catch {}
}

function colLetter(idx) {
  let s = "", n = idx;
  while (n >= 0) { s = String.fromCharCode((n % 26) + 65) + s; n = Math.floor(n / 26) - 1; }
  return s;
}

// ─── ExcelJS style helpers 
const argb   = (hex) => "FF" + hex.replace("#", "").toUpperCase();
const fillSolid = (hex) => ({ type: "pattern", pattern: "solid", fgColor: { argb: argb(hex) } });
const fontStyle = (hex, bold = false, size = 11) => ({ color: { argb: argb(hex) }, bold, size, name: "Calibri" });
const thinBorder = (hex = "#D1D5DB") => {
  const s = { style: "thin", color: { argb: argb(hex) } };
  return { top: s, bottom: s, left: s, right: s };
};
const align = (horizontal = "center", vertical = "middle", wrapText = false) => ({ horizontal, vertical, wrapText });

function styleCell(cell, { fill, font, border, alignment } = {}) {
  if (fill)      cell.fill      = fill;
  if (font)      cell.font      = font;
  if (border)    cell.border    = border;
  if (alignment) cell.alignment = alignment;
}
function wc(sheet, addr, value, style) {
  const cell = sheet.getCell(addr);
  cell.value = value;
  styleCell(cell, style);
}
function wf(sheet, addr, formula, style) {
  const cell = sheet.getCell(addr);
  cell.value = { formula };
  styleCell(cell, style);
}

// ─── Palette 
const P = {
  red: "#9C262C", redDark: "#6b1a1e", redFade: "#fdf2f2",
  gold: "#ffd740",
  gray50: "#f9fafb", gray100: "#f3f4f6", gray200: "#e5e7eb",
  gray300: "#d1d5db", gray400: "#9ca3af", gray500: "#6b7280",
  gray600: "#4b5563", gray700: "#374151", gray900: "#111827",
  green: "#16a34a", blue: "#2563eb", orange: "#ea580c", white: "#ffffff",
};

// Category color palette: [dark bg, medium bg, pale bg]
const CAT_COLORS = [
  ["#92400e", "#d97706", "#fef3c7"],
  ["#1e40af", "#3b82f6", "#dbeafe"],
  ["#14532d", "#22c55e", "#dcfce7"],
  ["#581c87", "#a855f7", "#f3e8ff"],
  ["#164e63", "#06b6d4", "#cffafe"],
  ["#831843", "#ec4899", "#fce7f3"],
];
const catBg      = (i) => CAT_COLORS[i % CAT_COLORS.length][0];
const catBgLight = (i) => CAT_COLORS[i % CAT_COLORS.length][1];
const catBgPale  = (i) => CAT_COLORS[i % CAT_COLORS.length][2];

function gradeColor(pct) {
  if (pct >= 90) return "#15803d";
  if (pct >= 80) return "#2563eb";
  if (pct >= 75) return "#d97706";
  if (pct >= 60) return "#ea580c";
  return "#dc2626";
}

const DEFAULT_TERMS = ["PRELIM", "MIDTERM", "SEMI-FINAL", "FINAL"];

const SCHOOL = {
  name:    "VINEYARD INTERNATIONAL POLYTECHNIC COLLEGE, INC.",
  address: "Antonio Luna St., Mabulay Subd., Cagayan de Oro City",
  hotline: "(088) 858 8646 / (088) 882 1922 / 0963 947 7295",
  logo:    circleLogoUrl,
};


async function fetchLogoBuffer(url) {
  try {
    const res = await fetch(url);
    return await res.arrayBuffer();
  } catch (e) {
    console.error("Logo fetch failed:", e);
    return null;
  }
}


function buildSheet(ws, term, subjectLabel, sectionLabel, logoImageId) {
  const { name: termName, categories, students } = term;

  const FIXED        = 2;
  const SCHOOL_ROWS  = 7;
  const CAT_HDR_ROW  = 8;
  const SUB_HDR_ROW  = 9;
  const MAX_PTS_ROW  = 10;
  const DATA_START   = 11;

  const catColStart = [];
  let cursor = FIXED;
  for (const cat of categories) {
    catColStart.push(cursor);
    if (cat.columns.length > 0) cursor += cat.columns.length + 1;
  }
  const finalGradeCol = cursor;
  const roundedCol    = cursor + 1;
  const totalCols     = cursor + 2;

  // ── Column widths 
  ws.getColumn(1).width = 6;
  ws.getColumn(2).width = 30;
  for (let c = 3; c <= totalCols; c++) ws.getColumn(c).width = 14;

  // ── Row heights 
  [20, 18, 18, 10, 30, 18, 20, 28, 36, 16].forEach((h, i) => { ws.getRow(i + 1).height = h; });

  // ── Logo image — fixed 60x60px square, offset right so it doesn't cover text ──
  if (logoImageId !== null && logoImageId !== undefined) {
    ws.addImage(logoImageId, {
      tl: { col: 0, row: 0, nativeColOff: 4, nativeRowOff: 4 },
      ext: { width: 70, height: 70 },
      editAs: "absolute",
    });
  }

  // ── School header rows 
  const lastCol = colLetter(totalCols - 1);
  const baseHdr = {
    fill:      fillSolid("#ffffff"),
    border:    thinBorder("#e5e7eb"),
    alignment: align("center", "middle", true),
  };
  const hdrRows = [
    [SCHOOL.name,    fontStyle(P.red,     true,  13)],
    [SCHOOL.address, fontStyle(P.gray700, false, 11)],
    [SCHOOL.hotline, fontStyle(P.gray700, false, 11)],
    ["",             fontStyle(P.gray700, false, 11)],
    [subjectLabel,   fontStyle(P.gray900, true,  12)],
    [sectionLabel ? `Section: ${sectionLabel}` : "", fontStyle(P.gray700, false, 11)],
    [`${termName.toUpperCase()} TERM`, fontStyle(P.redDark, true, 11)],
  ];
  // Merge school header rows FIRST, then write values into master cells
  hdrRows.forEach(([val, font], i) => {
    const row = i + 1;
    ws.mergeCells(`A${row}:${lastCol}${row}`);
    wc(ws, `A${row}`, val, { ...baseHdr, font });
  });


  ws.mergeCells(`A${CAT_HDR_ROW}:A${MAX_PTS_ROW}`);
  ws.mergeCells(`B${CAT_HDR_ROW}:B${MAX_PTS_ROW}`);
  // Merge category headers across their columns
  for (let ci = 0; ci < categories.length; ci++) {
    const cat = categories[ci];
    if (!cat.columns.length) continue;
    const span = cat.columns.length + 1;
    const sa   = `${colLetter(catColStart[ci])}${CAT_HDR_ROW}`;
    const ea   = `${colLetter(catColStart[ci] + span - 1)}${CAT_HDR_ROW}`;
    if (span > 1) ws.mergeCells(`${sa}:${ea}`);
  }
  // Merge Final & Rounded across rows 8–10
  ws.mergeCells(`${colLetter(finalGradeCol)}${CAT_HDR_ROW}:${colLetter(finalGradeCol)}${MAX_PTS_ROW}`);
  ws.mergeCells(`${colLetter(roundedCol)}${CAT_HDR_ROW}:${colLetter(roundedCol)}${MAX_PTS_ROW}`);

  // NOW write values into master cells AFTER merges
  const fixedHdr = {
    font:      fontStyle("#ffffff", true, 11),
    fill:      fillSolid("#374151"),
    alignment: align("center", "middle"),
    border:    thinBorder("#4b5563"),
  };
  wc(ws, `A${CAT_HDR_ROW}`, "No.",  fixedHdr);
  wc(ws, `B${CAT_HDR_ROW}`, "Name", fixedHdr);

  for (let ci = 0; ci < categories.length; ci++) {
    const cat = categories[ci];
    if (!cat.columns.length) continue;
    const bg = catBg(ci);
    const sa = `${colLetter(catColStart[ci])}${CAT_HDR_ROW}`;
    wc(ws, sa, `${cat.name.toUpperCase()} (${cat.pct}%)`, {
      font:      fontStyle("#ffffff", true, 11),
      fill:      fillSolid(bg),
      alignment: align("center", "middle", true),
      border:    thinBorder(bg),
    });
  }

  const fgHdr = {
    font:      fontStyle(P.gold, true, 11),
    fill:      fillSolid(P.redDark),
    alignment: align("center", "middle"),
    border:    thinBorder(P.redDark),
  };
  wc(ws, `${colLetter(finalGradeCol)}${CAT_HDR_ROW}`, "FINAL GRADE", fgHdr);
  wc(ws, `${colLetter(roundedCol)}${CAT_HDR_ROW}`,    "ROUNDED",     fgHdr);

  
  const emptyFixed = { fill: fillSolid("#374151"), border: thinBorder("#4b5563") };
  wc(ws, `A${SUB_HDR_ROW}`, "", emptyFixed);
  wc(ws, `B${SUB_HDR_ROW}`, "", emptyFixed);

  for (let ci = 0; ci < categories.length; ci++) {
    const cat = categories[ci], cStart = catColStart[ci];
    const subStyle = {
      font:      fontStyle("#ffffff", true, 10),
      fill:      fillSolid(catBgLight(ci)),
      alignment: align("center", "middle", true),
      border:    thinBorder(catBgLight(ci)),
    };
    for (let j = 0; j < cat.columns.length; j++)
      wc(ws, `${colLetter(cStart + j)}${SUB_HDR_ROW}`,
        `${cat.columns[j].label} (${cat.columns[j].maxPts}pts)`, subStyle);
    if (cat.columns.length > 0)
      wc(ws, `${colLetter(cStart + cat.columns.length)}${SUB_HDR_ROW}`, "Score", subStyle);
  }

  wc(ws, `A${MAX_PTS_ROW}`, "", emptyFixed);
  wc(ws, `B${MAX_PTS_ROW}`, "", emptyFixed);

  for (let ci = 0; ci < categories.length; ci++) {
    const cat = categories[ci], cStart = catColStart[ci];
    const pale = catBgPale(ci);
    const mpStyle = {
      font:      fontStyle(P.gray500, false, 9),
      fill:      fillSolid(pale),
      alignment: align("center", "middle"),
      border:    thinBorder("#e5e7eb"),
    };
    for (let j = 0; j < cat.columns.length; j++) {
      const c = ws.getCell(`${colLetter(cStart + j)}${MAX_PTS_ROW}`);
      c.value = cat.columns[j].maxPts;
      styleCell(c, mpStyle);
    }
    if (cat.columns.length > 0)
      wc(ws, `${colLetter(cStart + cat.columns.length)}${MAX_PTS_ROW}`, "",
        { fill: fillSolid(pale), border: thinBorder("#e5e7eb") });
  }

  // ── Student data rows 
  for (let si = 0; si < students.length; si++) {
    const s = students[si], row = DATA_START + si;
    ws.getRow(row).height = 22;
    const rowBg    = si % 2 === 0 ? "#ffffff" : "#f9fafb";
    const rowStyle = { fill: fillSolid(rowBg), border: thinBorder("#e5e7eb"), alignment: align("center", "middle") };

    const noCell = ws.getCell(`A${row}`);
    noCell.value = s.no;
    styleCell(noCell, { ...rowStyle, font: fontStyle(P.gray700, true, 11) });

    const nameCell = ws.getCell(`B${row}`);
    nameCell.value = s.name;
    styleCell(nameCell, {
      fill:      fillSolid(rowBg),
      border:    thinBorder("#e5e7eb"),
      font:      fontStyle(P.gray900, true, 11),
      alignment: align("left", "middle"),
    });

    const scoreCols = [];
    for (let ci = 0; ci < categories.length; ci++) {
      const cat = categories[ci], cStart = catColStart[ci];
      if (!cat.columns.length) continue;

      const inpStyle = { fill: fillSolid(rowBg),         border: thinBorder("#e5e7eb"), alignment: align("center", "middle") };
      const scrStyle = { fill: fillSolid(catBgPale(ci)), border: thinBorder("#e5e7eb"), font: fontStyle(catBg(ci), true, 11), alignment: align("center", "middle") };

      for (let j = 0; j < cat.columns.length; j++) {
        const val = s.scores[cat.columns[j].id];
        const c   = ws.getCell(`${colLetter(cStart + j)}${row}`);
        c.value   = val == null || val === "" ? 0 : Number(val);
        styleCell(c, inpStyle);
      }

      const scoreIdx = cStart + cat.columns.length;
      const inpRange = `${colLetter(cStart)}${row}:${colLetter(cStart + cat.columns.length - 1)}${row}`;
      const maxRange = `${colLetter(cStart)}${MAX_PTS_ROW}:${colLetter(cStart + cat.columns.length - 1)}${MAX_PTS_ROW}`;
      const scoreAddr = `${colLetter(scoreIdx)}${row}`;
      wf(ws, scoreAddr,
        `IFERROR((SUM(${inpRange})/SUMPRODUCT((${inpRange}>0)*${maxRange}))*${cat.pct},0)`,
        scrStyle);
      scoreCols.push(scoreAddr);
    }

    if (scoreCols.length > 0) {
      const fgAddr  = `${colLetter(finalGradeCol)}${row}`;
      const rdAddr  = `${colLetter(roundedCol)}${row}`;
      wf(ws, fgAddr, `SUM(${scoreCols.join(",")})`, {
        fill:      fillSolid("#fff5f5"),
        border:    thinBorder("#e5e7eb"),
        font:      fontStyle(P.red, true, 11),
        alignment: align("center", "middle"),
      });
      wf(ws, rdAddr, `ROUND(${fgAddr},0)`, {
        fill:      fillSolid(P.redDark),
        border:    thinBorder(P.redDark),
        font:      fontStyle(P.gold, true, 12),
        alignment: align("center", "middle"),
      });
    }
  }

  return { finalGradeCol, roundedCol, DATA_START };
}

// ─── Build Grading Sheet 
function buildGradingSheet(gs, terms, termNames, termMeta, subjectLabel, sectionLabel, logoImageId) {
  const COL_HDR = 8, DATA_GS = 9;
  const totalCols = 2 + terms.length + 2;

  gs.getColumn(1).width = 6;
  gs.getColumn(2).width = 30;
  for (let c = 3; c <= totalCols; c++) gs.getColumn(c).width = 16;
  [20, 18, 18, 10, 30, 18, 20, 28].forEach((h, i) => { gs.getRow(i + 1).height = h; });

  if (logoImageId !== null && logoImageId !== undefined) {
    gs.addImage(logoImageId, {
      tl: { col: 0, row: 0, nativeColOff: 4, nativeRowOff: 4 },
      ext: { width: 70, height: 70 },
      editAs: "absolute",
    });
  }

  const lastCol = colLetter(totalCols - 1);
  const baseHdr = { fill: fillSolid("#ffffff"), border: thinBorder("#e5e7eb"), alignment: align("center", "middle", true) };
  const hdrRows = [
    [SCHOOL.name,    fontStyle(P.red,     true,  13)],
    [SCHOOL.address, fontStyle(P.gray700, false, 11)],
    [SCHOOL.hotline, fontStyle(P.gray700, false, 11)],
    ["",             fontStyle(P.gray700, false, 11)],
    [subjectLabel,   fontStyle(P.gray900, true,  12)],
    [sectionLabel ? `Section: ${sectionLabel}` : "", fontStyle(P.gray700, false, 11)],
    ["GRADING SHEET", fontStyle(P.redDark, true, 12)],
  ];
  // Merge school header rows FIRST, then write values
  hdrRows.forEach(([val, font], i) => {
    const row = i + 1;
    gs.mergeCells(`A${row}:${lastCol}${row}`);
    wc(gs, `A${row}`, val, { ...baseHdr, font });
  });

  const fixedHdr = { font: fontStyle("#ffffff", true, 11), fill: fillSolid("#374151"), alignment: align("center", "middle"), border: thinBorder("#4b5563") };
  const fgHdr    = { font: fontStyle(P.gold,    true, 11), fill: fillSolid(P.redDark), alignment: align("center", "middle"), border: thinBorder(P.redDark) };

  wc(gs, `A${COL_HDR}`, "No.",  fixedHdr);
  wc(gs, `B${COL_HDR}`, "Name", fixedHdr);

  for (let ti = 0; ti < terms.length; ti++) {
    const bg = catBg(ti);
    wc(gs, `${colLetter(2 + ti)}${COL_HDR}`, termNames[ti], {
      font:      fontStyle("#ffffff", true, 11),
      fill:      fillSolid(bg),
      alignment: align("center", "middle"),
      border:    thinBorder(bg),
    });
  }
  wc(gs, `${colLetter(2 + terms.length)}${COL_HDR}`,     "FINAL GRADE", fgHdr);
  wc(gs, `${colLetter(2 + terms.length + 1)}${COL_HDR}`, "REMARKS",     fgHdr);

  const maxStudents = Math.max(...terms.map(t => t.students.length), 0);
  for (let si = 0; si < maxStudents; si++) {
    const row      = DATA_GS + si;
    const refStud  = terms.find(t => t.students[si])?.students[si];
    const rowBg    = si % 2 === 0 ? "#ffffff" : "#f9fafb";
    const rowStyle = { fill: fillSolid(rowBg), border: thinBorder("#e5e7eb"), alignment: align("center", "middle") };
    gs.getRow(row).height = 22;

    const noCell = gs.getCell(`A${row}`);
    noCell.value = si + 1;
    styleCell(noCell, { ...rowStyle, font: fontStyle(P.gray700, true, 11) });

    const nameCell = gs.getCell(`B${row}`);
    nameCell.value = refStud?.name || "";
    styleCell(nameCell, { fill: fillSolid(rowBg), border: thinBorder("#e5e7eb"), font: fontStyle(P.gray900, true, 11), alignment: align("left", "middle") });

    for (let ti = 0; ti < terms.length; ti++) {
      const { roundedCol: rc, DATA_START: ds } = termMeta[ti];
      wf(gs, `${colLetter(2 + ti)}${row}`,
        `'${termNames[ti]}'!${colLetter(rc)}${ds + si}`,
        { ...rowStyle, font: fontStyle(catBg(ti), true, 11) });
    }

    const fgCell   = `${colLetter(2 + terms.length)}${row}`;
    const termCols = termNames.map((_, ti) => `${colLetter(2 + ti)}${row}`);
    wf(gs, fgCell, `ROUND(AVERAGE(${termCols.join(",")}),0)`, {
      fill: fillSolid("#fff5f5"), border: thinBorder("#e5e7eb"),
      font: fontStyle(P.red, true, 12), alignment: align("center", "middle"),
    });
    wf(gs, `${colLetter(2 + terms.length + 1)}${row}`,
      `IF(${fgCell}>=75,"PASSED","FAILED")`, rowStyle);
  }
}

// ─── Export all terms
async function exportAllTerms(terms, subjectLabel, sectionLabel, subjectCode) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ClassRecord";
  wb.created = new Date();

  // ── Fetch & register logo once 
  const logoBuffer = await fetchLogoBuffer(SCHOOL.logo);
  let logoImageId  = null;
  if (logoBuffer) {
    const ext = SCHOOL.logo.toLowerCase().includes(".png") ? "png" : "jpeg";
    logoImageId = wb.addImage({ buffer: logoBuffer, extension: ext });
  }

  // ── Term sheets 
  const termNames = [], termMeta = [];
  for (const term of terms) {
    const sheetName = term.name.replace(/[\\/*?[\]:]/g, "").slice(0, 31);
    termNames.push(sheetName);
    const ws   = wb.addWorksheet(sheetName);
    const meta = buildSheet(ws, term, subjectLabel, sectionLabel, logoImageId);
    termMeta.push(meta);
  }

  // ── Grading sheet 
  const gs = wb.addWorksheet("GRADING SHEET");
  buildGradingSheet(gs, terms, termNames, termMeta, subjectLabel, sectionLabel, logoImageId);

  const buf      = await wb.xlsx.writeBuffer();
  const safeCode    = (subjectCode || subjectLabel).replace(/[\/*?[\]:]/g, "").trim();
  const safeSection = sectionLabel ? sectionLabel.replace(/[\/*?[\]:]/g, "").trim() : "";
  const filename    = safeSection ? `${safeCode} - ${safeSection}` : safeCode || "class_record";
  saveAs(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${filename}.xlsx`
  );
}


function ConfirmDeleteModal({ open, onClose, onConfirm, title, description }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-linear-to-r from-(--dominant-red) to-red-600 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertTriangle size={22} color="#ffd740" />
                <h3 className="text-xl font-bold text-white">{title || "Confirm Delete"}</h3>
              </div>
              <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
                <X size={24} />
              </button>
            </div>
            {/* Body */}
            <div className="p-6">
              <div className="flex items-start">
                <div className="shrink-0 mr-4">
                  <Trash2 size={28} className="text-red-500" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Are you sure?</h4>
                  <p className="text-gray-600">{description || "This action cannot be undone."}</p>
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => { onConfirm(); onClose(); }}
                className="px-4 py-2 bg-(--dominant-red) text-white rounded-md hover:bg-red-700 transition-colors font-medium"
              >
                Yes, Delete It
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


function MotionDropdown({ value, onChange, options, placeholder, minWidth = 280 }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const selectedLabel = useMemo(
    () => options.find(o => o.value === value)?.label || placeholder,
    [value, options, placeholder]
  );

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", minWidth }}>
      <motion.button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        style={{
          width: "100%", padding: "9px 14px", textAlign: "left",
          background: "#fff", border: `1px solid ${isOpen ? P.red : P.gray200}`,
          borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", minWidth,
          boxShadow: isOpen ? `0 0 0 2px ${P.red}33` : "none",
          transition: "border-color .15s, box-shadow .15s",
        }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <span style={{
          fontSize: 13, fontWeight: value ? 500 : 400,
          color: value ? P.gray900 : P.gray400,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          maxWidth: minWidth - 50,
        }}>
          {selectedLabel}
        </span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} color={P.gray500} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
              background: "#fff", border: `1px solid ${P.gray200}`, borderRadius: 10,
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)", zIndex: 200,
              overflow: "hidden", maxHeight: 280, overflowY: "auto",
            }}
          >
            {options.map((opt, idx) => (
              <motion.button
                key={opt.value} type="button"
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                style={{
                  width: "100%", padding: "11px 16px", textAlign: "left",
                  background: opt.value === value ? P.redFade : "transparent",
                  border: "none", borderBottom: `1px solid ${P.gray100}`,
                  cursor: "pointer", display: "block",
                  color: opt.value === value ? P.red : P.gray900,
                  fontWeight: opt.value === value ? 600 : 400, fontSize: 13,
                }}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                whileHover={{ backgroundColor: P.redFade, x: 4, color: P.red }}
              >
                {opt.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TermRecord({ term, onUpdate }) {
  const { categories, students } = term;
  const [showCatModal, setShowCatModal] = useState(false);
  const [showColModal, setShowColModal] = useState({ open: false, catId: null });
  const [catForm, setCatForm] = useState({ name: "", pct: "" });
  const [colForm, setColForm] = useState({ label: "", maxPts: "100" });
  const [toast, setToast]       = useState(null);
  const [valError, setValError] = useState({ open: false, message: "" });
  // Confirm-delete state
  const [confirmCat, setConfirmCat] = useState({ open: false, id: null, name: "" });
  const [confirmCol, setConfirmCol] = useState({ open: false, catId: null, colId: null, label: "" });

  const showToast   = (msg, type = "info") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2500); };
  const showValError = (message) => setValError({ open: true, message });
  const totalPct = categories.reduce((s, c) => s + Number(c.pct), 0);

  const addCategory = () => {
    const name = catForm.name.trim(), pct = Number(catForm.pct);
    if (!name)              return showValError("Category name is required. Please enter a name before adding.");
    if (!pct || pct <= 0)   return showValError("Percentage weight must be greater than 0. Please enter a valid number.");
    if (totalPct + pct > 100) return showValError(`Not enough percentage remaining. You only have ${100 - totalPct}% left to allocate.`);
    onUpdate({ categories: [...categories, { id: uid(), name, pct, columns: [] }] });
    setCatForm({ name: "", pct: "" }); setShowCatModal(false);
    showToast(`"${name}" added at ${pct}%`, "success");
  };
  const removeCategory = (id) => {
    const cat = categories.find(c => c.id === id);
    setConfirmCat({ open: true, id, name: cat?.name || "this category" });
  };
  const doRemoveCategory = (id) => onUpdate({ categories: categories.filter(c => c.id !== id) });

  const addColumn = () => {
    const { catId } = showColModal, label = colForm.label.trim(), maxPts = Number(colForm.maxPts);
    if (!label)               return showValError("Column label is required. Please enter a label (e.g. a date or activity name).");
    if (!maxPts || maxPts <= 0) return showValError("Max points must be greater than 0. Please enter a valid number.");
    onUpdate({ categories: categories.map(c => c.id === catId ? { ...c, columns: [...c.columns, { id: uid(), label, maxPts }] } : c) });
    setColForm({ label: "", maxPts: "100" }); setShowColModal({ open: false, catId: null });
    showToast("Column added", "success");
  };
  const removeColumn = (catId, colId) => {
    const cat = categories.find(c => c.id === catId);
    const col = cat?.columns.find(col => col.id === colId);
    setConfirmCol({ open: true, catId, colId, label: col?.label || "this column" });
  };
  const doRemoveColumn = (catId, colId) =>
    onUpdate({ categories: categories.map(c => c.id === catId ? { ...c, columns: c.columns.filter(col => col.id !== colId) } : c) });

  const setScore = (studId, colId, val) =>
    onUpdate({ students: students.map(s => s.id === studId ? { ...s, scores: { ...s.scores, [colId]: val } } : s) });

  const computeRow = (student) => {
    let finalGrade = 0; const catScores = {};
    for (const cat of categories) {
      if (!cat.columns.length) { catScores[cat.id] = null; continue; }
      let earned = 0, total = 0;
      for (const col of cat.columns) { const v = Number(student.scores[col.id] || 0); if (v > 0) { earned += v; total += col.maxPts; } }
      const rawScore = total > 0 ? (earned / total) * cat.pct : 0;
      catScores[cat.id] = { rawScore }; finalGrade += rawScore;
    }
    return { catScores, finalGrade, rounded: Math.round(finalGrade * 10) / 10 };
  };

  const allCols      = categories.flatMap(c => c.columns.map(col => ({ ...col, catId: c.id })));
  const emptyColspan = 2 + allCols.length + categories.filter(c => c.columns.length > 0).length + (categories.length > 0 ? 2 : 0);

  return (
    <div style={{ background: P.white, borderRadius: 12, border: `1px solid ${P.gray200}`, overflow: "hidden", marginBottom: 8 }}>
      {toast && <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: toast.type === "error" ? P.red : toast.type === "success" ? P.green : P.blue, color: "#fff", padding: "10px 20px", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", fontSize: 14, fontWeight: 600, animation: "fadeIn .2s ease" }}>{toast.msg}</div>}

      <div style={{ background: P.gray50, borderBottom: `1px solid ${P.gray200}`, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <SmBtn onClick={() => setShowCatModal(true)} color={totalPct >= 100 ? P.gray300 : P.red} textColor="#fff" icon="➕" disabled={totalPct >= 100}>Add Category</SmBtn>
        <PctBar used={totalPct} />
        {students.length > 0 && <span style={{ fontSize: 12, color: P.gray500, marginLeft: "auto" }}>{students.length} student{students.length !== 1 ? "s" : ""} loaded from system</span>}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 300, fontSize: 12 }}>
          <thead>
            <tr>
              <Th rowSpan={3} style={{ background: P.gray700, color: "#fff", width: 38 }}>No.</Th>
              <Th rowSpan={3} style={{ background: P.gray700, color: "#fff", minWidth: 160 }}>Name</Th>
              {categories.map((cat, ci) => (
                <Th key={cat.id} colSpan={cat.columns.length > 0 ? cat.columns.length + 1 : 1} style={{ background: catBg(ci), color: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    <span style={{ fontSize: 11 }}>{cat.name}</span>
                    <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: 20, padding: "0 6px", fontSize: 10 }}>{cat.pct}%</span>
                    <IcnBtn onClick={() => setShowColModal({ open: true, catId: cat.id })}>+</IcnBtn>
                    <IcnBtn onClick={() => removeCategory(cat.id)} danger>✕</IcnBtn>
                  </div>
                </Th>
              ))}
              {categories.length > 0 && <>
                <Th rowSpan={3} style={{ background: P.redDark, color: P.gold, fontWeight: 800, fontSize: 11 }}>Final</Th>
                <Th rowSpan={3} style={{ background: P.redDark, color: P.gold, fontWeight: 800, fontSize: 11 }}>Rounded</Th>
              </>}
            </tr>
            <tr>
              {categories.map((cat, ci) =>
                cat.columns.map(col => (
                  <Th key={col.id} style={{ background: catBgLight(ci), color: "#fff", fontSize: 10 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <span>{col.label}</span>
                      <span style={{ opacity: .8, fontSize: 9 }}>{col.maxPts}pts</span>
                      <button onClick={() => removeColumn(cat.id, col.id)} style={{ background: "none", border: "none", color: "#ffd0d0", cursor: "pointer", fontSize: 9, padding: 0 }}>✕</button>
                    </div>
                  </Th>
                )).concat(cat.columns.length > 0 ? [<Th key={cat.id + "sh"} style={{ background: catBgLight(ci), color: "#fff", fontSize: 10 }}>Score</Th>] : [])
              )}
            </tr>
            <tr>
              {categories.map((cat, ci) =>
                cat.columns.map(col => (
                  <td key={col.id + "mx"} style={{ textAlign: "center", fontSize: 9, color: P.gray500, padding: "1px 3px", background: catBgPale(ci), border: `1px solid ${P.gray200}`, fontStyle: "italic" }}>{col.maxPts}</td>
                )).concat(cat.columns.length > 0 ? [<td key={cat.id + "mxe"} style={{ background: catBgPale(ci), border: `1px solid ${P.gray200}` }} />] : [])
              )}
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && <tr><td colSpan={emptyColspan} style={{ textAlign: "center", color: P.gray400, padding: "28px", fontSize: 13 }}>Select a subject above to load students automatically.</td></tr>}
            {students.map((s, si) => {
              const { catScores, finalGrade, rounded } = computeRow(s);
              return (
                <tr key={s.id} style={{ background: si % 2 === 0 ? P.white : P.gray50 }}>
                  <Td style={{ textAlign: "center", color: P.gray600, fontWeight: 600 }}>{s.no}</Td>
                  <Td><span style={{ fontWeight: 600 }}>{s.name}</span></Td>
                  {categories.map((cat, ci) => {
                    const inputs = cat.columns.map(col => (
                      <td key={col.id} style={{ padding: "2px 3px", textAlign: "center", border: `1px solid ${P.gray200}` }}>
                        <input type="number" min={0} max={col.maxPts} value={s.scores[col.id] ?? ""}
                          onChange={e => setScore(s.id, col.id, e.target.value === "" ? "" : Math.min(Number(e.target.value), col.maxPts))}
                          style={{ width: 52, textAlign: "center", border: `1px solid ${P.gray200}`, borderRadius: 4, padding: "2px 3px", fontSize: 12, outline: "none", background: P.gray50 }} />
                      </td>
                    ));
                    const scoreCell = cat.columns.length > 0 ? [
                      <td key={cat.id + "sv"} style={{ textAlign: "center", fontWeight: 700, fontSize: 11, padding: "3px 6px", background: catBgPale(ci), border: `1px solid ${P.gray200}` }}>
                        {catScores[cat.id]
                          ? <span style={{ color: gradeColor((catScores[cat.id].rawScore / cat.pct) * 100) }}>{catScores[cat.id].rawScore.toFixed(2)}</span>
                          : <span style={{ color: P.gray400 }}>—</span>}
                      </td>
                    ] : [];
                    return [...inputs, ...scoreCell];
                  })}
                  {categories.length > 0 && <>
                    <Td style={{ textAlign: "center", fontWeight: 700, fontSize: 12, background: "#fff5f5", color: gradeColor(finalGrade) }}>{finalGrade.toFixed(2)}</Td>
                    <Td style={{ textAlign: "center", fontWeight: 800, fontSize: 13, background: gradeColor(rounded) + "22", color: gradeColor(rounded) }}>{rounded}</Td>
                  </>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={showCatModal} onClose={() => setShowCatModal(false)} title="Add Grade Category">
        <Label>Category Name</Label>
        <TInput value={catForm.name} onChange={v => setCatForm(p => ({ ...p, name: v }))} placeholder="e.g. Attendance/Attitude" />
        <Label mt>Percentage Weight (%)</Label>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <TInput type="number" value={catForm.pct} onChange={v => setCatForm(p => ({ ...p, pct: v }))} placeholder={`Max ${100 - totalPct}%`} style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: P.gray400 }}>Left: {100 - totalPct}%</span>
        </div>
        <div style={{ marginTop: 6 }}>{[5, 10, 15, 20, 25, 30, 40].filter(v => v <= 100 - totalPct).map(v => (<QBtn key={v} onClick={() => setCatForm(p => ({ ...p, pct: String(v) }))}>{v}%</QBtn>))}</div>
        <MActions onCancel={() => setShowCatModal(false)} onOk={addCategory} okLabel="Add Category" />
      </Modal>
      <Modal open={showColModal.open} onClose={() => setShowColModal({ open: false, catId: null })} title="Add Column">
        <Label>Column Label</Label>
        <TInput value={colForm.label} onChange={v => setColForm(p => ({ ...p, label: v }))} placeholder="e.g. 8/14/2021" />
        <Label mt>Max Points</Label>
        <TInput type="number" value={colForm.maxPts} onChange={v => setColForm(p => ({ ...p, maxPts: v }))} placeholder="100" />
        <div style={{ marginTop: 6 }}>{[50, 100].map(v => (<QBtn key={v} onClick={() => setColForm(p => ({ ...p, maxPts: String(v) }))}>{v}pts</QBtn>))}</div>
        <MActions onCancel={() => setShowColModal({ open: false, catId: null })} onOk={addColumn} okLabel="Add Column" />
      </Modal>

      {/* ── Validation Error Modal (form errors) ── */}
      <ValidationErrorModal
        isOpen={valError.open}
        onClose={() => setValError({ open: false, message: "" })}
        message={valError.message}
      />

      {/* ── Confirm delete CATEGORY ── */}
      <ConfirmDeleteModal
        open={confirmCat.open}
        onClose={() => setConfirmCat({ open: false, id: null, name: "" })}
        onConfirm={() => doRemoveCategory(confirmCat.id)}
        title="Delete Category"
        description={`Are you sure you want to delete the "${confirmCat.name}" category? All its columns and entered scores will be permanently removed.`}
      />

      {/* ── Confirm delete COLUMN ── */}
      <ConfirmDeleteModal
        open={confirmCol.open}
        onClose={() => setConfirmCol({ open: false, catId: null, colId: null, label: "" })}
        onConfirm={() => doRemoveColumn(confirmCol.catId, confirmCol.colId)}
        title="Delete Column"
        description={`Are you sure you want to delete the column "${confirmCol.label}"? All scores entered for this column will be lost.`}
      />
    </div>
  );
}

export default function ClassRecord() {
  const [rosterData,        setRosterData]       = useState([]);
  const [loadingRoster,     setLoadingRoster]     = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedSection,   setSelectedSection]   = useState("All");
  const [terms, setTerms] = useState(() => {
    // Try to restore categories from sessionStorage (persists on refresh, gone on browser close)
    const saved = ssLoad();
    if (saved && saved.length > 0) {
      return saved.map(t => ({ ...t, students: [] })); // students reload from API
    }
    return DEFAULT_TERMS.map(name => ({ id: uid(), name, categories: [], students: [] }));
  });
  const [activeTermId, setActiveTermId] = useState(null);
  const [showAddTerm,  setShowAddTerm]  = useState(false);
  const [newTermName,  setNewTermName]  = useState("");
  const [toast, setToast] = useState(null);
  const [confirmTerm, setConfirmTerm] = useState({ open: false, id: null, name: "" });

  const showToast = (msg, type = "info") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2800); };
  const activeTid  = activeTermId ?? terms[0]?.id;
  const activeTerm = terms.find(t => t.id === activeTid) ?? terms[0];

  useEffect(() => {
    (async () => {
      try {
        setLoadingRoster(true);
        const res = await instructorAPI.getGradeableStudents();
        if (res.success && res.data?.length > 0) {
          setRosterData(res.data);
          setSelectedSubjectId(res.data[0].subject_id.toString());
        }
      } catch { showToast("Failed to load subjects from system", "error"); }
      finally   { setLoadingRoster(false); }
    })();
  }, []);

  const subjectOptions = useMemo(() =>
    rosterData.map(s => ({ value: s.subject_id.toString(), label: `${s.subject_code} – ${s.descriptive_title}` }))
  , [rosterData]);

  const sectionOptions = useMemo(() => {
    const subj = rosterData.find(s => s.subject_id.toString() === selectedSubjectId);
    if (!subj?.students) return [{ value: "All", label: "All Sections" }];
    const unique = [...new Set(subj.students.map(s => s.section || "Unassigned"))].sort();
    return [{ value: "All", label: "All Sections" }, ...unique.map(sec => ({ value: sec, label: sec }))];
  }, [rosterData, selectedSubjectId]);

  useEffect(() => { setSelectedSection("All"); }, [selectedSubjectId]);

  const derivedStudents = useMemo(() => {
    const subj = rosterData.find(s => s.subject_id.toString() === selectedSubjectId);
    if (!subj?.students) return [];
    let list = subj.students;
    if (selectedSection !== "All") list = list.filter(s => (s.section || "Unassigned") === selectedSection);
    list = [...list].sort((a, b) => {
      const sa = a.section || "Unassigned", sb = b.section || "Unassigned";
      return sa !== sb ? sa.localeCompare(sb) : a.name.localeCompare(b.name);
    });
    return list.map((s, i) => ({ id: s.id, no: i + 1, name: s.name?.toUpperCase() || "", program: s.courseCode || s.course || "", section: s.section || "Unassigned", scores: {} }));
  }, [rosterData, selectedSubjectId, selectedSection]);

  useEffect(() => {
    if (!derivedStudents.length) return;
    setTerms(prev => prev.map(term => {
      const ex = {};
      for (const s of term.students) ex[s.id] = s.scores;
      return { ...term, students: derivedStudents.map(s => ({ ...s, scores: ex[s.id] || {} })) };
    }));
  }, [derivedStudents]);

  // Auto-save categories to sessionStorage on every terms change
  useEffect(() => {
    if (terms.some(t => t.categories.length > 0)) ssSave(terms);
  }, [terms]);

  const updateTerm = (id, patch) => setTerms(p => p.map(t => t.id === id ? { ...t, ...patch } : t));
  const addTerm = () => {
    const name = newTermName.trim();
    if (!name) return showToast("Term name required", "error");
    if (terms.find(t => t.name.toUpperCase() === name.toUpperCase())) return showToast("Term already exists", "error");
    const id = uid();
    setTerms(p => [...p, { id, name: name.toUpperCase(), categories: [], students: derivedStudents.map(s => ({ ...s, scores: {} })) }]);
    setActiveTermId(id); setNewTermName(""); setShowAddTerm(false);
    showToast(`"${name}" term added`, "success");
  };
  const removeTerm = (id) => {
    if (terms.length === 1) return showToast("Cannot remove the only term", "error");
    const t = terms.find(t => t.id === id);
    setConfirmTerm({ open: true, id, name: t?.name || "this term" });
  };
  const doRemoveTerm = (id) => {
    const rem = terms.filter(t => t.id !== id); setTerms(rem);
    if (activeTid === id) setActiveTermId(rem[0].id);
    showToast("Term removed");
  };
  const renameTerm = (id, name) => setTerms(p => p.map(t => t.id === id ? { ...t, name: name.toUpperCase() } : t));

  const currentSubjectObj   = rosterData.find(s => s.subject_id.toString() === selectedSubjectId);
  const currentSubjectLabel = currentSubjectObj ? `${currentSubjectObj.subject_code} – ${currentSubjectObj.descriptive_title}` : "";
  const currentSectionLabel = selectedSection === "All" ? "" : selectedSection;

  const handleExport = async () => {
    if (!terms.some(t => t.students.length > 0 && t.categories.some(c => c.columns.length > 0)))
      return showToast("Add categories with columns to at least one term first", "error");
    try {
      showToast("Preparing export…", "info");
      await exportAllTerms(terms, currentSubjectLabel, currentSectionLabel, currentSubjectObj?.subject_code || "");
      showToast("Excel exported successfully ✓", "success");
    } catch (err) {
      console.error(err);
      showToast("Export failed. Check console for details.", "error");
    }
  };

  return (
    <div style={{ fontFamily: "'Segoe UI',sans-serif", background: P.gray50, minHeight: "100vh" }}>
      {toast && <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: toast.type === "error" ? P.red : toast.type === "success" ? P.green : P.blue, color: "#fff", padding: "10px 20px", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", fontSize: 14, fontWeight: 600, animation: "fadeIn .2s ease" }}>{toast.msg}</div>}

      <div style={{ background: P.red, color: "#fff", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
        <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: 1 }}>📋 Class Record Builder</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>{terms.length} term{terms.length !== 1 ? "s" : ""} • {activeTerm?.students.length || 0} students</span>
          {ssLoad() && (
            <button onClick={() => { ssClear(); setTerms(DEFAULT_TERMS.map(name => ({ id: uid(), name, categories: [], students: derivedStudents.map(s => ({ ...s, scores: {} })) }))); showToast("Saved data cleared", "info"); }}
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.35)", color: "#fff", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              🗑 Clear Saved
            </button>
          )}
          <BtnTool onClick={handleExport} icon="⬇️" label="Export All Terms (.xlsx)" color={P.green} textColor="#fff" />
        </div>
      </div>

      {/* Session restore notice */}
      {ssLoad() && terms.some(t => t.categories.length > 0) && (
        <div style={{ background: "#ecfdf5", borderBottom: "1px solid #6ee7b7", padding: "6px 20px", fontSize: 12, color: "#065f46", display: "flex", gap: 6, alignItems: "center" }}>
          <span>✅</span>
          <span><strong>Session restored</strong> — your categories and columns were saved from your last visit. They will be cleared when you close this browser tab.</span>
        </div>
      )}

      <div style={{ background: P.white, borderBottom: `1px solid ${P.gray200}`, padding: "16px 24px", display: "flex", gap: 20, alignItems: "center" }}>
        <img src={SCHOOL.logo} alt="School Logo" onError={e => { e.currentTarget.style.display = "none"; }}
          style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${P.gray200}`, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: P.red, lineHeight: 1.3 }}>{SCHOOL.name}</div>
          <div style={{ fontSize: 12, color: P.gray500, marginTop: 2 }}>{SCHOOL.address}</div>
          <div style={{ fontSize: 12, color: P.gray500 }}>{SCHOOL.hotline}</div>
          {currentSubjectLabel && (
            <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: P.gray900 }}>{currentSubjectLabel}</span>
              {currentSectionLabel && <span style={{ background: P.blue + "18", color: P.blue, fontWeight: 600, fontSize: 12, borderRadius: 20, padding: "2px 10px" }}>{currentSectionLabel}</span>}
              <span style={{ fontSize: 12, color: P.gray400 }}>• {derivedStudents.length} student{derivedStudents.length !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a", padding: "7px 20px", fontSize: 12, color: "#92400e", display: "flex", gap: 6, alignItems: "center" }}>
        <span>💡</span>
        <span>Students are <strong>loaded automatically</strong> from your assigned subjects and sections. Select a subject, pick a section if needed, then build your categories per term tab.</span>
      </div>

      <div style={{ background: P.white, borderBottom: `1px solid ${P.gray200}`, padding: "14px 20px", display: "flex", gap: 20, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: P.gray600, textTransform: "uppercase", letterSpacing: .5, marginBottom: 6 }}>SUBJECT</div>
          {loadingRoster
            ? <div style={{ fontSize: 13, color: P.gray400, padding: "9px 14px", background: P.gray50, borderRadius: 8, border: `1px solid ${P.gray200}`, minWidth: 300 }}>Loading subjects…</div>
            : <MotionDropdown value={selectedSubjectId} onChange={setSelectedSubjectId}
                options={[{ value: "", label: "— Select a subject —" }, ...subjectOptions]}
                placeholder="— Select a subject —" minWidth={340} />
          }
        </div>
        {selectedSubjectId && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: P.gray600, textTransform: "uppercase", letterSpacing: .5, marginBottom: 6 }}>SECTION</div>
            <MotionDropdown value={selectedSection} onChange={setSelectedSection} options={sectionOptions} placeholder="All Sections" minWidth={210} />
          </div>
        )}
      </div>

      <div style={{ background: P.white, borderBottom: `1px solid ${P.gray200}`, padding: "0 16px", display: "flex", alignItems: "flex-end", overflowX: "auto" }}>
        {terms.map(t => (
          <TermTab key={t.id} term={t} active={t.id === activeTid}
            onClick={() => setActiveTermId(t.id)} onRemove={() => removeTerm(t.id)}
            onRename={(name) => renameTerm(t.id, name)} canRemove={terms.length > 1} />
        ))}
        <button onClick={() => setShowAddTerm(true)}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "10px 16px", background: "none", border: "none", cursor: "pointer", color: P.gray500, fontSize: 13, fontWeight: 600, borderBottom: "3px solid transparent", whiteSpace: "nowrap" }}
          onMouseEnter={e => e.currentTarget.style.color = P.red}
          onMouseLeave={e => e.currentTarget.style.color = P.gray500}>
          <span style={{ fontSize: 16 }}>+</span> Add Term
        </button>
      </div>

      <div style={{ padding: "16px 12px" }}>
        {activeTerm && <TermRecord key={activeTerm.id} term={activeTerm} onUpdate={(patch) => updateTerm(activeTerm.id, patch)} />}
      </div>

      <div style={{ display: "flex", gap: 16, padding: "0 12px 20px", flexWrap: "wrap" }}>
        {[["≥90", P.green, "Excellent"], ["≥80", P.blue, "Good"], ["≥75", "#d97706", "Passing"], ["≥60", P.orange, "Low Pass"], ["<60", "#dc2626", "Failing"]].map(([label, color, desc]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
            <div style={{ width: 11, height: 11, background: color, borderRadius: 3 }} />
            <span style={{ color: P.gray700 }}><strong>{label}%</strong> – {desc}</span>
          </div>
        ))}
      </div>

      {/* ── Confirm delete TERM ── */}
      <ConfirmDeleteModal
        open={confirmTerm.open}
        onClose={() => setConfirmTerm({ open: false, id: null, name: "" })}
        onConfirm={() => doRemoveTerm(confirmTerm.id)}
        title="Delete Term"
        description={`Are you sure you want to delete the "${confirmTerm.name}" term? All categories, columns, and scores for this term will be permanently removed.`}
      />

      <Modal open={showAddTerm} onClose={() => setShowAddTerm(false)} title="Add New Term">
        <Label>Term Name</Label>
        <TInput value={newTermName} onChange={setNewTermName} placeholder="e.g. Midterm" />
        <div style={{ marginTop: 6 }}>{DEFAULT_TERMS.filter(n => !terms.find(t => t.name === n)).map(n => (<QBtn key={n} onClick={() => setNewTermName(n)}>{n}</QBtn>))}</div>
        <MActions onCancel={() => setShowAddTerm(false)} onOk={addTerm} okLabel="Add Term" />
      </Modal>

      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
        input[type=number]::-webkit-inner-spin-button{opacity:.5}
        input:focus{border-color:${P.red}!important;box-shadow:0 0 0 2px ${P.red}22}
        tr:hover td{background:#fff8f8!important}
      `}</style>
    </div>
  );
}


function TermTab({ term, active, onClick, onRemove, onRename, canRemove }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(term.name);
  const commit = () => { const t = val.trim(); if (t) onRename(t); else setVal(term.name); setEditing(false); };
  return (
    <div onClick={!editing ? onClick : undefined}
      style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", cursor: "pointer", userSelect: "none", borderBottom: active ? `3px solid ${P.red}` : "3px solid transparent", background: active ? P.redFade : "none", transition: "all .15s" }}>
      {editing
        ? <input autoFocus value={val} onChange={e => setVal(e.target.value)} onBlur={commit}
            onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setVal(term.name); setEditing(false); } }}
            onClick={e => e.stopPropagation()}
            style={{ border: `1px solid ${P.gray300}`, borderRadius: 4, padding: "2px 6px", fontSize: 13, outline: "none", width: 100 }} />
        : <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? P.red : P.gray600, whiteSpace: "nowrap" }}>{term.name}</span>
      }
      {!editing && <span onDoubleClick={e => { e.stopPropagation(); setEditing(true); }} style={{ fontSize: 10, color: P.gray400, cursor: "text" }} title="Double-click to rename">✎</span>}
      {term.students.length > 0 && <span style={{ background: active ? P.red : P.gray200, color: active ? "#fff" : P.gray600, borderRadius: 20, padding: "0 6px", fontSize: 10, fontWeight: 700 }}>{term.students.length}</span>}
      {canRemove && !editing && <button onClick={e => { e.stopPropagation(); onRemove(); }} style={{ background: "none", border: "none", color: P.gray400, cursor: "pointer", fontSize: 12, padding: "0 2px" }}>✕</button>}
    </div>
  );
}

function Th({ children, style = {}, ...props }) {
  return <th {...props} style={{ padding: "7px", textAlign: "center", fontWeight: 700, fontSize: 12, border: "1px solid rgba(255,255,255,0.15)", whiteSpace: "nowrap", ...style }}>{children}</th>;
}
function Td({ children, style = {} }) {
  return <td style={{ padding: "3px 7px", border: `1px solid ${P.gray200}`, ...style }}>{children}</td>;
}
function IcnBtn({ children, onClick, danger = false }) {
  return <button onClick={e => { e.stopPropagation(); onClick(); }} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 3, color: danger ? "#ffd0d0" : "#fff", cursor: "pointer", padding: "0 5px", fontSize: 13, fontWeight: 800, lineHeight: "18px" }}>{children}</button>;
}
function SmBtn({ children, onClick, color, textColor, icon, disabled = false }) {
  return <button onClick={disabled ? undefined : onClick} style={{ background: color, color: textColor, border: "none", borderRadius: 7, padding: "6px 12px", fontWeight: 700, fontSize: 12, cursor: disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 5, opacity: disabled ? .5 : 1, boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>{icon} {children}</button>;
}
function BtnTool({ onClick, icon, label, color, textColor, disabled = false }) {
  return <button onClick={disabled ? undefined : onClick} style={{ background: color, color: textColor, border: "none", borderRadius: 8, padding: "7px 14px", fontWeight: 700, fontSize: 13, cursor: disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, opacity: disabled ? .5 : 1, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>{icon} {label}</button>;
}
function PctBar({ used }) {
  const color = used >= 100 ? "#16a34a" : used >= 75 ? "#d97706" : P.red;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 80, height: 6, background: P.gray200, borderRadius: 10, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(used, 100)}%`, height: "100%", background: color, borderRadius: 10, transition: "width .3s" }} />
      </div>
      <span style={{ fontSize: 11, color: P.gray600, fontWeight: 600 }}>{used}% / 100%</span>
    </div>
  );
}
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn .2s ease" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 26, minWidth: 310, maxWidth: 390, width: "90%", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontWeight: 800, fontSize: 15, color: P.red, marginBottom: 16 }}>{title}</div>
        {children}
      </div>
    </div>
  );
}
function MActions({ onCancel, onOk, okLabel }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
      <button onClick={onCancel} style={{ background: P.gray100, color: P.gray700, border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancel</button>
      <button onClick={onOk}    style={{ background: P.red, color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontWeight: 700, fontSize: 13, boxShadow: "0 2px 8px rgba(156,38,44,0.3)" }}>{okLabel}</button>
    </div>
  );
}
function Label({ children, mt = false }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: P.gray700, marginBottom: 4, marginTop: mt ? 12 : 0 }}>{children}</div>;
}
function TInput({ value, onChange, placeholder, type = "text", style = {}, ...rest }) {
  return <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} {...rest}
    style={{ width: "100%", padding: "8px 11px", border: `1.5px solid ${P.gray200}`, borderRadius: 8, fontSize: 13, outline: "none", color: P.gray900, boxSizing: "border-box", background: P.gray50, ...style }} />;
}
function QBtn({ children, onClick }) {
  return <button onClick={onClick} style={{ marginRight: 5, marginBottom: 4, padding: "3px 10px", background: P.gray100, border: `1px solid ${P.gray200}`, borderRadius: 20, fontSize: 12, cursor: "pointer", color: P.gray700, fontWeight: 600 }}>{children}</button>;
}