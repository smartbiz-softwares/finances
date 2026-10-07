# ⚠️ IMPORTANTE: tareas pendientes del responsable del servidor

Estas tareas **no se pueden hacer desde el código**: hay que hacerlas en el
servidor (VPS), en GitHub o en los paneles de los proveedores. Están ordenadas
por urgencia. Marca cada casilla al terminarla.

> Última revisión: 7 de octubre de 2026, tras el despliegue del commit `8edb6ac`
> (correcciones de seguridad, multi-moneda y cobros recurrentes).

---

## 🔴 1. Rotar las claves de IA (urgente, hoy)

**Por qué:** hasta el commit `8edb6ac`, cualquier usuario registrado podía
**leer y cambiar** las claves de DeepSeek y Gemini desde
`/api/settings/ai-keys`. El hueco ya está cerrado, pero si alguien las copió
antes, las sigue teniendo y puede gastar tu saldo con ellas.

**Pasos:**

- [ ] **Gemini:** entra en <https://aistudio.google.com/app/apikey>, crea una
      clave nueva y **borra la antigua**.
- [ ] **DeepSeek:** entra en <https://platform.deepseek.com/api_keys>, crea una
      clave nueva y **borra la antigua**.
- [ ] Pon las claves nuevas en el servidor (elige **una** forma):
  - Panel de administración (`/panel`) → sección **"Proveedores de IA y Conector de Modelos LLM"** → editar cada proveedor; o
  - en el `.env` del servidor (`GEMINI_API_KEY`, `DEEPSEEK_API_KEY`) y reinicia
    (ver el paso 2.4).
- [ ] Revisa el consumo de los últimos meses en ambos paneles. Si hay picos que
      no reconoces, es señal de que alguien las usó.
- [ ] Si también usas `OPENAI_API_KEY` o `GROQ_API_KEY` y estaban guardadas en la
      tabla de proveedores, rótalas igual.

---

## 🔴 2. Fijar los secretos de sesión en el `.env` (urgente, esta semana)

**Por qué:** las sesiones de los usuarios se firman con `JWT_SECRET` y las del
panel con `ADMIN_JWT_SECRET`. Si faltaban en el `.env`, el servidor usaba un
valor escrito en el código, y con él **cualquiera que leyera el repositorio
podía hacerse pasar por cualquier usuario**. Desde `8edb6ac`, si faltan, el
servidor genera uno aleatorio y lo guarda en `/var/www/finances/.secretos-sesion.json`.
Eso ya es seguro, pero es mejor tenerlos en el `.env`, junto al resto de la
configuración, y guardados en tu gestor de contraseñas.

**Pasos** (en el VPS, por SSH):

1. - [ ] Entra al servidor y ve a la carpeta de la app:
   ```bash
   ssh -p 22112 TU_USUARIO@TU_SERVIDOR
   cd /var/www/finances
   ```
2. - [ ] Mira si ya existen:
   ```bash
   grep -E '^(JWT_SECRET|ADMIN_JWT_SECRET)=' .env
   ```
3. - [ ] **Si no salen**, cópialos del archivo generado (así nadie pierde la
     sesión):
   ```bash
   cat .secretos-sesion.json
   # Copia cada valor al .env:
   echo 'JWT_SECRET=<valor de JWT_SECRET>' >> .env
   echo 'ADMIN_JWT_SECRET=<valor de ADMIN_JWT_SECRET>' >> .env
   ```
   Si el archivo no existe (porque ya estaban en el `.env`), no hay nada que hacer.
4. - [ ] Reinicia el servidor para que lea el `.env`:
   ```bash
   pm2 restart hera-api --update-env
   pm2 logs hera-api --lines 30   # no debe aparecer "no está en .env"
   ```
5. - [ ] Guarda ambos valores en tu gestor de contraseñas. **No los subas nunca a
     GitHub.**

> ⚠️ Si alguna vez cambias `JWT_SECRET`, todos los usuarios tendrán que volver a
> iniciar sesión. Es normal y no pierden datos.

---

## 🟠 3. Copias de seguridad de la base de datos (esta semana)

**Por qué:** todos los datos de los usuarios están en un único archivo,
`/var/www/finances/hera.db`, y **hoy no hay ninguna copia**. Un disco que falle,
un `rm` equivocado o un despliegue roto significan perderlo todo.

**Pasos:**

- [ ] Crea la carpeta de copias:
  ```bash
  sudo mkdir -p /var/backups/hera && sudo chown $USER /var/backups/hera
  ```
- [ ] Prueba una copia a mano. Usa `.backup` de SQLite, que es segura con la app
      en marcha (copiar el archivo con `cp` puede dejarla corrupta):
  ```bash
  sqlite3 /var/www/finances/hera.db ".backup '/var/backups/hera/hera-$(date +%F).db'"
  ls -lh /var/backups/hera
  ```
  Si no tienes `sqlite3`: `sudo apt install sqlite3`.
- [ ] Prográmala cada noche y conserva 30 días. Ejecuta `crontab -e` y añade:
  ```cron
  15 3 * * * sqlite3 /var/www/finances/hera.db ".backup '/var/backups/hera/hera-$(date +\%F).db'" && find /var/backups/hera -name 'hera-*.db' -mtime +30 -delete
  ```
- [ ] **Saca las copias del servidor.** Una copia en el mismo disco no sirve si
      el disco muere. Opciones: descargarlas periódicamente con
      `scp -P 22112 TU_USUARIO@TU_SERVIDOR:/var/backups/hera/*.db .`, o subirlas
      a un almacenamiento externo (Backblaze B2, Google Drive con `rclone`, etc.).
- [ ] **Prueba a restaurar una vez:** copia una copia a tu ordenador y ábrela con
      `sqlite3 hera-FECHA.db "SELECT COUNT(*) FROM users;"`. Una copia que nunca
      se ha restaurado no es una copia.

---

## 🟠 4. Revisar la configuración de pagos en Cuba (esta semana)

**Por qué:** si la tabla de configuración de pagos está vacía, el servidor crea
una con datos **de ejemplo** (tarjeta `9225 1234 5678 9012`, titular
"Carlos Manuel Pérez") y los enseña a los usuarios para que te transfieran.

- [ ] Entra al panel de administración (`/panel`) → sección **"Configuración de Datos
      Bancarios y Tasa CUP (Transfermóvil)"** y comprueba
      que la tarjeta, el titular, el teléfono y la tasa CUP son **los tuyos**.

---

## 🟡 5. Cerrar CORS después de unos días (en 1–2 semanas)

**Qué es:** CORS decide qué páginas web pueden llamar a tu API. Desde este
cambio hay una lista de orígenes permitidos (la web, la app Android, la de
iPhone y el entorno de desarrollo), pero en **modo observación**: un origen
desconocido se deja pasar y se anota. Así nadie se queda fuera por un origen
olvidado.

**Pasos:**

- [ ] Deja la app funcionando normalmente **una o dos semanas**.
- [ ] Consulta qué orígenes desconocidos han llegado. Necesitas un token del
      panel: inicia sesión en el panel y cópialo del almacenamiento del
      navegador (`hera_admin_token`), o pídelo así:
  ```bash
  TOKEN=$(curl -s -X POST https://herawallet.app/api/admin/login \
    -H 'Content-Type: application/json' \
    -d '{"username":"admin","password":"TU_CONTRASEÑA"}' | python3 -c 'import json,sys;print(json.load(sys.stdin)["token"])')
  curl -s https://herawallet.app/api/admin/health -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | grep -A20 '"cors"'
  ```
  También salen en los logs: `pm2 logs hera-api | grep CORS`.
- [ ] Si aparece algún origen **legítimo** (por ejemplo, otro dominio tuyo),
      añádelo al `.env`:
  ```
  CORS_ORIGENES=https://otro-dominio-tuyo.com
  ```
- [ ] Activa el modo estricto añadiendo al `.env` y reiniciando:
  ```
  CORS_ESTRICTO=1
  ```
  ```bash
  pm2 restart hera-api --update-env
  ```
- [ ] Prueba la web **y la app Android** tras el cambio. Si la app deja de
      conectar, quita `CORS_ESTRICTO=1`, reinicia y avísame con lo que aparezca
      en `pm2 logs hera-api | grep CORS`.

---

## 🟡 6. Revisar los pull requests de Dependabot (cada semana)

**Qué es:** Dependabot ya está activado (`.github/dependabot.yml`). Cada lunes
abrirá pull requests cuando haya actualizaciones o correcciones de seguridad
en las dependencias. Cada PR pasa las pruebas automáticas.

- [ ] En GitHub → **Settings → Code security** comprueba que están activados
      *Dependabot alerts* y *Dependabot security updates*.
- [ ] Cada semana, revisa los PR de Dependabot:
  - ✅ pruebas en verde y versión menor o parche: puedes fusionarlo;
  - ⚠️ versión mayor (el primer número cambia, p. ej. `8.x → 9.x`) o pruebas en
    rojo: pídeme que lo revise antes de fusionarlo;
  - Capacitor (`@capacitor/*`) llega agrupado: tras fusionarlo, comprueba que
    el APK se compila en GitHub Actions.

**Vulnerabilidades conocidas que quedan** (ninguna afecta al servidor en
producción):

| Paquete | Gravedad | Dónde se usa | Qué hacer |
|---|---|---|---|
| `@capacitor/cli`, `uuid`, `xcode` | Moderada | Solo al construir el APK | Esperar el parche de Capacitor (llegará por Dependabot) |
| `esbuild` | Baja | Servidor de desarrollo en Windows | Nada; se resuelve al actualizar Vite/tsx |

---

## 🟢 7. Comprobaciones rápidas después de cada despliegue

Tras cada push a `main`, GitHub Actions comprueba tipos, ejecuta las pruebas,
compila y despliega. Si algo falla, **el despliegue se detiene antes de tocar el
servidor**. Aun así, conviene hacer esta prueba de 2 minutos:

- [ ] Entra en <https://herawallet.app> e inicia sesión.
- [ ] Registra un gasto, ábrelo y pulsa **Editar**; cambia el importe y guarda.
- [ ] En **Deudas → Cobros recurrentes**, crea un cobro de prueba y pulsa
      **Cobrar**.
- [ ] Si tienes cuentas en varias monedas, comprueba que en **Cuentas** no
      aparece el aviso "Hay cuentas fuera del total", o indica el tipo de
      cambio que pide.
- [ ] Abre la app Android y comprueba que carga y deja iniciar sesión.

---

## 📋 Referencia: variables del `.env` relacionadas con estos cambios

| Variable | Obligatoria | Para qué |
|---|---|---|
| `JWT_SECRET` | Sí (recomendado) | Firma las sesiones de los usuarios. Ver paso 2. |
| `ADMIN_JWT_SECRET` | Sí (recomendado) | Firma las sesiones del panel. Ver paso 2. |
| `ADMIN_PASSWORD` | Sí | Contraseña del panel. Sin ella el panel no deja entrar. |
| `CORS_ORIGENES` | No | Orígenes extra permitidos, separados por comas. |
| `CORS_ESTRICTO` | No | `1` para bloquear orígenes desconocidos. Ver paso 5. |
| `OTP_DEBUG` | **Nunca en producción** | Muestra los códigos de acceso en la respuesta y en los logs. |

La lista completa está en `.env.example`.

---

## Lo que ya está hecho (no requiere acción)

- Claves de IA solo accesibles desde el panel y mostradas enmascaradas.
- Deudas y sus pagos protegidos: cada usuario solo ve y toca las suyas.
- Límite de intentos en el login del panel y códigos OTP fuera de los logs.
- Exportación de documentos con sesión obligatoria y sin inyección de HTML.
- Límite de tamaño por petición: 1 MB en general y 25 MB solo para audio y fotos.
- CORS con lista de orígenes (en modo observación, ver paso 5).
- Validación de movimientos, edición de movimientos y totales en una sola
  moneda, también en la línea de tiempo.
- Pruebas automáticas antes de cada despliegue y en cada pull request.
- Dependabot activado y vulnerabilidades reducidas de 30 a 4 (ninguna en el
  servidor).

**Siguiente paso técnico** (lo hago yo cuando lo pidas): dividir `src/App.tsx`
(~14.000 líneas) y `server.ts` (~5.000) en archivos por pantalla y por grupo de
rutas, en una rama aparte y por partes.
