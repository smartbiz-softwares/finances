/* Panel de Empieza: métricas, solicitudes, calendario y API. Sin dependencias.
   Todo dato que viene de un formulario se escapa antes de pintarse. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const nf = new Intl.NumberFormat('es-UY');
  const n = x => nf.format(Math.round(x || 0));

  const est = { dias: 30, desde: '', hasta: '', seccion: 'resumen', resumen: null, meta: null, mes: null, diaElegido: null, pagina: 1, filtros: { q: '', tipo: '', estado: '' }, reservas: [] };
  const contenido = $('[data-contenido]');
  const cajon = $('[data-cajon]');
  const tip = $('[data-tooltip]');

  // Nombres legibles de lo que guarda la telemetría.
  const PASOS = { nombre: 'Nombre (primera pregunta)', sector: 'Sector', pais: 'País', sucursales: 'Puntos de venta', mercancia: 'Mercancía entre sucursales', trabajadores: 'Personas en el negocio', usuarios: 'Quién usaría el sistema', productos: 'Cantidad de productos', codigos: 'Códigos de barras', variantes: 'Tallas o colores', vencimiento: 'Productos que se vencen', internet: 'Conexión a internet', conexion: 'Cómo se conecta', luz: 'Cortes de luz', dispositivos: 'Dónde lo usaría', control: 'Cómo lleva el control', sistemaActual: 'Sistema actual', dolores: 'Lo que más le preocupa', deudores: 'Clientes que le deben', monedas: 'Monedas', objetivo: 'Objetivo a 3 meses', cuando: 'Cuándo quiere empezar', revisar: 'Revisión de respuestas', contacto: 'WhatsApp (último paso)' };
  const ORIGENES = { hero: 'Botón del inicio', fijo: 'Botón fijo al bajar', calculadora: 'Calculadora', cierre: 'Cierre de la página', pasos: 'Sección "tres pasos"', preguntas: 'Preguntas frecuentes', pie: 'Pie de página', flotante: 'Botón flotante de WhatsApp', formulario: 'Dentro del formulario', otro: 'Otro' };
  const CAMINOS = { agenda: 'Reservar un día', whatsapp: 'WhatsApp ahora' };
  const ESTADOS = { nueva: 'Nueva', contactada: 'Contactada', cliente: 'Cliente', descartada: 'Descartada', pendiente: 'Pendiente', confirmada: 'Confirmada', realizada: 'Realizada', cancelada: 'Cancelada', no_asistio: 'No asistió' };

  // --- Red -------------------------------------------------------------------------
  async function api(ruta, opciones = {}) {
    const res = await fetch(ruta, { credentials: 'same-origin', ...opciones, headers: { 'Content-Type': 'application/json', 'X-Panel': '1', ...(opciones.headers || {}) } });
    const j = await res.json().catch(() => ({}));
    if (res.status === 401) { mostrarEntrar(); throw new Error('No autorizado'); }
    if (!res.ok) throw new Error(j.error || `Error ${res.status}`);
    return j;
  }
  const qsPeriodo = () => (est.desde && est.hasta ? `desde=${est.desde}&hasta=${est.hasta}` : `dias=${est.dias}`);
  const cargando = (b, si) => (si ? b.setAttribute('data-cargando', '') : b.removeAttribute('data-cargando'));

  function aviso(texto, deshacer) {
    const el = document.createElement('div');
    el.className = 'aviso';
    el.innerHTML = `<span>${esc(texto)}</span>${deshacer ? '<button type="button">Deshacer</button>' : ''}`;
    $('[data-avisos]').append(el);
    if (deshacer) $('button', el).addEventListener('click', () => { el.remove(); deshacer(); });
    setTimeout(() => el.remove(), deshacer ? 6000 : 3000);
  }

  // --- Entrada ---------------------------------------------------------------------
  function mostrarEntrar(mensaje) {
    $('[data-app]').hidden = true;
    $('[data-entrar]').hidden = false;
    const err = $('[data-error-entrar]');
    err.hidden = !mensaje;
    err.textContent = mensaje || '';
    setTimeout(() => $('#clave').focus(), 50);
  }
  $('[data-form-entrar]').addEventListener('submit', async e => {
    e.preventDefault();
    const b = $('button', e.currentTarget);
    cargando(b, true);
    try {
      const res = await fetch('/api/panel/entrar', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clave: $('#clave').value }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return mostrarEntrar(j.error || 'No se pudo entrar');
      $('#clave').value = '';
      await iniciar();
    } finally {
      cargando(b, false);
    }
  });
  $('[data-salir]').addEventListener('click', async () => {
    await fetch('/api/panel/salir', { method: 'POST', credentials: 'same-origin' });
    mostrarEntrar();
  });

  async function iniciar() {
    try {
      const res = await fetch('/api/v1/sesion', { credentials: 'same-origin' });
      const j = await res.json().catch(() => ({}));
      if (res.status === 503) return mostrarEntrar(j.error);
      if (!res.ok) return mostrarEntrar();
      est.meta = j;
    } catch {
      return mostrarEntrar('No hay conexión con el servidor');
    }
    $('[data-entrar]').hidden = true;
    $('[data-app]').hidden = false;
    irA(location.hash.slice(1) || 'resumen');
  }

  // --- Navegación y período ---------------------------------------------------------
  const TITULOS = { resumen: 'Resumen', formulario: 'Formulario', solicitudes: 'Solicitudes', calendario: 'Calendario', contenido: 'Contenido', api: 'API para tu masterpanel' };
  addEventListener('hashchange', () => irA(location.hash.slice(1)));
  function irA(seccion) {
    if (!TITULOS[seccion]) seccion = 'resumen';
    est.seccion = seccion;
    ocultarTip();
    $('[data-titulo]').textContent = TITULOS[seccion];
    $$('[data-seccion]').forEach(a => (a.dataset.seccion === seccion ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    $('[data-barra-periodo] .periodo').hidden = seccion === 'calendario' || seccion === 'api';
    $('[data-exportar]').hidden = seccion !== 'solicitudes';
    pintar();
  }
  $$('[data-dias]').forEach(b =>
    b.addEventListener('click', () => {
      est.dias = Number(b.dataset.dias);
      est.desde = est.hasta = '';
      $('[data-desde]').value = $('[data-hasta]').value = '';
      $$('[data-dias]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      est.resumen = null;
      est.pagina = 1;
      pintar();
    }),
  );
  $$('[data-desde], [data-hasta]').forEach(i =>
    i.addEventListener('change', () => {
      const d = $('[data-desde]').value, h = $('[data-hasta]').value;
      if (!d || !h || d > h) return;
      est.desde = d; est.hasta = h;
      $$('[data-dias]').forEach(x => x.setAttribute('aria-pressed', 'false'));
      est.resumen = null;
      est.pagina = 1;
      pintar();
    }),
  );

  const esqueleto = () => `<div class="rejilla-kpi">${'<div class="kpi esqueleto" style="height:96px"></div>'.repeat(6)}</div><div class="rejilla rejilla-2">${'<div class="bloque esqueleto" style="height:260px"></div>'.repeat(4)}</div>`;

  async function pintar() {
    const s = est.seccion;
    $('[data-exportar]').href = `/api/v1/exportar/solicitudes.csv?${qsPeriodo()}`;
    if (s === 'solicitudes') return pintarSolicitudes();
    if (s === 'calendario') return pintarCalendario();
    if (s === 'api') return pintarApi();
    if (!est.resumen) {
      contenido.innerHTML = esqueleto();
      try {
        est.resumen = await api(`/api/v1/resumen?${qsPeriodo()}`);
      } catch (e) {
        contenido.innerHTML = `<p class="vacio">${esc(e.message)}</p>`;
        return;
      }
    }
    if (est.seccion !== s) return;
    if (s === 'resumen') pintarResumen(est.resumen);
    if (s === 'formulario') pintarFormulario(est.resumen);
    if (s === 'contenido') pintarContenido(est.resumen);
  }

  // --- Piezas de gráficos -------------------------------------------------------------
  const bloque = (titulo, sub, cuerpo, clase = '') => `<section class="bloque ${clase}"><h2>${esc(titulo)}</h2>${sub ? `<p class="sub">${esc(sub)}</p>` : ''}<div class="bloque-cuerpo">${cuerpo}</div></section>`;

  function barras(items, { nombre = x => x.nombre, total, max, limite = 10, sufijo = '' } = {}) {
    const lista = items.slice(0, limite);
    if (!lista.length) return '<p class="vacio">Todavía no hay datos en este período.</p>';
    const tope = max || Math.max(...lista.map(x => x.n), 1);
    const suma = total ?? items.reduce((a, x) => a + x.n, 0);
    return `<div class="barras">${lista
      .map(
        x => `<div class="barra-fila"><span>${esc(nombre(x))}</span><span class="valor"><b>${n(x.n)}</b>${sufijo}${suma ? ` · ${Math.round((x.n / suma) * 100)}%` : ''}</span><div class="barra-pista"><i style="width:${(x.n / tope) * 100}%"></i></div></div>`,
      )
      .join('')}</div>${items.length > limite ? `<p class="sub" style="margin-top:8px">y ${items.length - limite} más</p>` : ''}`;
  }

  const topeLindo = v => {
    if (v <= 4) return 4;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    return [1, 2, 2.5, 5, 10].map(m => m * p).find(m => m >= v);
  };
  const tickTexto = v => (v >= 10000 ? `${Math.round(v / 1000)}K` : nf.format(v));

  function mostrarTip(e, html) {
    tip.innerHTML = html;
    tip.hidden = false;
    const w = tip.offsetWidth;
    tip.style.left = `${Math.min(e.clientX + 14, innerWidth - w - 8)}px`;
    tip.style.top = `${e.clientY + 14}px`;
  }
  const ocultarTip = () => { tip.hidden = true; };

  // Línea con área tenue y cruz de lectura al pasar el puntero.
  function montarLinea(el, puntos, nombreSerie) {
    const dibujar = () => {
      const W = Math.max(el.clientWidth, 280), H = 220, m = { l: 40, r: 12, t: 12, b: 28 };
      const tope = topeLindo(Math.max(...puntos.map(p => p.y), 0));
      const x = i => m.l + (puntos.length < 2 ? (W - m.l - m.r) / 2 : (i * (W - m.l - m.r)) / (puntos.length - 1));
      const y = v => m.t + (1 - v / tope) * (H - m.t - m.b);
      const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * tope));
      const cada = Math.max(1, Math.ceil(puntos.length / 6));
      const d = puntos.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join('');
      el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(nombreSerie)} por día">
        <g class="eje">${ticks.map(t => `<line class="rej" x1="${m.l}" x2="${W - m.r}" y1="${y(t)}" y2="${y(t)}"/><text x="${m.l - 8}" y="${y(t) + 4}" text-anchor="end">${tickTexto(t)}</text>`).join('')}
        ${puntos.map((p, i) => (i % cada === 0 || i === puntos.length - 1 ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(p.etiqueta)}</text>` : '')).join('')}</g>
        ${puntos.length > 1 ? `<path class="area" d="${d}L${x(puntos.length - 1)},${y(0)}L${x(0)},${y(0)}Z"/>` : ''}
        <path class="linea" d="${d}"/>
        <circle class="punto" r="4" cx="${x(puntos.length - 1)}" cy="${y(puntos[puntos.length - 1]?.y || 0)}"/>
        <line class="guia" data-guia y1="${m.t}" y2="${H - m.b}" visibility="hidden"/>
        <circle class="punto" data-marca r="5" visibility="hidden"/>
        <rect class="zona-hover" x="${m.l}" y="${m.t}" width="${W - m.l - m.r}" height="${H - m.t - m.b}"/>
      </svg>`;
      const svg = $('svg', el), guia = $('[data-guia]', el), marca = $('[data-marca]', el);
      $('.zona-hover', el).addEventListener('pointermove', e => {
        const r = svg.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width) * W;
        const i = Math.max(0, Math.min(puntos.length - 1, Math.round(((px - m.l) / (W - m.l - m.r)) * (puntos.length - 1))));
        guia.setAttribute('x1', x(i)); guia.setAttribute('x2', x(i)); guia.setAttribute('visibility', 'visible');
        marca.setAttribute('cx', x(i)); marca.setAttribute('cy', y(puntos[i].y)); marca.setAttribute('visibility', 'visible');
        mostrarTip(e, `${esc(puntos[i].etiquetaLarga || puntos[i].etiqueta)}<br><b>${n(puntos[i].y)}</b> ${esc(nombreSerie.toLowerCase())}`);
      });
      $('.zona-hover', el).addEventListener('pointerleave', () => { guia.setAttribute('visibility', 'hidden'); marca.setAttribute('visibility', 'hidden'); ocultarTip(); });
    };
    dibujar();
    new ResizeObserver(() => { clearTimeout(el._t); el._t = setTimeout(dibujar, 120); }).observe(el);
  }

  // Columnas finas (≤ 24 px) con extremo redondeado, ancladas a la base.
  function montarColumnas(el, items, { nombre, etiqueta = x => x.nombre, unidad = 'visitas' }) {
    const dibujar = () => {
      const W = Math.max(el.clientWidth, 280), H = 180, m = { l: 34, r: 8, t: 10, b: 26 };
      const tope = topeLindo(Math.max(...items.map(x => x.n), 0));
      const banda = (W - m.l - m.r) / items.length;
      const ancho = Math.min(24, banda - 2);
      const y = v => m.t + (1 - v / tope) * (H - m.t - m.b);
      const base = y(0);
      const cada = Math.max(1, Math.ceil(items.length / 12));
      el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(nombre)}">
        <g class="eje">${[0, 0.5, 1].map(f => Math.round(f * tope)).map(t => `<line class="rej" x1="${m.l}" x2="${W - m.r}" y1="${y(t)}" y2="${y(t)}"/><text x="${m.l - 6}" y="${y(t) + 4}" text-anchor="end">${tickTexto(t)}</text>`).join('')}
        ${items.map((it, i) => (i % cada === 0 ? `<text x="${m.l + banda * i + banda / 2}" y="${H - 8}" text-anchor="middle">${esc(etiqueta(it))}</text>` : '')).join('')}</g>
        ${items
          .map((it, i) => {
            const cx = m.l + banda * i + (banda - ancho) / 2, top = y(it.n), r = Math.min(4, (base - top) / 2, ancho / 2);
            return it.n > 0
              ? `<path class="col" data-i="${i}" d="M${cx},${base}V${top + r}Q${cx},${top} ${cx + r},${top}H${cx + ancho - r}Q${cx + ancho},${top} ${cx + ancho},${top + r}V${base}Z"/>`
              : '';
          })
          .join('')}
        ${items.map((it, i) => `<rect class="zona-hover" data-i="${i}" x="${m.l + banda * i}" y="${m.t}" width="${banda}" height="${H - m.t - m.b}"/>`).join('')}
      </svg>`;
      $$('.zona-hover', el).forEach(z => {
        z.addEventListener('pointermove', e => mostrarTip(e, `${esc(etiqueta(items[z.dataset.i]))}<br><b>${n(items[z.dataset.i].n)}</b> ${unidad}`));
        z.addEventListener('pointerleave', ocultarTip);
      });
    };
    dibujar();
    new ResizeObserver(() => { clearTimeout(el._t); el._t = setTimeout(dibujar, 120); }).observe(el);
  }

  const tablaDe = (cabeceras, filas) =>
    `<details class="tabla-ver"><summary>Ver como tabla</summary><div class="tabla-envoltura"><table class="datos"><thead><tr>${cabeceras.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${filas.map(f => `<tr>${f.map((c, i) => `<td class="${i ? 'num' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;

  const fechaCorta = dia => {
    const [y, m, d] = dia.split('-').map(Number);
    return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d))).replace('.', '');
  };
  const fechaLarga = dia => {
    const [y, m, d] = dia.split('-').map(Number);
    return new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
  };
  const fechaHora = iso => new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short', timeZone: est.meta?.zona }).format(new Date(iso));

  function kpi(nombre, valor, antes, { formato = n, sufijo = '' } = {}) {
    let delta = '';
    if (antes != null) {
      if (!antes && !valor) delta = 'Sin cambios';
      else if (!antes) delta = '<b class="sube">nuevo</b> vs. período anterior';
      else {
        const p = Math.round(((valor - antes) / antes) * 100);
        delta = `<b class="${p >= 0 ? 'sube' : 'baja'}">${p >= 0 ? '↑' : '↓'} ${Math.abs(p)}%</b> vs. período anterior`;
      }
    }
    return `<div class="kpi"><p class="kpi-nombre">${esc(nombre)}</p><p class="kpi-valor">${formato(valor)}${sufijo}</p><p class="kpi-delta">${delta}</p></div>`;
  }

  // --- Resumen ---------------------------------------------------------------------------
  function pintarResumen(d) {
    const t = d.totales, a = d.anterior;
    contenido.innerHTML = `
      <div class="rejilla-kpi">
        ${kpi('Visitantes', t.visitantes, a.visitantes)}
        ${kpi('Visitas a páginas', t.visitas, a.visitas)}
        ${kpi('Tocaron Empezar', t.empezaron, a.empezaron)}
        ${kpi('Solicitudes', t.solicitudes, a.solicitudes)}
        ${kpi('Reservas', t.reservas, a.reservas)}
        ${kpi('Clics a WhatsApp', t.whatsapp, a.whatsapp)}
        ${kpi('Visitante → solicitud', t.conversion, a.conversion, { formato: x => String(x).replace('.', ','), sufijo: '%' })}
        ${kpi('Terminan el formulario', t.conversionFormulario, a.conversionFormulario, { formato: x => String(x).replace('.', ','), sufijo: '%' })}
      </div>
      <div class="rejilla rejilla-2">
        ${bloque('Visitantes por día', 'Personas distintas que entraron cada día.', '<div class="grafico" data-g-visitantes></div>' + tablaDe(['Día', 'Visitantes', 'Visitas'], d.serie.map(x => [x.dia, x.visitantes, x.visitas])))}
        ${bloque('Solicitudes por día', 'Personas que dejaron su WhatsApp en el formulario.', '<div class="grafico" data-g-solicitudes></div>' + tablaDe(['Día', 'Solicitudes', 'Reservas'], d.serie.map(x => [x.dia, x.solicitudes, x.reservas])))}
        ${bloque('Embudo', 'Sesiones que llegaron a cada etapa.', embudo(d.embudo))}
        ${bloque('Dónde abandonan', 'Última pregunta que vio quien empezó y no terminó.', barras(d.abandono, { nombre: x => PASOS[x.nombre] || x.nombre }))}
        ${bloque('De dónde llegan', 'Primera visita de cada sesión.', barras(d.fuentes))}
        ${bloque('Dispositivos', '', barras(d.dispositivos, { nombre: x => ({ celular: 'Celular', tablet: 'Tablet', computadora: 'Computadora' })[x.nombre] || x.nombre }))}
        ${bloque('Horas con más visitas', `Hora de ${d.periodo.zona.split('/').pop().replace('_', ' ')}.`, '<div class="grafico" data-g-horas></div>')}
        ${bloque('Días de la semana', '', '<div class="grafico" data-g-semana></div>')}
        ${bloque('Campañas (utm_campaign)', 'Agrega ?utm_source=instagram&utm_campaign=fiado a tus enlaces para verlas aquí.', barras(d.campanas))}
        ${bloque('Qué botón Empezar tocan', '', barras(d.origenEmpezar, { nombre: x => ORIGENES[x.nombre] || x.nombre }))}
      </div>`;
    montarLinea($('[data-g-visitantes]'), d.serie.map(x => ({ etiqueta: fechaCorta(x.dia), etiquetaLarga: fechaLarga(x.dia), y: x.visitantes })), 'Visitantes');
    montarLinea($('[data-g-solicitudes]'), d.serie.map(x => ({ etiqueta: fechaCorta(x.dia), etiquetaLarga: fechaLarga(x.dia), y: x.solicitudes })), 'Solicitudes');
    montarColumnas($('[data-g-horas]'), d.horas.map(h => ({ nombre: h.hora, n: h.n })), { nombre: 'Visitas por hora', etiqueta: x => `${x.nombre % 12 || 12}${x.nombre < 12 ? 'a' : 'p'}` });
    montarColumnas($('[data-g-semana]'), d.semana, { nombre: 'Visitas por día de la semana' });
  }

  function embudo(etapas) {
    if (!etapas[0].sesiones) return '<p class="vacio">Todavía no hay visitas en este período.</p>';
    return `<div class="barras embudo">${etapas
      .map(
        (x, i) => `<div class="barra-fila"><span>${esc(x.nombre)}</span><span class="valor"><b>${n(x.sesiones)}</b> · ${String(x.dePrimera).replace('.', ',')}%</span><div class="barra-pista"><i style="width:${x.dePrimera}%"></i></div>${i ? `<span class="caida">${String(x.deAnterior).replace('.', ',')}% de la etapa anterior</span>` : ''}</div>`,
      )
      .join('')}</div>`;
  }

  // --- Formulario ------------------------------------------------------------------------
  function pintarFormulario(d) {
    const total = d.totales.solicitudes;
    contenido.innerHTML = `
      <div class="rejilla-kpi">
        ${kpi('Solicitudes del período', total, d.anterior.solicitudes)}
        ${kpi('Eligieron reservar', d.caminos.find(c => c.nombre === 'agenda')?.n || 0)}
        ${kpi('Eligieron WhatsApp', d.caminos.find(c => c.nombre === 'whatsapp')?.n || 0)}
        ${kpi('Uso de la calculadora', d.calculadora.usos)}
      </div>
      <div class="rejilla rejilla-3">
        ${bloque('Tamaño estimado', '', barras(d.tamanos))}
        ${bloque('Sectores', '', barras(d.sectores))}
        ${bloque('Países', '', barras(d.paises))}
        ${d.formulario
          .filter(p => !['Sector', 'País'].includes(p.pregunta))
          .map(p => bloque(p.pregunta, p.respuestas.length > 1 ? `${n(p.respuestas.reduce((a, x) => a + x.n, 0))} respuestas` : '', barras(p.respuestas, { limite: 8 })))
          .join('')}
      </div>
      ${total ? '' : '<p class="vacio">Cuando lleguen solicitudes, aquí verás cómo responde cada pregunta tu público.</p>'}`;
  }

  // --- Contenido -------------------------------------------------------------------------
  function pintarContenido(d) {
    contenido.innerHTML = `
      <div class="rejilla-kpi">
        ${kpi('Calculadora: usos', d.calculadora.usos)}
        ${kpi('Fuga promedio calculada', d.calculadora.promedio, null, { formato: x => `$${n(x)}` })}
        ${kpi('Fuga mediana calculada', d.calculadora.mediana, null, { formato: x => `$${n(x)}` })}
        ${kpi('Demo reproducida', d.demo.reproducciones)}
        ${kpi('Demo vista completa', d.demo.completas)}
      </div>
      <div class="rejilla rejilla-2">
        ${bloque('Páginas más vistas', '', barras(d.paginas, { limite: 15 }))}
        ${bloque('Páginas de entrada', 'Por dónde llega la gente (útil para ver qué páginas SEO funcionan).', barras(d.entradas, { limite: 15 }))}
        ${bloque('Qué buscan en las preguntas', 'Lo que escriben en el buscador de preguntas frecuentes.', barras(d.busquedas, { limite: 15 }))}
        ${bloque('Hasta dónde bajan', 'Visitas que llegaron a cada porcentaje de la página.', barras(d.scroll.sort((a, b) => parseInt(a.nombre) - parseInt(b.nombre)), { total: 0 }))}
        ${bloque('Desde dónde abren WhatsApp', '', barras(d.origenWhatsapp, { nombre: x => ORIGENES[x.nombre] || x.nombre }))}
      </div>`;
  }

  // --- Solicitudes --------------------------------------------------------------------------
  async function pintarSolicitudes() {
    const f = est.filtros;
    if (!$('[data-tabla-solicitudes]')) {
      contenido.innerHTML = `
        <div class="filtros">
          <input type="search" placeholder="Buscar por nombre, negocio, teléfono o respuesta" data-f="q" value="${esc(f.q)}" aria-label="Buscar">
          <select data-f="tipo" aria-label="Tipo"><option value="">Todo</option><option value="formulario">Formularios</option><option value="reserva">Reservas</option></select>
          <select data-f="estado" aria-label="Estado"><option value="">Cualquier estado</option>${Object.entries(ESTADOS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
        </div>
        <div class="bloque"><div class="tabla-envoltura" data-tabla-solicitudes></div><div class="paginacion" data-paginacion></div></div>`;
      $('[data-f="tipo"]').value = f.tipo;
      $('[data-f="estado"]').value = f.estado;
      let espera;
      $$('[data-f]').forEach(c =>
        c.addEventListener(c.tagName === 'INPUT' ? 'input' : 'change', () => {
          clearTimeout(espera);
          espera = setTimeout(() => { f[c.dataset.f] = c.value; est.pagina = 1; pintarSolicitudes(); }, c.tagName === 'INPUT' ? 300 : 0);
        }),
      );
    }
    const caja = $('[data-tabla-solicitudes]');
    caja.innerHTML = '<div class="esqueleto" style="height:240px"></div>';
    const params = new URLSearchParams({ ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)), pagina: est.pagina, limite: 50 });
    let d;
    try { d = await api(`/api/v1/solicitudes?${qsPeriodo()}&${params}`); } catch (e) { caja.innerHTML = `<p class="vacio">${esc(e.message)}</p>`; return; }
    if (!d.items.length) {
      caja.innerHTML = '<p class="vacio">No hay solicitudes con estos filtros en el período.</p>';
      $('[data-paginacion]').innerHTML = '';
      return;
    }
    const resp = (s, p) => s.respuestas?.find(r => r.pregunta === p)?.respuesta || '';
    caja.innerHTML = `<table class="datos"><thead><tr><th>Fecha</th><th>Persona</th><th>Tipo</th><th>Sector</th><th>País</th><th>Tamaño</th><th>Estado</th></tr></thead><tbody>${d.items
      .map(
        s => `<tr data-id="${esc(s.id)}" tabindex="0"><td>${esc(fechaHora(s.fecha))}</td><td>${esc(s.nombre)}<br><span class="tipo">${esc(s.negocio || s.telefono)}</span></td><td>${s.tipo === 'reserva' ? `Reserva<br><span class="tipo">${esc(s.dia ? `${fechaCorta(s.dia)} · ${s.hora}` : '')}</span>` : 'Formulario'}</td><td>${esc(resp(s, 'Sector'))}</td><td>${esc(resp(s, 'País'))}</td><td>${esc(s.tamano)}</td><td>${chip(s.tipo === 'reserva' ? s.estadoReserva : s.estado)}</td></tr>`,
      )
      .join('')}</tbody></table>`;
    const paginas = Math.ceil(d.total / d.limite);
    $('[data-paginacion]').innerHTML = `<span>${n(d.total)} solicitudes</span><span>${d.pagina > 1 ? '<button class="btn btn-secundario btn-chico" data-pag="-1">Anterior</button>' : ''} Página ${d.pagina} de ${paginas} ${d.pagina < paginas ? '<button class="btn btn-secundario btn-chico" data-pag="1">Siguiente</button>' : ''}</span>`;
    $$('[data-pag]').forEach(b => b.addEventListener('click', () => { est.pagina += Number(b.dataset.pag); pintarSolicitudes(); }));
    $$('tr[data-id]', caja).forEach(tr => {
      const abrir = () => abrirSolicitud(d.items.find(x => x.id === tr.dataset.id));
      tr.addEventListener('click', abrir);
      tr.addEventListener('keydown', e => { if (e.key === 'Enter') abrir(); });
    });
  }

  const chip = e => `<span class="estado estado-${esc(e)}">${esc(ESTADOS[e] || e)}</span>`;

  function abrirCajon(html) {
    $('[data-cajon-cuerpo]').innerHTML = html;
    cajon.hidden = false;
    setTimeout(() => $('.cerrar-cajon').focus(), 30);
  }
  const cerrarCajon = () => { cajon.hidden = true; };
  $('[data-cerrar-cajon]').addEventListener('click', cerrarCajon);
  cajon.addEventListener('click', e => { if (e.target === cajon) cerrarCajon(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !cajon.hidden) cerrarCajon(); });

  function textoAviso(r) {
    const horas = est.meta?.horasAviso || 5;
    if (r.avisoEnviado) return `Te avisamos por correo el ${fechaHora(r.avisoEnviado)}.`;
    if (['realizada', 'cancelada', 'no_asistio'].includes(r.estadoReserva)) return 'Esta cita ya no lleva aviso.';
    if (!r.inicio) return '';
    const cuando = new Date(Date.parse(r.inicio) - horas * 3600e3);
    return cuando < new Date() && Date.parse(r.inicio) > Date.now() ? 'El aviso sale en el próximo minuto.' : `Te avisaremos por correo ${horas} h antes: ${fechaHora(cuando.toISOString())}.`;
  }

  function abrirSolicitud(s) {
    const esReserva = s.tipo === 'reserva';
    abrirCajon(`
      <h2 id="cajon-titulo">${esc(s.nombre)}</h2>
      <p class="meta">${esc(s.negocio ? `${s.negocio} · ` : '')}${esc(s.telefono)} · ${esc(fechaHora(s.fecha))}</p>
      <div class="acciones">
        <a class="btn btn-primario btn-chico" href="https://wa.me/${esc(s.whatsapp)}" target="_blank" rel="noopener">Escribir por WhatsApp</a>
        <button class="btn btn-secundario btn-chico" type="button" data-copiar="${esc(s.telefono)}">Copiar teléfono</button>
      </div>
      ${esReserva ? `
        <div class="campo-panel"><label for="c-estado-r">Estado de la cita</label><select id="c-estado-r">${(est.meta?.estadosReserva || []).map(e => `<option value="${e}"${e === s.estadoReserva ? ' selected' : ''}>${ESTADOS[e]}</option>`).join('')}</select></div>
        <div class="dos"><div class="campo-panel"><label for="c-dia">Día</label><input id="c-dia" type="date" value="${esc(s.dia || '')}"></div><div class="campo-panel"><label for="c-hora">Hora</label><input id="c-hora" type="time" value="${esc(s.hora || '')}" step="900"></div></div>
        ${s.inicio ? `<p class="nota-aviso">${esc(textoAviso(s))}</p>` : ''}` : `
        <div class="campo-panel"><label for="c-estado">Estado</label><select id="c-estado">${(est.meta?.estadosSolicitud || []).map(e => `<option value="${e}"${e === s.estado ? ' selected' : ''}>${ESTADOS[e]}</option>`).join('')}</select></div>`}
      <div class="campo-panel"><label for="c-notas">Notas</label><textarea id="c-notas" placeholder="Lo que hablaste, próximos pasos…">${esc(s.notas)}</textarea></div>
      <div class="acciones"><button class="btn btn-primario" type="button" data-guardar><span class="btn-texto">Guardar cambios</span><span class="btn-spinner" aria-hidden="true"></span></button></div>
      <dl class="respuestas">${[['Ciudad', s.ciudad], ['Tamaño estimado', s.tamano], ...(s.respuestas || []).map(r => [r.pregunta, r.respuesta]), ['Página de origen', s.pagina]]
        .filter(([, v]) => v)
        .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
        .join('')}</dl>`);
    $('[data-copiar]').addEventListener('click', async e => {
      try { await navigator.clipboard.writeText(e.currentTarget.dataset.copiar); aviso('Teléfono copiado'); } catch { aviso('No se pudo copiar'); }
    });
    $('[data-guardar]').addEventListener('click', async e => {
      const b = e.currentTarget;
      cargando(b, true);
      try {
        const cuerpo = { notas: $('#c-notas').value };
        if (esReserva) Object.assign(cuerpo, { estado: $('#c-estado-r').value, ...($('#c-dia').value ? { dia: $('#c-dia').value } : {}), ...($('#c-hora').value ? { hora: $('#c-hora').value.slice(0, 5) } : {}) });
        else cuerpo.estado = $('#c-estado').value;
        await api(`/api/v1/${esReserva ? 'reservas' : 'solicitudes'}/${s.id}`, { method: 'PATCH', body: JSON.stringify(cuerpo) });
        aviso('Cambios guardados');
        cerrarCajon();
        est.resumen = null;
        pintar();
      } catch (err) {
        aviso(err.message);
      } finally {
        cargando(b, false);
      }
    });
  }

  // --- Calendario -----------------------------------------------------------------------------
  const dos = x => String(x).padStart(2, '0');
  const hoyClave = () => new Intl.DateTimeFormat('en-CA', { timeZone: est.meta?.zona, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

  async function pintarCalendario() {
    if (!est.mes) est.mes = hoyClave().slice(0, 7);
    contenido.innerHTML = '<div class="esqueleto" style="height:520px"></div>';
    try { est.reservas = (await api('/api/v1/reservas')).items; } catch (e) { contenido.innerHTML = `<p class="vacio">${esc(e.message)}</p>`; return; }
    dibujarCalendario();
  }

  function dibujarCalendario() {
    const [y, m] = est.mes.split('-').map(Number);
    const primero = new Date(Date.UTC(y, m - 1, 1));
    const offset = (primero.getUTCDay() + 6) % 7; // semana desde el lunes
    const hoy = hoyClave();
    const porDia = {};
    for (const r of est.reservas) (porDia[r.dia] ||= []).push(r);
    const celdas = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(Date.UTC(y, m - 1, 1 - offset + i));
      const clave = `${d.getUTCFullYear()}-${dos(d.getUTCMonth() + 1)}-${dos(d.getUTCDate())}`;
      const citas = (porDia[clave] || []).sort((a, b) => a.hora.localeCompare(b.hora));
      celdas.push(`<div class="cal-celda${d.getUTCMonth() !== m - 1 ? ' fuera' : ''}${clave === hoy ? ' hoy' : ''}${clave === est.diaElegido ? ' elegida' : ''}" data-dia="${clave}" role="gridcell" aria-label="${esc(fechaLarga(clave))}: ${citas.length} citas">
        <span class="cal-num">${d.getUTCDate()}</span>
        ${citas.slice(0, 3).map(r => `<button class="cita estado-${esc(r.estadoReserva)}" type="button" draggable="true" data-cita="${esc(r.id)}" title="${esc(`${r.hora12} · ${r.nombre}`)}">${esc(r.hora12.replace(':00', ''))} ${esc(r.nombre)}</button>`).join('')}
        ${citas.length > 3 ? `<span class="cita-mas">+${citas.length - 3} más</span>` : ''}
        <span class="marcas">${citas.map(() => '<i></i>').join('')}</span>
      </div>`);
    }
    const tituloMes = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(primero);
    const titulo = tituloMes.charAt(0).toUpperCase() + tituloMes.slice(1);
    const lista = est.diaElegido ? est.reservas.filter(r => r.dia === est.diaElegido) : est.reservas.filter(r => Date.parse(r.inicio) >= Date.now() - 3600e3).slice(0, 12);
    contenido.innerHTML = `
      <div class="rejilla">
        <section class="bloque">
          <div class="cal-cabecera">
            <h2>${esc(titulo)}</h2>
            <button class="btn btn-secundario btn-chico" type="button" data-mes="-1" aria-label="Mes anterior">‹</button>
            <button class="btn btn-secundario btn-chico" type="button" data-mes="0">Hoy</button>
            <button class="btn btn-secundario btn-chico" type="button" data-mes="1" aria-label="Mes siguiente">›</button>
          </div>
          <div class="cal" role="grid">${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(x => `<div class="cal-dia-nombre" role="columnheader">${x}</div>`).join('')}${celdas.join('')}</div>
          <div class="leyenda">${['pendiente', 'confirmada', 'realizada', 'cancelada', 'no_asistio'].map(chip).join('')}<span class="sub" style="align-self:center">Arrastra una cita a otro día para moverla.</span></div>
        </section>
        <section class="bloque">
          <h2>${est.diaElegido ? esc(fechaLarga(est.diaElegido)) : 'Próximas citas'}</h2>
          ${est.diaElegido ? '<button class="btn btn-secundario btn-chico" type="button" data-ver-proximas style="margin-top:8px">Ver próximas citas</button>' : ''}
          <div class="bloque-cuerpo">${lista.length ? `<ul class="lista-citas">${lista.map(r => `<li data-cita="${esc(r.id)}" tabindex="0"><span class="hora">${esc(r.hora12)}</span><span class="quien">${esc(r.nombre)}<small>${esc(est.diaElegido ? r.negocio || r.telefono : `${fechaLarga(r.dia)} · ${r.negocio || r.telefono}`)}</small></span>${chip(r.estadoReserva)}</li>`).join('')}</ul>` : '<p class="vacio">No hay citas.</p>'}</div>
        </section>
      </div>`;

    $$('[data-mes]').forEach(b =>
      b.addEventListener('click', () => {
        const paso = Number(b.dataset.mes);
        if (!paso) est.mes = hoyClave().slice(0, 7);
        else {
          const d = new Date(Date.UTC(y, m - 1 + paso, 1));
          est.mes = `${d.getUTCFullYear()}-${dos(d.getUTCMonth() + 1)}`;
        }
        dibujarCalendario();
      }),
    );
    $('[data-ver-proximas]')?.addEventListener('click', () => { est.diaElegido = null; dibujarCalendario(); });
    $$('[data-cita]').forEach(el => {
      const abrir = e => { e.stopPropagation(); abrirSolicitud(est.reservas.find(r => r.id === el.dataset.cita)); };
      el.addEventListener('click', abrir);
      el.addEventListener('keydown', e => { if (e.key === 'Enter') abrir(e); });
      el.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', el.dataset.cita); e.dataTransfer.effectAllowed = 'move'; });
    });
    $$('.cal-celda').forEach(c => {
      c.addEventListener('click', () => { est.diaElegido = c.dataset.dia; dibujarCalendario(); });
      c.addEventListener('dragover', e => { e.preventDefault(); c.classList.add('sobre'); });
      c.addEventListener('dragleave', () => c.classList.remove('sobre'));
      c.addEventListener('drop', async e => {
        e.preventDefault();
        c.classList.remove('sobre');
        const r = est.reservas.find(x => x.id === e.dataTransfer.getData('text/plain'));
        if (!r || r.dia === c.dataset.dia) return;
        await moverCita(r, c.dataset.dia, true);
      });
    });
  }

  async function moverCita(r, dia, conDeshacer) {
    const antes = r.dia;
    try {
      const nueva = await api(`/api/v1/reservas/${r.id}`, { method: 'PATCH', body: JSON.stringify({ dia }) });
      Object.assign(r, nueva);
      dibujarCalendario();
      aviso(`Cita movida al ${fechaLarga(dia)}`, conDeshacer ? () => moverCita(r, antes, false) : null);
    } catch (e) {
      aviso(e.message);
    }
  }

  // --- API ----------------------------------------------------------------------------------
  function pintarApi() {
    const base = location.origin;
    contenido.innerHTML = `
      <div class="rejilla rejilla-2">
        ${bloque('Cómo conectarla', 'Para ver estos datos en tu masterpanel.', `
          <p>1. En el <code>.env</code> del servidor define una clave larga y secreta:</p>
          <pre class="codigo">EMPIEZA_API_KEY="pon-aqui-una-clave-larga"
# Si tu masterpanel llama desde el navegador, su dominio:
EMPIEZA_API_ORIGENES="https://panel.smartbiz.com.uy"</pre>
          <p style="margin-top:12px">2. Llama a la API con esa clave en la cabecera <code>Authorization</code>:</p>
          <pre class="codigo">curl -H "Authorization: Bearer $EMPIEZA_API_KEY" \\
  "${esc(base)}/api/v1/resumen?dias=30"</pre>
          <p style="margin-top:12px">La especificación completa (OpenAPI 3.1) está en <a href="/api/v1/openapi.json" target="_blank" rel="noopener">/api/v1/openapi.json</a>: impórtala en Postman, Insomnia o tu generador de clientes.</p>`)}
        ${bloque('Rutas', 'Fechas en AAAA-MM-DD, hora del negocio. Sin fechas: últimos 30 días.', `
          <ul class="endpoints">
            <li><code>GET /api/v1/resumen</code> todas las métricas del período</li>
            <li><code>GET /api/v1/solicitudes</code> con <code>tipo</code>, <code>estado</code>, <code>q</code>, <code>pagina</code>, <code>limite</code></li>
            <li><code>GET /api/v1/solicitudes/{id}</code></li>
            <li><code>PATCH /api/v1/solicitudes/{id}</code> <code>{ estado, notas }</code></li>
            <li><code>GET /api/v1/reservas</code> todas, o por período</li>
            <li><code>PATCH /api/v1/reservas/{id}</code> <code>{ estado, dia, hora, notas }</code></li>
            <li><code>GET /api/v1/eventos</code> telemetría cruda, con <code>nombre</code></li>
            <li><code>GET /api/v1/exportar/solicitudes.csv</code></li>
            <li><code>GET /api/v1/openapi.json</code> especificación (pública)</li>
          </ul>`)}
        ${bloque('Ejemplo desde JavaScript', '', `<pre class="codigo">const res = await fetch('${esc(base)}/api/v1/reservas?dias=7', {
  headers: { Authorization: 'Bearer ' + EMPIEZA_API_KEY },
});
const { items } = await res.json();
// items: [{ nombre, telefono, dia, hora, inicio, estadoReserva, ... }]</pre>`, 'bloque-ancho')}
      </div>`;
  }

  iniciar();
})();
