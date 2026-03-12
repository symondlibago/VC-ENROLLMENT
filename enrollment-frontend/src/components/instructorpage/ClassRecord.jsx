import { useState } from "react";
import * as XLSX from "xlsx";

// ─── Utility ────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);

// Column index (0-based) → Excel letter  e.g. 0→A, 25→Z, 26→AA
function colLetter(idx) {
  let s = "";
  let n = idx;
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

const PALETTE = {
  red: "#9C262C", redLight: "#c0393f", redDark: "#6b1a1e",
  goldLight: "#ffd740",
  gray50: "#f9fafb", gray100: "#f3f4f6", gray200: "#e5e7eb",
  gray400: "#9ca3af", gray600: "#4b5563", gray700: "#374151", gray900: "#111827",
  green: "#16a34a", blue: "#2563eb", orange: "#ea580c",
};

function gradeColor(pct) {
  if (pct >= 90) return "#15803d";
  if (pct >= 80) return "#2563eb";
  if (pct >= 75) return "#d97706";
  if (pct >= 60) return "#ea580c";
  return "#dc2626";
}

const CAT_COLORS = [
  ["#b45309","#d97706","#fef3c7"],
  ["#1d4ed8","#3b82f6","#eff6ff"],
  ["#15803d","#22c55e","#f0fdf4"],
  ["#7c3aed","#a78bfa","#f5f3ff"],
  ["#0e7490","#06b6d4","#ecfeff"],
  ["#be185d","#ec4899","#fdf2f8"],
];
const catBg = (i) => CAT_COLORS[i % CAT_COLORS.length][0];
const catBgLight = (i) => CAT_COLORS[i % CAT_COLORS.length][1];
const catBgVeryLight = (i) => CAT_COLORS[i % CAT_COLORS.length][2];

// ────────────────────────────────────────────────────────────────────────────
//  EXCEL EXPORT  –  produces a real .xlsx with Excel formulas
// ────────────────────────────────────────────────────────────────────────────
function exportToExcel(categories, students) {
  /*
    Rows (1-based Excel):
      1  → Title
      2  → Category merged headers  (ATTENDANCE/ATTITUDE 15% | … | Final Grade | Rounded)
      3  → Sub-column labels        (8/14/2021 100pts | … | Score | …)
      4  → Max-points reference row (100  100  100  …)   ← used by Score formulas
      5+ → Student data rows

    Columns (0-based internally):
      0  No.   1  Name   2  Program
      then per category: [input cols …]  [Score col]
      lastly: Final Grade  |  Rounded
  */

  const FIXED       = 3;          // No., Name, Program
  const MAX_PTS_ROW = 4;          // Excel row that holds max-pts denominators
  const DATA_START  = 5;          // first student row (Excel 1-based)

  // Build column start index per category
  const catColStart = [];
  let cursor = FIXED;
  for (const cat of categories) {
    catColStart.push(cursor);
    if (cat.columns.length > 0) cursor += cat.columns.length + 1; // inputs + Score
    // (categories with 0 columns take no space in the export)
  }
  const finalGradeCol = cursor;
  const roundedCol    = cursor + 1;
  const totalCols     = cursor + 2;

  const wb = XLSX.utils.book_new();
  const ws = {};

  // ── Row 1: Title ──────────────────────────────────────────────────────────
  ws["A1"] = { v: "CLASS RECORD", t: "s" };

  // ── Row 2: Fixed col headers (span rows 2-4 via merges below) ────────────
  ws["A2"] = { v: "No.",     t: "s" };
  ws["B2"] = { v: "Name",    t: "s" };
  ws["C2"] = { v: "Program", t: "s" };

  // ── Row 2: Category headers ───────────────────────────────────────────────
  for (let ci = 0; ci < categories.length; ci++) {
    const cat = categories[ci];
    if (cat.columns.length === 0) continue;
    ws[colLetter(catColStart[ci]) + "2"] = {
      v: `${cat.name.toUpperCase()} (${cat.pct}%)`, t: "s",
    };
  }

  // Final Grade & Rounded (span rows 2-4 via merges)
  ws[colLetter(finalGradeCol) + "2"] = { v: "Final Grade", t: "s" };
  ws[colLetter(roundedCol)    + "2"] = { v: "Rounded",     t: "s" };

  // ── Row 3: Sub-column labels ──────────────────────────────────────────────
  for (let ci = 0; ci < categories.length; ci++) {
    const cat    = categories[ci];
    const cStart = catColStart[ci];
    for (let j = 0; j < cat.columns.length; j++) {
      const col = cat.columns[j];
      ws[colLetter(cStart + j) + "3"] = {
        v: `${col.label} (${col.maxPts}pts)`, t: "s",
      };
    }
    if (cat.columns.length > 0) {
      ws[colLetter(cStart + cat.columns.length) + "3"] = { v: "Score", t: "s" };
    }
  }

  // ── Row 4: Max-points reference row ──────────────────────────────────────
  for (let ci = 0; ci < categories.length; ci++) {
    const cat    = categories[ci];
    const cStart = catColStart[ci];
    for (let j = 0; j < cat.columns.length; j++) {
      ws[colLetter(cStart + j) + MAX_PTS_ROW] = { v: cat.columns[j].maxPts, t: "n" };
    }
  }

  // ── Rows 5+: Student data + formulas ─────────────────────────────────────
  for (let si = 0; si < students.length; si++) {
    const s   = students[si];
    const row = DATA_START + si;

    ws[colLetter(0) + row] = { v: s.no,           t: "n" };
    ws[colLetter(1) + row] = { v: s.name,          t: "s" };
    ws[colLetter(2) + row] = { v: s.program || "", t: "s" };

    const scoreCellRefs = [];   // collect for Final Grade formula

    for (let ci = 0; ci < categories.length; ci++) {
      const cat    = categories[ci];
      const cStart = catColStart[ci];
      if (cat.columns.length === 0) continue;

      // Input cells
      for (let j = 0; j < cat.columns.length; j++) {
        const val = s.scores[cat.columns[j].id];
        ws[colLetter(cStart + j) + row] = {
          v: val === "" || val === undefined ? 0 : Number(val), t: "n",
        };
      }

      // Score formula — denominator only counts max pts for columns where a score was entered (>0)
      // =IFERROR( (SUM(scores)) / SUMPRODUCT((scores>0)*maxPts) * pct, 0)
      // This prevents empty/zero columns from diluting the score.
      const scoreColIdx = cStart + cat.columns.length;
      const inputRange  = `${colLetter(cStart)}${row}:${colLetter(cStart + cat.columns.length - 1)}${row}`;
      const maxRange    = `${colLetter(cStart)}${MAX_PTS_ROW}:${colLetter(cStart + cat.columns.length - 1)}${MAX_PTS_ROW}`;
      // SUMPRODUCT((inputRange>0)*maxRange) = sum of maxPts only where student has a score > 0
      ws[colLetter(scoreColIdx) + row] = {
        f: `IFERROR((SUM(${inputRange})/SUMPRODUCT((${inputRange}>0)*${maxRange}))*${cat.pct},0)`, t: "n",
      };
      scoreCellRefs.push(colLetter(scoreColIdx) + row);
    }

    // Final Grade = SUM of all Score cells
    if (scoreCellRefs.length > 0) {
      ws[colLetter(finalGradeCol) + row] = {
        f: `SUM(${scoreCellRefs.join(",")})`, t: "n",
      };
      // Rounded = ROUND(finalGrade, 0)
      ws[colLetter(roundedCol) + row] = {
        f: `ROUND(${colLetter(finalGradeCol)}${row},0)`, t: "n",
      };
    }
  }

  // ── Merges ────────────────────────────────────────────────────────────────
  const merges = [];

  // Title across all columns
  merges.push({ s: { r:0, c:0 }, e: { r:0, c:totalCols-1 } });

  // No., Name, Program span rows 2-4
  for (let c = 0; c < FIXED; c++) {
    merges.push({ s: { r:1, c }, e: { r:3, c } });
  }

  // Category header merges (row 2)
  for (let ci = 0; ci < categories.length; ci++) {
    const cat  = categories[ci];
    const span = cat.columns.length + (cat.columns.length > 0 ? 1 : 0);
    if (span > 1) {
      merges.push({
        s: { r:1, c: catColStart[ci] },
        e: { r:1, c: catColStart[ci] + span - 1 },
      });
    }
  }

  // Final Grade & Rounded span rows 2-4
  merges.push({ s: { r:1, c:finalGradeCol }, e: { r:3, c:finalGradeCol } });
  merges.push({ s: { r:1, c:roundedCol    }, e: { r:3, c:roundedCol    } });

  ws["!merges"] = merges;

  // ── Column widths ─────────────────────────────────────────────────────────
  const colWidths = [
    { wch: 5  },  // No.
    { wch: 28 },  // Name
    { wch: 10 },  // Program
  ];
  for (let c = FIXED; c < totalCols; c++) colWidths.push({ wch: 14 });
  ws["!cols"] = colWidths;

  // ── Sheet ref ─────────────────────────────────────────────────────────────
  const lastRow = students.length > 0 ? DATA_START + students.length - 1 : DATA_START;
  ws["!ref"]   = `A1:${colLetter(totalCols - 1)}${lastRow}`;

  XLSX.utils.book_append_sheet(wb, ws, "Class Record");

  // ── Legend sheet ──────────────────────────────────────────────────────────
  const legendWs = XLSX.utils.aoa_to_sheet([
    ["Grade Range", "Description"],
    ["≥ 90", "Excellent"],
    ["≥ 80", "Good"],
    ["≥ 75", "Passing"],
    ["≥ 60", "Low Pass"],
    ["< 60",  "Failing"],
    [],
    ["Formulas used"],
    ["Score",       "=IFERROR((SUM(student inputs)/SUM(max pts row)) × category %, 0)"],
    ["Final Grade", "=SUM(all Score columns for the row)"],
    ["Rounded",     "=ROUND(Final Grade, 0)"],
    [],
    ["You can freely edit the score input cells and everything recalculates automatically."],
  ]);
  legendWs["!cols"] = [{ wch: 16 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, legendWs, "Legend");

  XLSX.writeFile(wb, "class_record.xlsx");
}

// ────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ────────────────────────────────────────────────────────────────────────────
export default function ClassRecord() {
  const [categories,    setCategories]    = useState([]);
  const [students,      setStudents]      = useState([]);
  const [showCatModal,  setShowCatModal]  = useState(false);
  const [showColModal,  setShowColModal]  = useState({ open: false, catId: null });
  const [showStudModal, setShowStudModal] = useState(false);
  const [catForm,       setCatForm]       = useState({ name: "", pct: "" });
  const [colForm,       setColForm]       = useState({ label: "", maxPts: "100" });
  const [studForm,      setStudForm]      = useState({ name: "", program: "" });
  const [editStudId,    setEditStudId]    = useState(null);
  const [toast,         setToast]         = useState(null);

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const totalPct = categories.reduce((s, c) => s + Number(c.pct), 0);
  const allCols  = categories.flatMap(c => c.columns.map(col => ({ ...col, catId: c.id })));

  // ── Categories ────────────────────────────────────────────────────────────
  const addCategory = () => {
    const name = catForm.name.trim();
    const pct  = Number(catForm.pct);
    if (!name)              return showToast("Category name required", "error");
    if (!pct || pct <= 0)   return showToast("Enter a valid percentage", "error");
    if (totalPct + pct > 100) return showToast(`Only ${100 - totalPct}% remaining`, "error");
    setCategories(p => [...p, { id: uid(), name, pct, columns: [] }]);
    setCatForm({ name: "", pct: "" });
    setShowCatModal(false);
    showToast(`"${name}" added at ${pct}%`, "success");
  };

  const removeCategory = (id) => {
    setCategories(p => p.filter(c => c.id !== id));
    showToast("Category removed");
  };

  // ── Columns ───────────────────────────────────────────────────────────────
  const addColumn = () => {
    const { catId } = showColModal;
    const label  = colForm.label.trim();
    const maxPts = Number(colForm.maxPts);
    if (!label)              return showToast("Column label required", "error");
    if (!maxPts || maxPts <= 0) return showToast("Max points must be > 0", "error");
    setCategories(p =>
      p.map(c => c.id === catId
        ? { ...c, columns: [...c.columns, { id: uid(), label, maxPts }] }
        : c)
    );
    setColForm({ label: "", maxPts: "100" });
    setShowColModal({ open: false, catId: null });
    showToast("Column added", "success");
  };

  const removeColumn = (catId, colId) => {
    setCategories(p =>
      p.map(c => c.id === catId
        ? { ...c, columns: c.columns.filter(col => col.id !== colId) }
        : c)
    );
  };

  // ── Students ──────────────────────────────────────────────────────────────
  const saveStudent = () => {
    const name    = studForm.name.trim();
    const program = studForm.program.trim();
    if (!name) return showToast("Student name required", "error");
    if (editStudId) {
      setStudents(p => p.map(s => s.id === editStudId ? { ...s, name, program } : s));
      showToast("Student updated", "success");
    } else {
      setStudents(p => [...p, { id: uid(), no: p.length + 1, name, program, scores: {} }]);
      showToast("Student added", "success");
    }
    setStudForm({ name: "", program: "" });
    setEditStudId(null);
    setShowStudModal(false);
  };

  const removeStudent = (id) => {
    setStudents(p =>
      p.filter(s => s.id !== id).map((s, i) => ({ ...s, no: i + 1 }))
    );
  };

  const openEditStudent = (s) => {
    setStudForm({ name: s.name, program: s.program });
    setEditStudId(s.id);
    setShowStudModal(true);
  };

  const setScore = (studId, colId, val) => {
    setStudents(p =>
      p.map(s => s.id === studId
        ? { ...s, scores: { ...s.scores, [colId]: val } }
        : s)
    );
  };

  // ── Live preview computation ───────────────────────────────────────────────
  const computeRow = (student) => {
    let finalGrade = 0;
    const catScores = {};
    for (const cat of categories) {
      if (!cat.columns.length) { catScores[cat.id] = null; continue; }
      let earned = 0, total = 0;
      for (const col of cat.columns) {
        const v = Number(student.scores[col.id] || 0);
        if (v > 0) { earned += v; total += col.maxPts; }
      }
      const rawScore = total > 0 ? (earned / total) * cat.pct : 0;
      catScores[cat.id] = { rawScore };
      finalGrade += rawScore;
    }
    return { catScores, finalGrade, rounded: Math.round(finalGrade * 10) / 10 };
  };

  // ── Export handler ────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!students.length)   return showToast("Add at least one student first", "error");
    if (!categories.length) return showToast("Add at least one category first", "error");
    if (!categories.some(c => c.columns.length > 0))
      return showToast("Add columns to your categories first", "error");
    exportToExcel(categories, students);
    showToast("Excel exported with live formulas! ✓", "success");
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: PALETTE.gray50, minHeight: "100vh" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: toast.type === "error" ? PALETTE.red : toast.type === "success" ? PALETTE.green : PALETTE.blue,
          color: "#fff", padding: "10px 20px", borderRadius: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)", fontSize: 14, fontWeight: 600,
          animation: "fadeIn .2s ease",
        }}>{toast.msg}</div>
      )}

      {/* Toolbar */}
      <div style={{
        background: PALETTE.red, color: "#fff", padding: "12px 20px",
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
      }}>
        <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: 1, marginRight: 8 }}>
          📋 Class Record Builder
        </div>
        <BtnTool onClick={() => setShowStudModal(true)} icon="👤" label="Add Student"
          color={PALETTE.goldLight} textColor={PALETTE.gray900} />
        <BtnTool onClick={() => setShowCatModal(true)} icon="➕" label="Add Category"
          disabled={totalPct >= 100}
          color={totalPct >= 100 ? PALETTE.gray400 : "#fff"} textColor={totalPct >= 100 ? "#fff" : PALETTE.red} />
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <PctBar used={totalPct} />
          <BtnTool onClick={handleExport} icon="⬇️" label="Export Excel (.xlsx)"
            color={PALETTE.green} textColor="#fff" />
        </div>
      </div>

      {/* Info banner */}
      <div style={{
        background: "#fffbeb", borderBottom: "1px solid #fde68a",
        padding: "8px 20px", fontSize: 12, color: "#92400e",
        display: "flex", gap: 8, alignItems: "center",
      }}>
        <span>💡</span>
        <span>
          The exported <strong>.xlsx</strong> contains <strong>real Excel formulas</strong> — Score columns 
          use <code>IFERROR((SUM(scores)/SUM(max pts))×weight%,0)</code>, Final Grade sums all Score 
          columns, Rounded uses <code>ROUND()</code>. Edit any score cell in Excel and everything updates automatically.
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", padding: "20px 12px" }}>
        <table style={{
          borderCollapse: "collapse", width: "100%", minWidth: 600,
          background: "#fff", boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
          borderRadius: 10, overflow: "hidden", fontSize: 13,
        }}>
          <thead>
            {/* Row 1: Category headers */}
            <tr>
              <Th rowSpan={3} style={{ background: PALETTE.gray700, color: "#fff", width: 42 }}>No.</Th>
              <Th rowSpan={3} style={{ background: PALETTE.gray700, color: "#fff", minWidth: 160 }}>Name</Th>
              <Th rowSpan={3} style={{ background: PALETTE.gray700, color: "#fff", width: 80 }}>Program</Th>
              {categories.map((cat, ci) => {
                const span = (cat.columns.length > 0 ? cat.columns.length + 1 : 1);
                return (
                  <Th key={cat.id} colSpan={span} style={{ background: catBg(ci), color: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <span>{cat.name}</span>
                      <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: 20, padding: "1px 8px", fontSize: 11 }}>{cat.pct}%</span>
                      <button onClick={() => setShowColModal({ open: true, catId: cat.id })}
                        style={{ background: "rgba(255,255,255,0.25)", border: "none", borderRadius: 4, color: "#fff", cursor: "pointer", padding: "1px 6px", fontSize: 14, fontWeight: 800 }}>+</button>
                      <button onClick={() => removeCategory(cat.id)}
                        style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 4, color: "#ffd0d0", cursor: "pointer", padding: "1px 5px", fontSize: 11 }}>✕</button>
                    </div>
                  </Th>
                );
              })}
              {categories.length > 0 && (
                <>
                  <Th rowSpan={3} style={{ background: PALETTE.redDark, color: PALETTE.goldLight, fontWeight: 800 }}>Final Grade</Th>
                  <Th rowSpan={3} style={{ background: PALETTE.redDark, color: PALETTE.goldLight, fontWeight: 800 }}>Rounded</Th>
                </>
              )}
            </tr>

            {/* Row 2: Sub-column headers */}
            <tr>
              {categories.map((cat, ci) =>
                cat.columns.map(col => (
                  <Th key={col.id} style={{ background: catBgLight(ci), color: "#fff", fontSize: 11 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <span>{col.label}</span>
                      <span style={{ opacity: 0.8, fontSize: 10 }}>{col.maxPts}pts</span>
                      <button onClick={() => removeColumn(cat.id, col.id)}
                        style={{ background: "none", border: "none", color: "#ffd0d0", cursor: "pointer", fontSize: 10 }}>✕</button>
                    </div>
                  </Th>
                )).concat(
                  cat.columns.length > 0
                    ? [<Th key={cat.id + "sh"} style={{ background: catBgLight(ci), color: "#fff", fontSize: 11 }}>Score</Th>]
                    : []
                )
              )}
            </tr>

            {/* Row 3: Max pts */}
            <tr>
              {categories.map((cat, ci) =>
                cat.columns.map(col => (
                  <td key={col.id + "max"} style={{
                    textAlign: "center", fontSize: 10, color: PALETTE.gray600,
                    padding: "2px 4px", background: catBgVeryLight(ci), fontStyle: "italic",
                    border: `1px solid ${PALETTE.gray200}`,
                  }}>{col.maxPts}</td>
                )).concat(
                  cat.columns.length > 0
                    ? [<td key={cat.id + "m"} style={{ background: catBgVeryLight(ci), border: `1px solid ${PALETTE.gray200}` }} />]
                    : []
                )
              )}
            </tr>
          </thead>

          <tbody>
            {students.length === 0 && (
              <tr>
                <td colSpan={3 + allCols.length + categories.filter(c => c.columns.length > 0).length + 2}
                  style={{ textAlign: "center", color: PALETTE.gray400, padding: "40px", fontSize: 14 }}>
                  No students yet — click <strong>Add Student</strong> to begin.
                </td>
              </tr>
            )}
            {students.map((s, si) => {
              const { catScores, finalGrade, rounded } = computeRow(s);
              const rowBg = si % 2 === 0 ? "#fff" : PALETTE.gray50;
              return (
                <tr key={s.id} style={{ background: rowBg }}>
                  <Td style={{ textAlign: "center", color: PALETTE.gray600, fontWeight: 600 }}>{s.no}</Td>
                  <Td>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontWeight: 600 }}>{s.name}</span>
                      <button onClick={() => openEditStudent(s)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: PALETTE.blue, fontSize: 12 }}>✏️</button>
                      <button onClick={() => removeStudent(s.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: PALETTE.red, fontSize: 12 }}>✕</button>
                    </div>
                  </Td>
                  <Td style={{ color: PALETTE.gray600, fontSize: 12 }}>{s.program}</Td>

                  {categories.map((cat, ci) => {
                    const inputCells = cat.columns.map(col => (
                      <td key={col.id} style={{ padding: "3px 4px", textAlign: "center", borderBottom: `1px solid ${PALETTE.gray100}`, border: `1px solid ${PALETTE.gray200}` }}>
                        <input
                          type="number" min={0} max={col.maxPts}
                          value={s.scores[col.id] ?? ""}
                          onChange={e => setScore(s.id, col.id,
                            e.target.value === "" ? "" : Math.min(Number(e.target.value), col.maxPts)
                          )}
                          style={{
                            width: 58, textAlign: "center", border: `1px solid ${PALETTE.gray200}`,
                            borderRadius: 5, padding: "3px 4px", fontSize: 13,
                            outline: "none", background: PALETTE.gray50, color: PALETTE.gray900,
                          }}
                        />
                      </td>
                    ));
                    const scoreCells = cat.columns.length > 0 ? [(
                      <td key={cat.id + "sv"} style={{
                        textAlign: "center", fontWeight: 700, fontSize: 12, padding: "4px 8px",
                        background: catBgVeryLight(ci), border: `1px solid ${PALETTE.gray200}`,
                      }}>
                        {catScores[cat.id]
                          ? <span style={{ color: gradeColor((catScores[cat.id].rawScore / cat.pct) * 100) }}>
                              {catScores[cat.id].rawScore.toFixed(2)}
                            </span>
                          : <span style={{ color: PALETTE.gray400 }}>—</span>}
                      </td>
                    )] : [];
                    return [...inputCells, ...scoreCells];
                  })}

                  {categories.length > 0 && (
                    <>
                      <Td style={{ textAlign: "center", fontWeight: 700, fontSize: 13, background: "#fff5f5", color: gradeColor(finalGrade) }}>
                        {finalGrade.toFixed(2)}
                      </Td>
                      <Td style={{ textAlign: "center", fontWeight: 800, fontSize: 14, background: gradeColor(rounded) + "22", color: gradeColor(rounded) }}>
                        {rounded}
                      </Td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      {students.length > 0 && categories.length > 0 && (
        <div style={{ display: "flex", gap: 16, padding: "0 12px 20px", flexWrap: "wrap" }}>
          {[["≥90", PALETTE.green, "Excellent"], ["≥80", PALETTE.blue, "Good"], ["≥75", "#d97706", "Passing"],
            ["≥60", PALETTE.orange, "Low Pass"], ["<60", "#dc2626", "Failing"]].map(([label, color, desc]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
              <div style={{ width: 12, height: 12, background: color, borderRadius: 3 }} />
              <span style={{ color: PALETTE.gray700 }}><strong>{label}%</strong> – {desc}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      <Modal open={showCatModal} onClose={() => setShowCatModal(false)} title="Add Grade Category">
        <Label>Category Name</Label>
        <TextInput value={catForm.name} onChange={v => setCatForm(p => ({ ...p, name: v }))} placeholder="e.g. Attendance/Attitude" />
        <Label style={{ marginTop: 12 }}>Percentage Weight (%)</Label>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TextInput type="number" min={1} max={100 - totalPct}
            value={catForm.pct} onChange={v => setCatForm(p => ({ ...p, pct: v }))}
            placeholder={`Max ${100 - totalPct}%`} style={{ flex: 1 }} />
          <span style={{ color: PALETTE.gray400, fontSize: 12 }}>Remaining: {100 - totalPct}%</span>
        </div>
        <div style={{ marginTop: 6 }}>
          {[5,10,15,20,25,30,40].filter(v => v <= 100 - totalPct).map(v => (
            <QuickBtn key={v} onClick={() => setCatForm(p => ({ ...p, pct: String(v) }))}>{v}%</QuickBtn>
          ))}
        </div>
        <ModalActions onCancel={() => setShowCatModal(false)} onConfirm={addCategory} confirmLabel="Add Category" />
      </Modal>

      <Modal open={showColModal.open} onClose={() => setShowColModal({ open: false, catId: null })} title="Add Column">
        <Label>Column Label</Label>
        <TextInput value={colForm.label} onChange={v => setColForm(p => ({ ...p, label: v }))} placeholder="e.g. 8/14/2021" />
        <Label style={{ marginTop: 12 }}>Max Points</Label>
        <TextInput type="number" min={1} value={colForm.maxPts}
          onChange={v => setColForm(p => ({ ...p, maxPts: v }))} placeholder="100" />
        <div style={{ marginTop: 6 }}>
          {[50,100].map(v => (
            <QuickBtn key={v} onClick={() => setColForm(p => ({ ...p, maxPts: String(v) }))}>{v} pts</QuickBtn>
          ))}
        </div>
        <ModalActions onCancel={() => setShowColModal({ open: false, catId: null })} onConfirm={addColumn} confirmLabel="Add Column" />
      </Modal>

      <Modal
        open={showStudModal}
        onClose={() => { setShowStudModal(false); setEditStudId(null); setStudForm({ name: "", program: "" }); }}
        title={editStudId ? "Edit Student" : "Add Student"}
      >
        <Label>Full Name</Label>
        <TextInput value={studForm.name} onChange={v => setStudForm(p => ({ ...p, name: v }))} placeholder="e.g. DELA CRUZ, JUAN A." />
        <Label style={{ marginTop: 12 }}>Program</Label>
        <TextInput value={studForm.program} onChange={v => setStudForm(p => ({ ...p, program: v }))} placeholder="e.g. OBM 1" />
        <ModalActions
          onCancel={() => { setShowStudModal(false); setEditStudId(null); setStudForm({ name: "", program: "" }); }}
          onConfirm={saveStudent}
          confirmLabel={editStudId ? "Save Changes" : "Add Student"}
        />
      </Modal>

      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
        input[type=number]::-webkit-inner-spin-button { opacity:.5; }
        input:focus { border-color:${PALETTE.red}!important; box-shadow:0 0 0 2px ${PALETTE.red}22; }
        tr:hover td { background:#fff8f8!important; }
      `}</style>
    </div>
  );
}

// ─── Shared primitives ───────────────────────────────────────────────────────
function Th({ children, style = {}, ...props }) {
  return (
    <th {...props} style={{ padding: "8px 8px", textAlign: "center", fontWeight: 700, fontSize: 12, border: "1px solid rgba(255,255,255,0.15)", whiteSpace: "nowrap", ...style }}>
      {children}
    </th>
  );
}
function Td({ children, style = {} }) {
  return (
    <td style={{ padding: "4px 8px", borderBottom: `1px solid ${PALETTE.gray100}`, border: `1px solid ${PALETTE.gray200}`, ...style }}>
      {children}
    </td>
  );
}
function BtnTool({ onClick, icon, label, color, textColor, disabled }) {
  return (
    <button onClick={disabled ? undefined : onClick} style={{
      background: color, color: textColor, border: "none", borderRadius: 8,
      padding: "7px 14px", fontWeight: 700, fontSize: 13, cursor: disabled ? "not-allowed" : "pointer",
      display: "flex", alignItems: "center", gap: 6, opacity: disabled ? 0.5 : 1,
      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    }}>
      {icon} {label}
    </button>
  );
}
function PctBar({ used }) {
  const color = used >= 100 ? PALETTE.goldLight : used >= 75 ? PALETTE.goldLight : "#fff";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>Category Weight</span>
      <div style={{ width: 120, height: 8, background: "rgba(255,255,255,0.2)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(used, 100)}%`, height: "100%", background: color, borderRadius: 10, transition: "width .4s" }} />
      </div>
      <span style={{ fontSize: 12, color, fontWeight: 700 }}>{used}% / 100%</span>
    </div>
  );
}
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn .2s ease" }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 28, minWidth: 320, maxWidth: 400, width: "90%", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontWeight: 800, fontSize: 16, color: PALETTE.red, marginBottom: 18 }}>{title}</div>
        {children}
      </div>
    </div>
  );
}
function ModalActions({ onCancel, onConfirm, confirmLabel }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
      <button onClick={onCancel} style={{ background: PALETTE.gray100, color: PALETTE.gray700, border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
      <button onClick={onConfirm} style={{ background: PALETTE.red, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontWeight: 700, boxShadow: "0 2px 8px rgba(156,38,44,0.3)" }}>{confirmLabel}</button>
    </div>
  );
}
function Label({ children, style = {} }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: PALETTE.gray700, marginBottom: 5, ...style }}>{children}</div>;
}
function TextInput({ value, onChange, placeholder, type = "text", style = {}, ...rest }) {
  return (
    <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} {...rest}
      style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${PALETTE.gray200}`, borderRadius: 8, fontSize: 14, outline: "none", color: PALETTE.gray900, boxSizing: "border-box", background: PALETTE.gray50, ...style }} />
  );
}
function QuickBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{ marginRight: 6, marginBottom: 4, padding: "3px 10px", background: PALETTE.gray100, border: `1px solid ${PALETTE.gray200}`, borderRadius: 20, fontSize: 12, cursor: "pointer", color: PALETTE.gray700, fontWeight: 600 }}>
      {children}
    </button>
  );
}