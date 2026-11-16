import * as XLSX from 'xlsx';
import { formatJabatanWithoutSuffix, PersonelRow } from '../types/sprin';

export function downloadExcelTemplate(): void {
  const rows = [
    ['NO', 'NAMA', 'PANGKAT', 'NRP', 'JABATAN'],
    [1, 'ANDI SETIYANTO', 'IPTU', '73120096', 'BHABINKAMTIBMAS MUGASARI'],
    [2, 'SUPRIYATNO', 'AIPDA', '72100456', 'BAUNIT SAMAPTA'],
    [3, 'WARDOYO', 'AIPDA', '83101282', 'BAUNIT SAMAPTA'],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 16 },
    { wch: 14 },
    { wch: 34 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Personel');
  XLSX.writeFile(workbook, 'Template_Personel_Sprin.xlsx');
}

function normalizeHeader(h: unknown): string {
  return String(h ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function splitPangkatNrpFallback(raw: string): { pangkat: string; nrp: string } {
  const cleaned = raw.trim();
  if (!cleaned) return { pangkat: '', nrp: '' };

  const sepMatch = cleaned.split(/\s*[\/|\-]\s*/);
  if (sepMatch.length >= 2) {
    return {
      pangkat: sepMatch[0].trim(),
      nrp: sepMatch.slice(1).join(' ').replace(/^NRP\s*:?\s*/i, '').trim(),
    };
  }

  const nrpWordMatch = cleaned.match(/^(.*?)\bNRP\b[:.\s]*(.+)$/i);
  if (nrpWordMatch) {
    return {
      pangkat: nrpWordMatch[1].trim(),
      nrp: nrpWordMatch[2].trim(),
    };
  }

  const trailingDigits = cleaned.match(/^(.*?)\s+(\d{6,})$/);
  if (trailingDigits) {
    return {
      pangkat: trailingDigits[1].trim(),
      nrp: trailingDigits[2].trim(),
    };
  }

  return { pangkat: cleaned, nrp: '' };
}

export async function parseExcelPersonel(file: File): Promise<PersonelRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const sheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
  });

  if (rawRows.length === 0) return [];

  // Cari baris header (yang memuat "nama" atau "pangkat")
  let headerIdx = -1;
  for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
    const cells = rawRows[r].map(normalizeHeader);
    if (
      cells.some(
        (c) => c === 'nama' || c.includes('namapersonel') || c === 'pangkat'
      )
    ) {
      headerIdx = r;
      break;
    }
  }

  const hasHeader = headerIdx !== -1;
  const headers = hasHeader ? rawRows[headerIdx].map(normalizeHeader) : [];

  const idxNama = headers.findIndex((h) => h.includes('nama'));
  const idxPangkat = headers.findIndex((h) => h === 'pangkat');
  const idxNrp = headers.findIndex((h) => h === 'nrp');
  const idxPangkatNrp = headers.findIndex(
    (h) => h.includes('pangkatnrp') || (h.includes('pangkat') && h.includes('nrp'))
  );
  const idxJabatan = headers.findIndex(
    (h) => h.includes('jabatan') || h.includes('kesatuan')
  );

  const startRow = hasHeader ? headerIdx + 1 : 0;

  const result: PersonelRow[] = [];
  for (let r = startRow; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.every((cell) => String(cell ?? '').trim() === '')) {
      continue;
    }

    let nama = '';
    let pangkat = '';
    let nrp = '';
    let jabatan = '';

    if (hasHeader && idxNama !== -1) {
      nama = String(row[idxNama] ?? '').trim();

      if (idxPangkat !== -1 && idxNrp !== -1) {
        pangkat = String(row[idxPangkat] ?? '').trim();
        nrp = String(row[idxNrp] ?? '')
          .replace(/^NRP\s*:?\s*/i, '')
          .trim();
      } else if (idxPangkatNrp !== -1) {
        const parsed = splitPangkatNrpFallback(String(row[idxPangkatNrp] ?? ''));
        pangkat = parsed.pangkat;
        nrp = parsed.nrp;
      } else {
        if (idxPangkat !== -1) pangkat = String(row[idxPangkat] ?? '').trim();
        if (idxNrp !== -1) {
          nrp = String(row[idxNrp] ?? '')
            .replace(/^NRP\s*:?\s*/i, '')
            .trim();
        }
      }

      jabatan =
        idxJabatan !== -1
          ? formatJabatanWithoutSuffix(String(row[idxJabatan] ?? ''))
          : '';
    } else {
      // Format kolom urutan baku: 1 NO, 2 NAMA, 3 PANGKAT, 4 NRP, 5 JABATAN
      const col0 = String(row[0] ?? '').trim();
      const hasNoCol = /^\d+\.?$/.test(col0);
      const offset = hasNoCol ? 1 : 0;
      nama = String(row[offset] ?? '').trim();
      pangkat = String(row[offset + 1] ?? '').trim();
      nrp = String(row[offset + 2] ?? '')
        .replace(/^NRP\s*:?\s*/i, '')
        .trim();
      jabatan = formatJabatanWithoutSuffix(String(row[offset + 3] ?? ''));
    }

    if (!nama && !pangkat && !nrp && !jabatan) continue;

    result.push({
      id: `pers-imp-${Date.now()}-${r}`,
      pangkat,
      nama,
      nrp,
      jabatan,
    });
  }

  return result;
}
