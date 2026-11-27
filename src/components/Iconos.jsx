export function IconoCancha({ size = 26, color = 'var(--verde)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden="true">
      <rect x="1.5" y="4.5" width="23" height="17" rx="2" fill="none" stroke={color} strokeWidth="1.5" />
      <path
        d="M13 4.5v17M1.5 10h4v6h-4M24.5 10h-4v6h4"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />
      <circle cx="13" cy="13" r="2.6" fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function IconoVolver() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M10 2L4 8l6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconoBuscar() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="9" cy="9" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M13.6 13.6L18 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function IconoAgenda() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <rect x="2.5" y="3.5" width="15" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2.5 8h15M6.5 1.8v3.4M13.5 1.8v3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconoCuenta() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="6.8" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3.6 17.5c0-3.3 2.9-5.4 6.4-5.4s6.4 2.1 6.4 5.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconoCheck({ size = 27 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 12.5l5 5L20 6.5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconoAviso() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" aria-hidden="true" style={{ flex: 'none', marginTop: 1 }}>
      <circle cx="8.5" cy="8.5" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.5 5v4.2M8.5 11.6v0.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
