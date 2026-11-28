import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/** Seite mit Kopfzeile. `zurueck` = true: Zurück-Pfeil (Browser-Verlauf) oder ein fester Pfad. */
export function Page({
  title,
  zurueck,
  aktion,
  children,
}: {
  title: ReactNode;
  zurueck?: boolean | string;
  aktion?: ReactNode;
  children: ReactNode;
}) {
  const nav = useNavigate();
  return (
    <>
      <header className="header">
        {zurueck ? (
          <button
            aria-label="Zurück"
            onClick={() => (typeof zurueck === 'string' ? nav(zurueck) : nav(-1))}
          >
            ‹ Zurück
          </button>
        ) : null}
        <h1>{title}</h1>
        {aktion}
      </header>
      <main className="content">{children}</main>
    </>
  );
}

export function Section({ title, aktion, children }: { title: string; aktion?: ReactNode; children?: ReactNode }) {
  return (
    <>
      <div className="section-title">
        <span>{title}</span>
        {aktion}
      </div>
      {children}
    </>
  );
}

export function Card({ children, kind }: { children: ReactNode; kind?: 'warn' | 'soft' }) {
  return <div className={`card ${kind ?? ''}`}>{children}</div>;
}

export function List({ children }: { children: ReactNode }) {
  return <div className="list">{children}</div>;
}

export function Row({
  title,
  sub,
  right,
  to,
  onClick,
}: {
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
  to?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div className="main">
        <div className="title">{title}</div>
        {sub ? <div className="sub">{sub}</div> : null}
      </div>
      {right ? <div className="right">{right}</div> : null}
      {to || onClick ? <span className="chev">›</span> : null}
    </>
  );
  if (to)
    return (
      <Link className="row" to={to}>
        {inner}
      </Link>
    );
  if (onClick)
    return (
      <button className="row" onClick={onClick}>
        {inner}
      </button>
    );
  return <div className="row">{inner}</div>;
}

export function Button({
  children,
  onClick,
  kind,
  small,
  block,
  disabled,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: 'secondary' | 'danger';
  small?: boolean;
  block?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      className={`btn ${kind ?? ''} ${small ? 'small' : ''} ${block ? 'block' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'date' | 'time' | 'search';
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

/** Zahlenfeld, das auch leer sein darf (Wert undefined). */
export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const [text, setText] = useState(value === undefined ? '' : String(value));
  useEffect(() => {
    setText(value === undefined ? '' : String(value).replace('.', ','));
  }, [value]);
  return (
    <Field label={label}>
      <input
        type="text"
        inputMode="decimal"
        value={text}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const t = e.target.value;
          setText(t);
          const n = parseDezimal(t);
          onChange(n);
        }}
      />
    </Field>
  );
}

/** '9,5' oder '9.5' → 9.5; leer/ungültig → undefined */
export function parseDezimal(t: string): number | undefined {
  const n = Number(t.trim().replace(',', '.'));
  return t.trim() === '' || Number.isNaN(n) ? undefined : n;
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <Field label={label}>
      <textarea value={value} rows={rows} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function SelectField<T extends string | number>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <Field label={label}>
      <select
        value={String(value)}
        onChange={(e) => {
          const raw = e.target.value;
          const opt = options.find((o) => String(o.value) === raw);
          if (opt) onChange(opt.value);
        }}
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function Chip({ children, kind }: { children: ReactNode; kind?: 'gray' | 'warn' | 'red' }) {
  return <span className={`chip ${kind ?? ''}`}>{children}</span>;
}

export function ChipAuswahl<T extends string | number>({
  optionen,
  wert,
  onChange,
}: {
  optionen: { value: T; label: string }[];
  wert: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="chips">
      {optionen.map((o) => (
        <button
          key={String(o.value)}
          className={`chip-btn ${o.value === wert ? 'on' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

/** Unteres Fenster (Bottom-Sheet) für Formulare. */
export function Sheet({
  offen,
  onClose,
  titel,
  children,
}: {
  offen: boolean;
  onClose: () => void;
  titel: string;
  children: ReactNode;
}) {
  if (!offen) return null;
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <h2>{titel}</h2>
        {children}
      </div>
    </div>
  );
}

/** Kurze Rückmeldung unten im Bild. */
export function useToast(): [ReactNode, (text: string) => void] {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    if (!text) return;
    const t = setTimeout(() => setText(null), 3500);
    return () => clearTimeout(t);
  }, [text]);
  return [text ? <div className="toast">{text}</div> : null, setText];
}

export function bestaetige(text: string): boolean {
  return window.confirm(text);
}

/** Fortschrittsbalken; `ueber` färbt den Balken, wenn der Wert den Richtwert überschreitet. */
export function Balken({ wert, max, ueber }: { wert: number; max: number; ueber?: boolean }) {
  const pct = max > 0 ? Math.min(100, Math.round((wert / max) * 100)) : 0;
  return (
    <div className="bar">
      <i className={ueber ? 'over' : ''} style={{ width: `${pct}%` }} />
    </div>
  );
}
