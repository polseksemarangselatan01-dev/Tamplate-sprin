import {
  AlignmentType,
  BorderStyle,
  Document,
  HorizontalPositionAlign,
  HorizontalPositionRelativeFrom,
  ImageRun,
  Packer,
  PageBreak,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  TextWrappingType,
  UnderlineType,
  VerticalPositionRelativeFrom,
  WidthType,
} from 'docx';
import { formatJabatanWithoutSuffix, SprinData } from '../types/sprin';
import {
  buildDocumentPages,
  DasarChunk,
  KepadaChunk,
  UntukChunk,
} from './pagination';
import {
  compositeSignatureAndStampPng,
  dataUrlToUint8Array,
} from './stampAssets';

const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

const BLACK_BORDER = {
  style: BorderStyle.SINGLE,
  size: 6,
  color: '000000',
};

async function fetchTribrataBytes(): Promise<Uint8Array | null> {
  try {
    const res = await fetch('/assets/tribrata-emblem.png');
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

function buildContinuationHeaderParagraphs(
  pageNumber: number,
  nomorHeader: string,
  bulanTahunHeader: string,
  fillHex: string
): (Paragraph | Table)[] {
  const fixedRun = (text: string) =>
    new TextRun({ text, font: 'Arial', size: 22, color: '000000' });
  const fillRun = (text: string) =>
    new TextRun({ text, font: 'Arial', size: 22, color: fillHex });

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: String(pageNumber),
          font: 'Arial',
          size: 24,
          color: '000000',
        }),
      ],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 52, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [] })],
            }),
            new TableCell({
              width: { size: 48, type: WidthType.PERCENTAGE },
              borders: { ...NO_BORDERS, bottom: BLACK_BORDER },
              children: [
                new Paragraph({
                  spacing: { after: 20 },
                  children: [fixedRun('SPRIN  KAPOLSEK SEMARANG SELATAN')],
                }),
                new Paragraph({
                  spacing: { after: 20 },
                  children: [
                    fixedRun('NOMOR   :SPRIN/ '),
                    fillRun(nomorHeader),
                  ],
                }),
                new Paragraph({
                  spacing: { after: 40 },
                  children: [fixedRun('TANGGAL : '), fillRun(bulanTahunHeader)],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new Paragraph({ spacing: { after: 120 }, children: [] }),
  ];
}

function buildDasarTable(chunk: DasarChunk, fillHex: string): Table {
  const fixed = (text: string) =>
    new TextRun({ text, font: 'Arial', size: 24, color: '000000' });
  const fill = (text: string) =>
    new TextRun({ text, font: 'Arial', size: 24, color: fillHex });

  const children: Paragraph[] = [];
  if (chunk.includePointOne) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { left: 340, hanging: 340 },
        spacing: { after: 80 },
        children: [
          fixed(
            '1.  Undang-undang (UU) Nomor 5 Tahun 2026 tentang Perubahan Ketiga atas Undang-Undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia;'
          ),
        ],
      })
    );
  }
  chunk.rows.forEach((d, idx) => {
    const poinNo = chunk.startIndex + idx + 2;
    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { left: 340, hanging: 340 },
        spacing: { after: 80 },
        children: [fill(`${poinNo}.  ${d.text}`)],
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 16, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ children: [fixed(chunk.showLabel ? 'Dasar' : '')] }),
            ],
          }),
          new TableCell({
            width: { size: 3, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ children: [fixed(chunk.showLabel ? ':' : '')] }),
            ],
          }),
          new TableCell({
            width: { size: 81, type: WidthType.PERCENTAGE },
            children,
          }),
        ],
      }),
    ],
  });
}

function buildUntukTable(chunk: UntukChunk, fillHex: string): Table {
  const fixed = (text: string) =>
    new TextRun({ text, font: 'Arial', size: 24, color: '000000' });
  const fill = (text: string) =>
    new TextRun({ text, font: 'Arial', size: 24, color: fillHex });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 16, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                indent: { left: 140 },
                children: [fixed(chunk.showLabel ? 'Untuk' : '')],
              }),
            ],
          }),
          new TableCell({
            width: { size: 3, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ children: [fixed(chunk.showLabel ? ':' : '')] }),
            ],
          }),
          new TableCell({
            width: { size: 81, type: WidthType.PERCENTAGE },
            children: chunk.rows.map((u, idx) => {
              const poinNo = chunk.startIndex + idx + 1;
              return new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                indent: { left: 397, hanging: 397 },
                spacing: { after: 70 },
                children: [fill(`${poinNo}.  ${u.text}`)],
              });
            }),
          }),
        ],
      }),
    ],
  });
}

function buildKepadaTable(chunk: KepadaChunk, fillHex: string): Table {
  const fixed = (text: string, underline = false) =>
    new TextRun({
      text,
      font: 'Arial',
      size: 24,
      color: '000000',
      underline: underline ? { type: UnderlineType.SINGLE } : undefined,
    });
  const fill = (text: string, underline = false) =>
    new TextRun({
      text,
      font: 'Arial',
      size: 24,
      color: fillHex,
      underline: underline ? { type: UnderlineType.SINGLE } : undefined,
    });

  const kepadaCellChildren: Paragraph[] = chunk.rows.flatMap((p, idx) => {
    const cleanJabatan = formatJabatanWithoutSuffix(p.jabatan);
    const rowNum = chunk.startIndex + idx + 1;
    return [
      new Paragraph({
        children: [
          fixed(`${rowNum}.  `),
          fill(p.pangkat, true),
          fixed('  ', true),
          fill(p.nama, true),
          fixed('   NRP   ', true),
          fill(p.nrp, true),
        ],
      }),
      new Paragraph({
        indent: { left: 360 },
        spacing: { after: 70 },
        children: [fill(cleanJabatan), fixed(' POLSEK SMG SELATAN')],
      }),
    ];
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 16, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [fixed(chunk.showLabel ? 'Kepada' : '')],
              }),
            ],
          }),
          new TableCell({
            width: { size: 3, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [fixed(chunk.showLabel ? ':' : '')],
              }),
            ],
          }),
          new TableCell({
            width: { size: 81, type: WidthType.PERCENTAGE },
            children: kepadaCellChildren,
          }),
        ],
      }),
    ],
  });
}

function buildSignatureParagraphs(
  dikeluarkanDi: string,
  tanggalLabel: string,
  namaPejabat: string,
  pangkatNrpPejabat: string,
  compositeBytes: Uint8Array | null,
  fillHex: string
): (Paragraph | Table)[] {
  const fixed = (text: string, underline = false, size = 24) =>
    new TextRun({
      text,
      font: 'Arial',
      size,
      color: '000000',
      underline: underline ? { type: UnderlineType.SINGLE } : undefined,
    });
  const fill = (text: string) =>
    new TextRun({ text, font: 'Arial', size: 24, color: fillHex });

  const sigRuns: (TextRun | ImageRun)[] = [
    new TextRun({ text: '', font: 'Arial', size: 24 }),
  ];
  if (compositeBytes) {
    // 112mm x 52mm pada 96 DPI = 423 x 197 px -> mengambang di belakang teks agar jarak tetap tepat 4 baris
    sigRuns.push(
      new ImageRun({
        data: compositeBytes,
        transformation: { width: 423, height: 197 },
        type: 'png',
        floating: {
          horizontalPosition: {
            relative: HorizontalPositionRelativeFrom.COLUMN,
            align: HorizontalPositionAlign.CENTER,
          },
          verticalPosition: {
            relative: VerticalPositionRelativeFrom.PARAGRAPH,
            offset: -558000,
          },
          allowOverlap: true,
          behindDocument: true,
          layoutInCell: true,
          wrap: {
            type: TextWrappingType.NONE,
          },
        },
      })
    );
  }

  const emptyLine = (children: (TextRun | ImageRun)[]) =>
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0, line: 288 },
      children,
    });

  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 34, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [] })],
            }),
            new TableCell({
              width: { size: 66, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  indent: { left: 1200 },
                  spacing: { after: 15 },
                  children: [fixed('Dikeluarkan di : '), fill(dikeluarkanDi)],
                }),
                new Paragraph({
                  indent: { left: 1200 },
                  spacing: { after: 70 },
                  border: { bottom: BLACK_BORDER },
                  children: [fixed('Pada tanggal   : '), fill(tanggalLabel)],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 0 },
                  children: [
                    fixed(
                      'KAPOLSEK SEMARANG SELATAN POLRESTABES SEMARANG',
                      false,
                      22
                    ),
                  ],
                }),
                // Jarak tepat 4 baris antara KAPOLSEK dan Nama Pejabat
                emptyLine(sigRuns),
                emptyLine([new TextRun({ text: '', font: 'Arial', size: 24 })]),
                emptyLine([new TextRun({ text: '', font: 'Arial', size: 24 })]),
                emptyLine([new TextRun({ text: '', font: 'Arial', size: 24 })]),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 15 },
                  children: [
                    new TextRun({
                      text: namaPejabat,
                      font: 'Arial',
                      size: 24,
                      color: fillHex,
                      underline: { type: UnderlineType.SINGLE },
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [fill(pangkatNrpPejabat)],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ];
}

export async function exportSprinToDocx(
  data: SprinData,
  printBlackMode: boolean
): Promise<void> {
  const fillHex = printBlackMode ? '000000' : '008000';
  const [tribrataBytes, compositePng] = await Promise.all([
    fetchTribrataBytes(),
    compositeSignatureAndStampPng(data.ttdImage, data.stempelImage),
  ]);
  const compositeBytes = compositePng
    ? dataUrlToUint8Array(compositePng)
    : null;

  const fixed = (text: string, underline = false) =>
    new TextRun({
      text,
      font: 'Arial',
      size: 24,
      color: '000000',
      underline: underline ? { type: UnderlineType.SINGLE } : undefined,
    });
  const fill = (text: string) =>
    new TextRun({ text, font: 'Arial', size: 24, color: fillHex });

  const nomorParts = data.nomorHeader.split('/');
  const nomorSuffix =
    nomorParts.length > 1
      ? `/ ${nomorParts.slice(1).join(' / ')}`
      : '/ XI / HUK.6.6./2026';

  const pages = buildDocumentPages(data);
  const allChildren: (Paragraph | Table)[] = [];

  pages.forEach((plan, pageIdx) => {
    if (pageIdx > 0) {
      allChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }

    if (plan.type === 'cont') {
      allChildren.push(
        ...buildContinuationHeaderParagraphs(
          plan.pageNumber,
          data.nomorHeader,
          data.bulanTahunHeader,
          fillHex
        )
      );
    }

    if (plan.includeHeader) {
      allChildren.push(
        new Table({
          width: { size: 44, type: WidthType.PERCENTAGE },
          borders: { ...NO_BORDERS, bottom: BLACK_BORDER },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: { ...NO_BORDERS, bottom: BLACK_BORDER },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [fixed('POLRI DAERAH JAWA TENGAH')],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [fixed('RESOR KOTA BESAR SEMARANG')],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 30 },
                      children: [fixed('SEKTOR SEMARANG SELATAN')],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 140, after: 40 },
          children: tribrataBytes
            ? [
                new ImageRun({
                  data: tribrataBytes,
                  transformation: { width: 70, height: 62 },
                  type: 'png',
                }),
              ]
            : [],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 20 },
          children: [fixed('SURAT PERINTAH', true)],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 150 },
          children: [
            fixed('Nomor : Sprin / '),
            fill(data.nomorUrut || '...'),
            fixed(` ${nomorSuffix}`),
          ],
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: NO_BORDERS,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 16, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ children: [fixed('Pertimbangan')] })],
                }),
                new TableCell({
                  width: { size: 3, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ children: [fixed(':')] })],
                }),
                new TableCell({
                  width: { size: 81, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.JUSTIFIED,
                      spacing: { after: 100 },
                      children: [fill(data.pertimbangan)],
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      );
    }

    if (plan.dasarChunk) {
      allChildren.push(buildDasarTable(plan.dasarChunk, fillHex));
    }

    if (plan.includeDiperintahkan) {
      allChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 140, after: 110 },
          children: [fixed('DIPERINTAHKAN')],
        })
      );
    }

    if (plan.kepadaChunk && plan.kepadaChunk.rows.length > 0) {
      allChildren.push(buildKepadaTable(plan.kepadaChunk, fillHex));
    }

    if (plan.untukChunk && plan.untukChunk.rows.length > 0) {
      const hasContentAbove =
        Boolean(plan.includeHeader) ||
        Boolean(plan.dasarChunk) ||
        Boolean(plan.kepadaChunk && plan.kepadaChunk.rows.length > 0);
      if (hasContentAbove) {
        allChildren.push(
          new Paragraph({
            spacing: { before: 40, after: 40 },
            children: [new TextRun({ text: '', size: 6 })],
          })
        );
      }
      allChildren.push(buildUntukTable(plan.untukChunk, fillHex));
    }

    if (plan.includeSignature) {
      allChildren.push(
        new Paragraph({
          spacing: { before: 40, after: 60 },
          children: [fixed('Selesai.')],
        }),
        ...buildSignatureParagraphs(
          data.dikeluarkanDi,
          data.tanggalTtdSurat,
          data.namaPejabat,
          data.pangkatNrpPejabat,
          compositeBytes,
          fillHex
        )
      );
    }

    if (plan.tembusanChunk && plan.tembusanChunk.rows.length > 0) {
      if (plan.tembusanChunk.showLabel) {
        allChildren.push(
          new Paragraph({
            spacing: { before: 120, after: 40 },
            children: [fixed('Tembusan :', true)],
          })
        );
      }
      allChildren.push(
        ...plan.tembusanChunk.rows.map((t, idx) => {
          const poinNo = plan.tembusanChunk!.startIndex + idx + 1;
          return new Paragraph({
            spacing: { after: 20 },
            children: [fill(`${poinNo}.  ${t.text}`)],
          });
        })
      );
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: {
              top: 680, // 12mm
              right: 794, // 14mm
              bottom: 1020, // 18mm
              left: 1361, // 24mm
            },
          },
        },
        children: allChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Sprin_${(data.nomorUrut || 'Draft').replace(/[^a-zA-Z0-9_-]/g, '')}_Polsek_Semarang_Selatan.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
