import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { seedBeiBedarf } from './db/seed';
import { persistenterSpeicher } from './db/backup';
import './styles.css';

registerSW({ immediate: true });

async function start() {
  try {
    await seedBeiBedarf();
    await persistenterSpeicher();
  } catch (e) {
    console.error('Start-Initialisierung fehlgeschlagen', e);
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

start();
