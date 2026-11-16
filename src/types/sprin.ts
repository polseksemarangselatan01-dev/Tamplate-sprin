export interface DasarItem {
  id: string;
  text: string;
}

export interface UntukItem {
  id: string;
  text: string;
}

export interface TembusanItem {
  id: string;
  text: string;
}

export interface PersonelRow {
  id: string;
  pangkat: string;
  nama: string;
  nrp: string;
  jabatan: string;
}

export interface SprinData {
  // 01. Nomor & Header Halaman 2+
  nomorUrut: string;
  nomorHeader: string;
  bulanTahunHeader: string;

  // 02. Pertimbangan
  pertimbangan: string;

  // 03. Dasar (Poin 2 dst.)
  dasarPoin: DasarItem[];

  // 04. Perintah / Untuk (Poin 1 - 4 dst.)
  untukPoin: UntukItem[];

  // 05. Tembusan
  tembusan: TembusanItem[];

  // 06. Daftar Kepada (Personel)
  personel: PersonelRow[];

  // Pengesahan Pejabat
  dikeluarkanDi: string;
  tanggalTtdSurat: string;
  namaPejabat: string;
  pangkatNrpPejabat: string;

  // 07. Tanda Tangan & Stempel
  ttdImage: string;
  stempelImage: string;
  transparankanUpload: boolean;
}

export function formatJabatanWithoutSuffix(jabatan: string): string {
  return jabatan
    .replace(/\s*POLSEK\s+(SMG|SEMARANG)\s+SELATAN\s*$/i, '')
    .trim();
}

export const DEFAULT_PERSONEL_ROWS: PersonelRow[] = [
  {
    id: 'pers-1',
    pangkat: 'IPTU',
    nama: 'ANDI SETIYANTO',
    nrp: '73120096',
    jabatan: 'BHABINKAMTIBMAS MUGASARI',
  },
  {
    id: 'pers-2',
    pangkat: 'AIPDA',
    nama: 'SUPRIYATNO',
    nrp: '72100456',
    jabatan: 'BAUNIT SAMAPTA',
  },
  {
    id: 'pers-3',
    pangkat: 'AIPDA',
    nama: 'WARDOYO',
    nrp: '83101282',
    jabatan: 'BAUNIT SAMAPTA',
  },
];

export const DEFAULT_SPRIN_DATA: SprinData = {
  nomorUrut: '205',
  nomorHeader: '205/XI/HUK.6.6./2026',
  bulanTahunHeader: 'NOVEMBER  2026',

  pertimbangan:
    'bahwa untuk kelancaran kegiatan Funrun dan Cek kesehatan gratis yang diselenggarakan oleh Poltekes Kemenkes Semarang, maka dipandang perlu mengeluarkan Surat Perintah ini;',

  dasarPoin: [
    {
      id: 'dasar-2',
      text: 'surat rekomendasi Kapolsek Semarang Selatan, Nomor: B/291/XIYAN.2.1./2026 tanggal 13 November 2026, tentang rekomendasi kegiatan;',
    },
  ],

  untukPoin: [
    {
      id: 'untuk-1',
      text: 'Disamping melaksanakan tugasnya sehari-hari, melaksanakan pengamanan kegiatan Funrun dan Cek kesehatan gratis yang diselenggarakan oleh Poltekes Kemenkes Semarang;',
    },
    {
      id: 'untuk-2',
      text: 'kegiatan dilaksanakan pada hari Minggu tanggal 15 November 2026 pukul 05.00 Wib s.d selesai di halaman kantor Gubernur Jawa Tengah;',
    },
    {
      id: 'untuk-3',
      text: 'melaksanakan perintah ini dengan seksama dan penuh rasa tanggung jawab;',
    },
    {
      id: 'untuk-4',
      text: 'melaporkan hasil pelaksanaan tugas kepada Kapolsek;',
    },
  ],

  tembusan: [],

  personel: DEFAULT_PERSONEL_ROWS,

  dikeluarkanDi: 'Semarang',
  tanggalTtdSurat: '13 November  2026',
  namaPejabat: 'RISMANTO,S.H.,M.H.',
  pangkatNrpPejabat: 'KOMISARIS POLISI NRP 73020406',

  ttdImage: '',
  stempelImage: '',
  transparankanUpload: true,
};

export const EMPTY_SPRIN_DATA: SprinData = {
  nomorUrut: '',
  nomorHeader: '/XI/HUK.6.6./2026',
  bulanTahunHeader: 'NOVEMBER  2026',

  pertimbangan: '',

  dasarPoin: [
    {
      id: 'dasar-2',
      text: '',
    },
  ],

  untukPoin: [
    { id: 'untuk-1', text: '' },
    { id: 'untuk-2', text: '' },
    {
      id: 'untuk-3',
      text: 'melaksanakan perintah ini dengan seksama dan penuh rasa tanggung jawab;',
    },
    {
      id: 'untuk-4',
      text: 'melaporkan hasil pelaksanaan tugas kepada Kapolsek;',
    },
  ],

  tembusan: [],

  personel: [
    {
      id: 'pers-1',
      pangkat: '',
      nama: '',
      nrp: '',
      jabatan: '',
    },
  ],

  dikeluarkanDi: 'Semarang',
  tanggalTtdSurat: '',
  namaPejabat: 'RISMANTO,S.H.,M.H.',
  pangkatNrpPejabat: 'KOMISARIS POLISI NRP 73020406',

  ttdImage: '',
  stempelImage: '',
  transparankanUpload: true,
};
