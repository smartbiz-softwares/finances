// Mapa de palabras clave: cada búsqueda apunta a UNA página que la responde.
// No se incrustan en el HTML como lista (eso penaliza): sirven para escribir
// títulos, encabezados y preguntas, y para revisar qué búsquedas cubre cada
// página. Se exporta a seo/palabras-clave.csv al compilar.

import { sectores } from './datos/sectores.mjs';
import { problemas } from './datos/problemas.mjs';
import { paises } from './datos/paises.mjs';
import { rutas } from './plantillas.mjs';
import { glosario } from './datos/glosario.mjs';

const productos = ['sistema', 'programa', 'software', 'aplicación', 'app'];
const generales = [
  'sistema de gestión',
  'sistema de gestión para pymes',
  'programa para administrar un negocio',
  'software para pymes',
  'sistema de punto de venta',
  'punto de venta',
  'sistema de ventas',
  'sistema de inventario',
  'control de inventario',
  'programa de inventario y ventas',
  'app para negocio',
  'aplicación para controlar ventas',
  'sistema para controlar fiados',
  'sistema de caja para negocio',
  'erp para pymes',
  'erp para pequeñas empresas',
  'sistema administrativo para negocios',
  'programa para tienda',
  'sistema con inteligencia artificial para negocios',
  'asistente de ia para negocios',
];
const informativas = [
  'cómo organizar mi negocio',
  'cómo administrar un negocio pequeño',
  'cómo saber si mi negocio es rentable',
  'cómo controlar las ventas de mi negocio',
  'qué sistema usar para mi negocio',
  'mejor sistema para pymes',
  'mejor programa para tienda',
  'alternativa al cuaderno de ventas',
  'pasar de excel a un sistema',
  'cómo dejar de perder dinero en mi negocio',
];

export function generarPalabrasClave() {
  const filas = [];
  const vistas = new Set();
  const agregar = (palabra, ruta, intencion, tipo) => {
    const k = palabra.toLowerCase().replace(/\s+/g, ' ').trim();
    if (vistas.has(k)) return;
    vistas.add(k);
    filas.push({ palabra: k, ruta, intencion, tipo });
  };

  for (const g of generales) agregar(g, rutas.inicio, 'comercial', 'general');
  for (const q of informativas) agregar(q, rutas.inicio, 'informativa', 'general');

  for (const c of paises) {
    for (const g of generales.slice(0, 12)) agregar(`${g} ${c.en}`, rutas.pais(c), 'comercial', 'país');
    agregar(`sistema multimoneda ${c.en}`, rutas.pais(c), 'comercial', 'país');
    agregar(`programa para mipymes ${c.en}`, rutas.pais(c), 'comercial', 'país');
  }

  for (const s of sectores) {
    for (const sin of s.sinonimos) {
      for (const pr of productos) agregar(`${pr} para ${sin}`, rutas.sector(s), 'comercial', 'sector');
      agregar(`punto de venta para ${sin}`, rutas.sector(s), 'comercial', 'sector');
      agregar(`cómo administrar mi ${sin}`, rutas.sector(s), 'informativa', 'sector');
    }
    for (const c of paises) {
      for (const sin of s.sinonimos.slice(0, 3)) {
        agregar(`sistema para ${sin} ${c.en}`, rutas.sectorPais(s, c), 'comercial', 'sector+país');
        agregar(`programa para ${sin} ${c.en}`, rutas.sectorPais(s, c), 'comercial', 'sector+país');
      }
      agregar(`control de inventario ${s.sinonimos[0]} ${c.en}`, rutas.sectorPais(s, c), 'comercial', 'sector+país');
    }
    for (const p of problemas) {
      const ruta = rutas.combo(s, p);
      for (const t of p.terminos) {
        agregar(`${t} para ${s.sinonimos[0]}`, ruta, 'comercial', 'sector+problema');
        agregar(`${t} ${s.sinonimos[1] || s.sinonimos[0]}`, ruta, 'comercial', 'sector+problema');
      }
      for (const q of p.preguntas) agregar(`${q} en mi ${s.corto}`, ruta, 'informativa', 'sector+problema');
    }
  }

  for (const p of problemas) {
    for (const t of p.terminos) {
      agregar(t, rutas.problema(p), 'comercial', 'problema');
      for (const pr of ['sistema de', 'programa de', 'app de']) agregar(`${pr} ${t.replace(/^(sistema|programa) de /, '')}`, rutas.problema(p), 'comercial', 'problema');
    }
    for (const q of p.preguntas) {
      agregar(q, rutas.problema(p), 'informativa', 'problema');
      agregar(`${q} de mi negocio`, rutas.problema(p), 'informativa', 'problema');
    }
  }
  for (const g of glosario) {
    agregar(`qué es ${g.termino.toLowerCase().replace(/ \(.*\)/, '')}`, '/glosario/', 'informativa', 'glosario');
    agregar(`${g.termino.toLowerCase().replace(/ \(.*\)/, '')} significado`, '/glosario/', 'informativa', 'glosario');
  }
  for (const q of ['calculadora de pérdidas de un negocio', 'cuánto dinero pierde mi negocio', 'calcular pérdidas por fiados', 'calcular merma de inventario', 'calculadora de merma', 'calcular descuadre de caja'])
    agregar(q, '/calculadora-de-fugas/', 'informativa', 'herramienta');
  for (const q of ['cuaderno o sistema para mi negocio', 'excel o sistema de inventario', 'excel vs sistema de gestión', 'dejar el cuaderno de ventas', 'llevar las cuentas en cuaderno o excel', 'cuándo usar un sistema de gestión'])
    agregar(q, '/comparar/cuaderno-excel-o-sistema/', 'informativa', 'comparativa');
  return filas;
}

export function aCsv(filas) {
  const celda = v => `"${String(v).replace(/"/g, '""')}"`;
  return ['palabra_clave,pagina,intencion,tipo', ...filas.map(f => [f.palabra, f.ruta, f.intencion, f.tipo].map(celda).join(','))].join('\n') + '\n';
}
