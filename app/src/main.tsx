import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { Fehlergrenze } from './components/Fehlergrenze';
import { seedBeiBedarf, ergaenzungenAnwenden } from './db/seed';
import { persistenterSpeicher } from './db/backup';
import './styles.css';

registerSW({ immediate: true });

async function start() {
  try {
    await seedBeiBedarf();
    await ergaenzungenAnwenden();
    await persistenterSpeicher();
  } catch (e) {
    console.error('Start-Initialisierung fehlgeschlagen', e);
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Fehlergrenze><App /></Fehlergrenze>
    </StrictMode>,
  );
}

start();
