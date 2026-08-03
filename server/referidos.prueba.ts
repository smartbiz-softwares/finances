/**
 * Pruebas del programa de referidos.
 *
 * Lo importante aquí no es el camino feliz sino los intentos de abuso: quien
 * quiera fabricar tokens va a probar exactamente estas cosas.
 *
 *   npx tsx server/referidos.prueba.ts
 */
import Database from 'better-sqlite3';
import * as R from './referidos.ts';

let fallos = 0;
let pruebas = 0;

function comprobar(descripcion: string, condicion: boolean, detalle?: any) {
  pruebas++;
  if (condicion) console.log(`  ok   ${descripcion}`);
  else {
    fallos++;
    console.log(`  FALLO ${descripcion}`, detalle !== undefined ? JSON.stringify(detalle) : '');
  }
}

function baseDePrueba() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY, email TEXT, displayName TEXT, phone TEXT,
      createdAt TEXT, lastSeenAt TEXT
    );
  `);
  R.crearTablas(db);
  return db;
}

function alta(db: any, id: string, nombre: string) {
  db.prepare('INSERT INTO users (id, displayName, createdAt) VALUES (?, ?, ?)')
    .run(id, nombre, new Date().toISOString());
}

/** Acreditador de mentira que solo apunta lo que se le pide. */
function contador() {
  const movimientos: { userId: string; tokens: number }[] = [];
  return {
    movimientos,
    acreditar: (userId: string, tokens: number) => { movimientos.push({ userId, tokens }); },
    total: (userId: string) =>
      movimientos.filter((m) => m.userId === userId).reduce((s, m) => s + m.tokens, 0),
  };
}

// --- Códigos ---------------------------------------------------------------
console.log('\nCódigos');
{
  const db = baseDePrueba();
  alta(db, 'ana', 'Ana');

  const codigo = R.codigoDe(db, 'ana');
  comprobar('el código tiene seis caracteres', codigo.length === 6, codigo);
  comprobar('no lleva caracteres que se confundan al dictarlos',
    !/[01OIL]/.test(codigo), codigo);
  comprobar('el mismo usuario conserva su código', R.codigoDe(db, 'ana') === codigo);

  alta(db, 'luis', 'Luis');
  comprobar('otro usuario recibe uno distinto', R.codigoDe(db, 'luis') !== codigo);
}

// --- Canje correcto --------------------------------------------------------
console.log('\nCanje');
{
  const db = baseDePrueba();
  alta(db, 'ana', 'Ana');
  alta(db, 'luis', 'Luis');
  const codigo = R.codigoDe(db, 'ana');
  const c = contador();

  const r = R.canjear(db, { codigo, referidoId: 'luis', acreditar: c.acreditar });

  comprobar('el canje se aplica', r.aplicado === true, r);
  comprobar('quien invita recibe 10.000', c.total('ana') === 10000, c.total('ana'));
  comprobar('quien es invitado recibe 5.000', c.total('luis') === 5000, c.total('luis'));

  const datos = R.referidosDe(db, 'ana');
  comprobar('el referido aparece en la lista de quien invitó', datos.total === 1, datos);
  comprobar('los tokens ganados se suman bien', datos.tokensGanados === 10000, datos.tokensGanados);
}

// --- Intentos de abuso -----------------------------------------------------
console.log('\nAbuso');
{
  const db = baseDePrueba();
  alta(db, 'ana', 'Ana');
  const c = contador();

  const propio = R.canjear(db, {
    codigo: R.codigoDe(db, 'ana'), referidoId: 'ana', acreditar: c.acreditar,
  });
  comprobar('nadie puede referirse a sí mismo',
    !propio.aplicado && propio.motivo === 'auto-referido', propio);
  comprobar('y no se acredita nada', c.movimientos.length === 0);
}
{
  const db = baseDePrueba();
  alta(db, 'ana', 'Ana');
  alta(db, 'luis', 'Luis');
  alta(db, 'eva', 'Eva');
  const c = contador();

  R.canjear(db, { codigo: R.codigoDe(db, 'ana'), referidoId: 'luis', acreditar: c.acreditar });
  const segundo = R.canjear(db, {
    codigo: R.codigoDe(db, 'eva'), referidoId: 'luis', acreditar: c.acreditar,
  });

  comprobar('un usuario solo canjea un código en su vida',
    !segundo.aplicado && segundo.motivo === 'ya-canjeado', segundo);
  comprobar('Eva no cobra por un canje rechazado', c.total('eva') === 0);
}
{
  const db = baseDePrueba();
  alta(db, 'luis', 'Luis');
  const c = contador();
  const r = R.canjear(db, { codigo: 'ZZZZZZ', referidoId: 'luis', acreditar: c.acreditar });
  comprobar('un código inventado no da nada',
    !r.aplicado && r.motivo === 'codigo-desconocido', r);
}
{
  const db = baseDePrueba();
  alta(db, 'ana', 'Ana');
  alta(db, 'luis', 'Luis');
  db.prepare('UPDATE referral_config SET activo = 0 WHERE id = 1').run();
  const c = contador();

  const r = R.canjear(db, { codigo: R.codigoDe(db, 'ana'), referidoId: 'luis', acreditar: c.acreditar });
  comprobar('con el programa apagado no se canjea nada',
    !r.aplicado && r.motivo === 'programa-inactivo', r);
}
{
  const db = baseDePrueba();
  alta(db, 'ana', 'Ana');
  db.prepare('UPDATE referral_config SET maxPorUsuario = 2 WHERE id = 1').run();
  const codigo = R.codigoDe(db, 'ana');
  const c = contador();

  ['a', 'b', 'c'].forEach((n) => alta(db, n, n));
  R.canjear(db, { codigo, referidoId: 'a', acreditar: c.acreditar });
  R.canjear(db, { codigo, referidoId: 'b', acreditar: c.acreditar });
  const tercero = R.canjear(db, { codigo, referidoId: 'c', acreditar: c.acreditar });

  comprobar('el tope por usuario se respeta',
    !tercero.aplicado && tercero.motivo === 'tope-alcanzado', tercero);
  comprobar('Ana cobró solo por los dos primeros', c.total('ana') === 20000, c.total('ana'));
}

// --- Configuración ---------------------------------------------------------
console.log('\nConfiguración');
{
  const db = baseDePrueba();
  const cfg = R.configuracion(db);
  comprobar('de serie son 10.000 y 5.000',
    cfg.tokensReferidor === 10000 && cfg.tokensReferido === 5000, cfg);

  db.prepare('UPDATE referral_config SET tokensReferidor = 25000, tokensReferido = 1000 WHERE id = 1').run();
  alta(db, 'ana', 'Ana');
  alta(db, 'luis', 'Luis');
  const c = contador();
  R.canjear(db, { codigo: R.codigoDe(db, 'ana'), referidoId: 'luis', acreditar: c.acreditar });

  comprobar('un cambio en el panel se aplica al siguiente canje',
    c.total('ana') === 25000 && c.total('luis') === 1000, c.movimientos);

  const historico = db.prepare('SELECT tokensReferidor FROM referrals WHERE referidoId = ?').get('luis') as any;
  comprobar('cada canje guarda lo que valía en su momento',
    historico.tokensReferidor === 25000, historico);
}

// --- Mayúsculas y espacios -------------------------------------------------
console.log('\nEntrada del usuario');
{
  const db = baseDePrueba();
  alta(db, 'ana', 'Ana');
  alta(db, 'luis', 'Luis');
  const codigo = R.codigoDe(db, 'ana');
  const c = contador();

  const r = R.canjear(db, {
    codigo: `  ${codigo.toLowerCase()} `, referidoId: 'luis', acreditar: c.acreditar,
  });
  comprobar('se acepta en minúsculas y con espacios de más', r.aplicado === true, r);
}

console.log(`\n${pruebas - fallos}/${pruebas} pruebas correctas`);
process.exit(fallos > 0 ? 1 : 0);
