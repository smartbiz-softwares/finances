<div align="center">
  <img src="src/logo.png" alt="HeraWallet Logo" width="100" />
  <h1>HeraWallet</h1>
  <p><strong><em>"Tus metas empiezan con un mejor control."</em></strong></p>
  <p>
    <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node Express" />
    <img src="https://img.shields.io/badge/SQLite-Better--SQLite3-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
    <img src="https://img.shields.io/badge/Gemini_AI-Google-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Gemini AI" />
  </p>
</div>

---

## 💡 ¿Qué es HeraWallet?

**HeraWallet** es una plataforma de finanzas personales moderna, intuitiva e impulsada por Inteligencia Artificial, diseñada para ayudar a personas y familias en Latinoamérica, Cuba y el mundo a transformar el caos financiero en claridad absoluta.

Inspirada en los estándares de diseño de empresas como **Anthropic, Apple, Linear, Notion y Stripe**, HeraWallet combina una experiencia visual minimalista y premium con algoritmos avanzados de análisis financiero.

---

## 🌟 ¿Cómo ayuda HeraWallet a las personas?

Muchas personas enfrentan incertidumbre sobre dónde se va su dinero al final del mes, sufren por "fugas invisibles" de capital, u olvidan cobros y deudas pendientes. **HeraWallet resuelve estos problemas directamente:**

### 1. 🎯 Control Unificado de Cuentas y Divisas
* **Toda tu economía en un solo lugar:** Agrupa tus cuentas bancarias, dinero en efectivo, tarjetas de crédito y billeteras cripto (BTC/ETH).
* **Soporte Multimoneda Inteligente:** Diseñado para economías dinámicas o con múltiples monedas (USD, EUR, MXN, ARS, COP, CLP, CUP, GBP).

### 2. 📊 Score Hera de Salud Financiera (0 a 100)
Calcula automáticamente tu nivel de bienestar económico analizando **5 pilares fundamentales**:
* **Ahorro & Flujo de Caja:** Relación real entre tus ingresos y gastos.
* **Control de Deudas:** Proporción de tus compromisos financieros frente a tu saldo disponible.
* **Liquidez:** Evaluación de tu colchón financiero disponible para emergencias.
* **Cumplimiento de Metas:** Progreso acumulado en tus objetivos de ahorro.
* **Consistencia:** Hábito constante en el registro de tus transacciones.

### 3. 🤖 Copiloto e Inteligencia Artificial Financiera
Integra modelos avanzados de IA (Google Gemini / DeepSeek) que actúan como tu asesor personal:
* **Detección de Fugas de Dinero:** Identifica cobros duplicados, suscripciones olvidadas o gastos hormiga innecesarios.
* **Asistente en Tiempo Real:** Puedes chatear con tu IA para hacerle preguntas como: *¿En qué gasté más este mes?* o *¿Cuánto puedo ahorrar para viajar en diciembre?*
* **Lectura Inteligente:** Análisis y extracción automática de información en comprobantes y tickets de compra.

### 4. 🤝 Gestión Transparente de Deudas y Préstamos
* **Cuentas por Cobrar y por Pagar:** Registra préstamos a amigos, familiares o compromisos bancarios.
* **Abonos Parciales:** Permite registrar pagos en partes con historial detallado y notas para evitar malentendidos o pérdidas de dinero.

### 5. 🚀 Metas de Ahorro Automatizadas
* Define un objetivo (ej. *Fondo de Emergencia*, *Compra de Vehículo*, *Viaje*) y HeraWallet calculará exactamente cuánto debes ahorrar de manera semanal para lograrlo antes de tu fecha límite.

### 6. 🔐 Seguridad y Autenticación Simplificada
* Inicio de sesión mediante número telefónico con código **OTP (SMS)**.
* Arquitectura orientada a la privacidad, donde cada usuario cuenta con aislamiento estricto de sus datos a nivel de fila (*Row-Level Isolation*).

---

## 🛠️ Arquitectura Tecnológica

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts, Motion (Framer Motion).
* **Backend:** Node.js, Express, SQLite (`better-sqlite3` con modo WAL de alto rendimiento), JWT.
* **IA & Integraciones:** Google Gemini API, DeepSeek API, ZDSMS API (envío de OTPs por SMS).

---

## 🚀 Inicio Rápido en Desarrollo Local

### Requisitos Previos
* **Node.js** v18+ o v20+
* **npm** v9+

### Pasos de Instalación

1. **Clonar e instalar dependencias:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd finances
   npm install
   ```

2. **Configurar el archivo de entorno `.env`:**
   Crea un archivo `.env` en la raíz de `finances`:
   ```env
   PORT=4000
   JWT_SECRET=tu_clave_secreta_jwt
   GEMINI_API_KEY=tu_api_key_de_gemini
   ```

3. **Ejecutar el proyecto en desarrollo:**
   Para ejecutar tanto el servidor API de Express como el servidor de desarrollo de Vite al mismo tiempo:
   ```bash
   npm run start
   ```

   O ejecutar los servicios individualmente en terminales separadas:
   * **Backend API (Puerto 4000):** `npm run server`
   * **Frontend Vite (Puerto 3000):** `npm run dev`

4. **Abrir en el navegador:**
   Ingresa a `http://localhost:3000`

---

## 🌐 Despliegue en Producción

Para desplegar este proyecto en un servidor **VPS con Ubuntu**, consulta la guía completa ubicada en el nivel superior de este repositorio:
📄 **[GUIA_DESPLIEGUE_UBUNTU_VPS.md](../GUIA_DESPLIEGUE_UBUNTU_VPS.md)**

---

## 🎨 Identidad Visual y Diseño

* **Color de Marca:** Terracota Premium (`#D97757`)
* **Tipografía de Títulos:** *Source Serif 4*
* **Tipografía de Interfaz:** *Inter*
* **Estilo:** Bordes finos (1px), sin sombras pesadas, esquinas suavizadas (16–20px) y modo oscuro nativo.

---

<div align="center">
  <sub>Desarrollado con ❤️ para brindar libertad y claridad financiera.</sub>
</div>
