import { Component, type ReactNode } from 'react';

/** Fängt Fehler beim Anzeigen ab, damit nie nur ein schwarzer Bildschirm bleibt. */
export class Fehlergrenze extends Component<{ children: ReactNode }, { fehler?: Error }> {
  state: { fehler?: Error } = {};
  static getDerivedStateFromError(fehler: Error) {
    return { fehler };
  }
  componentDidCatch(fehler: Error) {
    console.error('Anzeigefehler', fehler);
  }
  render() {
    if (!this.state.fehler) return this.props.children;
    return (
      <div style={{ padding: 24, color: '#222', background: '#fff', minHeight: '100vh', font: '16px system-ui' }}>
        <h2>Hier ist etwas schiefgegangen</h2>
        <p>Deine Daten sind nicht verloren. Bitte gehe zurück zur Startseite.</p>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#a00' }}>{this.state.fehler.message}</pre>
        <button style={{ padding: '12px 16px', fontSize: 16 }} onClick={() => { window.location.hash = '#/'; window.location.reload(); }}>
          Zur Startseite
        </button>
      </div>
    );
  }
}
