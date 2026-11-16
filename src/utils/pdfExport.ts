import { jsPDF } from 'jspdf';
import { formatJabatanWithoutSuffix, SprinData } from '../types/sprin';
import {
  buildDocumentPages,
  DasarChunk,
  KepadaChunk,
  TembusanChunk,
  UntukChunk,
} from './pagination';
import { compositeSignatureAndStampPng } from './stampAssets';

const PAGE_W = 210;
const MARGIN_LEFT = 24;
const MARGIN_RIGHT = 14;
const MARGIN_TOP = 12;

const LABEL_W = 28;
const COLON_W = 5;
const VALUE_X = MARGIN_LEFT + LABEL_W + COLON_W; // 57mm
const VALUE_W = PAGE_W - MARGIN_RIGHT - VALUE_X; // 139mm

const LINE_H = 5.08;

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function setColor(doc: jsPDF, rgb: [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function drawContinuationHeader(
  doc: jsPDF,
  pageNumber: number,
  nomorHeader: string,
  bulanTahunHeader: string,
  fillRgb: [number, number, number]
): number {
  let y = MARGIN_TOP + 3.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  setColor(doc, [0, 0, 0]);
  doc.text(String(pageNumber), PAGE_W / 2, y, { align: 'center' });
  y += 5.5;

  const boxW = 82;
  const boxX = PAGE_W - MARGIN_RIGHT - boxW;

  doc.setFontSize(10.8);
  setColor(doc, [0, 0, 0]);
  doc.text('SPRIN  KAPOLSEK SEMARANG SELATAN', boxX, y);
  y += 4.5;

  doc.text('NOMOR', boxX, y);
  doc.text(':SPRIN/', boxX + 21, y);
  const prefixW = doc.getTextWidth(':SPRIN/ ');
  setColor(doc, fillRgb);
  doc.text(nomorHeader || '205/XI/HUK.6.6./2026', boxX + 21 + prefixW, y);
  y += 4.5;

  setColor(doc, [0, 0, 0]);
  doc.text('TANGGAL', boxX, y);
  doc.text(':', boxX + 21, y);
  const colonW = doc.getTextWidth(': ');
  setColor(doc, fillRgb);
  doc.text(bulanTahunHeader || 'NOVEMBER  2026', boxX + 21 + colonW, y);

  y += 1.4;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.32);
  doc.line(boxX, y, boxX + boxW, y);

  doc.setFontSize(12);
  setColor(doc, [0, 0, 0]);
  return y + 6.5;
}

function drawJustifiedOrWrapped(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxW: number,
  rgb: [number, number, number]
): number {
  const clean = text || '';
  if (!clean) return y + LINE_H;

  setColor(doc, rgb);
  const lines = doc.splitTextToSize(clean, maxW) as string[];
  lines.forEach((line, i) => {
    const isLast = i === lines.length - 1;
    if (!isLast && line.trim().includes(' ')) {
      const words = line.trim().split(/\s+/);
      if (words.length > 1) {
        const totalWordsW = words.reduce((sum, w) => sum + doc.getTextWidth(w), 0);
        const spaceW = (maxW - totalWordsW) / (words.length - 1);
        let curX = x;
        words.forEach((w, wIdx) => {
          doc.text(w, curX, y);
          curX += doc.getTextWidth(w) + (wIdx < words.length - 1 ? spaceW : 0);
        });
      } else {
        doc.text(line, x, y);
      }
    } else {
      doc.text(line, x, y);
    }
    y += LINE_H;
  });
  return y;
}

function drawDasarChunk(
  doc: jsPDF,
  chunk: DasarChunk,
  startY: number,
  fillRgb: [number, number, number]
): number {
  let y = startY;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);

  if (chunk.showLabel) {
    setColor(doc, [0, 0, 0]);
    doc.text('Dasar', MARGIN_LEFT, y);
    doc.text(':', MARGIN_LEFT + LABEL_W, y);
  }

  if (chunk.includePointOne) {
    setColor(doc, [0, 0, 0]);
    doc.text('1.', VALUE_X, y);
    y = drawJustifiedOrWrapped(
      doc,
      'Undang-undang (UU) Nomor 5 Tahun 2026 tentang Perubahan Ketiga atas Undang-Undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia;',
      VALUE_X + 6,
      y,
      VALUE_W - 6,
      [0, 0, 0]
    );
    y += 1.8;
  }

  chunk.rows.forEach((d, idx) => {
    const poinNo = chunk.startIndex + idx + 2;
    setColor(doc, fillRgb);
    doc.text(`${poinNo}.`, VALUE_X, y);
    y = drawJustifiedOrWrapped(
      doc,
      d.text,
      VALUE_X + 6,
      y,
      VALUE_W - 6,
      fillRgb
    );
    y += 1.8;
  });

  return y;
}

function drawKepadaChunk(
  doc: jsPDF,
  chunk: KepadaChunk,
  startY: number,
  fillRgb: [number, number, number]
): number {
  let y = startY;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);

  if (chunk.showLabel) {
    setColor(doc, [0, 0, 0]);
    doc.text('Kepada', MARGIN_LEFT, y);
    doc.text(':', MARGIN_LEFT + LABEL_W, y);
  }

  const numW = 7;
  const itemX = VALUE_X + numW;

  chunk.rows.forEach((person, idx) => {
    const rowNum = chunk.startIndex + idx + 1;
    setColor(doc, [0, 0, 0]);
    doc.text(`${rowNum}.`, VALUE_X, y);

    const pangkatText = person.pangkat || '[PANGKAT]';
    const namaText = person.nama || '[NAMA PERSONEL]';
    const nrpLabel = '   NRP   ';
    const nrpText = person.nrp || '[NRP]';

    let curX = itemX;
    setColor(doc, fillRgb);
    doc.text(pangkatText, curX, y);
    curX += doc.getTextWidth(pangkatText);

    curX += doc.getTextWidth('  ');

    doc.text(namaText, curX, y);
    curX += doc.getTextWidth(namaText);

    setColor(doc, [0, 0, 0]);
    doc.text(nrpLabel, curX, y);
    curX += doc.getTextWidth(nrpLabel);

    setColor(doc, fillRgb);
    doc.text(nrpText, curX, y);
    curX += doc.getTextWidth(nrpText);

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.32);
    doc.line(itemX, y + 0.9, curX, y + 0.9);

    y += 4.95;

    const cleanJabatan = formatJabatanWithoutSuffix(person.jabatan);
    const jabText = cleanJabatan || '[JABATAN]';
    setColor(doc, fillRgb);
    doc.text(jabText, itemX, y);
    const jabW = doc.getTextWidth(jabText);
    setColor(doc, [0, 0, 0]);
    doc.text(' POLSEK SMG SELATAN', itemX + jabW, y);

    y += 4.95 + 1.8;
  });

  return y;
}

function drawUntukChunk(
  doc: jsPDF,
  chunk: UntukChunk,
  startY: number,
  fillRgb: [number, number, number]
): number {
  let y = startY;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);

  if (chunk.showLabel) {
    setColor(doc, [0, 0, 0]);
    doc.text('Untuk', MARGIN_LEFT + 2.5, y);
    doc.text(':', MARGIN_LEFT + LABEL_W, y);
  }

  chunk.rows.forEach((u, idx) => {
    const poinNo = chunk.startIndex + idx + 1;
    setColor(doc, fillRgb);
    doc.text(`${poinNo}.`, VALUE_X, y);
    y = drawJustifiedOrWrapped(
      doc,
      u.text,
      VALUE_X + 7,
      y,
      VALUE_W - 7,
      fillRgb
    );
    y += 1.4;
  });

  return y;
}

function drawSignatureBlock(
  doc: jsPDF,
  data: SprinData,
  startY: number,
  compositePng: string | null,
  fillRgb: [number, number, number],
  compact: boolean
): number {
  let y = startY;
  const blockW = 108;
  const blockX = PAGE_W - MARGIN_RIGHT - blockW;
  const headerBoxX = blockX + 24;
  const headerBoxW = 76;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);

  setColor(doc, [0, 0, 0]);
  doc.text('Dikeluarkan di', headerBoxX, y);
  doc.text(':', headerBoxX + 30, y);
  setColor(doc, fillRgb);
  doc.text(data.dikeluarkanDi || 'Semarang', headerBoxX + 33, y);
  y += 4.8;

  setColor(doc, [0, 0, 0]);
  doc.text('Pada tanggal', headerBoxX, y);
  doc.text(':', headerBoxX + 30, y);
  setColor(doc, fillRgb);
  doc.text(data.tanggalTtdSurat || '', headerBoxX + 33, y);

  y += 1.2;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.32);
  doc.line(headerBoxX, y, headerBoxX + headerBoxW, y);

  y += 4.6;
  const centerX = blockX + blockW / 2;
  doc.setFontSize(11.2);
  setColor(doc, [0, 0, 0]);
  doc.text('KAPOLSEK SEMARANG SELATAN POLRESTABES SEMARANG', centerX, y, {
    align: 'center',
  });

  const sigAreaH = 21;
  if (compositePng) {
    // Dimensi kanvas 1120x520 -> area gambar tepat 112mm x 52mm (stempel 50mm x 50mm = 5 cm, TTD 3x)
    const imgW = 112;
    const imgH = 52;
    const imgX = centerX - imgW / 2;
    const imgY = y + 2 + (sigAreaH - imgH) / 2;
    doc.addImage(compositePng, 'PNG', imgX, imgY, imgW, imgH);
  }

  y += sigAreaH + 4.8;
  doc.setFontSize(12);
  setColor(doc, fillRgb);
  const namaPejabat = data.namaPejabat || '';
  doc.text(namaPejabat, centerX, y, { align: 'center' });
  const namaW = doc.getTextWidth(namaPejabat);
  if (namaW > 0) {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.32);
    doc.line(centerX - namaW / 2, y + 0.9, centerX + namaW / 2, y + 0.9);
  }

  y += 4.8;
  doc.text(data.pangkatNrpPejabat || '', centerX, y, { align: 'center' });
  return y + 4;
}

function drawTembusan(
  doc: jsPDF,
  chunk: TembusanChunk,
  startY: number,
  fillRgb: [number, number, number]
): void {
  if (chunk.rows.length === 0) return;
  let y = startY;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);

  if (chunk.showLabel) {
    setColor(doc, [0, 0, 0]);
    const title = 'Tembusan :';
    doc.text(title, MARGIN_LEFT, y);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.32);
    doc.line(MARGIN_LEFT, y + 0.8, MARGIN_LEFT + doc.getTextWidth(title), y + 0.8);
    y += 5.2;
  }

  let maxLineW = 78;
  chunk.rows.forEach((t, idx) => {
    const poinNo = chunk.startIndex + idx + 1;
    setColor(doc, fillRgb);
    doc.text(`${poinNo}.`, MARGIN_LEFT, y);
    const val = t.text || '';
    doc.text(val, MARGIN_LEFT + 6, y);
    maxLineW = Math.max(maxLineW, 6 + doc.getTextWidth(val));
    y += 5.0;
  });

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.32);
  doc.line(MARGIN_LEFT, y - 3.6, MARGIN_LEFT + maxLineW, y - 3.6);
}

export async function exportSprinToPdf(
  data: SprinData,
  printBlackMode: boolean
): Promise<void> {
  const fillRgb: [number, number, number] = printBlackMode
    ? [0, 0, 0]
    : [0, 128, 0];

  const [tribrataDataUrl, compositeStampTtd] = await Promise.all([
    fetchImageAsDataUrl('/assets/tribrata-emblem.png'),
    compositeSignatureAndStampPng(data.ttdImage, data.stempelImage),
  ]);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pages = buildDocumentPages(data);
  const nomorParts = data.nomorHeader.split('/');
  const nomorSuffix =
    nomorParts.length > 1
      ? `/ ${nomorParts.slice(1).join(' / ')}`
      : '/ XI / HUK.6.6./2026';

  pages.forEach((plan, pageIndex) => {
    if (pageIndex > 0) {
      doc.addPage('a4', 'portrait');
    }

    let y = MARGIN_TOP + 4;

    if (plan.type === 'cont') {
      y = drawContinuationHeader(
        doc,
        plan.pageNumber,
        data.nomorHeader,
        data.bulanTahunHeader,
        fillRgb
      );
    }

    if (plan.includeHeader) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      setColor(doc, [0, 0, 0]);
      const kopLines = [
        'POLRI DAERAH JAWA TENGAH',
        'RESOR KOTA BESAR SEMARANG',
        'SEKTOR SEMARANG SELATAN',
      ];
      const kopW = Math.max(...kopLines.map((l) => doc.getTextWidth(l))) + 2;
      const kopCenterX = MARGIN_LEFT + kopW / 2;
      kopLines.forEach((line) => {
        doc.text(line, kopCenterX, y, { align: 'center' });
        y += 4.6;
      });
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.35);
      doc.line(MARGIN_LEFT, y - 3.4, MARGIN_LEFT + kopW, y - 3.4);

      y += 1.5;
      if (tribrataDataUrl) {
        doc.addImage(
          tribrataDataUrl,
          'PNG',
          PAGE_W / 2 - 9.25,
          y,
          18.5,
          16.5
        );
      }
      y += 20.5;

      doc.text('SURAT PERINTAH', PAGE_W / 2, y, { align: 'center' });
      doc.setLineWidth(0.35);
      doc.line(PAGE_W / 2 - 38, y + 1.0, PAGE_W / 2 + 38, y + 1.0);
      y += 5.2;

      const p1 = 'Nomor : Sprin / ';
      const p2 = data.nomorUrut || '205';
      const p3 = ` ${nomorSuffix}`;
      const totalNoW =
        doc.getTextWidth(p1) + doc.getTextWidth(p2) + doc.getTextWidth(p3);
      let noX = PAGE_W / 2 - totalNoW / 2;
      setColor(doc, [0, 0, 0]);
      doc.text(p1, noX, y);
      noX += doc.getTextWidth(p1);
      setColor(doc, fillRgb);
      doc.text(p2, noX, y);
      noX += doc.getTextWidth(p2);
      setColor(doc, [0, 0, 0]);
      doc.text(p3, noX, y);

      y += 8.0;

      setColor(doc, [0, 0, 0]);
      doc.text('Pertimbangan', MARGIN_LEFT, y);
      doc.text(':', MARGIN_LEFT + LABEL_W, y);
      y = drawJustifiedOrWrapped(
        doc,
        data.pertimbangan,
        VALUE_X,
        y,
        VALUE_W,
        fillRgb
      );

      y += 2.5;
    }

    if (plan.dasarChunk) {
      y = drawDasarChunk(doc, plan.dasarChunk, y, fillRgb);
    }

    if (plan.includeDiperintahkan) {
      y += 3.2;
      setColor(doc, [0, 0, 0]);
      doc.text('DIPERINTAHKAN', PAGE_W / 2, y, { align: 'center' });
      y += 6.2;
    }

    if (plan.kepadaChunk && plan.kepadaChunk.rows.length > 0) {
      y = drawKepadaChunk(doc, plan.kepadaChunk, y, fillRgb);
    }

    if (plan.untukChunk && plan.untukChunk.rows.length > 0) {
      const hasContentAbove =
        Boolean(plan.includeHeader) ||
        Boolean(plan.dasarChunk) ||
        Boolean(plan.kepadaChunk && plan.kepadaChunk.rows.length > 0);
      if (hasContentAbove) {
        y += 2.0;
      }
      y = drawUntukChunk(doc, plan.untukChunk, y, fillRgb);
    }

    if (plan.includeSignature) {
      y += 0.5;
      setColor(doc, [0, 0, 0]);
      doc.text('Selesai.', MARGIN_LEFT, y);
      y += 3.5;
      y = drawSignatureBlock(
        doc,
        data,
        y,
        compositeStampTtd,
        fillRgb,
        plan.type === 'main'
      );
    }

    if (plan.tembusanChunk && plan.tembusanChunk.rows.length > 0) {
      const hasAbove =
        Boolean(plan.includeHeader) ||
        Boolean(plan.dasarChunk) ||
        Boolean(plan.kepadaChunk && plan.kepadaChunk.rows.length > 0) ||
        Boolean(plan.untukChunk && plan.untukChunk.rows.length > 0) ||
        Boolean(plan.includeSignature);
      drawTembusan(doc, plan.tembusanChunk, hasAbove ? y + 3 : y, fillRgb);
    }
  });

  const safeNum = (data.nomorUrut || 'Draft').replace(/[^a-zA-Z0-9_-]/g, '');
  doc.save(`Sprin_${safeNum}_Polsek_Semarang_Selatan.pdf`);
}
