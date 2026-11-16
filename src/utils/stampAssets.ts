/**
 * Utility untuk membuat Tanda Tangan & Stempel Dinas default (transparan PNG)
 * serta memproses gambar unggahan pengguna agar latar putih menjadi transparan.
 */

let cachedDefaultTtd: string | null = null;
let cachedDefaultStempel: string | null = null;

export function getDefaultTtdDataUrl(): string {
  if (cachedDefaultTtd) return cachedDefaultTtd;
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#111827';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Skala 2.4x dan diperluas mengisi hampir seluruh kanvas agar tampil 3x lebih besar & tajam
  ctx.save();
  ctx.translate(-210, -24);
  ctx.scale(2.35, 2.25);

  ctx.lineWidth = 3.0;
  ctx.beginPath();
  ctx.moveTo(105, 118);
  ctx.bezierCurveTo(108, 72, 114, 34, 122, 26);
  ctx.bezierCurveTo(128, 20, 126, 56, 116, 108);
  ctx.stroke();

  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(116, 72);
  ctx.bezierCurveTo(132, 46, 152, 48, 148, 66);
  ctx.bezierCurveTo(145, 79, 124, 82, 128, 92);
  ctx.bezierCurveTo(134, 104, 162, 112, 174, 88);
  ctx.bezierCurveTo(182, 72, 188, 62, 194, 78);
  ctx.bezierCurveTo(198, 90, 208, 94, 222, 82);
  ctx.bezierCurveTo(234, 72, 246, 76, 256, 86);
  ctx.bezierCurveTo(266, 94, 286, 88, 304, 82);
  ctx.stroke();

  ctx.lineWidth = 2.3;
  ctx.beginPath();
  ctx.moveTo(154, 106);
  ctx.bezierCurveTo(205, 100, 265, 102, 336, 118);
  ctx.stroke();

  ctx.restore();

  cachedDefaultTtd = canvas.toDataURL('image/png');
  return cachedDefaultTtd;
}

export function getDefaultStempelDataUrl(): string {
  if (cachedDefaultStempel) return cachedDefaultStempel;
  if (typeof document === 'undefined') return '';

  // Resolusi tinggi 420x420 untuk ukuran cetak tepat 5 cm (50mm)
  const baseSize = 280;
  const size = 420;
  const scaleFactor = size / baseSize;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.scale(scaleFactor, scaleFactor);

  const cx = baseSize / 2;
  const cy = baseSize / 2;
  const stampColor = 'rgba(88, 44, 155, 0.84)';

  ctx.clearRect(0, 0, baseSize, baseSize);
  ctx.strokeStyle = stampColor;
  ctx.fillStyle = stampColor;

  // Lingkaran luar ganda
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.arc(cx, cy, 126, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(cx, cy, 120, 0, Math.PI * 2);
  ctx.stroke();

  // Lingkaran dalam
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(cx, cy, 78, 0, Math.PI * 2);
  ctx.stroke();

  // Dua garis paralel horizontal di tengah lingkaran dalam
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx - 76, cy - 16);
  ctx.lineTo(cx + 76, cy - 16);
  ctx.moveTo(cx - 76, cy + 16);
  ctx.lineTo(cx + 76, cy + 16);
  ctx.stroke();

  // Tulisan KEPALA di tengah
  ctx.font = 'bold 17px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('KEPALA', cx, cy + 1);

  // Fungsi pembantu teks melingkar
  const drawArcText = (
    text: string,
    radius: number,
    startAngle: number,
    endAngle: number,
    inward = false
  ) => {
    ctx.save();
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const len = text.length;
    const step = len > 1 ? (endAngle - startAngle) / (len - 1) : 0;
    for (let i = 0; i < len; i++) {
      const angle = startAngle + step * i;
      ctx.save();
      ctx.translate(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
      ctx.rotate(angle + (inward ? -Math.PI / 2 : Math.PI / 2));
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }
    ctx.restore();
  };

  // Teks atas melingkar
  drawArcText(
    'POLRI RESOR KOTA BESAR SEMARANG',
    99,
    -Math.PI * 0.96,
    -Math.PI * 0.04,
    false
  );

  // Teks bawah melingkar
  drawArcText(
    'SEKTOR SEMARANG SELATAN',
    101,
    Math.PI * 0.88,
    Math.PI * 0.12,
    true
  );

  // Bintang kecil di sisi kiri & kanan
  const drawStar = (sx: number, sy: number, r: number) => {
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? r : r * 0.42;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const px = sx + Math.cos(a) * rad;
      const py = sy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  drawStar(cx - 101, cy + 4, 7);
  drawStar(cx + 101, cy + 4, 7);

  // Ornamen simbol Tribrata minimalis di bagian atas dalam
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 58);
  ctx.lineTo(cx - 18, cy - 28);
  ctx.lineTo(cx + 18, cy - 28);
  ctx.closePath();
  ctx.stroke();

  // Tulisan kecil di bagian bawah dalam
  ctx.font = 'bold 9.5px Arial, sans-serif';
  ctx.fillText('POLSEK', cx, cy + 38);
  ctx.fillText('SMG SELATAN', cx, cy + 51);

  cachedDefaultStempel = canvas.toDataURL('image/png');
  return cachedDefaultStempel;
}

export function processUploadedImage(
  file: File,
  makeTransparent: boolean
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak valid.'));
      img.onload = () => {
        const maxDim = 900;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        if (makeTransparent) {
          const imageData = ctx.getImageData(0, 0, width, height);
          const d = imageData.data;
          for (let i = 0; i < d.length; i += 4) {
            const r = d[i];
            const g = d[i + 1];
            const b = d[i + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            const maxC = Math.max(r, g, b);
            const minC = Math.min(r, g, b);
            const sat = maxC - minC;

            // Hapus piksel putih/abu terang menjadi transparan
            if (lum > 235 && sat < 30) {
              d[i + 3] = 0;
            } else if (lum > 205 && sat < 35) {
              const alphaRatio = (235 - lum) / 30;
              d[i + 3] = Math.round(d[i + 3] * Math.max(0, Math.min(1, alphaRatio)));
            }
          }
          ctx.putImageData(imageData, 0, 0);
        }

        resolve(canvas.toDataURL('image/png'));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function dataUrlToUint8Array(dataUrl: string): Uint8Array | null {
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    const binary = atob(parts[1]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

function loadImageElement(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Menggabungkan Stempel Dinas (ukuran tepat 5 cm = 50mm x 50mm) dan TTD (diperbesar 3x)
 * menjadi satu gambar PNG transparan beresolusi tinggi untuk PDF & Word.
 * Dimensi proporsional area: 112mm x 52mm (10px per mm -> 1120 x 520 px).
 */
export async function compositeSignatureAndStampPng(
  ttdImage: string,
  stempelImage: string
): Promise<string | null> {
  if (!ttdImage && !stempelImage) return null;
  if (typeof document === 'undefined') return null;

  const [ttdImg, stempelImg] = await Promise.all([
    loadImageElement(ttdImage),
    loadImageElement(stempelImage),
  ]);

  if (!ttdImg && !stempelImg) return null;

  // Kanvas 112mm x 52mm @ 10 px/mm = 1120 x 520 px
  const canvas = document.createElement('canvas');
  canvas.width = 1120;
  canvas.height = 520;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Stempel ukuran tepat 5 cm = 50mm x 50mm (500 x 500 px) di sebelah kiri
  if (stempelImg) {
    const sSize = 500;
    const sx = 10;
    const sy = (canvas.height - sSize) / 2;
    ctx.drawImage(stempelImg, sx, sy, sSize, sSize);
  }

  // Tanda tangan diperbesar 3x (kotak 96mm x 51mm = 960 x 510 px) menimpa di kanan
  if (ttdImg) {
    const maxW = 960;
    const maxH = 510;
    const ratio = Math.min(maxW / ttdImg.width, maxH / ttdImg.height);
    const drawW = ttdImg.width * ratio;
    const drawH = ttdImg.height * ratio;
    const tx = 140 + (maxW - drawW) / 2;
    const ty = (canvas.height - drawH) / 2;
    ctx.drawImage(ttdImg, tx, ty, drawW, drawH);
  }

  return canvas.toDataURL('image/png');
}

