import TagPage from './features/arbeitszeit/TagPage';
import ArbeitszeitPage from './features/arbeitszeit/ArbeitszeitPage';
import StatistikPage from './features/arbeitszeit/StatistikPage';
import AufgabenPage from './features/aufgaben/AufgabenPage';
import FaecherPage from './features/mehr/FaecherPage';
import { HashRouter, NavLink, Route, Routes } from 'react-router-dom';
import HeutePage from './features/heute/HeutePage';
import KalenderPage from './features/kalender/KalenderPage';
import KlassenPage from './features/klassen/KlassenPage';
import KlassePage from './features/klassen/KlassePage';
import SchuelerPage from './features/klassen/SchuelerPage';
import PlanPage from './features/plan/PlanPage';
import LernzielePage from './features/plan/LernzielePage';
import EinheitPage from './features/kalender/EinheitPage';
import BibliothekPage from './features/bibliothek/BibliothekPage';
import SpielPage from './features/bibliothek/SpielPage';
import ReihePage from './features/bibliothek/ReihePage';
import NotizPage from './features/bibliothek/NotizPage';
import WettkaempfePage from './features/wettkaempfe/WettkaempfePage';
import WettkampfPage from './features/wettkaempfe/WettkampfPage';
import TestsPage from './features/tests/TestsPage';
import TestPage from './features/tests/TestPage';
import NotenPage from './features/tests/NotenPage';
import FotoPage from './features/foto/FotoPage';
import MehrPage from './features/mehr/MehrPage';
import SchuljahrPage from './features/mehr/SchuljahrPage';

const TABS = [
  { to: '/', ico: '🏠', label: 'Heute', end: true },
  { to: '/kalender', ico: '📅', label: 'Kalender', end: false },
  { to: '/klassen', ico: '👧', label: 'Klassen', end: false },
  { to: '/bibliothek', ico: '📚', label: 'Bibliothek', end: false },
  { to: '/mehr', ico: '⚙️', label: 'Mehr', end: false },
];

export default function App() {
  return (
    <HashRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<HeutePage />} />
          <Route path="/kalender" element={<KalenderPage />} />
          <Route path="/einheit/:id" element={<EinheitPage />} />
          <Route path="/klassen" element={<KlassenPage />} />
          <Route path="/klasse/:id" element={<KlassePage />} />
          <Route path="/schueler/:id" element={<SchuelerPage />} />
          <Route path="/plan/:klasseId" element={<PlanPage />} />
          <Route path="/lernziele" element={<LernzielePage />} />
          <Route path="/bibliothek" element={<BibliothekPage />} />
          <Route path="/spiel/:id" element={<SpielPage />} />
          <Route path="/reihe/:id" element={<ReihePage />} />
          <Route path="/notiz/:id" element={<NotizPage />} />
          <Route path="/wettkaempfe" element={<WettkaempfePage />} />
          <Route path="/wettkampf/:id" element={<WettkampfPage />} />
          <Route path="/tests" element={<TestsPage />} />
          <Route path="/test/:id" element={<TestPage />} />
          <Route path="/noten" element={<NotenPage />} />
          <Route path="/foto" element={<FotoPage />} />
          <Route path="/mehr" element={<MehrPage />} />
          <Route path="/tag/:datum" element={<TagPage />} />
          <Route path="/arbeitszeit" element={<ArbeitszeitPage />} />
          <Route path="/arbeitszeit/statistik" element={<StatistikPage />} />
          <Route path="/aufgaben" element={<AufgabenPage />} />
          <Route path="/faecher" element={<FaecherPage />} />
          <Route path="/schuljahr" element={<SchuljahrPage />} />
          <Route path="*" element={<HeutePage />} />
        </Routes>
        <nav className="nav">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="ico">{t.ico}</span>
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </HashRouter>
  );
}
