import {
  DasarItem,
  formatJabatanWithoutSuffix,
  PersonelRow,
  SprinData,
  TembusanItem,
  UntukItem,
} from '../types/sprin';

export interface DasarChunk {
  includePointOne: boolean;
  startIndex: number;
  rows: DasarItem[];
  showLabel: boolean;
}

export interface KepadaChunk {
  startIndex: number;
  rows: PersonelRow[];
  showLabel: boolean;
}

export interface UntukChunk {
  startIndex: number;
  rows: UntukItem[];
  showLabel: boolean;
}

export interface TembusanChunk {
  startIndex: number;
  rows: TembusanItem[];
  showLabel: boolean;
}

export interface PagePlan {
  type: 'main' | 'cont';
  pageNumber: number;
  includeHeader?: boolean;
  dasarChunk?: DasarChunk;
  includeDiperintahkan?: boolean;
  kepadaChunk?: KepadaChunk;
  untukChunk?: UntukChunk;
  includeSignature?: boolean;
  tembusanChunk?: TembusanChunk;
}

// Dimensi kertas A4 & margin persis sesuai .a4-sheet (padding: 12mm 14mm 18mm 24mm)
const PAGE_HEIGHT_MM = 297;
const MARGIN_TOP_MM = 12;
const MARGIN_BOTTOM_MM = 18;
// Batas bawah aman sebelum menyentuh margin bawah 18mm (297 - 18 = 279mm)
const BOTTOM_LIMIT_MM = PAGE_HEIGHT_MM - MARGIN_BOTTOM_MM - 0.5; // 278.5mm

const LINE_H_MM = 5.08;
const LINE_H_KEPADA_MM = 4.95;

// Tinggi blok tetap halaman 1 & halaman lanjutan (mm)
const KOP_AND_TITLE_H_MM = 47.2; // Kop + Tribrata + SURAT PERINTAH + Nomor
const CONT_HEADER_H_MM = 25.0; // Nomor halaman + kotak SPRIN kanan atas + jarak bawah

const STATIC_DASAR_1_TEXT =
  'Undang-undang (UU) Nomor 5 Tahun 2026 tentang Perubahan Ketiga atas Undang-Undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia;';

let cachedMeasureCtx: CanvasRenderingContext2D | null | undefined;

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (cachedMeasureCtx !== undefined) return cachedMeasureCtx;
  if (typeof document === 'undefined') {
    cachedMeasureCtx = null;
    return null;
  }
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.font = '12pt Arial, Helvetica, sans-serif';
  }
  cachedMeasureCtx = ctx;
  return ctx;
}

/**
 * Mengukur jumlah baris teks Arial 12pt pada lebar tertentu (mm).
 */
export function countWrappedLines(text: string, maxWidthMm: number): number {
  const clean = text || '';
  if (!clean.trim()) return 1;

  const ctx = getMeasureContext();
  // 1mm = 96 / 25.4 px pada CSS 96dpi
  const maxPx = maxWidthMm * (96 / 25.4);
  const paragraphs = clean.split(/\r?\n/);
  let totalLines = 0;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      totalLines += 1;
      continue;
    }

    if (!ctx) {
      // Fallback estimasi karakter per baris saat non-DOM
      const charsPerLine = Math.max(12, Math.floor(maxWidthMm / 2.22));
      totalLines += Math.max(1, Math.ceil(trimmed.length / charsPerLine));
      continue;
    }

    const words = trimmed.split(/\s+/);
    let currentLine = '';
    let paraLines = 0;

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxPx) {
        currentLine = candidate;
      } else {
        if (currentLine) {
          paraLines += 1;
          currentLine = word;
        } else {
          // Satu kata super panjang melebihi lebar kolom
          const wordW = ctx.measureText(word).width;
          paraLines += Math.max(1, Math.ceil(wordW / maxPx));
          currentLine = '';
        }
      }
    }

    if (currentLine) {
      paraLines += 1;
    }

    totalLines += Math.max(1, paraLines);
  }

  return Math.max(1, totalLines);
}

function measurePersonelRowHeightMm(row: PersonelRow): number {
  const pangkat = row.pangkat || '[PANGKAT]';
  const nama = row.nama || '[NAMA PERSONEL]';
  const nrp = row.nrp || '[NRP]';
  const line1Text = `${pangkat}  ${nama}   NRP   ${nrp}`;

  const cleanJabatan = formatJabatanWithoutSuffix(row.jabatan) || '[JABATAN]';
  const line2Text = `${cleanJabatan} POLSEK SMG SELATAN`;

  const lines1 = countWrappedLines(line1Text, 132);
  const lines2 = countWrappedLines(line2Text, 132);

  return lines1 * LINE_H_KEPADA_MM + 0.5 + 0.4 + lines2 * LINE_H_KEPADA_MM;
}

/**
 * Rencana pembagian halaman A4 berbasis batas margin bawah (18mm dari bawah = 278.5mm):
 * - Teks / baris yang belum menyentuh margin bawah tetap berada di halaman 1 (atau halaman berjalan).
 * - Teks / blok yang akan menyentuh atau melewati margin bawah otomatis turun ke halaman berikutnya.
 * Dipakai bersama 1:1 oleh Pratinjau (A4Document), Ekspor PDF (pdfExport), dan Ekspor Word (docxExport).
 */
export function buildDocumentPages(data: SprinData): PagePlan[] {
  const pages: PagePlan[] = [];

  let currentPage: PagePlan = {
    type: 'main',
    pageNumber: 1,
    includeHeader: true,
  };
  let y = MARGIN_TOP_MM + KOP_AND_TITLE_H_MM;

  const startNextPage = () => {
    pages.push(currentPage);
    currentPage = {
      type: 'cont',
      pageNumber: pages.length + 1,
      includeHeader: false,
    };
    y = MARGIN_TOP_MM + CONT_HEADER_H_MM;
  };

  // 1. Pertimbangan (lebar kolom isi 139mm)
  const pertLines = countWrappedLines(data.pertimbangan, 139);
  y += 4.0 + pertLines * LINE_H_MM;

  // 2. Dasar (Poin 1 tetap + dasarPoin[0..n], lebar teks 133mm)
  const dasar1H = countWrappedLines(STATIC_DASAR_1_TEXT, 133) * LINE_H_MM;
  const dasarTopGap = 3.5;

  if (y + dasarTopGap + dasar1H > BOTTOM_LIMIT_MM) {
    startNextPage();
  } else {
    y += dasarTopGap;
  }

  currentPage.dasarChunk = {
    includePointOne: true,
    startIndex: 0,
    rows: [],
    showLabel: true,
  };
  y += dasar1H;

  data.dasarPoin.forEach((item, idx) => {
    const itemLines = countWrappedLines(
      item.text || `Dasar poin ${idx + 2}`,
      133
    );
    const itemH = itemLines * LINE_H_MM;
    const gapBefore = currentPage.dasarChunk ? 2.6 : 0;

    if (y + gapBefore + itemH > BOTTOM_LIMIT_MM) {
      startNextPage();
      currentPage.dasarChunk = {
        includePointOne: false,
        startIndex: idx,
        rows: [item],
        showLabel: false,
      };
      y += itemH;
    } else {
      if (!currentPage.dasarChunk) {
        currentPage.dasarChunk = {
          includePointOne: false,
          startIndex: idx,
          rows: [],
          showLabel: false,
        };
      }
      currentPage.dasarChunk.rows.push(item);
      y += gapBefore + itemH;
    }
  });

  // 3. DIPERINTAHKAN + Kepada
  const diperintahkanH = 5.5 + LINE_H_MM + 4.0;
  const firstPersonelH =
    data.personel.length > 0 ? measurePersonelRowHeightMm(data.personel[0]) : 0;

  // Pastikan judul DIPERINTAHKAN tidak yatim di bawah halaman jika baris 1 Kepada langsung turun
  if (y + diperintahkanH + firstPersonelH > BOTTOM_LIMIT_MM) {
    startNextPage();
  }

  currentPage.includeDiperintahkan = true;
  y += diperintahkanH;

  let kepadaLabelShown = false;
  data.personel.forEach((person, idx) => {
    const rowH = measurePersonelRowHeightMm(person);
    const gapBefore = currentPage.kepadaChunk ? 1.8 : 0;

    if (y + gapBefore + rowH > BOTTOM_LIMIT_MM) {
      startNextPage();
      currentPage.kepadaChunk = {
        startIndex: idx,
        rows: [person],
        showLabel: !kepadaLabelShown,
      };
      kepadaLabelShown = true;
      y += rowH;
    } else {
      if (!currentPage.kepadaChunk) {
        currentPage.kepadaChunk = {
          startIndex: idx,
          rows: [],
          showLabel: !kepadaLabelShown,
        };
        kepadaLabelShown = true;
      }
      currentPage.kepadaChunk.rows.push(person);
      y += gapBefore + rowH;
    }
  });

  // 4. Untuk (lebar teks 132mm)
  let untukLabelShown = false;
  data.untukPoin.forEach((item, idx) => {
    const itemLines = countWrappedLines(
      item.text || `Untuk poin ${idx + 1}`,
      132
    );
    const itemH = itemLines * LINE_H_MM;
    const isStartOfSection = !untukLabelShown;
    const gapBefore = currentPage.untukChunk
      ? 1.8
      : isStartOfSection &&
          (currentPage.includeHeader ||
            currentPage.dasarChunk ||
            currentPage.kepadaChunk)
        ? 3.5
        : 0;

    if (y + gapBefore + itemH > BOTTOM_LIMIT_MM) {
      startNextPage();
      currentPage.untukChunk = {
        startIndex: idx,
        rows: [item],
        showLabel: !untukLabelShown,
      };
      untukLabelShown = true;
      y += itemH;
    } else {
      if (!currentPage.untukChunk) {
        currentPage.untukChunk = {
          startIndex: idx,
          rows: [],
          showLabel: !untukLabelShown,
        };
        untukLabelShown = true;
      }
      currentPage.untukChunk.rows.push(item);
      y += gapBefore + itemH;
    }
  });

  // 5. Selesai. + Blok Tanda Tangan & Stempel (jarak 4 baris = 21mm antara KAPOLSEK dan Nama Pejabat)
  const isCompactSig = currentPage.type === 'main';
  const closingBlockH = isCompactSig ? 57.2 : 58.2;

  if (y + closingBlockH > BOTTOM_LIMIT_MM) {
    startNextPage();
  }

  currentPage.includeSignature = true;
  y += currentPage.type === 'main' ? 57.2 : 58.2;

  // 6. Tembusan (opsional)
  if (data.tembusan.length > 0) {
    const tembTopGap = currentPage.type === 'main' ? 3.0 : 8.0;
    const tembTitleH = 6.2;
    let tembLabelShown = false;

    data.tembusan.forEach((t, idx) => {
      const lineH =
        countWrappedLines(t.text || 'Tujuan tembusan', 166) * LINE_H_MM;
      const neededBefore = !tembLabelShown
        ? tembTopGap + tembTitleH
        : currentPage.tembusanChunk
          ? 0.5
          : tembTitleH;

      if (y + neededBefore + lineH + 1.5 > BOTTOM_LIMIT_MM) {
        startNextPage();
        currentPage.tembusanChunk = {
          startIndex: idx,
          rows: [t],
          showLabel: !tembLabelShown,
        };
        tembLabelShown = true;
        y += tembTitleH + lineH;
      } else {
        if (!currentPage.tembusanChunk) {
          currentPage.tembusanChunk = {
            startIndex: idx,
            rows: [],
            showLabel: !tembLabelShown,
          };
          y += (!tembLabelShown ? tembTopGap : 0) + tembTitleH;
          tembLabelShown = true;
        } else {
          y += 0.5;
        }
        currentPage.tembusanChunk.rows.push(t);
        y += lineH;
      }
    });
  }

  pages.push(currentPage);
  return pages;
}

export function getTotalPages(data: SprinData): number {
  return buildDocumentPages(data).length;
}
