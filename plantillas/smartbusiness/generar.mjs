// Rellena las plantillas de SmartBusiness con un JSON de datos y genera
// el correo (HTML) y la factura y el recibo (HTML + PDF) en ./salida.
//
//   node plantillas/smartbusiness/generar.mjs [datos.json]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const dir = dirname(fileURLToPath(import.meta.url));
const salida = join(dir, 'salida');
const datos = JSON.parse(readFileSync(resolve(process.argv[2] ?? join(dir, 'datos-ejemplo.json')), 'utf8'));

const dinero = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: datos.moneda ?? 'USD' }).format(n);

const subtotal = datos.conceptos.reduce((s, c) => s + c.cantidad * c.precio, 0);
const impuestos = datos.impuestos ?? 0;

const filasCorreo = datos.conceptos.map((c) => `
      <tr><td colspan="2" style="padding:0 0 2px;font-size:13px;color:#5B6F66;">${c.periodo ?? ''}</td></tr>
      <tr><td style="padding:2px 0;font-weight:600;">${c.descripcion}</td><td align="right" style="padding:2px 0;">${dinero(c.cantidad * c.precio)}</td></tr>
      <tr><td colspan="2" style="padding:0 0 14px;font-size:13px;color:#8A9C94;">Cant. ${c.cantidad}</td></tr>`).join('');

const filasDocumento = datos.conceptos.map((c) => `
      <tr><td>${c.descripcion}${c.periodo ? `<div class="periodo">${c.periodo}</div>` : ''}</td>
      <td class="num">${c.cantidad}</td><td class="num">${dinero(c.precio)}</td><td class="num">${dinero(c.cantidad * c.precio)}</td></tr>`).join('');

const valores = {
  ...datos,
  subtotal: dinero(subtotal),
  total: dinero(subtotal + impuestos),
  empresa_direccion_linea: datos.empresa_direccion.replace(/<br>/g, ', '),
  filas_correo: filasCorreo,
  filas_documento: filasDocumento,
  fila_impuestos_correo: impuestos
    ? `<tr><td style="padding:4px 0;color:#5B6F66;">Impuestos</td><td align="right" style="padding:4px 0;">${dinero(impuestos)}</td></tr>`
    : '',
  fila_impuestos_documento: impuestos ? `<tr><td>Impuestos</td><td>${dinero(impuestos)}</td></tr>` : '',
  estilos: readFileSync(join(dir, 'estilos-documento.css'), 'utf8'),
};

const rellenar = (plantilla, extra = {}) =>
  readFileSync(join(dir, plantilla), 'utf8').replace(/\{\{(\w+)\}\}/g, (_, k) => {
    const v = { ...valores, ...extra }[k];
    if (v === undefined) throw new Error(`${plantilla}: falta el dato "${k}"`);
    return String(v);
  });

mkdirSync(salida, { recursive: true });

// El correo apunta al logo por URL (Gmail no muestra imágenes en data:); los PDF lo llevan incrustado.
writeFileSync(join(salida, 'correo-recibo.html'), rellenar('correo-recibo.html'));
writeFileSync(join(salida, 'logo.png'), readFileSync(join(dir, 'logo.png')));
const logoIncrustado = `data:image/png;base64,${readFileSync(join(dir, 'logo.png')).toString('base64')}`;

// require (y no import) para que también encuentre un Playwright global vía NODE_PATH.
const { chromium } = createRequire(import.meta.url)('playwright');
const navegador = await chromium.launch();
const pagina = await navegador.newPage();
for (const [plantilla, nombre] of [
  ['factura.html', `Factura-${datos.factura_numero}`],
  ['recibo.html', `Recibo-${datos.recibo_numero}`],
]) {
  const html = rellenar(plantilla, { logo_url: logoIncrustado });
  writeFileSync(join(salida, `${nombre}.html`), html);
  await pagina.setContent(html, { waitUntil: 'load' });
  await pagina.pdf({ path: join(salida, `${nombre}.pdf`), format: 'Letter', printBackground: true });
}
await navegador.close();
console.log(`Listo: ${salida}`);
