/**
 * A minimal WordprocessingML writer: enough OOXML to build the documents this
 * app hands out, with no dependency to ship.
 *
 * Content builders return XML strings, so a document is just string
 * concatenation. `createDocxBlob` wraps the result in a .docx package —
 * including headers, footers and their images when a document needs them.
 */

export function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ─── CRC-32 ─────────────────────────────────────────────────────────────────
let CRC_TABLE = null;
function crc32(bytes) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

// ─── ZIP (store / no compression) ───────────────────────────────────────────
const u16 = (arr, n) => { arr.push(n & 0xff, (n >>> 8) & 0xff); };
const u32 = (arr, n) => { arr.push(n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff); };

function zipStore(files) {
  const enc = new TextEncoder();
  const parts = [];      // Uint8Arrays written in order (local headers + data)
  let offset = 0;
  const push = (bytes) => { parts.push(bytes); offset += bytes.length; };

  const records = files.map((f) => ({
    nameBytes: enc.encode(f.name),
    data: typeof f.data === 'string' ? enc.encode(f.data) : f.data,
    crc: 0,
    offset: 0,
  }));

  for (const rec of records) {
    rec.crc = crc32(rec.data);
    rec.offset = offset;
    const h = [];
    u32(h, 0x04034b50); u16(h, 20); u16(h, 0x0800); u16(h, 0); // sig, ver, UTF-8 flag, store
    u16(h, 0); u16(h, 0x21);                                    // mod time/date (1980-01-01)
    u32(h, rec.crc); u32(h, rec.data.length); u32(h, rec.data.length);
    u16(h, rec.nameBytes.length); u16(h, 0);                   // name len, extra len
    push(Uint8Array.from(h));
    push(rec.nameBytes);
    push(rec.data);
  }

  const cdStart = offset;
  const central = [];
  for (const rec of records) {
    const c = [];
    u32(c, 0x02014b50); u16(c, 20); u16(c, 20); u16(c, 0x0800); u16(c, 0);
    u16(c, 0); u16(c, 0x21);
    u32(c, rec.crc); u32(c, rec.data.length); u32(c, rec.data.length);
    u16(c, rec.nameBytes.length); u16(c, 0); u16(c, 0);        // name, extra, comment len
    u16(c, 0); u16(c, 0); u32(c, 0);                            // disk, internal, external attrs
    u32(c, rec.offset);
    central.push(Uint8Array.from(c));
    central.push(rec.nameBytes);
  }
  const cdSize = central.reduce((s, a) => s + a.length, 0);

  const end = [];
  u32(end, 0x06054b50); u16(end, 0); u16(end, 0);
  u16(end, records.length); u16(end, records.length);
  u32(end, cdSize); u32(end, cdStart); u16(end, 0);

  const all = [...parts, ...central, Uint8Array.from(end)];
  const total = all.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let p = 0;
  for (const a of all) { out.set(a, p); p += a.length; }
  return out;
}

// ─── Content builders (return XML strings) ──────────────────────────────────

// Word wants every drawing in a part to carry its own id.
let drawingId = 1000;
const nextDrawingId = () => ++drawingId;

const BORDER_SIDES = ['top', 'left', 'bottom', 'right'];

/**
 * Border spec → XML, under whichever wrapper element the caller names.
 * A side may be `false`/`'nil'` (explicitly none) or a size in eighths of a
 * point; `{ bottom: 18 }` draws a thick rule under a cell and nothing else.
 */
function borderXml(wrapper, spec, { fillNil = false } = {}) {
  if (!spec) return '';
  const sides = BORDER_SIDES.concat(wrapper === 'w:tblBorders' ? ['insideH', 'insideV'] : [])
    .map((side) => {
      const value = spec[side];
      if (value === undefined) return fillNil ? `<w:${side} w:val="nil"/>` : '';
      if (value === false || value === 'nil' || value === 'none') return `<w:${side} w:val="nil"/>`;
      return `<w:${side} w:val="single" w:sz="${value}" w:space="0" w:color="${spec.color || 'auto'}"/>`;
    })
    .join('');
  return sides ? `<${wrapper}>${sides}</${wrapper}>` : '';
}

function runProps(r, defaults) {
  const size = r.size || defaults.size;
  const font = r.font || defaults.font;
  return '<w:rPr>' +
    (font ? `<w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}"/>` : '') +
    (r.bold ?? defaults.bold ? '<w:b/>' : '') +
    (r.italic ?? defaults.italic ? '<w:i/>' : '') +
    (r.underline ? '<w:u w:val="single"/>' : '') +
    (r.caps ? '<w:caps/>' : '') +
    `<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>` +
    ((r.color || defaults.color) ? `<w:color w:val="${r.color || defaults.color}"/>` : '') +
    '</w:rPr>';
}

/** Splits on \n and \t so a run can carry line breaks and tab stops. */
function runXml(r, defaults) {
  const rPr = runProps(r, defaults);
  if (r.raw) return `<w:r>${rPr}${r.raw}</w:r>`;
  const pieces = String(r.text ?? '').split(/(\n|\t)/).filter((p) => p !== '');
  if (!pieces.length) return `<w:r>${rPr}<w:t xml:space="preserve"></w:t></w:r>`;
  const body = pieces
    .map((piece) => {
      if (piece === '\n') return '<w:br/>';
      if (piece === '\t') return '<w:tab/>';
      return `<w:t xml:space="preserve">${escapeXml(piece)}</w:t>`;
    })
    .join('');
  return `<w:r>${rPr}${body}</w:r>`;
}

/**
 * A paragraph. `text` is a string, or an array of runs
 * [{ text, bold, italic, underline, color, size, font, raw }].
 * opts: { bold, italic, color, size, font, align, spacingBefore, spacingAfter,
 *         line, tabs:[{ pos, val }], indent:{ left, right, firstLine, hanging },
 *         borders:{ top, bottom, ... }, keepNext, contextualSpacing }
 */
export function para(text, opts = {}) {
  const {
    bold = false, italic = false, size = 22, align = 'left', color, font,
    spacingBefore = 0, spacingAfter = 60, line,
    tabs, indent, borders, keepNext = false,
  } = opts;

  const defaults = { bold, italic, size, color, font };
  const runs = Array.isArray(text)
    ? text.map((r) => runXml(r, defaults)).join('')
    : runXml({ text }, defaults);

  const pPr =
    (keepNext ? '<w:keepNext/>' : '') +
    (tabs?.length ? `<w:tabs>${tabs.map((t) => `<w:tab w:val="${t.val || 'left'}" w:pos="${t.pos}"/>`).join('')}</w:tabs>` : '') +
    borderXml('w:pBdr', borders) +
    // Schema order inside pPr puts spacing before ind, and both before jc.
    `<w:spacing w:before="${spacingBefore}" w:after="${spacingAfter}"${line ? ` w:line="${line}" w:lineRule="auto"` : ''}/>` +
    (indent ? `<w:ind${indent.left != null ? ` w:left="${indent.left}"` : ''}${indent.right != null ? ` w:right="${indent.right}"` : ''}${indent.firstLine != null ? ` w:firstLine="${indent.firstLine}"` : ''}${indent.hanging != null ? ` w:hanging="${indent.hanging}"` : ''}/>` : '') +
    `<w:jc w:val="${align}"/>` +
    (font || size !== 22 ? `<w:rPr>${font ? `<w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}"/>` : ''}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr>` : '');

  return `<w:p><w:pPr>${pPr}</w:pPr>${runs}</w:p>`;
}

export function spacer() { return '<w:p><w:pPr><w:spacing w:after="0"/></w:pPr></w:p>'; }
export function pageBreak() { return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'; }

/** A field run, e.g. field('PAGE') or field('NUMPAGES'). Use inside `para`. */
export function field(instruction) {
  return {
    raw: '<w:fldChar w:fldCharType="begin"/></w:r>' +
      `<w:r><w:instrText xml:space="preserve"> ${instruction} </w:instrText></w:r>` +
      '<w:r><w:fldChar w:fldCharType="separate"/></w:r>' +
      '<w:r><w:t>1</w:t></w:r>' +
      '<w:r><w:fldChar w:fldCharType="end"/>',
  };
}

// Inline image paragraph. `relId` must match an image relationship passed to
// createDocxBlob; cx/cy are the display size in EMU (1 inch = 914400, 1 mm = 36000).
// `indent` may be negative, to let a banner run wider than the text column.
export function image(relId, { cx, cy, align = 'center', name = 'Image', spacingAfter = 40, indent } = {}) {
  const ind = indent
    ? `<w:ind${indent.left != null ? ` w:left="${indent.left}"` : ''}${indent.right != null ? ` w:right="${indent.right}"` : ''}/>`
    : '';
  return `<w:p><w:pPr><w:spacing w:after="${spacingAfter}"/>${ind}<w:jc w:val="${align}"/></w:pPr>` +
    `${imageRun(relId, { cx, cy, name })}</w:p>`;
}

/** The same picture as a run, for dropping inside a paragraph or table cell. */
export function imageRun(relId, { cx, cy, name = 'Image' } = {}) {
  const id = nextDrawingId();
  return `<w:r><w:drawing>` +
    `<wp:inline distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="${escapeXml(name)} ${id}"/>` +
    `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic>` +
    `<pic:nvPicPr><pic:cNvPr id="${id}" name="${escapeXml(name)} ${id}"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="${relId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
    `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
}

/**
 * A picture centred behind the page, the way Word's own watermark sits.
 * Belongs in a header so it repeats on every page.
 *
 * The image is drawn as-is: Word's washout lives in VML attributes that other
 * readers ignore, so a watermark should arrive already faded.
 */
export function watermark(relId, { widthPt = 372, heightPt = 372, title = 'Watermark' } = {}) {
  const id = nextDrawingId();
  // Anchored to the page, not the margins, so it stays centred on the sheet
  // however much room the header and footer are given. The paragraph itself is
  // 1pt so it adds no height to the header.
  return '<w:p><w:pPr><w:spacing w:after="0"/><w:rPr><w:sz w:val="2"/></w:rPr></w:pPr>' +
    '<w:r><w:rPr><w:sz w:val="2"/></w:rPr><w:pict>' +
    `<v:shape id="Watermark${id}" o:spid="_x0000_s${id}" type="#_x0000_t75" ` +
    `style="position:absolute;margin-left:0;margin-top:0;width:${widthPt}pt;height:${heightPt}pt;` +
    'z-index:-251657728;mso-position-horizontal:center;mso-position-horizontal-relative:page;' +
    'mso-position-vertical:center;mso-position-vertical-relative:page" o:allowincell="f">' +
    `<v:imagedata r:id="${relId}" o:title="${escapeXml(title)}"/>` +
    '<w10:wrap anchorx="page" anchory="page"/>' +
    '</v:shape></w:pict></w:r></w:p>';
}

/** The VML shape definition a watermark's `type="#_x0000_t75"` refers to. */
const VML_SHAPETYPE =
  '<w:p><w:pPr><w:spacing w:after="0"/><w:rPr><w:sz w:val="2"/></w:rPr></w:pPr><w:r><w:pict>' +
  '<v:shapetype id="_x0000_t75" coordsize="21600,21600" o:spt="75" o:preferrelative="t" ' +
  'path="m@4@5l@4@11@9@11@9@5xe" filled="f" stroked="f">' +
  '<v:stroke joinstyle="miter"/><v:formulas>' +
  '<v:f eqn="if lineDrawn pixelLineWidth 0"/><v:f eqn="sum @0 1 0"/><v:f eqn="sum 0 0 @1"/>' +
  '<v:f eqn="prod @2 1 2"/><v:f eqn="prod @3 21600 pixelWidth"/><v:f eqn="prod @3 21600 pixelHeight"/>' +
  '<v:f eqn="sum @0 0 1"/><v:f eqn="prod @6 1 2"/><v:f eqn="prod @7 21600 pixelWidth"/>' +
  '<v:f eqn="sum @8 21600 0"/><v:f eqn="prod @7 21600 pixelHeight"/><v:f eqn="sum @10 21600 0"/>' +
  '</v:formulas><v:path o:extrusionok="f" gradientshapeok="t" o:connecttype="rect"/>' +
  '<o:lock v:ext="edit" aspectratio="t"/></v:shapetype>' +
  '</w:pict></w:r></w:p>';

/**
 * A table cell.
 * cell: string | { text, content, bold, italic, underline, color, fill, align,
 *                  size, font, span, borders, vAlign, margins, noWrap }
 * `content` drops in raw paragraph XML; `span` is a horizontal gridSpan.
 */
function cellXml(cell, defaults, colWidth) {
  const c = typeof cell === 'object' && cell !== null ? cell : { text: cell };
  const {
    text = '', bold = false, italic = false, underline = false, caps = false,
    color, fill, align = 'left', size, font, content, span, borders,
    vAlign = 'center', margins, noWrap = false, vMerge, keepNext = false,
  } = c;

  const sz = size || defaults.size;
  const width = colWidth ? `<w:tcW w:w="${colWidth}" w:type="dxa"/>` : '';
  const shd = fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>` : '';
  const m = { ...defaults.margins, ...margins };

  const paragraph = content || para(
    [{ text, bold, italic, underline, caps, color, size: sz, font: font || defaults.font }],
    { align, spacingAfter: 0, spacingBefore: 0, size: sz, font: font || defaults.font, keepNext }
  );

  // A bordered table leaves its cells alone; a borderless one pins every cell
  // to "nil" so an opted-in cell is the only thing that draws a rule.
  const cellBorders = borders ?? defaults.cellBorders;

  return '<w:tc><w:tcPr>' + width +
    (span > 1 ? `<w:gridSpan w:val="${span}"/>` : '') +
    // 'restart' opens a vertical merge, 'continue' extends it down a row.
    (vMerge ? `<w:vMerge${vMerge === 'restart' ? ' w:val="restart"' : ''}/>` : '') +
    (cellBorders ? borderXml('w:tcBorders', cellBorders, { fillNil: true }) : '') +
    shd +
    (noWrap ? '<w:noWrap/>' : '') +
    `<w:vAlign w:val="${vAlign}"/>` +
    `<w:tcMar><w:top w:w="${m.top}" w:type="dxa"/><w:bottom w:w="${m.bottom}" w:type="dxa"/>` +
    `<w:left w:w="${m.left}" w:type="dxa"/><w:right w:w="${m.right}" w:type="dxa"/></w:tcMar>` +
    '</w:tcPr>' + paragraph + '</w:tc>';
}

/**
 * rows: array of arrays of cells, or { cells, height, cantSplit, header }.
 * opts: { widths:[twips], fontSize, font, borders, borderColor, borderSize,
 *         vMargin, hMargin, keepRows, indent, align }
 */
export function table(rows, opts = {}) {
  const {
    widths = null, fontSize = 18, font, borders = true, borderColor = '000000',
    borderSize = 4, vMargin = 20, hMargin = 60, keepRows = false, indent, align,
  } = opts;

  const totalW = widths ? widths.reduce((a, b) => a + b, 0) : 0;
  const grid = widths ? `<w:tblGrid>${widths.map((w) => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>` : '';
  const tblBorders = borders
    ? `<w:tblBorders>${['top', 'left', 'bottom', 'right', 'insideH', 'insideV']
        .map((s) => `<w:${s} w:val="single" w:sz="${borderSize}" w:space="0" w:color="${borderColor}"/>`)
        .join('')}</w:tblBorders>`
    : `<w:tblBorders>${['top', 'left', 'bottom', 'right', 'insideH', 'insideV']
        .map((s) => `<w:${s} w:val="none" w:sz="0" w:space="0" w:color="auto"/>`)
        .join('')}</w:tblBorders>`;

  const tblPr = '<w:tblPr>' +
    (totalW ? `<w:tblW w:w="${totalW}" w:type="dxa"/>` : '<w:tblW w:w="0" w:type="auto"/>') +
    (align ? `<w:jc w:val="${align}"/>` : '') +
    (indent != null ? `<w:tblInd w:w="${indent}" w:type="dxa"/>` : '') +
    tblBorders +
    `<w:tblLayout w:type="${widths ? 'fixed' : 'autofit'}"/>` +
    '</w:tblPr>';

  const defaults = {
    size: fontSize,
    font,
    margins: { top: vMargin, bottom: vMargin, left: hMargin, right: hMargin },
    cellBorders: borders ? null : {},
  };

  const trs = rows
    .map((row) => {
      const cells = Array.isArray(row) ? row : row.cells;
      const cantSplit = (Array.isArray(row) ? keepRows : row.cantSplit ?? keepRows);
      const height = Array.isArray(row) ? null : row.height;
      const repeat = !Array.isArray(row) && row.header;
      const trPr = (cantSplit || height || repeat)
        ? `<w:trPr>${repeat ? '<w:tblHeader/>' : ''}${cantSplit ? '<w:cantSplit/>' : ''}${height ? `<w:trHeight w:val="${height}" w:hRule="atLeast"/>` : ''}</w:trPr>`
        : '';

      // gridSpan means a row holds fewer cells than the grid has columns, so
      // walk the grid as we go rather than indexing by cell position.
      let col = 0;
      const tcs = cells.map((cell) => {
        const span = (typeof cell === 'object' && cell?.span) || 1;
        const w = widths ? widths.slice(col, col + span).reduce((a, b) => a + b, 0) : null;
        col += span;
        return cellXml(cell, defaults, w);
      }).join('');

      return `<w:tr>${trPr}${tcs}</w:tr>`;
    })
    .join('');

  return `<w:tbl>${tblPr}${grid}${trs}</w:tbl>`;
}

// ─── Document assembly ──────────────────────────────────────────────────────

const PAPER = {
  legal: [12240, 20160],
  letter: [12240, 15840],
  a4: [11906, 16838],
  // Philippine long bond / folio: 8.5in x 13in.
  folio: [12240, 18720],
  long: [12240, 18720],
};

const NS = [
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"',
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"',
  'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"',
  'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"',
  'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"',
  'xmlns:v="urn:schemas-microsoft-com:vml"',
  'xmlns:o="urn:schemas-microsoft-com:office:office"',
  'xmlns:w10="urn:schemas-microsoft-com:office:word"',
].join(' ');

const REL_IMAGE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image';
const REL_HEADER = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/header';
const REL_FOOTER = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer';

/** Declares only the images a part actually references. */
function relsFor(xml, images, extra = []) {
  const used = images.filter((img) => xml.includes(`"${img.id}"`));
  const rows = [
    ...used.map((img) => `<Relationship Id="${img.id}" Type="${REL_IMAGE}" Target="media/${img.name}"/>`),
    ...extra.map((e) => `<Relationship Id="${e.id}" Type="${e.type}" Target="${e.target}"/>`),
  ].join('');
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rows}</Relationships>`;
}

/**
 * Builds a .docx.
 *
 * images:  [{ id, name, ext, data:Uint8Array }] — one shared pool; every part
 *          that mentions an id gets the relationship, and the bytes are
 *          written once.
 * headers: { first, default, even } — raw block XML (paragraphs/tables).
 * footers: { first, default, even } — likewise.
 * A watermark goes in a header; pass `shapeType: true` on the first header
 * that uses one.
 */
export function createDocxBlob(childrenXml, {
  landscape = false,
  paper = 'letter',
  images = [],
  headers = null,
  footers = null,
  margins = {},
  defaultFont = null,
} = {}) {
  const [w, h] = PAPER[paper] || PAPER.letter;
  const pgSz = landscape
    ? `<w:pgSz w:w="${h}" w:h="${w}" w:orient="landscape"/>`
    : `<w:pgSz w:w="${w}" w:h="${h}"/>`;

  const m = { top: 720, right: 720, bottom: 720, left: 720, header: 360, footer: 360, ...margins };

  // Header/footer parts, numbered in the order Word expects to find them.
  const parts = [];           // { file, kind, xml, relId, type }
  let relSeq = 100;
  const addPart = (kind, type, xml) => {
    if (!xml) return null;
    const index = parts.filter((p) => p.kind === kind).length + 1;
    const entry = {
      kind,
      type,
      file: `${kind}${index}.xml`,
      xml,
      relId: `rId${++relSeq}`,
    };
    parts.push(entry);
    return entry;
  };

  for (const type of ['first', 'default', 'even']) {
    addPart('header', type, headers?.[type]);
    addPart('footer', type, footers?.[type]);
  }

  const references = parts
    .map((p) => `<w:${p.kind}Reference w:type="${p.type}" r:id="${p.relId}"/>`)
    .join('');

  const sectPr = `<w:sectPr>${references}${pgSz}` +
    `<w:pgMar w:top="${m.top}" w:right="${m.right}" w:bottom="${m.bottom}" w:left="${m.left}" ` +
    `w:header="${m.header}" w:footer="${m.footer}" w:gutter="0"/>` +
    (headers?.first || footers?.first ? '<w:titlePg/>' : '') +
    '</w:sectPr>';

  const documentXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    `<w:document ${NS}><w:body>${childrenXml}${sectPr}</w:body></w:document>`;

  const imgExts = [...new Set(images.map((i) => i.ext))];
  const imageDefaults = imgExts
    .map((ext) => `<Default Extension="${ext}" ContentType="image/${ext === 'jpg' ? 'jpeg' : ext}"/>`)
    .join('');

  const contentTypes =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    imageDefaults +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    (defaultFont ? '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' : '') +
    parts
      .map((p) => `<Override PartName="/word/${p.file}" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.${p.kind}+xml"/>`)
      .join('') +
    '</Types>';

  const rootRels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    '</Relationships>';

  const files = [
    { name: '[Content_Types].xml', data: contentTypes },
    { name: '_rels/.rels', data: rootRels },
    { name: 'word/document.xml', data: documentXml },
  ];

  if (defaultFont) {
    files.push({ name: 'word/styles.xml', data: stylesXml(defaultFont) });
  }

  const docExtra = [
    ...parts.map((p) => ({
      id: p.relId,
      type: p.kind === 'header' ? REL_HEADER : REL_FOOTER,
      target: p.file,
    })),
    ...(defaultFont ? [{
      id: `rId${++relSeq}`,
      type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles',
      target: 'styles.xml',
    }] : []),
  ];

  files.push({ name: 'word/_rels/document.xml.rels', data: relsFor(documentXml, images, docExtra) });

  for (const p of parts) {
    const partXml =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      `<w:${p.kind === 'header' ? 'hdr' : 'ftr'} ${NS}>` +
      (p.xml.includes('<w:pict>') ? VML_SHAPETYPE : '') +
      `${p.xml}</w:${p.kind === 'header' ? 'hdr' : 'ftr'}>`;
    files.push({ name: `word/${p.file}`, data: partXml });
    files.push({ name: `word/_rels/${p.file}.rels`, data: relsFor(partXml, images) });
  }

  images.forEach((i) => files.push({ name: `word/media/${i.name}`, data: i.data }));

  return new Blob([zipStore(files)], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

/** Minimal styles part, just to set the document-wide font. */
function stylesXml(font) {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    `<w:styles ${NS}><w:docDefaults><w:rPrDefault><w:rPr>` +
    `<w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:eastAsia="${font}" w:cs="${font}"/>` +
    '</w:rPr></w:rPrDefault>' +
    '<w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault>' +
    '</w:docDefaults></w:styles>';
}
