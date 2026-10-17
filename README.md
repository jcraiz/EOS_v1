# Inglés en Escena - PWA (V1)
**Plataforma Web Comunicativa con Enfoque Teatral en Vivo**

Diseñada e implementada con la dirección visual **"Dramatic Stage Glass"** (inspirada en Google Stitch), integración completa con **Google Sheets & Google Drive** mediante **Google Apps Script (GAS)**, personalizador interactivo de avatares en HTML5 Canvas y ejercicios dinámicos de dictado y reconocimiento de voz mediante la **Web Speech API nativa**.

---

## 🌟 Características Implementadas

1. **Autenticación con Google Sheets:**
   - Login validado contra la pestaña `Usuarios` del Google Spreadsheet del profesor vía Webhook GAS.
   - Modo de demostración inmediato para pruebas rápidas sin configurar backend (`demo` / `demo123` o botón *"Ingresar como Alumno Demo"*).

2. **Camerino & Estudio de Avatar Personalizable:**
   - Motor gráfico en Canvas (`avatar.js`) que renderiza rostros, expresiones dramáticas, tonos de piel, peinados, vestuarios teatrales (*Shakespearean Bard, Broadway Modern, Detective Noir, Noble, Phantom*) y accesorios (*Máscara dorada, Micrófono vintage, Guion, Rosa roja*).
   - Botón *"Guardar en Mi Camerino Drive"*: exporta en alta definición y lo sincroniza a la carpeta específica de Google Drive del alumno mediante Google Apps Script.

3. **Vocabulario Comunicativo & Práctica de Voz en Escenario:**
   - Sección *"¿Qué aprendiste el día de hoy?"*: entrada restringida y validada en tiempo real para **máximo 3 a 4 palabras** (fomentando agilidad y ritmo escénico).
   - **Dictado Teatral:** Usa `SpeechSynthesis` para reproducir la pronunciación nativa de la frase con modulación escénica.
   - **Reconocimiento de Voz en Vivo:** Usa `webkitSpeechRecognition` para evaluar la dicción del alumno, otorgando un puntaje de precisión (*e.g., 96% Coincidencia*) y feedback fonético inmediato.
   - Registro automático en la pestaña `Vocabulario` de Google Sheets.

4. **Feedback de Clase ("Dos estrellas y un deseo"):**
   - Formulario donde el alumno registra dos aspectos positivos del ensayo y un deseo para la próxima sesión.
   - Almacenamiento instantáneo en la hoja `Feedback` vinculado al `student_id`.

5. **PWA (Progressive Web App):**
   - Instalable en la pantalla de inicio de celulares Android (Chrome) e iOS (Safari) sin pasar por Google Play o App Store.
   - Soporte offline con Service Worker (`sw.js`).
   - Diseño adaptable para teléfonos inteligentes, tablets y computadoras de escritorio.

---

## 🚀 Guía Rápida de Uso

### 1. Probar la aplicación de inmediato
Puedes abrir directamente el archivo `index.html` en tu navegador, o si prefieres ejecutar un servidor local:
```bash
# Opcional: ejecutar con servidor local ligero
npx serve c:/Users/user/Desktop/EOS/V1
```
Al entrar:
- Haz clic en **"🎭 Ingresar como Alumno Demo (Prueba Rápida)"** para explorar todas las pantallas de inmediato con datos de prueba.

---

### Paso 2: Crear la Carpeta para Avatares en Google Drive
1. En Google Drive, crea una carpeta llamada **"Avatares - Inglés en Escena"**.
2. Abre la carpeta y copia su ID de la URL del navegador:
   `https://drive.google.com/drive/folders/ESTE_ES_EL_ID_DE_LA_CARPETA`
3. Pega ese ID en la pestaña `Configuracion` de tu hoja de cálculo, en la fila `DRIVE_AVATAR_FOLDER_ID`.

---

### Paso 3: Configurar Google Apps Script (GAS)
1. En tu hoja de cálculo, ve al menú superior: **Extensiones > Apps Script**.
2. Borra el código por defecto y copia todo el contenido del archivo [`Code.gs`](file:///c:/Users/user/Desktop/EOS/V1/Code.gs).
3. Haz clic en **Guardar** (icono de disquete).
4. Haz clic en el botón azul **Implementar (Deploy) > Nueva implementación (New deployment)**.
5. Haz clic en el engranaje de tipo y selecciona **Aplicación web (Web app)**.
6. Ajusta estos dos parámetros clave:
   - **Ejecutar como (Execute as):** `Yo (tu correo de Google)`
   - **Quién tiene acceso (Who has access):** `Cualquier usuario (Anyone)`
7. Haz clic en **Implementar**. Acepta los permisos de Google Drive y Sheets si te lo solicita.
8. Copia la **URL de la aplicación web** generada (debe terminar en `/exec`).

---

### Paso 4: Conectar la URL en la Aplicación Web
1. Abre `index.html` en el navegador.
2. Haz clic en el enlace **"⚙️ Conectar Hoja de Google Sheets (GAS)"** (en la pantalla de login o en el icono de engranaje superior).
3. Pega tu URL de Apps Script.
4. Presiona **"Probar Conexión"** y luego **"Guardar Conexión"**.
5. ¡Listo! Todo lo que tus alumnos registren se sincronizará automáticamente en tiempo real con Google Sheets y Google Drive.

---

## 📱 Cómo Instalar como PWA en Celulares

### En Android (Google Chrome)
1. Abre la URL de la aplicación en Chrome.
2. Aparecerá automáticamente el banner *"Instala Inglés en Escena"*; presiona **"Instalar"**.
3. (O presiona el menú de 3 puntos `⋮` de Chrome y selecciona *"Agregar a la pantalla principal"* o *"Instalar app"*).
4. La app aparecerá con su icono teatral propio en el cajón de aplicaciones de tu móvil, funcionando en pantalla completa y offline.

### En iPhone / iPad (Apple Safari)
1. Abre la URL de la aplicación en Safari.
2. Toca el botón **Compartir** (icono de cuadrado con flecha hacia arriba).
3. Selecciona **"Agregar a pantalla de inicio"** (Add to Home Screen).
4. Toca **"Agregar"**. La app se abrirá en modo standalone sin la barra del navegador.

---

## 📁 Estructura del Proyecto en `V1/`

```
V1/
├── index.html           # Vista y componentes PWA (Login, Escenario, Camerino, Feedback)
├── styles.css           # Estilos Dramatic Stage Glass, glassmorphism y animaciones
├── app.js               # Controlador principal de la PWA y flujos de usuario
├── avatar.js            # Motor en HTML5 Canvas para diseño y exportación de avatares
├── speech.js            # Módulo nativo de Web Speech API (dictado y reconocimiento vocal)
├── gas-client.js        # Conector HTTP con Google Apps Script, CORS y modo offline
├── manifest.json        # Manifiesto PWA para instalación móvil
├── sw.js                # Service Worker para funcionamiento offline y cacheo
├── Code.gs              # Script backend para Google Apps Script (Web API)
├── icons/
│   └── icon.svg         # Icono vectorial oficial de la aplicación
└── README.md            # Documentación completa y manual de instalación
```
