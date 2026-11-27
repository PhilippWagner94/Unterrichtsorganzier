// Lokale Texterkennung. Alle Dateien (Worker, WASM, Sprachdaten) liegen auf dem eigenen Server
// unter /tesseract/ und werden danach im Gerät zwischengespeichert. Es wird nichts hochgeladen.
export async function erkenneText(bild: Blob, fortschritt: (anteil: number, status: string) => void): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const basis = `${import.meta.env.BASE_URL}tesseract`;
  const worker = await createWorker('deu', 1, {
    workerPath: `${basis}/worker.min.js`,
    corePath: basis,
    langPath: basis,
    gzip: true,
    workerBlobURL: false,
    logger: (m: { status: string; progress: number }) => fortschritt(m.progress ?? 0, m.status),
  });
  try {
    const { data } = await worker.recognize(bild);
    return data.text;
  } finally {
    await worker.terminate();
  }
}
