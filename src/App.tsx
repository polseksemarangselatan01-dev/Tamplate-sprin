import React, { useEffect, useState } from 'react';
import {
  Printer,
  FileText,
  FileDown,
  PanelLeftClose,
  PanelLeftOpen,
  Eye,
  X,
} from 'lucide-react';
import {
  DEFAULT_SPRIN_DATA,
  EMPTY_SPRIN_DATA,
  SprinData,
} from './types/sprin';
import { A4Document } from './components/A4Document';
import { getTotalPages } from './utils/pagination';
import { SprinFormPanel } from './components/SprinFormPanel';
import {
  getDefaultStempelDataUrl,
  getDefaultTtdDataUrl,
} from './utils/stampAssets';
import { exportSprinToDocx } from './utils/docxExport';
import { exportSprinToPdf } from './utils/pdfExport';

const STORAGE_KEY = 'sprin_blanko_a4_data_v4';
const ZOOM_PRESETS = [65, 80, 90, 100];

function withDefaultStamps(base: SprinData): SprinData {
  return {
    ...base,
    ttdImage: base.ttdImage || getDefaultTtdDataUrl(),
    stempelImage: base.stempelImage || getDefaultStempelDataUrl(),
  };
}

export default function App() {
  const [data, setData] = useState<SprinData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SprinData;
        return withDefaultStamps(parsed);
      }
    } catch {
      // Abaikan localStorage rusak
    }
    return withDefaultStamps(DEFAULT_SPRIN_DATA);
  });

  const [activeField, setActiveField] = useState<string | null>(null);
  const [printBlackMode, setPrintBlackMode] = useState(true);
  const [zoom, setZoom] = useState<number>(80);
  const [panelOpen, setPanelOpen] = useState(true);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Abaikan batas kuota storage
    }
  }, [data]);

  useEffect(() => {
    if (!previewOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [previewOpen]);

  const handleSelectFieldFromPaper = (fieldId: string) => {
    setPanelOpen(true);
    setActiveField(fieldId);
  };

  const handleJumpSection = (sectionId: string) => {
    setPanelOpen(true);
    requestAnimationFrame(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };

  const handlePrint = () => {
    setPreviewOpen(false);
    setActiveField(null);
    requestAnimationFrame(() => {
      window.print();
    });
  };

  const handleDownloadPdf = async () => {
    try {
      setExportError(null);
      setIsExportingPdf(true);
      await exportSprinToPdf(data, printBlackMode);
    } catch {
      setExportError(
        'Gagal mengunduh file PDF. Silakan coba lagi atau gunakan tombol Cetak.'
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadWord = async () => {
    try {
      setExportError(null);
      setIsExportingDocx(true);
      await exportSprinToDocx(data, printBlackMode);
    } catch {
      setExportError('Gagal mengunduh file Word (.docx). Silakan coba lagi.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleResetSample = () => {
    setData(withDefaultStamps(DEFAULT_SPRIN_DATA));
    setActiveField(null);
  };

  const handleClearForm = () => {
    setData({
      ...EMPTY_SPRIN_DATA,
      ttdImage: data.ttdImage,
      stempelImage: data.stempelImage,
    });
    setActiveField('nomorUrut');
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sprin_${data.nomorUrut || 'Draft'}_Data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<SprinData>;
      if (parsed && typeof parsed === 'object') {
        const normalizedPersonel = Array.isArray(parsed.personel)
          ? parsed.personel.map((raw, idx) => {
              const row = raw as unknown as Record<string, string>;
              if (row.pangkat !== undefined && row.nrp !== undefined) {
                return {
                  id: row.id || `pers-json-${Date.now()}-${idx}`,
                  pangkat: row.pangkat || '',
                  nama: row.nama || '',
                  nrp: row.nrp || '',
                  jabatan: row.jabatan || '',
                };
              }
              const legacy = (row.pangkatNrp || '').trim();
              const parts = legacy.split(/\s*[\/|\-]\s*/);
              return {
                id: row.id || `pers-json-${Date.now()}-${idx}`,
                pangkat: parts[0]?.trim() || '',
                nama: row.nama || '',
                nrp: parts.slice(1).join(' ').trim() || '',
                jabatan: row.jabatan || '',
              };
            })
          : DEFAULT_SPRIN_DATA.personel;

        setData(
          withDefaultStamps({
            ...DEFAULT_SPRIN_DATA,
            ...parsed,
            personel: normalizedPersonel,
          })
        );
      }
    } catch {
      // Abaikan JSON tidak valid
    }
  };

  const totalPages = getTotalPages(data);
  const zoomScale = zoom / 100;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      {/* Top Bar Contract: 3 zones */}
      <header className="no-print sticky top-0 z-30 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between gap-8">
        {/* Zone 1: Wordmark */}
        <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
          Blanko Sprin A4
        </span>

        {/* Zone 2: Clean single-line section links */}
        <nav
          aria-label="Navigasi bagian formulir"
          className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={() => handleJumpSection('sec-nomor')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Nomor
          </button>
          <button
            type="button"
            onClick={() => handleJumpSection('sec-dasar')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Dasar
          </button>
          <button
            type="button"
            onClick={() => handleJumpSection('sec-untuk')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Perintah
          </button>
          <button
            type="button"
            onClick={() => handleJumpSection('sec-kepada')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Kepada &amp; Excel
          </button>
          <button
            type="button"
            onClick={() => handleJumpSection('sec-ttd')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            TTD &amp; Stempel
          </button>
        </nav>

        {/* Zone 3: Preview & Primary CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveField(null);
              setPreviewOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
            Preview
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileDown className="w-4 h-4" aria-hidden="true" />
            {isExportingPdf ? 'Menyiapkan PDF...' : 'Unduh PDF'}
          </button>
        </div>
      </header>

      {exportError && (
        <div className="no-print bg-rose-50 border-b border-rose-200 px-5 py-2 text-xs font-medium text-rose-700 flex items-center justify-between gap-4">
          <span>{exportError}</span>
          <button
            type="button"
            onClick={() => setExportError(null)}
            className="text-rose-800 hover:underline shrink-0 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main Split Workspace */}
      <main className="print-workspace flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left / Top Form Panel */}
        {panelOpen && (
          <aside className="no-print w-full lg:w-[440px] xl:w-[470px] shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 lg:h-[calc(100vh-57px)] lg:overflow-y-auto">
            <SprinFormPanel
              data={data}
              onChange={setData}
              activeField={activeField}
              onFocusField={(fieldId) => setActiveField(fieldId)}
              printBlackMode={printBlackMode}
              onChangePrintBlackMode={setPrintBlackMode}
              onResetSample={handleResetSample}
              onClearForm={handleClearForm}
              onExportJson={handleExportJson}
              onImportJson={handleImportJson}
            />
          </aside>
        )}

        {/* Right / Bottom Preview Workspace */}
        <section
          aria-label="Pratinjau Kertas A4"
          onClick={() => setActiveField(null)}
          className="print-workspace flex-1 bg-slate-100 lg:h-[calc(100vh-57px)] overflow-auto px-3 py-4 sm:px-6 sm:py-5 flex flex-col items-center"
        >
          {/* Preview Controls Header */}
          <div className="no-print w-full max-w-[820px] mb-5 space-y-2.5">
            {/* Spec line */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
              <span>Format A4 (210 × 297 mm)</span>
              <span aria-hidden="true">·</span>
              <span>Arial 12pt</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num">{totalPages} Halaman</span>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPanelOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {panelOpen ? (
                  <>
                    <PanelLeftClose className="w-3.5 h-3.5" aria-hidden="true" />
                    Tutup Panel
                  </>
                ) : (
                  <>
                    <PanelLeftOpen className="w-3.5 h-3.5" aria-hidden="true" />
                    Buka Panel
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadWord}
                disabled={isExportingDocx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                {isExportingDocx ? 'Menyiapkan Word...' : 'Unduh Word (.docx)'}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                Cetak
              </button>
            </div>

            {/* Zoom Presets Row */}
            <div
              role="group"
              aria-label="Skala pratinjau"
              className="inline-flex items-center p-0.5 bg-white border border-slate-300 rounded-lg"
            >
              {ZOOM_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setZoom(preset)}
                  className={`px-2.5 py-1 text-xs font-medium font-mono-num rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    zoom === preset
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>

          {/* Multi-Page A4 Stack */}
          <div className="w-full flex justify-center overflow-x-auto pb-8">
            <A4Document
              data={data}
              activeField={activeField}
              onSelectField={handleSelectFieldFromPaper}
              printBlackMode={printBlackMode}
              zoomScale={zoomScale}
            />
          </div>
        </section>
      </main>

      {/* Preview Modal Full-Screen */}
      {previewOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Preview Surat Perintah A4"
          className="no-print fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-[1px] flex flex-col"
        >
          <div className="bg-white border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-900">
                Preview Dokumen A4
              </span>
              <span className="text-xs text-slate-500 font-mono-num">
                {totalPages} Halaman · {printBlackMode ? 'Semua Hitam' : 'Hijau (Draft)'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div
                role="group"
                aria-label="Skala preview"
                className="inline-flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-lg"
              >
                {ZOOM_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setZoom(preset)}
                    className={`px-2 py-1 text-xs font-medium font-mono-num rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      zoom === preset
                        ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                Cetak
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" aria-hidden="true" />
                {isExportingPdf ? 'Menyiapkan PDF...' : 'Unduh PDF'}
              </button>

              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
                Tutup
              </button>
            </div>
          </div>

          <div
            onClick={() => setPreviewOpen(false)}
            className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center"
          >
            <div onClick={(e) => e.stopPropagation()}>
              <A4Document
                data={data}
                activeField={null}
                onSelectField={() => {}}
                printBlackMode={printBlackMode}
                zoomScale={zoomScale}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
