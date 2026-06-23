
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

// A paragraph. `text` may be a string, or an array of runs [{ text, bold, color, size }].
export function para(text, opts = {}) {
  const { bold = false, italic = false, size = 22, align = 'left', color, spacingBefore = 0, spacingAfter = 60 } = opts;
  const runProps = (r) =>
    `<w:rPr>${r.bold ? '<w:b/>' : ''}${r.italic ? '<w:i/>' : ''}<w:sz w:val="${r.size || size}"/><w:szCs w:val="${r.size || size}"/>${r.color ? `<w:color w:val="${r.color}"/>` : ''}</w:rPr>`;
  const runs = Array.isArray(text)
    ? text.map((r) => `<w:r>${runProps(r)}<w:t xml:space="preserve">${escapeXml(r.text)}</w:t></w:r>`).join('')
    : `<w:r>${runProps({ bold, italic, size, color })}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
  const spacing = `<w:spacing w:before="${spacingBefore}" w:after="${spacingAfter}"/>`;
  return `<w:p><w:pPr>${spacing}<w:jc w:val="${align}"/></w:pPr>${runs}</w:p>`;
}

export function spacer() { return '<w:p><w:pPr><w:spacing w:after="0"/></w:pPr></w:p>'; }
export function pageBreak() { return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'; }

// Inline image paragraph. `relId` must match an image relationship passed to
// createDocxBlob; cx/cy are the display size in EMU (1 inch = 914400, 1 mm = 36000).
export function image(relId, { cx, cy, align = 'center', name = 'Image' } = {}) {
  return `<w:p><w:pPr><w:spacing w:after="40"/><w:jc w:val="${align}"/></w:pPr><w:r><w:drawing>` +
    `<wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">` +
    `<wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="1" name="${name}"/>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
    `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:nvPicPr><pic:cNvPr id="1" name="${name}"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="${relId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
    `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

function cellXml(cell, defaultSize, colWidth, vMargin = 20) {
  const c = typeof cell === 'object' && cell !== null ? cell : { text: cell };
  const { text = '', bold = false, italic = false, color, fill, align = 'left', size, content } = c;
  const sz = size || defaultSize;
  const w = colWidth ? `<w:tcW w:w="${colWidth}" w:type="dxa"/>` : '';
  const shd = fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>` : '';
  const rPr = `<w:rPr>${bold ? '<w:b/>' : ''}${italic ? '<w:i/>' : ''}<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>${color ? `<w:color w:val="${color}"/>` : ''}</w:rPr>`;
  // `content` lets a caller drop in raw paragraph XML (e.g. multi-line signature blocks).
  const body = content || `<w:p><w:pPr><w:spacing w:after="0"/><w:jc w:val="${align}"/></w:pPr><w:r>${rPr}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
  return `<w:tc><w:tcPr>${w}${shd}<w:vAlign w:val="center"/><w:tcMar><w:top w:w="${vMargin}" w:type="dxa"/><w:bottom w:w="${vMargin}" w:type="dxa"/><w:left w:w="60" w:type="dxa"/><w:right w:w="60" w:type="dxa"/></w:tcMar></w:tcPr>${body}</w:tc>`;
}

// rows: array of arrays of cells (string | { text, bold, color, fill, align, size }).
// opts: { widths:[twips], fontSize, borders, borderColor, borderSize, vMargin, keepRows }
export function table(rows, opts = {}) {
  const { widths = null, fontSize = 18, borders = true, borderColor = '000000', borderSize = 4, vMargin = 20, keepRows = false } = opts;
  const totalW = widths ? widths.reduce((a, b) => a + b, 0) : 0;
  const grid = widths ? `<w:tblGrid>${widths.map((w) => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>` : '';
  const borderXml = borders
    ? `<w:tblBorders>${['top', 'left', 'bottom', 'right', 'insideH', 'insideV']
        .map((s) => `<w:${s} w:val="single" w:sz="${borderSize}" w:space="0" w:color="${borderColor}"/>`)
        .join('')}</w:tblBorders>`
    : '';
  const tblPr = `<w:tblPr>${totalW ? `<w:tblW w:w="${totalW}" w:type="dxa"/>` : '<w:tblW w:w="0" w:type="auto"/>'}${borderXml}<w:tblLayout w:type="${widths ? 'fixed' : 'autofit'}"/></w:tblPr>`;
  const trPr = keepRows ? '<w:trPr><w:cantSplit/></w:trPr>' : '';
  const trs = rows
    .map((cells) => `<w:tr>${trPr}${cells.map((cell, i) => cellXml(cell, fontSize, widths ? widths[i] : null, vMargin)).join('')}</w:tr>`)
    .join('');
  return `<w:tbl>${tblPr}${grid}${trs}</w:tbl>`;
}

// ─── Document assembly ──────────────────────────────────────────────────────
const PAPER = { legal: [12240, 20160], letter: [12240, 15840], a4: [11906, 16838] };

// images: [{ id, name, ext, data:Uint8Array }] — `id` is the r:embed relationship id
// used by image(); `name` is the file name placed under word/media/.
export function createDocxBlob(childrenXml, { landscape = false, paper = 'letter', images = [] } = {}) {
  const [w, h] = PAPER[paper] || PAPER.letter;
  const pgSz = landscape
    ? `<w:pgSz w:w="${h}" w:h="${w}" w:orient="landscape"/>`
    : `<w:pgSz w:w="${w}" w:h="${h}"/>`;
  const sectPr = `<w:sectPr>${pgSz}<w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="360" w:footer="360" w:gutter="0"/></w:sectPr>`;

  const documentXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<w:body>${childrenXml}${sectPr}</w:body></w:document>`;

  const imgExts = [...new Set(images.map((i) => i.ext))];
  const imageDefaults = imgExts
    .map((ext) => `<Default Extension="${ext}" ContentType="image/${ext === 'jpg' ? 'jpeg' : ext}"/>`)
    .join('');

  const contentTypes =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    imageDefaults +
    `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
    `</Types>`;

  const rels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>` +
    `</Relationships>`;

  const files = [
    { name: '[Content_Types].xml', data: contentTypes },
    { name: '_rels/.rels', data: rels },
    { name: 'word/document.xml', data: documentXml },
  ];

  if (images.length) {
    const docRels =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      images
        .map((i) => `<Relationship Id="${i.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${i.name}"/>`)
        .join('') +
      `</Relationships>`;
    files.push({ name: 'word/_rels/document.xml.rels', data: docRels });
    images.forEach((i) => files.push({ name: `word/media/${i.name}`, data: i.data }));
  }

  const zipped = zipStore(files);

  return new Blob([zipped], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}
