/** Verkleinert ein Bild (längste Kante max. `maxKante` Pixel) und gibt es als JPEG-Blob zurück. */
export async function verkleinereBild(datei: Blob, maxKante = 1600, qualitaet = 0.82): Promise<Blob> {
  const bitmap = await ladeBitmap(datei);
  const faktor = Math.min(1, maxKante / Math.max(bitmap.width, bitmap.height));
  const b = Math.max(1, Math.round(bitmap.width * faktor));
  const h = Math.max(1, Math.round(bitmap.height * faktor));
  const canvas = document.createElement('canvas');
  canvas.width = b;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Bild konnte nicht verarbeitet werden.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, b, h);
  ctx.drawImage(bitmap.quelle, 0, 0, b, h);
  if ('close' in bitmap.quelle && typeof bitmap.quelle.close === 'function') bitmap.quelle.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Bild konnte nicht gespeichert werden.'))), 'image/jpeg', qualitaet),
  );
}

interface GeladenesBild {
  quelle: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
}

async function ladeBitmap(datei: Blob): Promise<GeladenesBild> {
  // createImageBitmap berücksichtigt die EXIF-Ausrichtung (wichtig bei iPhone-Fotos).
  if (typeof createImageBitmap === 'function') {
    try {
      const bm = await createImageBitmap(datei, { imageOrientation: 'from-image' } as ImageBitmapOptions);
      return { quelle: bm, width: bm.width, height: bm.height };
    } catch {
      /* Rückfall unten */
    }
  }
  const url = URL.createObjectURL(datei);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Das Bild konnte nicht gelesen werden.'));
      i.src = url;
    });
    return { quelle: img, width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}
