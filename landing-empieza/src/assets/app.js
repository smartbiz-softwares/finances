/* SmartBusiness · empieza.smartbiz.com.uy
   Formulario interactivo "Empezar", agenda, modales y animaciones.
   Sin dependencias. Sin JS la página funciona igual: Empezar abre WhatsApp. */
(() => {
  'use strict';

  const D = window.SB_DATOS;
  if (!D) return;
  const C = D.config;
  document.documentElement.classList.add('js');

  const $ = (sel, raiz = document) => raiz.querySelector(sel);
  const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));
  const esperar = ms => new Promise(r => setTimeout(r, ms));
  const movReducido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';
  const esc = s =>
    String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const I = D.iconos;

  // --- Almacenamiento (puede fallar en modo privado) -------------------------
  const CLAVE = 'sb-empieza-v1';
  const guardar = v => { try { localStorage.setItem(CLAVE, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };
  const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch { return null; } };
  const borrar = () => { try { localStorage.removeItem(CLAVE); } catch { /* sin almacenamiento */ } };

  // --- Botones con spinner ----------------------------------------------------
  function cargando(btn, si) {
    if (!btn) return;
    if (si) {
      btn.setAttribute('data-cargando', '');
      btn.setAttribute('aria-busy', 'true');
    } else {
      btn.removeAttribute('data-cargando');
      btn.removeAttribute('aria-busy');
    }
  }

  // WhatsApp: el enlace abre en el mismo clic (si se retrasa, el navegador lo
  // bloquea); el spinner es solo la confirmación visual de que se oyó el toque.
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-whatsapp]');
    if (!a) return;
    cargando(a, true);
    setTimeout(() => cargando(a, false), 1400);
  });

  // --- Demostración animada ---------------------------------------------------
  const demo = $('[data-demo]');
  if (demo) iniciarDemo(demo);

  function iniciarDemo(el) {
    const barras = $$('.demo-barras i', el);
    const subtitulo = $('[data-demo-subtitulo]', el);
    const play = $('[data-demo-play]', el);
    const escenas = $$('[data-escena]', el);
    const duraciones = [3600, 3600, 4400, 4600, 5200];
    let paso = -1, timer = null, inicio = 0, restante = 0, pausado = false;

    const mostrarPaso = i => {
      el.dataset.paso = i;
      escenas.forEach(s => s.classList.toggle('visible', s.dataset.escena.split(' ').includes(String(i))));
      subtitulo.classList.add('cambiando');
      setTimeout(() => { subtitulo.textContent = D.guionDemo[i]; subtitulo.classList.remove('cambiando'); }, 200);
      barras.forEach((b, j) => {
        b.style.transition = 'none';
        b.style.transform = `scaleX(${j < i ? 1 : 0})`;
      });
      const b = barras[i];
      b.getBoundingClientRect();
      b.style.transition = `transform ${duraciones[i]}ms linear`;
      b.style.transform = 'scaleX(1)';
      correr(duraciones[i]);
    };
    const correr = ms => {
      inicio = performance.now();
      restante = ms;
      clearTimeout(timer);
      timer = setTimeout(avanzar, ms);
    };
    const avanzar = () => {
      if (paso + 1 >= duraciones.length) return terminar();
      paso += 1;
      mostrarPaso(paso);
    };
    const terminar = () => {
      el.removeAttribute('data-reproduciendo');
      el.setAttribute('data-terminado', '');
      play.innerHTML = I.repetir;
      play.setAttribute('aria-label', 'Ver la demostración otra vez');
      paso = -1;
    };
    const pausar = () => {
      if (pausado || paso < 0) return;
      pausado = true;
      clearTimeout(timer);
      restante -= performance.now() - inicio;
      const b = barras[paso];
      const actual = new DOMMatrixReadOnly(getComputedStyle(b).transform).a;
      b.style.transition = 'none';
      b.style.transform = `scaleX(${actual})`;
      el.removeAttribute('data-reproduciendo');
      play.innerHTML = I.play;
      play.setAttribute('aria-label', 'Seguir con la demostración');
    };
    const reanudar = () => {
      pausado = false;
      el.setAttribute('data-reproduciendo', '');
      const b = barras[paso];
      b.getBoundingClientRect();
      b.style.transition = `transform ${Math.max(restante, 0)}ms linear`;
      b.style.transform = 'scaleX(1)';
      correr(Math.max(restante, 0));
    };
    play.addEventListener('click', e => {
      e.stopPropagation();
      if (pausado) return reanudar();
      el.removeAttribute('data-terminado');
      el.setAttribute('data-reproduciendo', '');
      paso = -1;
      avanzar();
    });
    el.addEventListener('click', () => { if (el.hasAttribute('data-reproduciendo')) pausar(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) pausar(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { if (!e.isIntersecting) pausar(); }, { threshold: 0.2 }).observe(el);
    }
    el.dataset.paso = '0';
    escenas.forEach(s => s.classList.toggle('visible', s.dataset.escena.split(' ').includes('0') && !s.classList.contains('fantasma')));
  }

  const fachada = $('[data-youtube]');
  if (fachada) {
    fachada.addEventListener('click', () => {
      const id = fachada.dataset.youtube;
      fachada.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0" title="Video de demostración" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    }, { once: true });
  }

  // --- Modal de confirmación --------------------------------------------------
  const modal = $('#modal-confirmar');
  function confirmar({ titulo, texto, aceptar = 'Aceptar', cancelar = 'Cancelar', icono = 'calendario', alAceptar }) {
    return new Promise(resolver => {
      $('[data-modal-titulo]', modal).textContent = titulo;
      $('[data-modal-texto]', modal).textContent = texto;
      $('[data-modal-icono]', modal).innerHTML = I[icono] || '';
      const bAceptar = $('[data-modal-aceptar]', modal);
      const bCancelar = $('[data-modal-cancelar]', modal);
      $('.btn-texto', bAceptar).textContent = aceptar;
      bCancelar.textContent = cancelar;
      cargando(bAceptar, false);
      bAceptar.disabled = false;
      bCancelar.disabled = false;

      const cerrar = valor => {
        modal.classList.remove('abierta');
        modal.classList.add('cerrando');
        setTimeout(() => { modal.close(); modal.classList.remove('cerrando'); }, movReducido() ? 0 : 170);
        bAceptar.onclick = bCancelar.onclick = modal.oncancel = modal.onclick = null;
        resolver(valor);
      };
      bCancelar.onclick = () => cerrar(false);
      modal.oncancel = e => { e.preventDefault(); if (!bAceptar.hasAttribute('data-cargando')) cerrar(false); };
      modal.onclick = e => { if (e.target === modal && !bAceptar.hasAttribute('data-cargando')) cerrar(false); };
      bAceptar.onclick = async () => {
        if (alAceptar) {
          cargando(bAceptar, true);
          bCancelar.disabled = true;
          try { await alAceptar(); } finally { cargando(bAceptar, false); }
        }
        cerrar(true);
      };
      modal.showModal();
      requestAnimationFrame(() => modal.classList.add('abierta'));
      bAceptar.focus();
    });
  }

  // --- Datos para las preguntas ------------------------------------------------
  const sectorDe = r => D.sectores.find(s => s.slug === r.sector);
  const paisDe = r => D.paises.find(p => p.slug === r.pais);
  const unidad = r => sectorDe(r)?.unidad || 'productos';
  const varias = v => ['2-3', '4-10', '10+'].includes(v);
  const suNegocio = r => sectorDe(r)?.su || 'tu negocio';

  const pasos = [
    {
      id: 'nombre', corto: 'Nombre', tipo: 'texto',
      titulo: () => '¡Hola! Soy Hera. ¿Cómo te llamas?',
      ayuda: 'Así te hablo por tu nombre mientras armamos juntos tu negocio.',
      placeholder: 'Escribe tu nombre', autocomplete: 'given-name', max: 40, requerido: true,
    },
    {
      id: 'sector', corto: 'Sector', tipo: 'unica', otro: 'Mi sector es otro', columnas: 2,
      titulo: r => `Mucho gusto, ${r.nombre}. ¿En qué sector se encuentra tu negocio?`,
      ayuda: 'Elige el que más se parezca. Si no está, toca "Mi sector es otro" y escríbelo.',
      opciones: () => D.sectores.map(s => ({ valor: s.slug, texto: s.nombre, icono: s.icono })),
    },
    {
      id: 'pais', corto: 'País', tipo: 'unica', otro: 'Otro país', columnas: 2,
      titulo: () => '¿En qué país está tu negocio?',
      ayuda: 'Así sabemos con qué monedas trabajas y en qué horario atenderte.',
      opciones: () => D.paises.map(p => ({ valor: p.slug, texto: p.nombre })),
    },
    {
      id: 'sucursales', corto: 'Puntos de venta', tipo: 'unica',
      titulo: r => `¿Cuántos puntos de venta o sucursales tiene ${suNegocio(r)}?`,
      opciones: () => [
        { valor: '1', texto: 'Uno solo', icono: 'tienda' },
        { valor: '2-3', texto: '2 o 3', icono: 'sucursal' },
        { valor: '4-10', texto: 'De 4 a 10', icono: 'sucursal' },
        { valor: '10+', texto: 'Más de 10', icono: 'sucursal' },
        { valor: '0', texto: 'Ninguno por ahora', detalle: 'Vendo por internet, a domicilio o por encargo', icono: 'celular' },
      ],
    },
    {
      id: 'mercancia', corto: 'Mercancía entre sucursales', tipo: 'unica', si: r => varias(r.sucursales),
      titulo: () => '¿Las sucursales comparten la mercancía o cada una tiene la suya?',
      ayuda: 'Nos ayuda a preparar el inventario de cada punto de venta.',
      opciones: () => [
        { valor: 'propia', texto: 'Cada una tiene su propia mercancía' },
        { valor: 'central', texto: 'Compartimos un almacén central', detalle: 'Desde ahí enviamos a cada sucursal' },
        { valor: 'mixto', texto: 'Un poco de las dos' },
        { valor: 'nose', texto: 'No lo tengo claro todavía' },
      ],
    },
    {
      id: 'trabajadores', corto: 'Personas en el negocio', tipo: 'unica',
      titulo: () => '¿Cuántas personas trabajan en el negocio, contándote a ti?',
      opciones: () => [
        { valor: '1', texto: 'Solo yo' },
        { valor: '2-5', texto: 'De 2 a 5' },
        { valor: '6-15', texto: 'De 6 a 15' },
        { valor: '16-50', texto: 'De 16 a 50' },
        { valor: '50+', texto: 'Más de 50' },
      ],
    },
    {
      id: 'usuarios', corto: 'Quién usaría el sistema', tipo: 'multiple', si: r => r.trabajadores && r.trabajadores !== '1', exclusiva: 'yo',
      titulo: () => 'Además de ti, ¿quiénes usarían el sistema?',
      ayuda: 'Marca todos los que correspondan.',
      opciones: () => [
        { valor: 'vendedores', texto: 'Cajeros o vendedores' },
        { valor: 'almacen', texto: 'Encargado de almacén' },
        { valor: 'gerente', texto: 'Administrador o gerente' },
        { valor: 'contador', texto: 'Contador' },
        { valor: 'socios', texto: 'Socios o familiares' },
        { valor: 'yo', texto: 'Solo yo, por ahora' },
      ],
    },
    {
      id: 'productos', corto: 'Cantidad de productos', tipo: 'unica',
      titulo: r => {
        const u = unidad(r);
        if (u === 'platos') return 'Más o menos, ¿cuántos platos y productos tiene tu carta?';
        if (u === 'servicios') return 'Más o menos, ¿cuántos servicios y productos distintos ofreces?';
        return 'Más o menos, ¿cuántos productos distintos vendes?';
      },
      ayuda: 'Un aproximado está perfecto. Cuenta cada producto distinto una sola vez.',
      opciones: () => [
        { valor: '<50', texto: 'Menos de 50' },
        { valor: '50-300', texto: 'Entre 50 y 300' },
        { valor: '300-1000', texto: 'Entre 300 y 1.000' },
        { valor: '1000-5000', texto: 'Entre 1.000 y 5.000' },
        { valor: '5000+', texto: 'Más de 5.000' },
        { valor: 'nose', texto: 'No sé, nunca los conté' },
      ],
    },
    {
      id: 'codigos', corto: 'Códigos de barras', tipo: 'unica',
      si: r => ['300-1000', '1000-5000', '5000+'].includes(r.productos) && unidad(r) !== 'servicios',
      titulo: () => '¿Tus productos tienen código de barras?',
      ayuda: 'Con tantos productos, el lector de códigos acelera mucho la venta.',
      opciones: () => [
        { valor: 'todos', texto: 'Sí, casi todos' },
        { valor: 'algunos', texto: 'Algunos sí, otros no' },
        { valor: 'ninguno', texto: 'No, ninguno' },
        { valor: 'nose', texto: 'No lo sé' },
      ],
    },
    {
      id: 'variantes', corto: 'Tallas, colores o medidas', tipo: 'unica', si: r => sectorDe(r)?.variantes,
      titulo: () => '¿Vendes el mismo producto en distintas tallas, colores o medidas?',
      opciones: () => [
        { valor: 'si', texto: 'Sí, muchos' },
        { valor: 'algunos', texto: 'Solo algunos' },
        { valor: 'no', texto: 'No' },
      ],
    },
    {
      id: 'vencimiento', corto: 'Productos que se vencen', tipo: 'unica', si: r => sectorDe(r)?.perecedero,
      titulo: () => '¿Vendes productos que se vencen o se echan a perder?',
      opciones: () => [
        { valor: 'muchos', texto: 'Sí, muchos' },
        { valor: 'algunos', texto: 'Algunos' },
        { valor: 'no', texto: 'Casi ninguno' },
      ],
    },
    {
      id: 'internet', corto: 'Conexión a internet', tipo: 'unica',
      titulo: () => '¿Cómo es la conexión a internet en tu negocio?',
      ayuda: 'Sé sincero: con esto preparamos tu sesión pensando en tu conexión real.',
      opciones: () => [
        { valor: 'buena', texto: 'Buena', detalle: 'Funciona estable casi todo el día', icono: 'wifi' },
        { valor: 'regular', texto: 'Más o menos', detalle: 'Se cae o se pone lenta varias veces al día', icono: 'wifi' },
        { valor: 'mala', texto: 'Pésima', detalle: 'Casi nunca tengo, o es muy cara', icono: 'wifi' },
      ],
    },
    {
      id: 'conexion', corto: 'Cómo se conecta', tipo: 'unica', si: r => r.internet && r.internet !== 'buena',
      titulo: () => '¿Cómo te conectas normalmente?',
      opciones: () => [
        { valor: 'wifi', texto: 'Wifi del negocio' },
        { valor: 'datos', texto: 'Datos del celular' },
        { valor: 'ambos', texto: 'Las dos cosas' },
        { valor: 'ninguna', texto: 'Todavía no tengo conexión en el negocio' },
      ],
    },
    {
      id: 'luz', corto: 'Cortes de electricidad', tipo: 'unica', si: r => r.internet && r.internet !== 'buena',
      titulo: () => '¿Y la electricidad? ¿Tienes cortes de luz?',
      opciones: () => [
        { valor: 'nunca', texto: 'Casi nunca' },
        { valor: 'aveces', texto: 'A veces' },
        { valor: 'diario', texto: 'Casi todos los días' },
      ],
    },
    {
      id: 'dispositivos', corto: 'Dónde lo usaría', tipo: 'multiple', exclusiva: 'nose',
      titulo: () => `¿Dónde te gustaría usar ${C.marca}?`,
      ayuda: 'Puedes marcar varios.',
      opciones: () => [
        { valor: 'celular', texto: 'En el celular', icono: 'celular' },
        { valor: 'computadora', texto: 'En una computadora', icono: 'maletin' },
        { valor: 'tablet', texto: 'En una tablet', icono: 'celular' },
        { valor: 'nose', texto: 'Todavía no lo sé' },
      ],
    },
    {
      id: 'control', corto: 'Cómo lleva el control hoy', tipo: 'unica',
      titulo: () => 'Hoy, ¿cómo llevas las ventas y el inventario?',
      opciones: () => [
        { valor: 'cuaderno', texto: 'En un cuaderno o libreta', icono: 'fiado' },
        { valor: 'excel', texto: 'En Excel o en el celular', icono: 'margen' },
        { valor: 'sistema', texto: 'Con otro sistema', icono: 'caja' },
        { valor: 'memoria', texto: 'De memoria', icono: 'chispa' },
        { valor: 'nada', texto: 'No lo llevo', icono: 'cerrar' },
      ],
    },
    {
      id: 'sistemaActual', corto: 'Sistema actual', tipo: 'texto', si: r => r.control === 'sistema', area: true, max: 300,
      titulo: () => '¿Qué sistema usas y qué es lo que no te gusta de él?',
      ayuda: 'Es opcional, pero nos ayuda mucho a no repetir lo que te molesta.',
      placeholder: 'Ej.: es lento, no tiene inventario, no funciona en el celular…',
    },
    {
      id: 'dolores', corto: 'Lo que más le preocupa', tipo: 'multiple', max: 3, otro: 'Otra cosa',
      titulo: r => `${r.nombre}, ¿qué es lo que más te preocupa hoy de tu negocio?`,
      ayuda: 'Elige hasta 3. Son las fugas más comunes.',
      opciones: () => D.problemas.map(p => ({ valor: p.clave, texto: p.opcion, icono: p.icono })),
    },
    {
      id: 'deudores', corto: 'Clientes que le deben', tipo: 'unica', si: r => (r.dolores || []).includes('fiado'),
      titulo: () => 'Más o menos, ¿cuántos clientes te deben dinero ahora?',
      opciones: () => [
        { valor: '<10', texto: 'Menos de 10' },
        { valor: '10-30', texto: 'Entre 10 y 30' },
        { valor: '30-100', texto: 'Entre 30 y 100' },
        { valor: '100+', texto: 'Más de 100' },
      ],
    },
    {
      id: 'monedas', corto: 'Monedas en que cobra', tipo: 'multiple', otro: 'Otra moneda',
      si: r => (r.dolores || []).includes('monedas') || ['cuba', 'venezuela', 'argentina'].includes(r.pais),
      titulo: () => '¿En qué monedas cobras?',
      ayuda: 'Marca todas las que recibes, en efectivo o por transferencia.',
      opciones: r => {
        const propias = paisDe(r)?.monedas || [];
        const lista = [...new Set([...propias, 'USD', 'EUR'])];
        return lista.map(m => ({ valor: m, texto: D.monedas[m] ? `${D.monedas[m]} (${m})` : m }));
      },
    },
    {
      id: 'objetivo', corto: 'Objetivo a 3 meses', tipo: 'unica', otro: 'Otra cosa',
      titulo: () => 'Si en 3 meses todo saliera bien, ¿qué te gustaría haber logrado?',
      opciones: () => [
        { valor: 'ganancia', texto: 'Saber cuánto gano cada día' },
        { valor: 'inventario', texto: 'Tener el inventario al día' },
        { valor: 'cobrar', texto: 'Cobrar lo que me deben' },
        { valor: 'caja', texto: 'Cerrar la caja en minutos' },
        { valor: 'crecer', texto: 'Abrir otra sucursal con todo bajo control' },
        { valor: 'tiempo', texto: 'Tener más tiempo libre' },
      ],
    },
    {
      id: 'cuando', corto: 'Cuándo quiere empezar', tipo: 'unica',
      titulo: () => '¿Cuándo te gustaría empezar?',
      opciones: () => [
        { valor: 'semana', texto: 'Esta misma semana', icono: 'chispa' },
        { valor: 'mes', texto: 'Este mes', icono: 'calendario' },
        { valor: 'meses', texto: 'En unos meses', icono: 'reloj' },
        { valor: 'averiguando', texto: 'Solo estoy averiguando', icono: 'globo' },
      ],
    },
    { id: 'contacto', corto: 'Contacto', tipo: 'contacto', titulo: r => `Último paso, ${r.nombre}. ¿A qué WhatsApp te escribimos?` },
  ];
  const pasoPorId = Object.fromEntries(pasos.map(p => [p.id, p]));

  // --- Estado ---------------------------------------------------------------
  let estado = nuevoEstado();
  function nuevoEstado() {
    return { r: {}, historial: [], etapa: 'preguntas', reserva: null, enviado: false, creado: Date.now() };
  }
  const persistir = () => guardar(estado);
  const aplicables = () => pasos.filter(p => !p.si || p.si(estado.r));
  const pasoActual = () => pasoPorId[estado.historial[estado.historial.length - 1]];

  function siguientePaso(idActual) {
    const lista = aplicables();
    const i = idActual ? lista.findIndex(p => p.id === idActual) : -1;
    return lista[i + 1] || null;
  }

  function etiqueta(paso, valor) {
    if (paso.tipo === 'texto') return valor;
    const ops = paso.opciones(estado.r);
    const uno = v => (v === 'otro' ? estado.r[`${paso.id}Otro`] || 'Otro' : ops.find(o => o.valor === v)?.texto || v);
    return Array.isArray(valor) ? valor.map(uno).join(', ') : uno(valor);
  }

  function resumen() {
    const filas = [];
    for (const p of aplicables()) {
      if (p.tipo === 'contacto') continue;
      const v = estado.r[p.id];
      if (v == null || v === '' || (Array.isArray(v) && !v.length)) continue;
      filas.push({ pregunta: p.corto, respuesta: etiqueta(p, v) });
    }
    return filas;
  }

  // --- Hoja ---------------------------------------------------------------------
  const hoja = $('#hoja-empezar');
  const cuerpo = $('[data-hoja-cuerpo]', hoja);
  const bAtras = $('[data-hoja-atras]', hoja);
  const bCerrar = $('[data-hoja-cerrar]', hoja);
  const barraProgreso = $('[data-progreso]', hoja);
  const progresoEl = $('.progreso', hoja);
  const pagina = document.body.dataset;

  function fijarProgreso(fraccion) {
    barraProgreso.style.setProperty('--p', fraccion.toFixed(3));
    progresoEl.setAttribute('aria-valuenow', Math.round(fraccion * 100));
  }

  function abrirHoja() {
    if (hoja.open) return;
    hoja.showModal();
    document.documentElement.classList.add('hoja-abierta');
    requestAnimationFrame(() => requestAnimationFrame(() => hoja.classList.add('abierta')));
  }

  function cerrarHoja() {
    hoja.classList.remove('abierta');
    hoja.classList.add('cerrando');
    setTimeout(() => {
      hoja.close();
      hoja.classList.remove('cerrando');
      document.documentElement.classList.remove('hoja-abierta');
    }, movReducido() ? 120 : 280);
  }

  async function pedirCierre() {
    const enCurso = estado.etapa === 'preguntas' && estado.historial.length > 1;
    if (enCurso) {
      const salir = await confirmar({
        titulo: '¿Quieres salir?',
        texto: 'Guardamos tus respuestas. Cuando vuelvas a tocar Empezar, sigues donde quedaste.',
        aceptar: 'Salir',
        cancelar: 'Seguir respondiendo',
        icono: 'escudo',
      });
      if (!salir) return;
    }
    cerrarHoja();
  }
  bCerrar.addEventListener('click', pedirCierre);
  hoja.addEventListener('cancel', e => { e.preventDefault(); pedirCierre(); });
  bAtras.addEventListener('click', atras);

  async function empezar(boton) {
    cargando(boton, true);
    const previo = leer();
    await esperar(320);
    cargando(boton, false);

    if (previo && previo.historial?.length > 1 && previo.etapa !== 'listo') {
      estado = previo;
      abrirHoja();
      esqueletoPregunta();
      const seguir = await confirmar({
        titulo: `¿Seguimos donde quedaste${previo.r.nombre ? `, ${previo.r.nombre}` : ''}?`,
        texto: 'Tus respuestas anteriores están guardadas en este dispositivo.',
        aceptar: 'Continuar',
        cancelar: 'Empezar de nuevo',
        icono: 'repetir',
      });
      if (!seguir) reiniciar();
      return reanudarEtapa(1);
    }
    reiniciar();
    abrirHoja();
    esqueletoPregunta();
    await esperar(movReducido() ? 0 : 420);
    irA(siguientePaso(null), 1);
  }

  function reiniciar() {
    estado = nuevoEstado();
    if (pagina.sector) estado.r.sector = pagina.sector;
    if (pagina.pais) estado.r.pais = pagina.pais;
    if (pagina.problema) estado.r.dolores = [pagina.problema];
    borrar();
  }

  function reanudarEtapa(dir) {
    if (estado.etapa === 'resultado' || estado.etapa === 'analisis') return mostrarResultado(false);
    if (estado.etapa === 'agenda') return mostrarAgenda();
    const actual = pasoActual() || siguientePaso(null);
    estado.historial = estado.historial.filter(id => pasoPorId[id]);
    if (!estado.historial.length) estado.historial = [actual.id];
    estado.historial.pop();
    irA(actual, dir);
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-empezar]');
    if (!b || !hoja || typeof hoja.showModal !== 'function') return;
    e.preventDefault();
    empezar(b);
  });

  // --- Transición entre vistas -------------------------------------------------
  function mostrarVista(html, dir = 1, { foco = true } = {}) {
    const vieja = cuerpo.firstElementChild;
    const nueva = document.createElement('div');
    nueva.className = 'vista';
    nueva.innerHTML = html;
    if (vieja) {
      $$('[id="hoja-titulo"]', vieja).forEach(el => el.removeAttribute('id'));
      vieja.style.pointerEvents = 'none';
      vieja.setAttribute('aria-hidden', 'true');
    }
    cuerpo.append(nueva);
    cuerpo.scrollTop = 0;
    const desp = movReducido() ? 0 : 28 * dir;
    if (vieja) {
      vieja.animate(
        [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-desp}px)` }],
        { duration: 200, easing: EASE, fill: 'forwards' },
      ).finished.then(() => vieja.remove(), () => vieja.remove());
    }
    nueva.animate(
      [{ opacity: 0, transform: `translateX(${desp}px)` }, { opacity: 1, transform: 'none' }],
      { duration: 320, delay: vieja ? 70 : 0, easing: EASE, fill: 'backwards' },
    );
    escalonar($$('[data-escalonar]', nueva), vieja ? 140 : 60);
    if (foco) {
      const destino = $('input[type="text"], input[type="tel"], textarea', nueva) || $('#hoja-titulo', nueva);
      setTimeout(() => destino?.focus({ preventScroll: true }), vieja ? 260 : 80);
    }
    return nueva;
  }

  function escalonar(elementos, base = 0) {
    if (movReducido()) return;
    elementos.forEach((el, i) =>
      el.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], {
        duration: 360,
        delay: base + Math.min(i, 10) * 40,
        easing: EASE,
        fill: 'backwards',
      }),
    );
  }

  const imgHera = (pose, clase) => `<img class="${clase}" src="/assets/img/${D.heras[pose]}.webp" width="240" height="330" alt="">`;
  const heraMini = () => imgHera('neutra', 'hera-mini');

  function esqueletoPregunta() {
    bAtras.hidden = true;
    fijarProgreso(0.02);
    mostrarVista(
      `<div class="vista-in" aria-busy="true" aria-label="Cargando">
        <div class="hera-burbuja">${heraMini()}<span>Hera</span></div>
        <div class="esqueleto esq-titulo"></div>
        <div class="esqueleto esq-linea"></div>
        <div class="opciones">${'<div class="esqueleto esq-opcion"></div>'.repeat(4)}</div>
      </div>`,
      1,
      { foco: false },
    );
  }

  // --- Preguntas ----------------------------------------------------------------
  function irA(paso, dir) {
    if (!paso) return mostrarResultado(true);
    estado.etapa = 'preguntas';
    if (estado.historial[estado.historial.length - 1] !== paso.id) estado.historial.push(paso.id);
    persistir();
    const lista = aplicables();
    const n = lista.findIndex(p => p.id === paso.id) + 1;
    fijarProgreso(n / (lista.length + 1));
    bAtras.hidden = estado.historial.length <= 1;
    const vista = mostrarVista(htmlPaso(paso, n, lista.length), dir);
    conectarPaso(vista, paso);
  }

  function atras() {
    if (estado.etapa === 'agenda') return mostrarResultado(false, -1);
    if (estado.etapa === 'resultado') {
      estado.etapa = 'preguntas';
      const ultimo = pasoActual();
      estado.historial.pop();
      return irA(ultimo, -1);
    }
    if (estado.historial.length <= 1) return;
    estado.historial.pop();
    const anterior = pasoPorId[estado.historial.pop()];
    irA(anterior, -1);
  }

  function htmlOpcion(paso, o, tipo, marcado) {
    const icono = o.icono ? `<span class="opcion-icono">${I[o.icono] || o.icono}</span>` : '';
    return `<label class="opcion" data-escalonar>
      <input type="${tipo}" name="${paso.id}" value="${esc(o.valor)}"${marcado ? ' checked' : ''}>
      ${icono}
      <span class="opcion-texto">${esc(o.texto)}${o.detalle ? `<small>${esc(o.detalle)}</small>` : ''}</span>
      <span class="opcion-marca${tipo === 'checkbox' ? ' cuadrada' : ''}">${I.check}</span>
    </label>`;
  }

  function htmlPaso(paso, n, total) {
    const r = estado.r;
    const titulo = esc(paso.titulo(r));
    const ayuda = paso.ayuda ? `<p class="pregunta-ayuda" id="ayuda-${paso.id}">${esc(paso.ayuda)}</p>` : '';
    const cabeza = `<div class="hera-burbuja">${heraMini()}<span>Pregunta ${n}${n === total ? ' · la última' : ''}</span></div>
      <h2 class="pregunta-titulo" id="hoja-titulo" tabindex="-1">${titulo}</h2>${ayuda}`;
    const boton = (texto = 'Continuar') =>
      `<div class="hoja-pie"><button class="btn btn-primario btn-ancho" type="submit"><span class="btn-texto">${texto}${I.flecha}</span><span class="btn-spinner" aria-hidden="true"></span></button></div>`;
    const error = '<p class="error" role="alert" data-error hidden></p>';

    if (paso.tipo === 'texto') {
      const v = esc((paso.id === 'nombre' && r.nombreCompleto) || r[paso.id] || '');
      const campo = paso.area
        ? `<textarea class="entrada" id="campo-${paso.id}" name="${paso.id}" maxlength="${paso.max}" placeholder="${esc(paso.placeholder)}" aria-labelledby="hoja-titulo">${v}</textarea>`
        : `<input class="entrada" type="text" id="campo-${paso.id}" name="${paso.id}" value="${v}" maxlength="${paso.max}" placeholder="${esc(paso.placeholder)}" autocomplete="${paso.autocomplete || 'off'}" enterkeyhint="next" aria-labelledby="hoja-titulo" ${paso.requerido ? 'required' : ''}>`;
      return `<form novalidate data-paso="${paso.id}">${cabeza}<div class="campo" data-escalonar>${campo}</div>${error}<div class="espacio"></div>${boton()}</form>`;
    }

    if (paso.tipo === 'contacto') {
      const pais = paisDe(r);
      const prefijos = [...new Map(D.paises.map(p => [p.prefijo, p])).values()];
      const pref = r.prefijo || pais?.prefijo || '53';
      return `<form novalidate data-paso="contacto" autocomplete="on">${cabeza}
        <p class="pregunta-ayuda">Te enviamos tu resultado y coordinamos tu sesión por ahí.</p>
        <div class="campo" data-escalonar>
          <label for="campo-telefono">Tu WhatsApp</label>
          <div class="telefono">
            <select class="entrada" id="campo-prefijo" name="prefijo" aria-label="Código de país">
              ${prefijos.map(p => `<option value="${p.prefijo}"${p.prefijo === pref ? ' selected' : ''}>+${p.prefijo}</option>`).join('')}
            </select>
            <input class="entrada" type="tel" id="campo-telefono" name="telefono" inputmode="tel" autocomplete="tel-national" placeholder="Número de WhatsApp" value="${esc(r.telefono || '')}" required>
          </div>
        </div>
        <div class="campo" data-escalonar>
          <label for="campo-negocio">Nombre de tu negocio <small>(opcional)</small></label>
          <input class="entrada" type="text" id="campo-negocio" name="negocio" autocomplete="organization" maxlength="80" value="${esc(r.negocio || '')}">
        </div>
        <div class="campo" data-escalonar>
          <label for="campo-ciudad">Ciudad <small>(opcional)</small></label>
          <input class="entrada" type="text" id="campo-ciudad" name="ciudad" autocomplete="address-level2" maxlength="60" value="${esc(r.ciudad || '')}">
        </div>
        <input type="text" name="sitio" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px">
        ${error}
        <p class="privacidad" data-escalonar>${I.escudo}<span>Usamos tus datos solo para preparar tu sesión y contactarte. No los compartimos con nadie.</span></p>
        <div class="espacio"></div>
        ${boton('Ver mi resultado')}
      </form>`;
    }

    const tipo = paso.tipo === 'multiple' ? 'checkbox' : 'radio';
    const actual = r[paso.id];
    const marcado = v => (Array.isArray(actual) ? actual.includes(v) : actual === v);
    const ops = paso.opciones(r).map(o => htmlOpcion(paso, o, tipo, marcado(o.valor))).join('');
    const otro = paso.otro
      ? htmlOpcion(paso, { valor: 'otro', texto: paso.otro, icono: 'lapiz' }, tipo, marcado('otro')) +
        `<div class="campo campo-otro" data-otro ${marcado('otro') ? '' : 'hidden'}>
          <label for="campo-${paso.id}-otro">Escríbelo aquí</label>
          <input class="entrada" type="text" id="campo-${paso.id}-otro" name="${paso.id}Otro" maxlength="60" value="${esc(r[`${paso.id}Otro`] || '')}" enterkeyhint="next">
        </div>`
      : '';
    return `<form novalidate data-paso="${paso.id}">${cabeza}
      <fieldset class="opciones${paso.columnas === 2 ? ' cols-2' : ''}" ${paso.ayuda ? `aria-describedby="ayuda-${paso.id}"` : ''}>
        <legend class="sr">${titulo}</legend>${ops}${otro}
      </fieldset>${error}<div class="espacio"></div>
      ${boton()}
    </form>`;
  }

  function conectarPaso(vista, paso) {
    const form = $('form', vista);
    const err = $('[data-error]', form);
    const boton = $('button[type="submit"]', form);
    const avisar = texto => {
      err.innerHTML = `${I.alerta}<span>${esc(texto)}</span>`;
      err.hidden = false;
      err.animate?.([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 240, easing: EASE });
    };
    const limpiar = () => { err.hidden = true; };

    if (paso.tipo === 'unica' || paso.tipo === 'multiple') {
      const cajaOtro = $('[data-otro]', form);
      const entradaOtro = cajaOtro && $('input', cajaOtro);
      const sincronizar = () => {
        const marcados = $$(`input[name="${paso.id}"]:checked`, form).map(i => i.value);
        if (cajaOtro) {
          const ver = marcados.includes('otro');
          if (ver && cajaOtro.hidden) {
            cajaOtro.hidden = false;
            if (!movReducido()) cajaOtro.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: EASE });
            setTimeout(() => entradaOtro.focus(), 60);
          } else if (!ver) cajaOtro.hidden = true;
        }
        if (paso.max) {
          const lleno = marcados.length >= paso.max;
          $$(`input[name="${paso.id}"]`, form).forEach(i => { i.disabled = lleno && !i.checked; });
        }
        if (boton) boton.disabled = !marcados.length;
        return marcados;
      };
      form.addEventListener('change', e => {
        limpiar();
        const inp = e.target;
        if (paso.exclusiva && inp.name === paso.id && inp.checked) {
          $$(`input[name="${paso.id}"]`, form).forEach(i => {
            if (inp.value === paso.exclusiva ? i.value !== paso.exclusiva : i.value === paso.exclusiva) i.checked = false;
          });
        }
        const marcados = sincronizar();
        // Respuesta única sin "otro": avanza sola tras un instante, para que se
        // vea la selección antes de pasar.
        if (paso.tipo === 'unica' && inp.name === paso.id && marcados[0] && marcados[0] !== 'otro') {
          form.dataset.auto = '1';
          setTimeout(() => { if (form.isConnected && form.dataset.auto === '1') form.requestSubmit(); }, 280);
        }
      });
      sincronizar();
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (form.dataset.enviando) return;
      limpiar();
      const auto = form.dataset.auto === '1';
      delete form.dataset.auto;
      const datos = new FormData(form);
      const r = estado.r;

      if (paso.tipo === 'texto') {
        const v = String(datos.get(paso.id) || '').trim();
        if (paso.requerido && v.length < 2) return avisar('Escribe tu nombre para seguir.');
        r[paso.id] = paso.id === 'nombre' ? v.replace(/\s+/g, ' ').split(' ')[0].replace(/^./, c => c.toUpperCase()) : v;
        if (paso.id === 'nombre') r.nombreCompleto = v.replace(/\s+/g, ' ').replace(/(^|\s)\S/g, c => c.toUpperCase());
      } else if (paso.tipo === 'contacto') {
        const tel = String(datos.get('telefono') || '').replace(/[^\d]/g, '');
        const input = $('#campo-telefono', form);
        if (tel.length < 6 || tel.length > 15) {
          input.setAttribute('aria-invalid', 'true');
          input.focus();
          return avisar('Revisa el número: escribe solo los dígitos de tu WhatsApp.');
        }
        input.removeAttribute('aria-invalid');
        r.prefijo = String(datos.get('prefijo'));
        r.telefono = tel;
        r.negocio = String(datos.get('negocio') || '').trim();
        r.ciudad = String(datos.get('ciudad') || '').trim();
        r.sitio = String(datos.get('sitio') || '');
      } else {
        const marcados = datos.getAll(paso.id).map(String);
        if (!marcados.length) return avisar('Elige una opción para seguir.');
        if (marcados.includes('otro')) {
          const t = String(datos.get(`${paso.id}Otro`) || '').trim();
          if (!t) { $('[data-otro] input', form)?.focus(); return avisar('Escribe tu respuesta en el campo de abajo.'); }
          r[`${paso.id}Otro`] = t;
        } else delete r[`${paso.id}Otro`];
        r[paso.id] = paso.tipo === 'multiple' ? marcados : marcados[0];
      }
      persistir();

      form.dataset.enviando = '1';
      if (paso.tipo === 'contacto') {
        cargando(boton, true);
        const [ok] = await Promise.all([enviarSolicitud('formulario'), esperar(600)]);
        estado.enviado = ok;
        persistir();
        cargando(boton, false);
        return mostrarResultado(true);
      }
      if (!auto) {
        cargando(boton, true);
        await esperar(280);
        cargando(boton, false);
      }
      irA(siguientePaso(paso.id), 1);
    });
  }

  // --- Resultado ------------------------------------------------------------------
  function tamano(r) {
    if (['4-10', '10+'].includes(r.sucursales) || ['16-50', '50+'].includes(r.trabajadores) || r.productos === '5000+') return 'grande';
    if (varias(r.sucursales) || r.trabajadores === '6-15' || r.productos === '1000-5000') return 'mediano';
    return 'pequeno';
  }

  function hallazgos() {
    const r = estado.r;
    const lista = [];
    const sector = sectorDe(r)?.nombre || r.sectorOtro || 'Tu negocio';
    const pais = paisDe(r)?.nombre || r.paisOtro || '';
    const sucursales = { 1: '1 punto de venta', '2-3': '2 o 3 sucursales', '4-10': 'de 4 a 10 sucursales', '10+': 'más de 10 sucursales', 0: 'vende sin local' };
    const personas = { 1: 'trabajas solo', '2-5': 'de 2 a 5 personas', '6-15': 'de 6 a 15 personas', '16-50': 'de 16 a 50 personas', '50+': 'más de 50 personas' };
    const partes = [
      sucursales[r.sucursales],
      personas[r.trabajadores],
      r.productos && r.productos !== 'nose' ? `${etiqueta(pasoPorId.productos, r.productos).toLowerCase()} ${unidad(r) === 'platos' ? 'platos' : unidad(r)}` : '',
    ].filter(Boolean);
    lista.push({ icono: sectorDe(r)?.icono || 'tienda', titulo: `${sector}${pais ? ` en ${pais}` : ''}`, texto: `${partes.join(' · ')}.`.replace(/^./, c => c.toUpperCase()) });

    for (const clave of (r.dolores || []).filter(d => d !== 'otro').slice(0, 3)) {
      const p = D.problemas.find(x => x.clave === clave);
      if (p) lista.push({ icono: p.icono, titulo: `Fuga: ${p.nombre.toLowerCase()}`, texto: `Lo resolvemos con ${p.funcion.toLowerCase()}.`, fuga: true });
    }
    if (r.dolores?.includes('otro') && r.doloresOtro) lista.push({ icono: 'chispa', titulo: `También te preocupa: ${r.doloresOtro}`, texto: 'Lo revisamos contigo en la sesión.', fuga: true });

    if (r.internet === 'buena') {
      lista.push({ icono: 'wifi', titulo: 'Tu conexión es buena', texto: 'Vas a poder ver tu negocio en tiempo real desde donde estés.' });
    } else if (r.internet) {
      const luz = r.luz === 'diario' ? ' y los cortes de luz' : '';
      lista.push({ icono: 'wifi', titulo: 'Tendremos en cuenta tu conexión', texto: `Preparamos la sesión pensando en tu internet${luz}, y te mostramos cómo trabajar mejor con ellos.` });
    }
    if (varias(r.sucursales)) {
      lista.push({ icono: 'sucursal', titulo: 'Varias sucursales, una sola vista', texto: 'Verás cada punto de venta por separado y todo tu negocio junto.' });
    } else if (['1000-5000', '5000+'].includes(r.productos)) {
      lista.push({ icono: 'stock', titulo: 'Muchos productos, empezamos por lo importante', texto: 'En la sesión cargamos primero los que más vendes para que empieces rápido.' });
    }
    return lista.slice(0, 6);
  }

  async function mostrarResultado(conAnalisis, dir = 1) {
    estado.etapa = 'resultado';
    persistir();
    bAtras.hidden = false;
    fijarProgreso(1);
    const r = estado.r;
    const lista = hallazgos();
    const grande = tamano(r) !== 'pequeno';
    const recomiendaAgenda = r.cuando !== 'averiguando' && (grande || r.cuando !== 'semana');

    const hoy = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    const vista = mostrarVista(
      `<div class="vista-in" aria-busy="${conAnalisis}">
        <div class="resultado-cabecera">${imgHera(conAnalisis ? 'piensa' : 'explica', 'resultado-hera')}<div>
          <p>Tu diagnóstico</p>
          <h2 class="pregunta-titulo" id="hoja-titulo" tabindex="-1">${conAnalisis ? `Estoy revisando tu negocio, ${esc(r.nombre)}…` : `Esto es lo que vi en tu negocio, ${esc(r.nombre)}`}</h2>
        </div></div>
        <div class="ticket-resultado">
          <p class="ticket-cabeza"><img class="ticket-logo" src="/assets/img/logo.webp" width="40" height="40" alt=""><span>SmartBusiness · Hera</span></p>
          <p class="ticket-meta">${esc(r.negocio || sectorDe(r)?.nombre || 'Tu negocio')} · ${esc(hoy)}</p>
          <ul class="hallazgos" data-hallazgos>${lista.map(() => '<li class="esqueleto esq-fila"></li>').join('')}</ul>
        </div>
        <div data-caminos hidden>
          <h3 class="caminos-titulo">¿Cómo quieres seguir?</h3>
          <div class="caminos">
            <button class="camino${recomiendaAgenda ? ' recomendado' : ''}" type="button" data-ir-agenda>
              ${recomiendaAgenda ? '<span class="camino-insignia">Recomendado para ti</span>' : ''}
              <span class="camino-icono">${I.calendario}</span>
              <span class="camino-contenido"><b>Reservar un día para armar mi negocio</b><small>Elige día y hora. Sesión de acompañamiento de 1 hora.</small></span>
              ${I.flecha}
            </button>
            <a class="camino${recomiendaAgenda ? '' : ' recomendado'}" href="${esc(urlWhatsapp())}" target="_blank" rel="noopener" data-whatsapp>
              ${recomiendaAgenda ? '' : '<span class="camino-insignia">Recomendado para ti</span>'}
              <span class="camino-icono">${D.whatsapp}</span>
              <span class="camino-contenido"><b>Hablar ahora por WhatsApp</b><small>Te responde una persona del equipo · ${esc(C.whatsappVisible)}</small></span>
              ${I.flecha}
            </a>
          </div>
        </div>
      </div>`,
      dir,
    );
    const ul = $('[data-hallazgos]', vista);
    const caminos = $('[data-caminos]', vista);
    const pintar = () => {
      ul.innerHTML = lista
        .map(h => `<li class="hallazgo${h.fuga ? ' fuga' : ''}">${I[h.icono] || ''}<div><h3>${esc(h.titulo)}</h3><p>${esc(h.texto)}</p></div></li>`)
        .join('');
    };

    if (conAnalisis) {
      await esperar(movReducido() ? 300 : 1100);
      if (!vista.isConnected) return;
      pintar();
      const items = $$('.hallazgo', ul);
      // Como un ticket que se imprime: una línea tras otra, no todo de golpe.
      for (const [i, li] of items.entries()) {
        if (!movReducido()) li.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 320, delay: i * 180, easing: EASE, fill: 'backwards' });
      }
      await esperar(movReducido() ? 0 : items.length * 180 + 200);
      const h2 = $('#hoja-titulo', vista);
      h2.textContent = `Esto es lo que vi en tu negocio, ${r.nombre}`;
      const img = $('.resultado-hera', vista);
      img.src = `/assets/img/${D.heras.explica}.webp`;
      vista.firstElementChild.setAttribute('aria-busy', 'false');
    } else {
      pintar();
    }
    if (!vista.isConnected) return;
    caminos.hidden = false;
    escalonar([$('.caminos-titulo', caminos), ...$$('.camino', caminos)]);
    $('[data-ir-agenda]', vista).addEventListener('click', async e => {
      const b = e.currentTarget;
      cargando(b, true);
      await esperar(260);
      mostrarAgenda();
    });
  }

  // --- Agenda ------------------------------------------------------------------------
  const zona = C.agenda.zonaHoraria;
  function partesEn(fecha) {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .formatToParts(fecha)
        .map(x => [x.type, x.value]),
    );
    return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, min: +p.minute };
  }
  // Hora local del negocio -> instante UTC (ajusta el desfase de la zona).
  function aUtc(y, m, d, h, min) {
    let t = Date.UTC(y, m - 1, d, h, min);
    for (let i = 0; i < 2; i++) {
      const p = partesEn(new Date(t));
      const visto = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min);
      t += Date.UTC(y, m - 1, d, h, min) - visto;
    }
    return new Date(t);
  }
  const fmtDia = new Intl.DateTimeFormat('es', { weekday: 'short', timeZone: 'UTC' });
  const fmtLargo = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  const fmtMes = new Intl.DateTimeFormat('es', { month: 'short', timeZone: 'UTC' });
  const dosD = n => String(n).padStart(2, '0');

  function diasDisponibles() {
    const a = C.agenda;
    const ahora = partesEn(new Date());
    const limite = Date.now() + a.margenHoras * 3600e3;
    const dias = [];
    for (let i = 0; i <= a.diasAdelante + 7 && dias.length < a.diasAdelante; i++) {
      const base = new Date(Date.UTC(ahora.y, ahora.m - 1, ahora.d + i));
      const y = base.getUTCFullYear(), m = base.getUTCMonth() + 1, d = base.getUTCDate();
      const clave = `${y}-${dosD(m)}-${dosD(d)}`;
      if (!a.dias.includes(base.getUTCDay()) || a.bloqueadas.includes(clave)) continue;
      const horas = [];
      for (let mins = a.desde * 60; mins + a.duracionMin <= a.hasta * 60; mins += a.duracionMin) {
        const h = Math.floor(mins / 60), mm = mins % 60;
        if (aUtc(y, m, d, h, mm).getTime() > limite) horas.push(`${dosD(h)}:${dosD(mm)}`);
      }
      if (horas.length) dias.push({ clave, y, m, d, base, horas });
    }
    return dias;
  }

  function mostrarAgenda() {
    estado.etapa = 'agenda';
    persistir();
    bAtras.hidden = false;
    const r = estado.r;
    const dias = diasDisponibles();
    let elegido = estado.reserva?.dia && dias.find(d => d.clave === estado.reserva.dia) ? estado.reserva.dia : dias[0]?.clave;
    let hora = estado.reserva?.dia === elegido ? estado.reserva.hora : null;
    const conexionMala = r.internet && r.internet !== 'buena';

    const vista = mostrarVista(
      `<div class="vista-in">
        <div class="hera-burbuja">${heraMini()}<span>Reserva tu sesión</span></div>
        <h2 class="pregunta-titulo" id="hoja-titulo" tabindex="-1">¿Qué día te gustaría empezar a armar tu negocio?</h2>
        <p class="pregunta-ayuda">Sesión de acompañamiento de 1 hora. Te confirmamos por WhatsApp cómo nos conectamos${conexionMala ? '; como tu conexión falla, también podemos hacerla por llamada' : ''}.</p>
        <p class="etiqueta-campo">Día</p>
        <div class="dias" role="group" aria-label="Días disponibles">
          ${dias
            .map(
              d => `<button class="dia" type="button" data-dia="${d.clave}" aria-pressed="${d.clave === elegido}" aria-label="${esc(fmtLargo.format(d.base))}" data-escalonar>
              <small>${esc(fmtDia.format(d.base).replace('.', ''))}</small><b>${d.d}</b><small>${esc(fmtMes.format(d.base).replace('.', ''))}</small></button>`,
            )
            .join('')}
        </div>
        <p class="etiqueta-campo">Hora <small>(${esc(C.agenda.etiquetaHora)})</small></p>
        <div class="horas" role="group" aria-label="Horarios disponibles" aria-live="polite" data-horas></div>
        <div class="espacio"></div>
        <div class="hoja-pie"><button class="btn btn-primario btn-ancho" type="button" data-reservar disabled><span class="btn-texto">Reservar este horario${I.flecha}</span><span class="btn-spinner" aria-hidden="true"></span></button></div>
      </div>`,
      1,
    );
    const cajaHoras = $('[data-horas]', vista);
    const bReservar = $('[data-reservar]', vista);
    let carga = 0;

    const pintarHoras = async () => {
      const id = ++carga;
      bReservar.disabled = !hora;
      cajaHoras.setAttribute('aria-busy', 'true');
      cajaHoras.innerHTML = '<div class="esqueleto esq-hora"></div>'.repeat(6);
      await esperar(movReducido() ? 120 : 420);
      if (id !== carga || !cajaHoras.isConnected) return;
      const dia = dias.find(d => d.clave === elegido);
      cajaHoras.innerHTML = dia.horas
        .map(h => `<button class="hora" type="button" data-hora="${h}" aria-pressed="${h === hora}">${h}</button>`)
        .join('');
      cajaHoras.removeAttribute('aria-busy');
      escalonar($$('.hora', cajaHoras));
    };

    vista.addEventListener('click', async e => {
      const bDia = e.target.closest('[data-dia]');
      const bHora = e.target.closest('[data-hora]');
      if (bDia && bDia.dataset.dia !== elegido) {
        elegido = bDia.dataset.dia;
        hora = null;
        $$('[data-dia]', vista).forEach(b => b.setAttribute('aria-pressed', String(b === bDia)));
        bDia.scrollIntoView({ behavior: movReducido() ? 'auto' : 'smooth', inline: 'nearest', block: 'nearest' });
        pintarHoras();
      } else if (bHora) {
        hora = bHora.dataset.hora;
        $$('[data-hora]', cajaHoras).forEach(b => b.setAttribute('aria-pressed', String(b === bHora)));
        bReservar.disabled = false;
      } else if (e.target.closest('[data-reservar]') && hora) {
        const dia = dias.find(d => d.clave === elegido);
        const texto = `${fmtLargo.format(dia.base)} a las ${hora} (${C.agenda.etiquetaHora}). Te escribiremos al +${r.prefijo} ${r.telefono} para confirmarla.`;
        estado.reserva = { dia: elegido, hora, texto: `${fmtLargo.format(dia.base)}, ${hora} (${C.agenda.etiquetaHora})` };
        persistir();
        const ok = await confirmar({
          titulo: '¿Confirmamos tu sesión?',
          texto: texto.charAt(0).toUpperCase() + texto.slice(1),
          aceptar: 'Sí, reservar',
          cancelar: 'Cambiar',
          icono: 'calendario',
          alAceptar: async () => {
            const [enviado] = await Promise.all([enviarSolicitud('reserva'), esperar(700)]);
            estado.reserva.enviada = enviado;
            persistir();
          },
        });
        if (ok) mostrarListo();
      }
    });
    if (dias.length) pintarHoras();
    else cajaHoras.innerHTML = '<p class="nota">No quedan horarios libres en estas fechas. Escríbenos por WhatsApp y te buscamos uno.</p>';
  }

  function mostrarListo() {
    estado.etapa = 'listo';
    persistir();
    bAtras.hidden = true;
    const r = estado.r;
    const enviada = estado.reserva?.enviada;
    const vista = mostrarVista(
      `<div class="vista-in exito">
        ${imgHera('explica', 'exito-hera')}
        <h2 class="pregunta-titulo" id="hoja-titulo" tabindex="-1">${enviada ? `¡Listo, ${esc(r.nombre)}! Tu sesión quedó reservada` : `¡Casi listo, ${esc(r.nombre)}!`}</h2>
        <p class="pregunta-ayuda">${enviada ? 'Te escribiremos por WhatsApp para confirmarla. Si quieres, avísanos ya desde aquí.' : 'Último paso: envíanos tu reserva por WhatsApp para confirmarla.'}</p>
        <div class="resumen-reserva" data-escalonar>
          <p>${I.calendario}<span>${esc(estado.reserva.texto.charAt(0).toUpperCase() + estado.reserva.texto.slice(1))}</span></p>
          <p>${I.reloj}<span>Sesión de 1 hora para armar tu negocio</span></p>
          <p>${D.whatsapp}<span>+${esc(r.prefijo)} ${esc(r.telefono)}</span></p>
        </div>
        <div class="acciones">
          <a class="btn btn-primario" href="${esc(urlWhatsapp())}" target="_blank" rel="noopener" data-whatsapp data-escalonar><span class="btn-texto">${D.whatsapp}${enviada ? 'Avisar por WhatsApp' : 'Confirmar por WhatsApp'}</span><span class="btn-spinner" aria-hidden="true"></span></a>
          <button class="btn btn-secundario" type="button" data-ics data-escalonar><span class="btn-texto">${I.calendario}Agregar a mi calendario</span><span class="btn-spinner" aria-hidden="true"></span></button>
          <button class="btn btn-secundario" type="button" data-terminar data-escalonar><span class="btn-texto">Volver a la página</span></button>
        </div>
      </div>`,
      1,
    );
    $('[data-ics]', vista).addEventListener('click', async e => {
      const b = e.currentTarget;
      cargando(b, true);
      await esperar(350);
      descargarIcs();
      cargando(b, false);
    });
    $('[data-terminar]', vista).addEventListener('click', cerrarHoja);
  }

  function descargarIcs() {
    const { dia, hora } = estado.reserva;
    const [y, m, d] = dia.split('-').map(Number);
    const [h, mm] = hora.split(':').map(Number);
    const inicio = aUtc(y, m, d, h, mm);
    const fin = new Date(inicio.getTime() + C.agenda.duracionMin * 60e3);
    const f = t => t.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SmartBusiness//Empieza//ES', 'BEGIN:VEVENT',
      `UID:${Date.now()}@empieza.smartbiz.com.uy`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(inicio)}`, `DTEND:${f(fin)}`,
      `SUMMARY:Armar mi negocio con ${C.marca}`,
      `DESCRIPTION:Sesión de acompañamiento. WhatsApp: ${C.whatsappVisible}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = 'sesion-smartbusiness.ics';
    document.body.append(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  // --- Mensaje de WhatsApp y envío ----------------------------------------------------
  function urlWhatsapp() {
    const r = estado.r;
    const lineas = [`Hola, soy ${r.nombreCompleto || r.nombre}${r.negocio ? ` de ${r.negocio}` : ''}. Acabo de responder el formulario de ${C.marca}:`];
    for (const f of resumen()) if (f.pregunta !== 'Nombre') lineas.push(`• ${f.pregunta}: ${f.respuesta}`);
    if (r.ciudad) lineas.push(`• Ciudad: ${r.ciudad}`);
    if (estado.reserva?.texto && estado.etapa === 'listo') lineas.push('', `Quiero confirmar mi sesión: ${estado.reserva.texto}.`);
    else lineas.push('', 'Quiero empezar. ¿Me ayudan?');
    return `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(lineas.join('\n'))}`;
  }

  async function enviarSolicitud(tipo) {
    if (!C.endpointSolicitudes) return false;
    const r = estado.r;
    const cuerpoJson = {
      tipo,
      nombre: r.nombreCompleto || r.nombre,
      telefono: `+${r.prefijo} ${r.telefono}`,
      negocio: r.negocio || '',
      ciudad: r.ciudad || '',
      respuestas: resumen(),
      reserva: tipo === 'reserva' ? estado.reserva?.texto : '',
      tamano: tamano(r),
      pagina: location.pathname,
      sitio: r.sitio || '',
    };
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 9000);
      const res = await fetch(C.endpointSolicitudes, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpoJson),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      return res.ok;
    } catch {
      return false;
    }
  }

  // Abrir directo con ?empezar o #empezar (útil para enlaces desde Instagram).
  if (/[?&]empezar\b/.test(location.search) || location.hash === '#empezar') {
    const b = $('[data-empezar]');
    if (b) setTimeout(() => empezar(b), 400);
  }
})();
