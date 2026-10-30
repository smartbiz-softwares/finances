// Almacén en archivos: sin base de datos que instalar.
//   solicitudes.jsonl  una línea por solicitud (solo se agrega)
//   eventos.jsonl      telemetría anónima (solo se agrega)
//   estado.json        lo que cambia: estado, notas, cambios de cita, avisos enviados
// Todo se carga en memoria al arrancar; las escrituras van en fila para que dos
// peticiones a la vez no mezclen líneas, y estado.json se reemplaza de forma
// atómica (archivo temporal + rename) para no quedar a medias si se corta la luz.

import { mkdir, readFile, appendFile, writeFile, rename } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { join } from 'node:path';

async function leerJsonl(archivo) {
  try {
    return (await readFile(archivo, 'utf8'))
      .split('\n')
      .filter(Boolean)
      .map(l => { try { return JSON.parse(l); } catch { return null; } })
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function crearAlmacen(dir) {
  await mkdir(dir, { recursive: true });
  const rutas = { solicitudes: join(dir, 'solicitudes.jsonl'), eventos: join(dir, 'eventos.jsonl'), estado: join(dir, 'estado.json') };
  const solicitudes = await leerJsonl(rutas.solicitudes);
  // Las solicitudes guardadas antes del panel no tenían id: se les da uno estable.
  for (const s of solicitudes) if (!s.id) s.id = createHash('sha1').update(`${s.fecha}|${s.whatsapp}|${s.tipo}`).digest('hex').slice(0, 16);
  const eventos = await leerJsonl(rutas.eventos);
  let estado = {};
  try { estado = JSON.parse(await readFile(rutas.estado, 'utf8')); } catch { /* aún no existe */ }

  let fila = Promise.resolve();
  const enFila = tarea => (fila = fila.then(tarea, tarea));

  return {
    solicitudes,
    eventos,
    estado,
    async agregarSolicitud(datos) {
      const s = { id: randomUUID(), ...datos };
      solicitudes.push(s);
      await enFila(() => appendFile(rutas.solicitudes, JSON.stringify(s) + '\n'));
      return s;
    },
    async agregarEventos(lista) {
      if (!lista.length) return;
      eventos.push(...lista);
      await enFila(() => appendFile(rutas.eventos, lista.map(e => JSON.stringify(e)).join('\n') + '\n'));
    },
    async actualizar(id, cambios) {
      estado[id] = { ...(estado[id] || {}), ...cambios, actualizado: new Date().toISOString() };
      await enFila(async () => {
        const tmp = `${rutas.estado}.tmp`;
        await writeFile(tmp, JSON.stringify(estado));
        await rename(tmp, rutas.estado);
      });
      return estado[id];
    },
  };
}
