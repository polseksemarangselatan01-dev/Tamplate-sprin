import React from 'react';
import { formatJabatanWithoutSuffix, SprinData } from '../types/sprin';
import {
  buildDocumentPages,
  DasarChunk,
  getTotalPages,
  KepadaChunk,
  TembusanChunk,
  UntukChunk,
} from '../utils/pagination';

export { buildDocumentPages, getTotalPages };
export type {
  DasarChunk,
  KepadaChunk,
  PagePlan,
  TembusanChunk,
  UntukChunk,
} from '../utils/pagination';

interface A4DocumentProps {
  data: SprinData;
  activeField: string | null;
  onSelectField: (fieldId: string) => void;
  printBlackMode: boolean;
  zoomScale: number;
}

interface FillSpanProps {
  fieldId: string;
  value: string;
  placeholder: string;
  activeField: string | null;
  onSelectField: (fieldId: string) => void;
  className?: string;
}

function FillSpan({
  fieldId,
  value,
  placeholder,
  activeField,
  onSelectField,
  className = '',
}: FillSpanProps) {
  const isEmpty = !value || value.trim().length === 0;
  const isActive = activeField === fieldId;

  return (
    <span
      role="button"
      tabIndex={0}
      title="Klik untuk mengedit kolom isian ini"
      onClick={(e) => {
        e.stopPropagation();
        onSelectField(fieldId);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectField(fieldId);
        }
      }}
      className={`a4-fill-text cursor-pointer ${isActive ? 'is-active' : ''} ${
        isEmpty ? 'italic opacity-70 underline decoration-dashed' : ''
      } ${className}`}
    >
      {isEmpty ? `[${placeholder}]` : value}
    </span>
  );
}

interface SignatureBlockProps {
  dikeluarkanDi: string;
  tanggalText: string;
  tanggalFieldId: string;
  namaPejabat: string;
  pangkatNrpPejabat: string;
  ttdImage: string;
  stempelImage: string;
  activeField: string | null;
  onSelectField: (fieldId: string) => void;
  compact?: boolean;
}

function SignatureBlock({
  dikeluarkanDi,
  tanggalText,
  tanggalFieldId,
  namaPejabat,
  pangkatNrpPejabat,
  ttdImage,
  stempelImage,
  activeField,
  onSelectField,
  compact = false,
}: SignatureBlockProps) {
  return (
    <div className="ml-auto w-[108mm]">
      <div className="ml-[24mm] w-[76mm] border-b border-black pb-[0.6mm]">
        <div className="flex">
          <span className="w-[30mm] shrink-0 a4-fixed-text select-none">
            Dikeluarkan di
          </span>
          <span className="w-[3mm] shrink-0 a4-fixed-text select-none">:</span>
          <span className="flex-1">
            <FillSpan
              fieldId="dikeluarkanDi"
              value={dikeluarkanDi}
              placeholder="Semarang"
              activeField={activeField}
              onSelectField={onSelectField}
            />
          </span>
        </div>
        <div className="flex mt-[0.4mm]">
          <span className="w-[30mm] shrink-0 a4-fixed-text select-none">
            Pada tanggal
          </span>
          <span className="w-[3mm] shrink-0 a4-fixed-text select-none">:</span>
          <span className="flex-1 whitespace-pre-wrap">
            <FillSpan
              fieldId={tanggalFieldId}
              value={tanggalText}
              placeholder="Tanggal"
              activeField={activeField}
              onSelectField={onSelectField}
            />
          </span>
        </div>
      </div>

      <div className="mt-[1.2mm] text-center">
        <div className="a4-fixed-text select-none whitespace-nowrap text-[11.2pt]">
          KAPOLSEK SEMARANG SELATAN POLRESTABES SEMARANG
        </div>

        {/* Area Tanda Tangan & Stempel: jarak tepat 4 baris (21mm) antara KAPOLSEK dan Nama Pejabat */}
        <div className="relative h-[21mm] flex items-center justify-center">
          {stempelImage && (
            <img
              src={stempelImage}
              alt="Stempel Dinas"
              className="pointer-events-none select-none absolute left-[1mm] top-1/2 -translate-y-1/2 w-[50mm] h-[50mm] object-contain z-10"
            />
          )}
          {ttdImage && (
            <img
              src={ttdImage}
              alt="Tanda Tangan Pejabat"
              className="pointer-events-none select-none absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-[calc(50%-6mm)] z-20 h-[51mm] w-[96mm] max-w-none object-contain"
            />
          )}
        </div>

        <div className="relative z-30">
          <span className="inline-block border-b border-black pb-[0.2mm]">
            <FillSpan
              fieldId="namaPejabat"
              value={namaPejabat}
              placeholder="NAMA PEJABAT"
              activeField={activeField}
              onSelectField={onSelectField}
            />
          </span>
        </div>
        <div className="relative z-30 mt-[0.4mm]">
          <FillSpan
            fieldId="pangkatNrpPejabat"
            value={pangkatNrpPejabat}
            placeholder="PANGKAT NRP"
            activeField={activeField}
            onSelectField={onSelectField}
          />
        </div>
      </div>
    </div>
  );
}

interface PageHeaderProps {
  pageNumber: number;
  titleLine: string;
  nomorHeader: string;
  bulanTahunHeader: string;
  activeField: string | null;
  onSelectField: (fieldId: string) => void;
}

function ContinuationHeader({
  pageNumber,
  titleLine,
  nomorHeader,
  bulanTahunHeader,
  activeField,
  onSelectField,
}: PageHeaderProps) {
  return (
    <div className="mb-[5mm]">
      <div className="text-center a4-fixed-text select-none mb-[1.5mm]">
        {pageNumber}
      </div>
      <div className="flex justify-end">
        <div className="w-[82mm] border-b border-black pb-[0.8mm] text-[10.8pt] leading-[1.22]">
          <div className="a4-fixed-text select-none">{titleLine}</div>
          <div className="flex">
            <span className="w-[21mm] shrink-0 a4-fixed-text select-none">
              NOMOR
            </span>
            <span className="a4-fixed-text select-none mr-[1mm]">:SPRIN/</span>
            <FillSpan
              fieldId="nomorHeader"
              value={nomorHeader}
              placeholder="205/XI/HUK.6.6./2026"
              activeField={activeField}
              onSelectField={onSelectField}
            />
          </div>
          <div className="flex">
            <span className="w-[21mm] shrink-0 a4-fixed-text select-none">
              TANGGAL
            </span>
            <span className="a4-fixed-text select-none mr-[1mm]">:</span>
            <FillSpan
              fieldId="bulanTahunHeader"
              value={bulanTahunHeader}
              placeholder="NOVEMBER  2026"
              activeField={activeField}
              onSelectField={onSelectField}
              className="whitespace-pre-wrap"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const A4Document: React.FC<A4DocumentProps> = ({
  data,
  activeField,
  onSelectField,
  printBlackMode,
  zoomScale,
}) => {
  const nomorParts = data.nomorHeader.split('/');
  const nomorSuffix =
    nomorParts.length > 1
      ? `/ ${nomorParts.slice(1).join(' / ')}`
      : '/ XI / HUK.6.6./2026';

  const pages = buildDocumentPages(data);

  const renderDasarSection = (chunk: DasarChunk, addTopMargin: boolean) => (
    <div className={`${addTopMargin ? 'mt-[3.5mm]' : ''} flex items-start`}>
      <div className="w-[28mm] shrink-0 a4-fixed-text select-none">
        {chunk.showLabel ? 'Dasar' : ''}
      </div>
      <div className="w-[5mm] shrink-0 a4-fixed-text select-none">
        {chunk.showLabel ? ':' : ''}
      </div>
      <div className="flex-1 space-y-[2.6mm]">
        {chunk.includePointOne && (
          <div className="flex items-start text-justify a4-fixed-text select-none">
            <div className="w-[6mm] shrink-0">1.</div>
            <div className="flex-1">
              Undang-undang (UU) Nomor 5 Tahun 2026 tentang Perubahan Ketiga
              atas Undang-Undang Nomor 2 Tahun 2002 tentang Kepolisian Negara
              Republik Indonesia;
            </div>
          </div>
        )}

        {chunk.rows.map((item, idx) => {
          const poinNo = chunk.startIndex + idx + 2;
          return (
            <div key={item.id} className="flex items-start text-justify">
              <div className="w-[6mm] shrink-0 a4-fill-text select-none">
                {poinNo}.
              </div>
              <div className="flex-1">
                <FillSpan
                  fieldId={`dasar-${item.id}`}
                  value={item.text}
                  placeholder={`Dasar poin ${poinNo}`}
                  activeField={activeField}
                  onSelectField={onSelectField}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderKepadaList = (chunk: KepadaChunk) => (
    <div className="flex items-start">
      <div className="w-[28mm] shrink-0 a4-fixed-text select-none">
        {chunk.showLabel ? 'Kepada' : ''}
      </div>
      <div className="w-[5mm] shrink-0 a4-fixed-text select-none">
        {chunk.showLabel ? ':' : ''}
      </div>
      <div className="flex-1 space-y-[1.8mm]">
        {chunk.rows.map((person, idx) => {
          const cleanJabatan = formatJabatanWithoutSuffix(person.jabatan);
          const rowNumber = chunk.startIndex + idx + 1;

          return (
            <div key={person.id} className="flex items-start leading-[1.22]">
              <div className="w-[7mm] shrink-0 a4-fixed-text select-none">
                {rowNumber}.
              </div>
              <div className="flex-1">
                <div>
                  <span className="inline-block border-b border-black pb-[0.2mm]">
                    <FillSpan
                      fieldId={`personel-${person.id}-pangkat`}
                      value={person.pangkat}
                      placeholder="PANGKAT"
                      activeField={activeField}
                      onSelectField={onSelectField}
                    />
                    <span className="select-none">{'  '}</span>
                    <FillSpan
                      fieldId={`personel-${person.id}-nama`}
                      value={person.nama}
                      placeholder="NAMA PERSONEL"
                      activeField={activeField}
                      onSelectField={onSelectField}
                    />
                    <span className="a4-fixed-text select-none">
                      {'   NRP   '}
                    </span>
                    <FillSpan
                      fieldId={`personel-${person.id}-nrp`}
                      value={person.nrp}
                      placeholder="NRP"
                      activeField={activeField}
                      onSelectField={onSelectField}
                    />
                  </span>
                </div>
                <div className="mt-[0.4mm]">
                  <FillSpan
                    fieldId={`personel-${person.id}-jabatan`}
                    value={cleanJabatan}
                    placeholder="JABATAN"
                    activeField={activeField}
                    onSelectField={onSelectField}
                  />
                  <span className="a4-fixed-text select-none">
                    {' POLSEK SMG SELATAN'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderUntukSection = (chunk: UntukChunk, addTopMargin: boolean) => (
    <div className={`${addTopMargin ? 'mt-[3.5mm]' : ''} flex items-start`}>
      <div className="w-[28mm] shrink-0 a4-fixed-text select-none pl-[2.5mm]">
        {chunk.showLabel ? 'Untuk' : ''}
      </div>
      <div className="w-[5mm] shrink-0 a4-fixed-text select-none">
        {chunk.showLabel ? ':' : ''}
      </div>
      <div className="flex-1 space-y-[1.8mm]">
        {chunk.rows.map((item, idx) => {
          const poinNo = chunk.startIndex + idx + 1;
          return (
            <div key={item.id} className="flex items-start text-justify">
              <div className="w-[7mm] shrink-0 a4-fill-text select-none">
                {poinNo}.
              </div>
              <div className="flex-1">
                <FillSpan
                  fieldId={`untuk-${item.id}`}
                  value={item.text}
                  placeholder={`Untuk poin ${poinNo}`}
                  activeField={activeField}
                  onSelectField={onSelectField}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderTembusanSection = (
    chunk: TembusanChunk,
    compact = false,
    hasPreviousContent = true
  ) => {
    if (chunk.rows.length === 0) return null;
    const topClass = !hasPreviousContent
      ? ''
      : compact
        ? 'mt-[3mm]'
        : 'mt-[8mm]';
    return (
      <div className={topClass}>
        {chunk.showLabel && (
          <div className="a4-fixed-text select-none inline-block border-b border-black pb-[0.2mm] mb-[1mm]">
            Tembusan :
          </div>
        )}
        <div>
          <div className="inline-block min-w-[78mm] border-b border-black pb-[0.8mm]">
            {chunk.rows.map((t, idx) => {
              const poinNo = chunk.startIndex + idx + 1;
              return (
                <div key={t.id} className="flex items-start leading-[1.25]">
                  <span className="w-[5.5mm] shrink-0 a4-fill-text select-none">
                    {poinNo}.
                  </span>
                  <FillSpan
                    fieldId={`tembusan-${t.id}`}
                    value={t.text}
                    placeholder="Tujuan tembusan"
                    activeField={activeField}
                    onSelectField={onSelectField}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderScaledPage = (pageNum: number, content: React.ReactNode) => (
    <div
      key={`a4-page-${pageNum}`}
      className="print-page-item"
      style={{
        width: `calc(210mm * ${zoomScale})`,
        height: `calc(297mm * ${zoomScale})`,
      }}
    >
      <div
        className="print-zoom-wrapper origin-top-left"
        style={{
          transform: `scale(${zoomScale})`,
          width: '210mm',
          height: '297mm',
        }}
      >
        <div
          className={`a4-sheet shadow-[0_10px_30px_rgba(15,23,42,0.12)] border border-slate-200 ${
            printBlackMode ? 'print-black-mode' : ''
          }`}
        >
          {content}
        </div>
      </div>
    </div>
  );

  return (
    <div className="print-pages-stack flex flex-col items-center gap-6">
      {pages.map((plan) => {
        const hasHeaderContent =
          Boolean(plan.includeHeader) ||
          Boolean(plan.dasarChunk) ||
          Boolean(plan.kepadaChunk && plan.kepadaChunk.rows.length > 0);
        const hasAnyAboveTembusan =
          hasHeaderContent ||
          Boolean(plan.untukChunk && plan.untukChunk.rows.length > 0) ||
          Boolean(plan.includeSignature);

        return renderScaledPage(
          plan.pageNumber,
          <>
            {plan.type === 'cont' && (
              <ContinuationHeader
                pageNumber={plan.pageNumber}
                titleLine="SPRIN  KAPOLSEK SEMARANG SELATAN"
                nomorHeader={data.nomorHeader}
                bulanTahunHeader={data.bulanTahunHeader}
                activeField={activeField}
                onSelectField={onSelectField}
              />
            )}

            {plan.includeHeader && (
              <>
                {/* Kop Surat */}
                <div className="a4-fixed-text select-none">
                  <div className="inline-block text-center border-b border-black pb-[0.6mm] leading-[1.15]">
                    <div>POLRI DAERAH JAWA TENGAH</div>
                    <div>RESOR KOTA BESAR SEMARANG</div>
                    <div>SEKTOR SEMARANG SELATAN</div>
                  </div>
                </div>

                {/* Lambang Tribrata & Judul */}
                <div className="mt-[3.5mm] text-center">
                  <div className="flex justify-center">
                    <img
                      src="/assets/tribrata-emblem.png"
                      alt="Lambang Tribrata Polri"
                      className="w-[18.5mm] h-[16.5mm] object-contain select-none"
                    />
                  </div>

                  <div className="mt-[1.2mm] a4-fixed-text select-none">
                    <span className="inline-block w-[76mm] border-b border-black pb-[0.3mm] tracking-[0.02em]">
                      SURAT PERINTAH
                    </span>
                  </div>

                  <div className="mt-[0.7mm]">
                    <span className="a4-fixed-text select-none">
                      Nomor : Sprin /{' '}
                    </span>
                    <FillSpan
                      fieldId="nomorUrut"
                      value={data.nomorUrut}
                      placeholder="205"
                      activeField={activeField}
                      onSelectField={onSelectField}
                    />
                    <span className="a4-fixed-text select-none">
                      {' '}
                      {nomorSuffix}
                    </span>
                  </div>
                </div>

                {/* Pertimbangan */}
                <div className="mt-[4mm] flex items-start">
                  <div className="w-[28mm] shrink-0 a4-fixed-text select-none">
                    Pertimbangan
                  </div>
                  <div className="w-[5mm] shrink-0 a4-fixed-text select-none">
                    :
                  </div>
                  <div className="flex-1 text-justify">
                    <FillSpan
                      fieldId="pertimbangan"
                      value={data.pertimbangan}
                      placeholder="isi pertimbangan surat perintah"
                      activeField={activeField}
                      onSelectField={onSelectField}
                    />
                  </div>
                </div>
              </>
            )}

            {plan.dasarChunk &&
              renderDasarSection(plan.dasarChunk, Boolean(plan.includeHeader))}

            {plan.includeDiperintahkan && (
              <div className="mt-[5.5mm] mb-[4mm] text-center a4-fixed-text select-none">
                DIPERINTAHKAN
              </div>
            )}

            {plan.kepadaChunk &&
              plan.kepadaChunk.rows.length > 0 &&
              renderKepadaList(plan.kepadaChunk)}

            {plan.untukChunk &&
              plan.untukChunk.rows.length > 0 &&
              renderUntukSection(plan.untukChunk, hasHeaderContent)}

            {plan.includeSignature && (
              <>
                <div
                  className={`${
                    plan.type === 'main' ? 'mt-[1mm]' : 'mt-[3mm]'
                  } a4-fixed-text select-none`}
                >
                  Selesai.
                </div>
                <div
                  className={plan.type === 'main' ? 'mt-[2mm]' : 'mt-[3mm]'}
                >
                  <SignatureBlock
                    dikeluarkanDi={data.dikeluarkanDi}
                    tanggalText={data.tanggalTtdSurat}
                    tanggalFieldId="tanggalTtdSurat"
                    namaPejabat={data.namaPejabat}
                    pangkatNrpPejabat={data.pangkatNrpPejabat}
                    ttdImage={data.ttdImage}
                    stempelImage={data.stempelImage}
                    activeField={activeField}
                    onSelectField={onSelectField}
                    compact={plan.type === 'main'}
                  />
                </div>
              </>
            )}

            {plan.tembusanChunk &&
              renderTembusanSection(
                plan.tembusanChunk,
                plan.type === 'main',
                hasAnyAboveTembusan
              )}
          </>
        );
      })}
    </div>
  );
};
