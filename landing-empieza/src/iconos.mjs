// Íconos de trazo (24×24) y la mascota Hera, en SVG en línea: sin peticiones
// extra y heredan el color del texto con currentColor.

const trazos = {
  tienda: '<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v1a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 12.5V20h14v-7.5"/><path d="M10 20v-5h4v5"/>',
  herramienta: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/>',
  farmacia: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 8v8M8 12h8"/>',
  ropa: '<path d="M20.4 3.5 16 2a4 4 0 0 1-8 0L3.6 3.5a2 2 0 0 0-1.3 2.2l.6 3.5a1 1 0 0 0 1 .8H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.1a1 1 0 0 0 1-.8l.6-3.5a2 2 0 0 0-1.3-2.2z"/>',
  cafe: '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/><path d="M6 2v2M10 2v2M14 2v2"/>',
  pan: '<path d="M4 11a8 5 0 0 1 16 0v1a2 2 0 0 1-2 2v5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-5a2 2 0 0 1-2-2z"/><path d="M9 9v3M12 8v4M15 9v3"/>',
  camion: '<path d="M2 6h12v10H2z"/><path d="M14 9h4l3 3.5V16h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  llave: '<path d="M5 16.5h14V12l-2.2-5H7.2L5 12z"/><path d="M5 12h14"/><circle cx="8" cy="16.5" r="1.8"/><circle cx="16" cy="16.5" r="1.8"/>',
  fabrica: '<path d="M3 21V10.5l5 3v-3l5 3v-3l5 3V4h3v17z"/><path d="M7 17.5h2M11.5 17.5h2M16 17.5h1.5"/>',
  tijera: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
  celular: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
  maletin: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
  fiado: '<path d="M5 4a1 1 0 0 1 1-1h10a3 3 0 0 1 3 3v15H8a3 3 0 0 1-3-3z"/><path d="M5 18a3 3 0 0 1 3-3h11M9 7h6M9 10.5h4"/>',
  stock: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  caja: '<rect x="3" y="10" width="18" height="10" rx="2"/><path d="M7 10V5h10v5M7 14h2M11 14h2M15 14h2M7 17h10"/>',
  margen: '<path d="M3 20h18"/><path d="M5 16l4-5 4 3 6-8"/><path d="M15 6h4v4"/>',
  merma: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/><path d="M10 11v6M14 11v6"/>',
  monedas: '<circle cx="9" cy="9" r="6"/><path d="M15.4 9.6a6 6 0 1 1-5.8 5.8"/><path d="M9 6.5v5M7.5 8h3"/>',
  tiempo: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
  flecha: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  atras: '<path d="M15 18l-6-6 6-6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  cerrar: '<path d="M6 6l12 12M18 6 6 18"/>',
  calendario: '<rect x="3" y="4.5" width="18" height="16.5" rx="3"/><path d="M8 2.5v4M16 2.5v4M3 10h18"/>',
  reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
  wifi: '<path d="M2 8.8a15 15 0 0 1 20 0M5 12.3a10 10 0 0 1 14 0M8.5 15.8a5 5 0 0 1 7 0"/><path d="M12 19.5h.01"/>',
  chispa: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16v4M17 18h4"/>',
  usuarios: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 20a6 6 0 0 0-2.6-4.9"/>',
  sucursal: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  escudo: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  globo: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  lapiz: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
  play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
  pausa: '<path d="M8 5v14M16 5v14"/>',
  repetir: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9"/><path d="M20 4v5h-5"/><path d="M20 12a8 8 0 0 1-14 5.3L4 15"/><path d="M4 20v-5h5"/>',
  alerta: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16h.01"/>',
  celularCheck:'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M9.5 12l2 2 3.5-4"/>',
};

export const nombresIconos = Object.keys(trazos);

export function icono(nombre, clase = 'ico') {
  const d = trazos[nombre];
  if (!d) throw new Error(`Ícono desconocido: ${nombre}`);
  return `<svg class="${clase}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
}

export const iconoWhatsapp = (clase = 'ico') =>
  `<svg class="${clase}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.2-.25-.59-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35M12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.89-9.89a9.82 9.82 0 0 1 9.88 9.9c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41"/></svg>`;

// Hera: robot verde de SmartBusiness. Misma silueta en todas partes para que
// se reconozca en dos segundos. Los ojos parpadean con CSS (.hera-ojo).
export const hera = (clase = 'hera') => `<svg class="${clase}" viewBox="0 0 120 120" role="img" aria-label="Hera, la asistente con inteligencia artificial de SmartBusiness">
  <line x1="60" y1="12" x2="60" y2="26" stroke="#00795F" stroke-width="4" stroke-linecap="round"/>
  <circle class="hera-antena" cx="60" cy="10" r="6" fill="#00A27F"/>
  <rect x="10" y="50" width="10" height="22" rx="5" fill="#005E4A"/>
  <rect x="100" y="50" width="10" height="22" rx="5" fill="#005E4A"/>
  <rect x="16" y="24" width="88" height="74" rx="30" fill="#00795F"/>
  <rect x="16" y="24" width="88" height="74" rx="30" fill="url(#hera-brillo)"/>
  <rect x="27" y="38" width="66" height="44" rx="20" fill="#0B2F27"/>
  <g class="hera-ojos">
    <rect class="hera-ojo" x="41" y="50" width="11" height="15" rx="5.5" fill="#7CF2CF"/>
    <rect class="hera-ojo" x="68" y="50" width="11" height="15" rx="5.5" fill="#7CF2CF"/>
  </g>
  <path d="M51 72q9 6 18 0" fill="none" stroke="#7CF2CF" stroke-width="3.5" stroke-linecap="round"/>
  <defs><linearGradient id="hera-brillo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
</svg>`;

export const logo = `<svg class="logo-marca" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><rect width="32" height="32" rx="9" fill="#00795F"/><path d="M21 11.5c-.8-1.6-2.6-2.5-4.9-2.5-3 0-5 1.5-5 3.7 0 5 10.3 2.6 10.3 7.6 0 2.3-2.2 3.8-5.3 3.8-2.5 0-4.4-1-5.3-2.8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>`;
