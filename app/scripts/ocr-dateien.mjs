// Kopiert die OCR-Dateien (Worker, WASM-Kern, deutsche Sprachdaten) nach public/tesseract,
// damit die Texterkennung komplett lokal ohne Internet läuft.
import { copyFileSync, mkdirSync } from 'node:fs';
const ziel = 'public/tesseract';
mkdirSync(ziel, { recursive: true });
const kopie = (von, nach) => copyFileSync(von, `${ziel}/${nach}`);
kopie('node_modules/tesseract.js/dist/worker.min.js', 'worker.min.js');
for (const f of ['tesseract-core-simd-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm', 'tesseract-core-lstm.wasm.js', 'tesseract-core-lstm.wasm'])
  kopie(`node_modules/tesseract.js-core/${f}`, f);
kopie('node_modules/@tesseract.js-data/deu/4.0.0_best_int/deu.traineddata.gz', 'deu.traineddata.gz');
console.log('OCR-Dateien kopiert');
