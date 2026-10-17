/**
 * =========================================================================
 * AVATAR ENGINE - EL CAMERINO (HTML5 Canvas Vector Renderer)
 * =========================================================================
 * Genera, renderiza y exporta avatares teatrales personalizados en tiempo real.
 */

const AvatarEngine = (function () {
  let canvas = null;
  let ctx = null;

  // Opciones y paletas disponibles
  const PALETTES = {
    skin: [
      { id: 'pale', name: 'Porcelana', color: '#FBEBE1', shadow: '#E8CCA8' },
      { id: 'fair', name: 'Claro', color: '#FFDFBA', shadow: '#E5BF98' },
      { id: 'tan', name: 'Trigueño', color: '#D29A67', shadow: '#B57B47' },
      { id: 'honey', name: 'Miel Cálido', color: '#C68642', shadow: '#9E642A' },
      { id: 'bronze', name: 'Bronce', color: '#8D5524', shadow: '#6A3C13' },
      { id: 'dark', name: 'Ébano', color: '#3C2014', shadow: '#24120B' }
    ],
    hairColor: [
      { id: 'black', name: 'Negro Azabache', color: '#1A181C', highlight: '#3A3640' },
      { id: 'brown', name: 'Castaño Noble', color: '#4A2E1B', highlight: '#6B442A' },
      { id: 'blonde', name: 'Rubio Escénico', color: '#D4AF37', highlight: '#FDE68A' },
      { id: 'crimson', name: 'Carmesí Dramático', color: '#8B152A', highlight: '#C72542' },
      { id: 'silver', name: 'Plata Clásica', color: '#9CA3AF', highlight: '#E5E7EB' },
      { id: 'violet', name: 'Púrpura Místico', color: '#581C87', highlight: '#A855F7' }
    ],
    costumeColor: [
      { id: 'crimson', name: 'Carmesí Real', main: '#8B152A', accent: '#D4AF37', border: '#C72542' },
      { id: 'gold', name: 'Oro Proscenio', main: '#B45309', accent: '#FDE68A', border: '#F59E0B' },
      { id: 'midnight', name: 'Azul Medianoche', main: '#1E1B4B', accent: '#93C5FD', border: '#3B82F6' },
      { id: 'emerald', name: 'Verde Época', main: '#064E3B', accent: '#6EE7B7', border: '#10B981' },
      { id: 'charcoal', name: 'Carbón Escenario', main: '#18181B', accent: '#F43F5E', border: '#3F3F46' }
    ]
  };

  // Estado por defecto
  let config = {
    skin: 'fair',
    hairStyle: 'curls',
    hairColor: 'brown',
    faceExpression: 'confident',
    costume: 'bard',
    costumeColor: 'crimson',
    prop: 'mask',
    showSpotlight: true
  };

  function init(canvasElement) {
    if (typeof canvasElement === 'string') {
      canvas = document.getElementById(canvasElement);
    } else {
      canvas = canvasElement;
    }
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    render();
  }

  function setConfig(newConfig) {
    config = { ...config, ...newConfig };
    render();
  }

  function getConfig() {
    return { ...config };
  }

  function randomize() {
    const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const hairStyles = ['curls', 'sleek', 'wavy', 'ponytail', 'crop', 'bard'];
    const expressions = ['confident', 'dramatic', 'joyful', 'mysterious'];
    const costumes = ['bard', 'broadway', 'detective', 'noble', 'phantom'];
    const props = ['mask', 'mic', 'script', 'rose', 'none'];

    config = {
      skin: randomPick(PALETTES.skin).id,
      hairStyle: randomPick(hairStyles),
      hairColor: randomPick(PALETTES.hairColor).id,
      faceExpression: randomPick(expressions),
      costume: randomPick(costumes),
      costumeColor: randomPick(PALETTES.costumeColor).id,
      prop: randomPick(props),
      showSpotlight: true
    };
    render();
    return config;
  }

  function toDataURL() {
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
  }

  // =========================================================================
  // DIBUJO EN CANVAS
  // =========================================================================

  function render() {
    if (!ctx || !canvas) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Fondo de escenario
    drawStageBackground(w, h);

    // 2. Luz de reflector (Spotlight cone)
    if (config.showSpotlight) {
      drawSpotlight(w, h);
    }

    // Coordenadas base centradas
    const cx = w / 2;
    const cy = h * 0.42;

    // 3. Cuello y base
    drawNeckAndChest(cx, cy);

    // 4. Vestuario (capa inferior del traje)
    drawCostumeBase(cx, cy);

    // 5. Rostro
    drawFace(cx, cy);

    // 6. Expresión (ojos, boca, cejas, rubor teatral)
    drawExpression(cx, cy);

    // 7. Cabello
    drawHair(cx, cy);

    // 8. Detalles del traje (cuellos, broches, corbata, solapas)
    drawCostumeTrim(cx, cy);

    // 9. Accesorio / Prop de escenario
    drawProp(cx, cy);

    // 10. Marco y resplandor teatral sutil
    drawStageFrame(w, h);
  }

  function drawStageBackground(w, h) {
    // Fondo oscuro de auditorio
    const bgGrad = ctx.createRadialGradient(w / 2, h * 0.35, 10, w / 2, h * 0.5, w * 0.7);
    bgGrad.addColorStop(0, '#241b2b');
    bgGrad.addColorStop(0.6, '#15131a');
    bgGrad.addColorStop(1, '#0c0a0f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Tablones de madera oscura del escenario en la parte inferior
    const floorY = h * 0.78;
    const floorGrad = ctx.createLinearGradient(0, floorY, 0, h);
    floorGrad.addColorStop(0, '#2b1d14');
    floorGrad.addColorStop(1, '#150d09');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, floorY, w, h - floorY);

    // Líneas sutiles de tablones
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 45) {
      ctx.beginPath();
      ctx.moveTo(i, floorY);
      ctx.lineTo(i - 20, h);
      ctx.stroke();
    }
  }

  function drawSpotlight(w, h) {
    ctx.save();
    const coneGrad = ctx.createRadialGradient(w / 2, 0, 10, w / 2, h * 0.45, w * 0.6);
    coneGrad.addColorStop(0, 'rgba(253, 230, 138, 0.35)');
    coneGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.12)');
    coneGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');

    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w + 50, h);
    ctx.lineTo(-50, h);
    ctx.closePath();
    ctx.fill();

    // Halo circular en el piso
    const floorOval = ctx.createRadialGradient(w / 2, h * 0.82, 10, w / 2, h * 0.82, w * 0.4);
    floorOval.addColorStop(0, 'rgba(251, 191, 36, 0.25)');
    floorOval.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = floorOval;
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.82, w * 0.38, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function getSkinObj() {
    return PALETTES.skin.find(s => s.id === config.skin) || PALETTES.skin[1];
  }

  function getCostumeColorObj() {
    return PALETTES.costumeColor.find(c => c.id === config.costumeColor) || PALETTES.costumeColor[0];
  }

  function getHairColorObj() {
    return PALETTES.hairColor.find(h => h.id === config.hairColor) || PALETTES.hairColor[1];
  }

  function drawNeckAndChest(cx, cy) {
    const skin = getSkinObj();
    ctx.save();
    // Cuello
    ctx.fillStyle = skin.shadow;
    ctx.beginPath();
    ctx.rect(cx - 24, cy + 40, 48, 55);
    ctx.fill();

    // Sombra bajo la barbilla
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 45, 26, 10, 0, 0, Math.PI);
    ctx.fill();
    ctx.restore();
  }

  function drawFace(cx, cy) {
    const skin = getSkinObj();
    ctx.save();
    // Base del rostro
    ctx.fillStyle = skin.color;
    ctx.beginPath();
    // Forma ovalada teatral estilizada
    ctx.moveTo(cx - 50, cy - 25);
    ctx.bezierCurveTo(cx - 55, cy + 30, cx - 35, cy + 65, cx, cy + 65);
    ctx.bezierCurveTo(cx + 35, cy + 65, cx + 55, cy + 30, cx + 50, cy - 25);
    ctx.bezierCurveTo(cx + 45, cy - 65, cx - 45, cy - 65, cx - 50, cy - 25);
    ctx.fill();

    // Orejas
    ctx.fillStyle = skin.color;
    ctx.beginPath();
    ctx.ellipse(cx - 52, cy + 5, 10, 16, -0.1, 0, Math.PI * 2);
    ctx.ellipse(cx + 52, cy + 5, 10, 16, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Rubor teatral en mejillas
    ctx.fillStyle = 'rgba(244, 63, 94, 0.18)';
    ctx.beginPath();
    ctx.ellipse(cx - 30, cy + 20, 14, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 30, cy + 20, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nariz
    ctx.strokeStyle = skin.shadow;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 5);
    ctx.lineTo(cx - 2, cy + 18);
    ctx.lineTo(cx + 5, cy + 18);
    ctx.stroke();

    ctx.restore();
  }

  function drawExpression(cx, cy) {
    const expr = config.faceExpression;
    ctx.save();

    // CEJAS
    ctx.strokeStyle = '#272023';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();

    if (expr === 'dramatic') {
      // Cejas dramáticas elevadas en el centro
      ctx.moveTo(cx - 38, cy - 12);
      ctx.lineTo(cx - 15, cy - 24);
      ctx.moveTo(cx + 38, cy - 12);
      ctx.lineTo(cx + 15, cy - 24);
    } else if (expr === 'mysterious') {
      // Una ceja levantada con intriga
      ctx.moveTo(cx - 38, cy - 22);
      ctx.lineTo(cx - 15, cy - 18);
      ctx.moveTo(cx + 38, cy - 16);
      ctx.lineTo(cx + 15, cy - 28);
    } else {
      // Confidente / Alegre
      ctx.moveTo(cx - 38, cy - 20);
      ctx.quadraticCurveTo(cx - 26, cy - 26, cx - 14, cy - 20);
      ctx.moveTo(cx + 38, cy - 20);
      ctx.quadraticCurveTo(cx + 26, cy - 26, cx + 14, cy - 20);
    }
    ctx.stroke();

    // OJOS
    drawEye(cx - 26, cy - 6, expr);
    drawEye(cx + 26, cy - 6, expr);

    // BOCA
    ctx.beginPath();
    if (expr === 'joyful') {
      // Gran sonrisa teatral
      ctx.fillStyle = '#8b152a';
      ctx.strokeStyle = '#680019';
      ctx.lineWidth = 2;
      ctx.arc(cx, cy + 34, 16, 0.1, Math.PI - 0.1, false);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Dientes blancos
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 8, cy + 34, 16, 4);
    } else if (expr === 'dramatic') {
      // Boca declamando monólogo
      ctx.fillStyle = '#4a0815';
      ctx.ellipse(cx, cy + 38, 10, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c72542';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (expr === 'mysterious') {
      // Sonrisa de medio lado
      ctx.strokeStyle = '#8b152a';
      ctx.lineWidth = 3.5;
      ctx.moveTo(cx - 15, cy + 38);
      ctx.quadraticCurveTo(cx + 5, cy + 38, cx + 18, cy + 32);
      ctx.stroke();
    } else {
      // Confident smile
      ctx.strokeStyle = '#8b152a';
      ctx.lineWidth = 3.5;
      ctx.moveTo(cx - 16, cy + 34);
      ctx.quadraticCurveTo(cx, cy + 44, cx + 16, cy + 34);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawEye(x, y, expr) {
    ctx.save();
    // Esclerótica
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(x, y, 11, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iris (marrón dorado teatral)
    ctx.fillStyle = '#6b3c1b';
    ctx.beginPath();
    ctx.arc(x, y, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Pupila
    ctx.fillStyle = '#0f0e12';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Brillo de luz de escenario
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - 2, y - 2, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Delineado / Párpado teatral
    ctx.strokeStyle = '#272023';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, 11, 7, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawHair(cx, cy) {
    const hair = getHairColorObj();
    const style = config.hairStyle;
    ctx.save();
    ctx.fillStyle = hair.color;

    if (style === 'curls') {
      // Rizos teatrales voluminosos
      ctx.beginPath();
      // Capa izquierda
      ctx.arc(cx - 45, cy - 40, 24, 0, Math.PI * 2);
      ctx.arc(cx - 50, cy - 10, 20, 0, Math.PI * 2);
      ctx.arc(cx - 40, cy + 18, 18, 0, Math.PI * 2);
      // Corona superior
      ctx.arc(cx - 25, cy - 58, 22, 0, Math.PI * 2);
      ctx.arc(cx, cy - 64, 25, 0, Math.PI * 2);
      ctx.arc(cx + 25, cy - 58, 22, 0, Math.PI * 2);
      // Capa derecha
      ctx.arc(cx + 45, cy - 40, 24, 0, Math.PI * 2);
      ctx.arc(cx + 50, cy - 10, 20, 0, Math.PI * 2);
      ctx.arc(cx + 40, cy + 18, 18, 0, Math.PI * 2);
      ctx.fill();

      // Destellos
      ctx.strokeStyle = hair.highlight;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx - 10, cy - 60, 15, Math.PI, Math.PI * 1.5);
      ctx.stroke();
    } else if (style === 'sleek') {
      // Estilo Broadway pulcro peinado hacia atrás
      ctx.beginPath();
      ctx.moveTo(cx - 52, cy - 15);
      ctx.quadraticCurveTo(cx - 50, cy - 65, cx, cy - 70);
      ctx.quadraticCurveTo(cx + 50, cy - 65, cx + 52, cy - 15);
      ctx.quadraticCurveTo(cx, cy - 45, cx - 52, cy - 15);
      ctx.fill();

      ctx.fillStyle = hair.highlight;
      ctx.fillRect(cx - 15, cy - 66, 30, 4);
    } else if (style === 'wavy') {
      // Ondas largas teatrales
      ctx.beginPath();
      ctx.moveTo(cx - 55, cy + 60);
      ctx.quadraticCurveTo(cx - 65, cy - 20, cx - 40, cy - 65);
      ctx.quadraticCurveTo(cx, cy - 72, cx + 40, cy - 65);
      ctx.quadraticCurveTo(cx + 65, cy - 20, cx + 55, cy + 60);
      ctx.quadraticCurveTo(cx + 45, cy + 20, cx + 45, cy - 35);
      ctx.quadraticCurveTo(cx, cy - 40, cx - 45, cy - 35);
      ctx.quadraticCurveTo(cx - 45, cy + 20, cx - 55, cy + 60);
      ctx.fill();
    } else if (style === 'ponytail') {
      // Coleta alta con lazo
      ctx.beginPath();
      ctx.arc(cx, cy - 45, 45, Math.PI, 0);
      ctx.fill();
      // Coleta cayendo a un lado
      ctx.beginPath();
      ctx.moveTo(cx + 25, cy - 50);
      ctx.bezierCurveTo(cx + 80, cy - 40, cx + 75, cy + 30, cx + 60, cy + 70);
      ctx.bezierCurveTo(cx + 50, cy + 30, cx + 60, cy - 30, cx + 25, cy - 45);
      ctx.fill();
    } else if (style === 'bard') {
      // Cabello renacentista con raya en medio
      ctx.beginPath();
      ctx.moveTo(cx - 54, cy + 25);
      ctx.bezierCurveTo(cx - 60, cy - 50, cx - 10, cy - 65, cx, cy - 40);
      ctx.bezierCurveTo(cx + 10, cy - 65, cx + 60, cy - 50, cx + 54, cy + 25);
      ctx.quadraticCurveTo(cx + 40, cy - 30, cx, cy - 35);
      ctx.quadraticCurveTo(cx - 40, cy - 30, cx - 54, cy + 25);
      ctx.fill();
    } else {
      // Crop moderno
      ctx.beginPath();
      ctx.arc(cx, cy - 42, 42, Math.PI * 0.9, Math.PI * 2.1);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawCostumeBase(cx, cy) {
    const col = getCostumeColorObj();
    ctx.save();

    // Hombros y torso
    ctx.fillStyle = col.main;
    ctx.beginPath();
    ctx.moveTo(cx - 25, cy + 80);
    ctx.lineTo(cx - 90, cy + 120);
    ctx.lineTo(cx - 95, cy + 220);
    ctx.lineTo(cx + 95, cy + 220);
    ctx.lineTo(cx + 90, cy + 120);
    ctx.lineTo(cx + 25, cy + 80);
    ctx.closePath();
    ctx.fill();

    // Sombra del drapeado
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.moveTo(cx - 90, cy + 120);
    ctx.lineTo(cx - 30, cy + 150);
    ctx.lineTo(cx - 35, cy + 220);
    ctx.lineTo(cx - 95, cy + 220);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + 90, cy + 120);
    ctx.lineTo(cx + 30, cy + 150);
    ctx.lineTo(cx + 35, cy + 220);
    ctx.lineTo(cx + 95, cy + 220);
    ctx.fill();

    ctx.restore();
  }

  function drawCostumeTrim(cx, cy) {
    const col = getCostumeColorObj();
    const cost = config.costume;
    ctx.save();

    if (cost === 'bard') {
      // Cuello lechuguilla (Ruff collar) blanco plisado
      ctx.fillStyle = '#f8f5ee';
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1.5;
      for (let i = -40; i <= 40; i += 8) {
        ctx.beginPath();
        ctx.arc(cx + i, cy + 80, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Bordados dorados verticales
      ctx.strokeStyle = col.accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 90);
      ctx.lineTo(cx, cy + 220);
      ctx.stroke();

      // Botones dorados
      ctx.fillStyle = col.accent;
      for (let y = cy + 105; y <= cy + 195; y += 22) {
        ctx.beginPath();
        ctx.arc(cx, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (cost === 'broadway') {
      // Esmoquin moderno con solapas satinadas y corbatín rojo
      ctx.fillStyle = '#ffffff'; // Camisa blanca
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy + 80);
      ctx.lineTo(cx + 20, cy + 80);
      ctx.lineTo(cx, cy + 140);
      ctx.closePath();
      ctx.fill();

      // Solapas negras satinadas
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy + 80);
      ctx.lineTo(cx - 55, cy + 140);
      ctx.lineTo(cx - 20, cy + 180);
      ctx.lineTo(cx - 5, cy + 140);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx + 20, cy + 80);
      ctx.lineTo(cx + 55, cy + 140);
      ctx.lineTo(cx + 20, cy + 180);
      ctx.lineTo(cx + 5, cy + 140);
      ctx.closePath();
      ctx.fill();

      // Corbatín carmesí teatral (Bowtie)
      ctx.fillStyle = '#c72542';
      ctx.beginPath();
      ctx.moveTo(cx, cy + 88);
      ctx.lineTo(cx - 14, cy + 82);
      ctx.lineTo(cx - 14, cy + 96);
      ctx.lineTo(cx, cy + 90);
      ctx.lineTo(cx + 14, cy + 96);
      ctx.lineTo(cx + 14, cy + 82);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(cx, cy + 89, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (cost === 'detective') {
      // Gabardina Noir con cuello alzado y corbata
      ctx.fillStyle = '#e2e8f0'; // Camisa
      ctx.fillRect(cx - 10, cy + 80, 20, 50);

      // Corbata suelta
      ctx.fillStyle = '#8b152a';
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy + 88);
      ctx.lineTo(cx + 5, cy + 88);
      ctx.lineTo(cx + 7, cy + 150);
      ctx.lineTo(cx, cy + 165);
      ctx.lineTo(cx - 7, cy + 150);
      ctx.closePath();
      ctx.fill();

      // Cuellos altos de la gabardina
      ctx.fillStyle = col.border;
      ctx.beginPath();
      ctx.moveTo(cx - 25, cy + 65);
      ctx.lineTo(cx - 55, cy + 110);
      ctx.lineTo(cx - 15, cy + 100);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx + 25, cy + 65);
      ctx.lineTo(cx + 55, cy + 110);
      ctx.lineTo(cx + 15, cy + 100);
      ctx.closePath();
      ctx.fill();
    } else if (cost === 'phantom') {
      // Capa de ópera mística con forro de terciopelo y broche enjoyado
      ctx.fillStyle = '#c72542'; // Forro carmesí
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy + 70);
      ctx.lineTo(cx - 70, cy + 110);
      ctx.lineTo(cx - 30, cy + 115);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx + 30, cy + 70);
      ctx.lineTo(cx + 70, cy + 110);
      ctx.lineTo(cx + 30, cy + 115);
      ctx.closePath();
      ctx.fill();

      // Cadena dorada y broche
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 35, cy + 90);
      ctx.quadraticCurveTo(cx, cy + 105, cx + 35, cy + 90);
      ctx.stroke();

      ctx.fillStyle = '#991b1b';
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy + 98, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Noble Renacentista con medalla de oro
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy + 85, 40, 0.2, Math.PI - 0.2);
      ctx.stroke();

      // Medallón colgante
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx, cy + 130, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawProp(cx, cy) {
    const prop = config.prop;
    if (prop === 'none') return;
    ctx.save();

    if (prop === 'mask') {
      // Máscara veneciana dorada sostenida en mano cerca del hombro
      const mx = cx + 55;
      const my = cy + 50;
      ctx.translate(mx, my);
      ctx.rotate(0.25);

      // Vara de sostener
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 30);
      ctx.lineTo(15, 120);
      ctx.stroke();

      // Cuerpo de la máscara
      ctx.fillStyle = '#fde68a';
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, 32, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Ojos de la máscara
      ctx.fillStyle = '#141317';
      ctx.beginPath();
      ctx.ellipse(-12, -2, 7, 4, -0.2, 0, Math.PI * 2);
      ctx.ellipse(12, -2, 7, 4, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Detalle de filigrana
      ctx.strokeStyle = '#c72542';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, -10, 8, 0, Math.PI);
      ctx.stroke();
    } else if (prop === 'mic') {
      // Micrófono vintage estilo escenario
      const mx = cx - 60;
      const my = cy + 80;
      // Pie de micro
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx - 10, my + 130);
      ctx.stroke();

      // Cabeza del micrófono elipsoidal
      ctx.fillStyle = '#e5e7eb';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(mx, my - 20, 16, 22, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Rejilla de micrófono
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(mx - 12, my - 20);
      ctx.lineTo(mx + 12, my - 20);
      ctx.moveTo(mx, my - 36);
      ctx.lineTo(mx, my - 4);
      ctx.stroke();
    } else if (prop === 'script') {
      // Libreto de guion enrollado con cinta roja
      const sx = cx + 55;
      const sy = cy + 120;
      ctx.translate(sx, sy);
      ctx.rotate(-0.35);

      // Pergamino blanco crema
      ctx.fillStyle = '#fef3c7';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-25, -12, 50, 24, 6);
      ctx.fill();
      ctx.stroke();

      // Letras simuladas "SCRIPT"
      ctx.fillStyle = '#92400e';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('ACT II', -15, 3);

      // Cinta roja
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-6, -13, 12, 26);
    } else if (prop === 'rose') {
      // Rosa roja de escenario
      const rx = cx - 55;
      const ry = cy + 120;
      // Tallo verde
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(rx, ry + 15);
      ctx.lineTo(rx - 15, ry + 80);
      ctx.stroke();

      // Pétalos rojos
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(rx, ry, 12, 0, Math.PI * 2);
      ctx.arc(rx - 6, ry - 6, 8, 0, Math.PI * 2);
      ctx.arc(rx + 6, ry - 6, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawStageFrame(w, h) {
    // Fina moldura dorada en las esquinas del avatar
    ctx.save();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 2;

    const cornerSize = 24;
    // Top Left
    ctx.beginPath();
    ctx.moveTo(10, 10 + cornerSize);
    ctx.lineTo(10, 10);
    ctx.lineTo(10 + cornerSize, 10);
    ctx.stroke();

    // Top Right
    ctx.beginPath();
    ctx.moveTo(w - 10 - cornerSize, 10);
    ctx.lineTo(w - 10, 10);
    ctx.lineTo(w - 10, 10 + cornerSize);
    ctx.stroke();

    // Bottom Left
    ctx.beginPath();
    ctx.moveTo(10, h - 10 - cornerSize);
    ctx.lineTo(10, h - 10);
    ctx.lineTo(10 + cornerSize, h - 10);
    ctx.stroke();

    // Bottom Right
    ctx.beginPath();
    ctx.moveTo(w - 10 - cornerSize, h - 10);
    ctx.lineTo(w - 10, h - 10);
    ctx.lineTo(w - 10, h - 10 - cornerSize);
    ctx.stroke();

    ctx.restore();
  }

  return {
    init,
    render,
    setConfig,
    getConfig,
    randomize,
    toDataURL,
    PALETTES
  };
})();
