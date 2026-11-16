import React, { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Trash2,
  FileSpreadsheet,
  Download,
  RotateCcw,
  Eraser,
  Upload,
  PenTool,
  Stamp,
} from 'lucide-react';
import {
  formatJabatanWithoutSuffix,
  PersonelRow,
  SprinData,
} from '../types/sprin';
import { downloadExcelTemplate, parseExcelPersonel } from '../utils/excelUtils';
import { processUploadedImage } from '../utils/stampAssets';

interface SprinFormPanelProps {
  data: SprinData;
  onChange: (next: SprinData) => void;
  activeField: string | null;
  onFocusField: (fieldId: string) => void;
  printBlackMode: boolean;
  onChangePrintBlackMode: (val: boolean) => void;
  onResetSample: () => void;
  onClearForm: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
}

export const SprinFormPanel: React.FC<SprinFormPanelProps> = ({
  data,
  onChange,
  activeField,
  onFocusField,
  printBlackMode,
  onChangePrintBlackMode,
  onResetSample,
  onClearForm,
  onExportJson,
  onImportJson,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const excelReplaceRef = useRef<HTMLInputElement>(null);
  const excelAppendRef = useRef<HTMLInputElement>(null);
  const ttdUploadRef = useRef<HTMLInputElement>(null);
  const stempelUploadRef = useRef<HTMLInputElement>(null);
  const jsonImportRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!activeField || !containerRef.current) return;
    const el = containerRef.current.querySelector<HTMLElement>(
      `[data-field-id="${activeField}"]`
    );
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus({ preventScroll: true });
    }
  }, [activeField]);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const updateField = <K extends keyof SprinData>(key: K, value: SprinData[K]) => {
    onChange({ ...data, [key]: value });
  };

  const handleNomorUrutChange = (val: string) => {
    const parts = data.nomorHeader.split('/');
    const suffix =
      parts.length > 1 ? parts.slice(1).join('/') : 'XI/HUK.6.6./2026';
    onChange({
      ...data,
      nomorUrut: val,
      nomorHeader: `${val}/${suffix}`,
    });
  };

  // Dasar Poin 2+
  const addDasar = () => {
    onChange({
      ...data,
      dasarPoin: [...data.dasarPoin, { id: `dasar-${Date.now()}`, text: '' }],
    });
  };

  const updateDasar = (id: string, text: string) => {
    onChange({
      ...data,
      dasarPoin: data.dasarPoin.map((d) => (d.id === id ? { ...d, text } : d)),
    });
  };

  const removeDasar = (id: string) => {
    if (data.dasarPoin.length <= 1) return;
    onChange({
      ...data,
      dasarPoin: data.dasarPoin.filter((d) => d.id !== id),
    });
  };

  // Untuk Poin 1-4+
  const addUntuk = () => {
    onChange({
      ...data,
      untukPoin: [...data.untukPoin, { id: `untuk-${Date.now()}`, text: '' }],
    });
  };

  const updateUntuk = (id: string, text: string) => {
    onChange({
      ...data,
      untukPoin: data.untukPoin.map((u) => (u.id === id ? { ...u, text } : u)),
    });
  };

  const removeUntuk = (id: string) => {
    if (data.untukPoin.length <= 1) return;
    onChange({
      ...data,
      untukPoin: data.untukPoin.filter((u) => u.id !== id),
    });
  };

  // Tembusan
  const addTembusan = () => {
    onChange({
      ...data,
      tembusan: [...data.tembusan, { id: `temb-${Date.now()}`, text: '' }],
    });
  };

  const updateTembusan = (id: string, text: string) => {
    onChange({
      ...data,
      tembusan: data.tembusan.map((t) => (t.id === id ? { ...t, text } : t)),
    });
  };

  const removeTembusan = (id: string) => {
    onChange({
      ...data,
      tembusan: data.tembusan.filter((t) => t.id !== id),
    });
  };

  // Personel Kepada
  const addPersonelRow = () => {
    const newRow: PersonelRow = {
      id: `pers-${Date.now()}`,
      pangkat: '',
      nama: '',
      nrp: '',
      jabatan: '',
    };
    onChange({
      ...data,
      personel: [...data.personel, newRow],
    });
  };

  const updatePersonelField = (
    id: string,
    key: keyof PersonelRow,
    value: string
  ) => {
    onChange({
      ...data,
      personel: data.personel.map((p) =>
        p.id === id ? { ...p, [key]: value } : p
      ),
    });
  };

  const removePersonelRow = (id: string) => {
    if (data.personel.length <= 1) return;
    onChange({
      ...data,
      personel: data.personel.filter((p) => p.id !== id),
    });
  };

  const handleExcelFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: 'replace' | 'append'
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const rows = await parseExcelPersonel(file);
      if (rows.length === 0) {
        showNotice('Tidak ada data personel ditemukan di file Excel.');
        return;
      }
      if (mode === 'replace') {
        onChange({ ...data, personel: rows });
        showNotice(
          `Berhasil mengimpor ${rows.length} personel ke daftar Kepada.`
        );
      } else {
        onChange({ ...data, personel: [...data.personel, ...rows] });
        showNotice(
          `Berhasil menyisipkan ${rows.length} personel ke daftar Kepada.`
        );
      }
    } catch {
      showNotice(
        'Gagal membaca file Excel. Gunakan format .xlsx / .xls / .csv.'
      );
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'ttdImage' | 'stempelImage'
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await processUploadedImage(file, data.transparankanUpload);
      updateField(target, dataUrl);
      showNotice(
        target === 'ttdImage'
          ? 'Tanda tangan berhasil diperbarui.'
          : 'Stempel dinas berhasil diperbarui.'
      );
    } catch {
      showNotice('Gagal memproses gambar yang diunggah.');
    }
  };

  const inputBase = (fieldId: string) =>
    `w-full rounded-lg border px-3 py-2 text-sm font-medium text-[#008000] bg-white placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-700 transition-colors ${
      activeField === fieldId
        ? 'border-emerald-700 ring-2 ring-emerald-600/20'
        : 'border-slate-300'
    }`;

  return (
    <div ref={containerRef} className="divide-y divide-slate-200 bg-white">
      {/* Panduan Pengisian Blanko */}
      <div className="px-4 py-3.5 bg-white">
        <div className="text-xs font-semibold text-slate-900 mb-2">
          Panduan Pengisian Blanko
        </div>
        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-xs bg-black shrink-0" />
            <span>Teks hitam: format blanko tetap (terkunci)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-xs bg-[#008000] shrink-0" />
            <span>Teks hijau: kolom isian (otomatis pindah halaman)</span>
          </div>
        </div>
      </div>

      {notice && (
        <div className="px-4 py-2 bg-emerald-50 text-emerald-800 text-xs font-medium">
          {notice}
        </div>
      )}

      {/* 01. NOMOR & HEADER HALAMAN 2+ */}
      <section id="sec-nomor" className="px-4 py-4 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          01. NOMOR &amp; HEADER HALAMAN 2+
        </h2>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Nomor Urut Sprin (Hal. 1)
          </label>
          <input
            type="text"
            data-field-id="nomorUrut"
            value={data.nomorUrut}
            onFocus={() => onFocusField('nomorUrut')}
            onChange={(e) => handleNomorUrutChange(e.target.value)}
            placeholder="205"
            className={`${inputBase('nomorUrut')} font-mono-num`}
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Otomatis mengisi nomor pada header halaman 2 dan seterusnya.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Nomor Header Kanan Atas (Hal. 2 dst.)
          </label>
          <input
            type="text"
            data-field-id="nomorHeader"
            value={data.nomorHeader}
            onFocus={() => onFocusField('nomorHeader')}
            onChange={(e) => updateField('nomorHeader', e.target.value)}
            placeholder="205/XI/HUK.6.6./2026"
            className={`${inputBase('nomorHeader')} font-mono-num`}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Bulan &amp; Tahun Header (Hal. 2 dst.)
          </label>
          <input
            type="text"
            data-field-id="bulanTahunHeader"
            value={data.bulanTahunHeader}
            onFocus={() => onFocusField('bulanTahunHeader')}
            onChange={(e) => updateField('bulanTahunHeader', e.target.value)}
            placeholder="NOVEMBER  2026"
            className={inputBase('bulanTahunHeader')}
          />
        </div>
      </section>

      {/* 02. PERTIMBANGAN */}
      <section id="sec-pertimbangan" className="px-4 py-4 space-y-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          02. PERTIMBANGAN
        </h2>
        <textarea
          rows={3}
          data-field-id="pertimbangan"
          value={data.pertimbangan}
          onFocus={() => onFocusField('pertimbangan')}
          onChange={(e) => updateField('pertimbangan', e.target.value)}
          placeholder="bahwa untuk kelancaran kegiatan..."
          className={`${inputBase('pertimbangan')} resize-y leading-relaxed`}
        />
      </section>

      {/* 03. DASAR (POIN 2) */}
      <section id="sec-dasar" className="px-4 py-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            03. DASAR (POIN 2)
          </h2>
          <button
            type="button"
            onClick={addDasar}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Tambah Poin
          </button>
        </div>

        <p className="text-[11px] text-slate-500">
          Poin 1 (UU Nomor 5 Tahun 2026) terkunci sebagai teks blanko hitam.
        </p>

        <div className="space-y-3">
          {data.dasarPoin.map((item, idx) => (
            <div key={item.id}>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700">
                  Dasar Poin {idx + 2}
                </label>
                {data.dasarPoin.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDasar(item.id)}
                    title="Hapus poin dasar"
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
              <textarea
                rows={3}
                data-field-id={`dasar-${item.id}`}
                value={item.text}
                onFocus={() => onFocusField(`dasar-${item.id}`)}
                onChange={(e) => updateDasar(item.id, e.target.value)}
                placeholder={`Dasar poin ${idx + 2}...`}
                className={`${inputBase(`dasar-${item.id}`)} resize-y leading-relaxed`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* 04. PERINTAH / UNTUK (POIN 1 - 4) */}
      <section id="sec-untuk" className="px-4 py-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            04. PERINTAH / UNTUK (POIN 1 – {data.untukPoin.length})
          </h2>
          <button
            type="button"
            onClick={addUntuk}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Tambah Poin
          </button>
        </div>

        <div className="space-y-3">
          {data.untukPoin.map((item, idx) => (
            <div key={item.id}>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700">
                  Untuk Poin {idx + 1}
                </label>
                {data.untukPoin.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeUntuk(item.id)}
                    title={`Hapus Untuk Poin ${idx + 1}`}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
              <textarea
                rows={idx === 0 ? 3 : 2}
                data-field-id={`untuk-${item.id}`}
                value={item.text}
                onFocus={() => onFocusField(`untuk-${item.id}`)}
                onChange={(e) => updateUntuk(item.id, e.target.value)}
                placeholder={`Isi perintah poin ${idx + 1}...`}
                className={`${inputBase(`untuk-${item.id}`)} resize-y leading-relaxed`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* 05. TEMBUSAN */}
      <section id="sec-tembusan" className="px-4 py-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            05. TEMBUSAN (OPSIONAL)
          </h2>
          <button
            type="button"
            onClick={addTembusan}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Tambah
          </button>
        </div>

        {data.tembusan.length === 0 ? (
          <p className="text-[11px] text-slate-500">
            Kosong (tidak ditampilkan di surat). Klik + Tambah bila perlu menambahkan Tembusan.
          </p>
        ) : (
          <div className="space-y-2">
            {data.tembusan.map((t, idx) => (
              <div key={t.id} className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-5 shrink-0 font-mono-num">
                  {idx + 1}.
                </span>
                <input
                  type="text"
                  data-field-id={`tembusan-${t.id}`}
                  value={t.text}
                  onFocus={() => onFocusField(`tembusan-${t.id}`)}
                  onChange={(e) => updateTembusan(t.id, e.target.value)}
                  placeholder="Tujuan tembusan..."
                  className={inputBase(`tembusan-${t.id}`)}
                />
                <button
                  type="button"
                  onClick={() => removeTembusan(t.id)}
                  title="Hapus tembusan"
                  className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 06. DAFTAR DIPERINTAHKAN (KEPADA) & IMPOR EXCEL */}
      <section id="sec-kepada" className="px-4 py-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            06. DAFTAR KEPADA &amp; IMPOR EXCEL
          </h2>
          <span className="text-xs text-slate-500 font-mono-num">
            {data.personel.length} personel
          </span>
        </div>

        {/* Excel Actions */}
        <input
          ref={excelReplaceRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => handleExcelFile(e, 'replace')}
          className="hidden"
        />
        <input
          ref={excelAppendRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => handleExcelFile(e, 'append')}
          className="hidden"
        />

        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => excelReplaceRef.current?.click()}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" />
            Impor Excel
          </button>
          <button
            type="button"
            onClick={() => excelAppendRef.current?.click()}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-white border border-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Sisip Excel
          </button>
        </div>

        <button
          type="button"
          onClick={downloadExcelTemplate}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          Unduh Template Excel (.xlsx)
        </button>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          Format kolom Excel: <span className="font-medium text-slate-700">1. NO, 2. NAMA, 3. PANGKAT, 4. NRP, 5. JABATAN</span>. Otomatis tampil sebagai <span className="font-medium text-slate-700">PANGKAT NAMA NRP</span> (bergaris bawah) dan <span className="font-medium text-slate-700">JABATAN POLSEK SMG SELATAN</span> di baris bawah.
        </p>

        {/* Daftar Personel */}
        <div className="pt-2 space-y-2.5 border-t border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-700">
              Daftar Personel ({data.personel.length})
            </span>
            <button
              type="button"
              onClick={addPersonelRow}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Tambah Baris
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
            {data.personel.map((row, idx) => (
              <div
                key={row.id}
                className="border border-slate-200 rounded-lg p-2.5 space-y-2 bg-slate-50/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 font-mono-num">
                    Personel {idx + 1}
                  </span>
                  {data.personel.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePersonelRow(row.id)}
                      title={`Hapus personel ${idx + 1}`}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-4">
                    <label className="block text-[11px] text-slate-600 mb-0.5">
                      Pangkat
                    </label>
                    <input
                      type="text"
                      data-field-id={`personel-${row.id}-pangkat`}
                      value={row.pangkat}
                      onFocus={() =>
                        onFocusField(`personel-${row.id}-pangkat`)
                      }
                      onChange={(e) =>
                        updatePersonelField(row.id, 'pangkat', e.target.value)
                      }
                      placeholder="IPTU"
                      className={`${inputBase(`personel-${row.id}-pangkat`)} px-2 py-1.5 text-xs`}
                    />
                  </div>
                  <div className="col-span-5">
                    <label className="block text-[11px] text-slate-600 mb-0.5">
                      Nama
                    </label>
                    <input
                      type="text"
                      data-field-id={`personel-${row.id}-nama`}
                      value={row.nama}
                      onFocus={() => onFocusField(`personel-${row.id}-nama`)}
                      onChange={(e) =>
                        updatePersonelField(row.id, 'nama', e.target.value)
                      }
                      placeholder="ANDI SETIYANTO"
                      className={`${inputBase(`personel-${row.id}-nama`)} px-2 py-1.5 text-xs`}
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-[11px] text-slate-600 mb-0.5">
                      NRP
                    </label>
                    <input
                      type="text"
                      data-field-id={`personel-${row.id}-nrp`}
                      value={row.nrp}
                      onFocus={() => onFocusField(`personel-${row.id}-nrp`)}
                      onChange={(e) =>
                        updatePersonelField(row.id, 'nrp', e.target.value)
                      }
                      placeholder="73120096"
                      className={`${inputBase(`personel-${row.id}-nrp`)} px-2 py-1.5 text-xs font-mono-num`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">
                    Jabatan (+ POLSEK SMG SELATAN otomatis)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      data-field-id={`personel-${row.id}-jabatan`}
                      value={formatJabatanWithoutSuffix(row.jabatan)}
                      onFocus={() =>
                        onFocusField(`personel-${row.id}-jabatan`)
                      }
                      onChange={(e) =>
                        updatePersonelField(row.id, 'jabatan', e.target.value)
                      }
                      placeholder="BHABINKAMTIBMAS MUGASARI"
                      className={`${inputBase(`personel-${row.id}-jabatan`)} px-2 py-1.5 text-xs`}
                    />
                    <span className="text-[10px] font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded px-1.5 py-1.5 whitespace-nowrap shrink-0">
                      POLSEK SMG SELATAN
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 07. TANDA TANGAN & STEMPEL */}
      <section id="sec-ttd" className="px-4 py-4 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          07. TANDA TANGAN &amp; STEMPEL
        </h2>

        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={data.transparankanUpload}
            onChange={(e) => updateField('transparankanUpload', e.target.checked)}
            className="w-4 h-4 rounded accent-emerald-700 cursor-pointer"
          />
          <span>Transparankan latar putih saat unggah</span>
        </label>

        {/* TTD Card */}
        <input
          ref={ttdUploadRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleImageUpload(e, 'ttdImage')}
          className="hidden"
        />
        <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50/40">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
              <PenTool className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
              Tanda Tangan (TTD)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => ttdUploadRef.current?.click()}
                className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-white border border-emerald-700/40 rounded-md hover:bg-emerald-50 cursor-pointer"
              >
                Ganti
              </button>
              <button
                type="button"
                onClick={() => updateField('ttdImage', '')}
                title="Hapus tanda tangan"
                className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="h-16 bg-white border border-slate-200 rounded-md flex items-center justify-center overflow-hidden">
            {data.ttdImage ? (
              <img
                src={data.ttdImage}
                alt="Pratinjau Tanda Tangan"
                className="max-h-14 object-contain"
              />
            ) : (
              <span className="text-[11px] text-slate-400">Belum ada TTD</span>
            )}
          </div>
        </div>

        {/* Stempel Card */}
        <input
          ref={stempelUploadRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleImageUpload(e, 'stempelImage')}
          className="hidden"
        />
        <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50/40">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
              <Stamp className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
              Stempel Dinas
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => stempelUploadRef.current?.click()}
                className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-white border border-emerald-700/40 rounded-md hover:bg-emerald-50 cursor-pointer"
              >
                Ganti
              </button>
              <button
                type="button"
                onClick={() => updateField('stempelImage', '')}
                title="Hapus stempel dinas"
                className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="h-16 bg-white border border-slate-200 rounded-md flex items-center justify-center overflow-hidden">
            {data.stempelImage ? (
              <img
                src={data.stempelImage}
                alt="Pratinjau Stempel Dinas"
                className="max-h-14 object-contain"
              />
            ) : (
              <span className="text-[11px] text-slate-400">Belum ada stempel</span>
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          Otomatis terpasang pada halaman pengesahan dengan stempel menimpa seperempat bagian kiri tanda tangan.
        </p>

        {/* Identitas Pejabat & Lokasi TTD */}
        <div className="pt-2 space-y-2.5 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Dikeluarkan di
              </label>
              <input
                type="text"
                data-field-id="dikeluarkanDi"
                value={data.dikeluarkanDi}
                onFocus={() => onFocusField('dikeluarkanDi')}
                onChange={(e) => updateField('dikeluarkanDi', e.target.value)}
                className={inputBase('dikeluarkanDi')}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Pada tanggal
              </label>
              <input
                type="text"
                data-field-id="tanggalTtdSurat"
                value={data.tanggalTtdSurat}
                onFocus={() => onFocusField('tanggalTtdSurat')}
                onChange={(e) => updateField('tanggalTtdSurat', e.target.value)}
                className={inputBase('tanggalTtdSurat')}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Nama Pejabat
              </label>
              <input
                type="text"
                data-field-id="namaPejabat"
                value={data.namaPejabat}
                onFocus={() => onFocusField('namaPejabat')}
                onChange={(e) => updateField('namaPejabat', e.target.value)}
                className={inputBase('namaPejabat')}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Pangkat &amp; NRP
              </label>
              <input
                type="text"
                data-field-id="pangkatNrpPejabat"
                value={data.pangkatNrpPejabat}
                onFocus={() => onFocusField('pangkatNrpPejabat')}
                onChange={(e) =>
                  updateField('pangkatNrpPejabat', e.target.value)
                }
                className={inputBase('pangkatNrpPejabat')}
              />
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM ACTION CONTROLS */}
      <section className="px-4 py-4 space-y-3 bg-slate-50/50">
        <div>
          <div className="text-xs font-medium text-slate-700 mb-2">
            Warna Teks (Pratinjau / Cetak / PDF / Word)
          </div>
          <div
            role="group"
            aria-label="Warna teks hasil akhir"
            className="grid grid-cols-2 p-1 bg-slate-200/70 rounded-lg"
          >
            <button
              type="button"
              onClick={() => onChangePrintBlackMode(true)}
              className={`py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                printBlackMode
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Hitam
            </button>
            <button
              type="button"
              onClick={() => onChangePrintBlackMode(false)}
              className={`py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                !printBlackMode
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hijau (Draft)
            </button>
          </div>
        </div>

        <input
          ref={jsonImportRef}
          type="file"
          accept=".json,application/json"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) onImportJson(file);
          }}
          className="hidden"
        />

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onResetSample}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Contoh Asli
          </button>
          <button
            type="button"
            onClick={onClearForm}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Eraser className="w-3.5 h-3.5" aria-hidden="true" />
            Kosongkan
          </button>
          <button
            type="button"
            onClick={onExportJson}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            Ekspor JSON
          </button>
          <button
            type="button"
            onClick={() => jsonImportRef.current?.click()}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            Impor JSON
          </button>
        </div>
      </section>
    </div>
  );
};
