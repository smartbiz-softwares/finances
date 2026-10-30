# empieza.smartbiz.com.uy

Landing de captación de SmartBusiness: promesa centrada en los problemas del
negocio, demo de Hera, casos, y un formulario interactivo que termina en
**reservar una sesión** o **escribir por WhatsApp** (+53 5907 9144).
Cada solicitud llega por correo a `jcksparrow0209@gmail.com`.

Es independiente de la app HeraWallet: no toca `server.ts` ni el build de Vite.

## Qué hay

| Ruta | Contenido |
| --- | --- |
| `/` | Página principal |
| `/sectores/<sector>/` | 12 páginas por sector |
| `/problemas/<problema>/` | 7 páginas, una por fuga |
| `/sectores/<sector>/<problema>/` | 84 páginas sector × problema |
| `/paises/<país>/` | 11 páginas por país |
| `/llms.txt`, `/llms-full.txt` | Resumen y texto completo para asistentes de IA |
| `/sitemap.xml`, `/robots.txt` | Para buscadores (y bots de IA permitidos) |
| `seo/palabras-clave.csv` | Mapa de más de 2.400 búsquedas → página que las responde |

El formulario pregunta (y se ramifica según cada respuesta): nombre, sector
(con "otro"), país, puntos de venta → si hay varios, cómo comparten la
mercancía; personas → quién usaría el sistema; cantidad de productos → códigos
de barras; tallas/colores (solo sectores que las tienen); vencimientos (solo
perecederos); **conexión a internet** → cómo se conecta y cortes de luz;
dispositivos; cómo lleva el control hoy → qué sistema usa; lo que más le
preocupa → cuántos le deben / en qué monedas cobra; objetivo; cuándo empezar;
WhatsApp. Luego muestra un diagnóstico y los dos caminos.

## Diseño

- **Sin barra de navegación.** El logo vive dentro del hero; en las páginas
  internas, las migas de pan van a su lado.
- **El ticket de caja** es el hilo visual: en el hero, Hera "imprime" las
  fugas de un negocio de ejemplo (la única animación de la página), y el
  diagnóstico del formulario sale con el mismo formato.
- **Montserrat**, alojada en `src/assets/fuentes/` (no depende de Google).
- **Íconos de [lucide-animated](https://lucide-animated.com)** (MIT,
  github.com/pqoqubbw/icons): sus SVG están en `src/iconos.mjs` y sus
  animaciones al pasar el puntero, portadas a CSS (`.la-*` en `estilos.css`),
  sin React. Donde no hay ícono exacto se usó el más cercano del catálogo
  (carrito para tiendas, paleta para ropa, gota para belleza, engranaje para
  fábricas, llama para panaderías).
- Criterios de [Impeccable](https://github.com/pbakaus/impeccable): sin rótulos
  sobre los títulos, sin filas de tarjetas iguales, sin vidrio decorativo y con
  la selección, el cursor de texto y los focos teñidos de la marca.
- **Hera** está en `src/assets/img/` (240 × 330 px). Con versiones de al menos
  480 × 660 px se verá nítida en pantallas de alta densidad: basta con
  reemplazar los archivos con el mismo nombre.

## Montar en local

Necesitas [Node.js](https://nodejs.org) 18 o superior. Desde esta carpeta:

```bash
npm install
npm run dev
```

Abre <http://localhost:4100>. `npm run dev` compila las 115 páginas en `dist/`
y arranca el servidor. Para que las solicitudes lleguen por correo, copia
`.env.example` como `.env` y completa el SMTP; sin él, quedan guardadas en
`solicitudes/solicitudes.jsonl`.

## Comandos

```bash
# Desde esta carpeta
npm run build   # genera dist/
npm start       # sirve dist/ y recibe /api/solicitud (puerto 4100)
npm test        # pruebas

# Desde la raíz del repositorio de HeraWallet
npm run landing:build
npm run landing:servidor
```

## Publicar en el VPS

1. En el `.env` de la raíz (el mismo de HeraWallet) deben estar `SMTP_HOST`,
   `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (ya se usan para los códigos OTP). Si
   quieres otro destinatario, añade `EMPIEZA_CORREO_DESTINO`.
2. Compila y arranca con PM2:

   ```bash
   cd /var/www/finances && npm run landing:build
   pm2 start landing-empieza/servidor.mjs --name empieza
   ```

3. En nginx, el subdominio apunta entero al servidor de la landing:

   ```nginx
   server {
     server_name empieza.smartbiz.com.uy;
     location / {
       proxy_pass http://127.0.0.1:4100;
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-For $remote_addr;
     }
     # listen 443 ssl; … (certbot --nginx -d empieza.smartbiz.com.uy)
   }
   ```

4. Da de alta `https://empieza.smartbiz.com.uy/sitemap.xml` en Google Search
   Console y Bing Webmaster Tools.

Si el correo falla o el SMTP no está configurado, ninguna solicitud se pierde:
todas quedan en `landing-empieza/solicitudes/solicitudes.jsonl` (fuera de git).

## Antes de publicar: revisar

- **Casos de éxito** (`src/config.mjs → casos`): la lista está vacía y la
  sección muestra un esqueleto del diseño. Cada caso real que añadas (con
  permiso del cliente; el formato está comentado ahí mismo) ocupa un hueco;
  con tres, el esqueleto desaparece.
- **Video** (`config.video.youtubeId`): mientras esté vacío se muestra la demo
  animada del episodio "El fiado fantasma". Al poner el ID de YouTube se
  muestra el video y se publica su `VideoObject` para Google.
- **Funciones prometidas**: la página afirma recordatorios de cobro, alertas
  de stock bajo, usuarios por cajero, varias sucursales y varias monedas
  (`src/plantillas.mjs → funciones`, `src/datos/problemas.mjs`,
  `src/datos/preguntas.mjs`). Quitar lo que SmartBusiness no haga hoy.
- **Agenda** (`config.agenda`): días, horario, zona horaria (hoy Cuba) y
  fechas bloqueadas.
- **Privacidad**: el formulario dice "no compartimos tus datos con nadie".

Tras cualquier cambio: `npm run landing:build` y reiniciar `pm2 restart empieza`.
