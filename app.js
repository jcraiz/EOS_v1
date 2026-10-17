/**
 * =========================================================================
 * INGLÉS EN ESCENA - APP CONTROLLER (PWA)
 * =========================================================================
 * Controlador principal que orquesta la autenticación, el camerino de avatares,
 * el módulo comunicativo de vocabulario (Web Speech API) y el feedback de clase.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Estado local
  let currentStudent = null;
  let activePhrase = 'Break a leg';
  let activeTranslation = '¡Mucho éxito en escena!';
  let deferredPrompt = null;

  // Detectar si la app corre bajo HTTP/HTTPS o protocolo local file://
  const isHttp = window.location.protocol === 'http:' || window.location.protocol === 'https:';

  // Inyectar Web App Manifest dinámicamente solo en HTTP/HTTPS (evita errores CORS en file://)
  if (isHttp) {
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = 'manifest.json';
    document.head.appendChild(manifestLink);
  }

  // =========================================================================
  // 1. REGISTRO DE SERVICE WORKER & PWA INSTALL PROMPT
  // =========================================================================
  if (isHttp && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => console.log('PWA Service Worker registrado con éxito:', reg.scope))
        .catch((err) => console.warn('Fallo al registrar Service Worker:', err));
    });
  } else if (!isHttp) {
    console.info('ℹ️ Modo local (file://): Los Service Workers y la instalación PWA requieren HTTP/HTTPS. Puedes ejecutar "start_server.bat" para correr en http://localhost:3000 con soporte PWA completo.');
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.classList.remove('hidden');
  });

  const btnPwaInstall = document.getElementById('btn-pwa-install');
  if (btnPwaInstall) {
    btnPwaInstall.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          showToast('¡App instalada en tu pantalla de inicio! 🎭');
        }
        deferredPrompt = null;
        document.getElementById('pwa-install-banner').classList.add('hidden');
      }
    });
  }

  // =========================================================================
  // 2. INICIALIZACIÓN DE SESIÓN Y VISTAS
  // =========================================================================
  initSession();
  initNavigation();
  initCustomizerUI();
  initVocabWordCounter();
  initSpeechRehearsal();
  initGasModal();

  function initSession() {
    currentStudent = GASClient.getSession();
    if (currentStudent) {
      showAppView(currentStudent);
    } else {
      showLoginView();
    }
  }

  function showLoginView() {
    document.getElementById('view-login').classList.add('active');
    document.getElementById('view-app').classList.remove('active');
  }

  function showAppView(student) {
    currentStudent = student;
    document.getElementById('view-login').classList.remove('active');
    document.getElementById('view-app').classList.add('active');

    // Actualizar nombre y racha en la barra superior
    document.getElementById('display-student-name').textContent = student.name || 'Estudiante';
    document.getElementById('display-streak').textContent = `🔥 ${student.streakDays || 7} Días`;

    // Inicializar Canvas del Avatar principal y miniaturas
    setTimeout(() => {
      AvatarEngine.init('camerino-main-canvas');
      if (student.avatarConfig) {
        AvatarEngine.setConfig(student.avatarConfig);
      }
      renderMiniAvatars();
    }, 100);

    // Cargar vocabulario previo
    loadStudentVocabulary();
  }

  function renderMiniAvatars() {
    // Topbar avatar
    const topCanvas = document.getElementById('topbar-avatar-canvas');
    if (topCanvas) {
      const tCtx = topCanvas.getContext('2d');
      const mainCanvas = document.getElementById('camerino-main-canvas');
      if (mainCanvas) {
        tCtx.clearRect(0, 0, topCanvas.width, topCanvas.height);
        tCtx.drawImage(mainCanvas, 0, 0, topCanvas.width, topCanvas.height);
      }
    }

    // Teaser avatar
    const teaserCanvas = document.getElementById('teaser-avatar-canvas');
    if (teaserCanvas) {
      const tcCtx = teaserCanvas.getContext('2d');
      const mainCanvas = document.getElementById('camerino-main-canvas');
      if (mainCanvas) {
        tcCtx.clearRect(0, 0, teaserCanvas.width, teaserCanvas.height);
        tcCtx.drawImage(mainCanvas, 0, 0, teaserCanvas.width, teaserCanvas.height);
      }
    }
  }

  function getDemoStudent(customName) {
    return {
      id: 'STU-001',
      name: customName || 'Mateo Rodríguez',
      username: 'mateo',
      avatarDriveUrl: '',
      avatarConfig: { costume: 'bard', prop: 'mask', hairStyle: 'curls', hairColor: 'brown', skin: 'fair', faceExpression: 'confident' },
      streakDays: 7
    };
  }

  // =========================================================================
  // 3. EVENTOS DE AUTENTICACIÓN
  // =========================================================================
  const formLogin = document.getElementById('form-login');
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const btnSubmit = document.getElementById('btn-login-submit');

    // Acceso instantáneo para usuarios demo locales sin requerir red
    const uLow = username.toLowerCase();
    if (uLow === 'mateo' || uLow === 'demo' || uLow === 'estudiante' || uLow === 'invitado') {
      const demoStudent = getDemoStudent(uLow === 'mateo' ? 'Mateo Rodríguez' : 'Estudiante Demo');
      demoStudent.username = uLow;
      GASClient.saveSession(demoStudent);
      showToast(`¡Bienvenido a escena, ${demoStudent.name}! 🎭`);
      showAppView(demoStudent);
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.querySelector('.btn-text').textContent = 'Validando libreto...';

    const result = await GASClient.login(username, password);

    btnSubmit.disabled = false;
    btnSubmit.querySelector('.btn-text').textContent = 'Entrar al Escenario';

    if (result.success && result.student) {
      showToast(`¡Bienvenido a escena, ${result.student.name}! 🎭`);
      showAppView(result.student);
    } else {
      showToast(result.message || 'Usuario o contraseña no encontrados.', '⚠️');
    }
  });

  // Botón Demo Rápido (Acceso Inmediato 100% garantizado)
  document.getElementById('btn-demo-mode').addEventListener('click', (e) => {
    e.preventDefault();
    const demoStudent = getDemoStudent('Mateo Rodríguez');
    GASClient.saveSession(demoStudent);
    showToast('¡Ingresando como Mateo Rodríguez (Modo Demo)! 🎭');
    showAppView(demoStudent);
  });

  // Logout
  document.getElementById('btn-logout').addEventListener('click', () => {
    GASClient.clearSession();
    showToast('Sesión de ensayo finalizada. ¡Hasta la próxima función!');
    showLoginView();
  });

  // =========================================================================
  // 4. CONTROL DE NAVEGACIÓN ENTRE PESTAÑAS (PWA BOTTOM BAR)
  // =========================================================================
  function initNavigation() {
    const navItems = document.querySelectorAll('.pwa-bottom-nav .nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetTabId = item.getAttribute('data-tab');
        switchTab(targetTabId);
      });
    });

    // Accesos rápidos
    document.getElementById('card-camerino-teaser').addEventListener('click', () => switchTab('tab-camerino'));
    document.getElementById('btn-open-camerino-action').addEventListener('click', (e) => {
      e.stopPropagation();
      switchTab('tab-camerino');
    });
    document.getElementById('btn-goto-camerino-top').addEventListener('click', () => switchTab('tab-camerino'));
    document.getElementById('card-feedback-teaser').addEventListener('click', () => switchTab('tab-feedback'));
    document.getElementById('btn-goto-feedback-tab').addEventListener('click', (e) => {
      e.stopPropagation();
      switchTab('tab-feedback');
    });
  }

  function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.pwa-bottom-nav .nav-item').forEach(btn => btn.classList.remove('active'));

    const targetPane = document.getElementById(tabId);
    if (targetPane) targetPane.classList.add('active');

    const activeNav = document.querySelector(`.pwa-bottom-nav .nav-item[data-tab="${tabId}"]`);
    if (activeNav) activeNav.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (tabId === 'tab-camerino') {
      setTimeout(() => {
        AvatarEngine.render();
      }, 50);
    }
  }

  // =========================================================================
  // 5. CAMERINO & PERSONALIZADOR DE AVATAR TEATRAL
  // =========================================================================
  function initCustomizerUI() {
    // Pestañas internas del Camerino
    const subtabs = document.querySelectorAll('.customizer-subtabs .subtab-btn');
    subtabs.forEach(btn => {
      btn.addEventListener('click', () => {
        subtabs.forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.customizer-pane').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const paneId = 'pane-' + btn.getAttribute('data-subtab');
        const pane = document.getElementById(paneId);
        if (pane) pane.classList.add('active');
      });
    });

    // Opciones de Vestuario
    document.querySelectorAll('#grid-costumes .option-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('#grid-costumes .option-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        AvatarEngine.setConfig({ costume: card.getAttribute('data-costume') });
        renderMiniAvatars();
      });
    });

    // Opciones de Accesorios (Props)
    document.querySelectorAll('#grid-props .option-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('#grid-props .option-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        AvatarEngine.setConfig({ prop: card.getAttribute('data-prop') });
        renderMiniAvatars();
      });
    });

    // Opciones de Expresión
    document.querySelectorAll('#grid-expressions .option-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('#grid-expressions .option-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        AvatarEngine.setConfig({ faceExpression: card.getAttribute('data-expression') });
        renderMiniAvatars();
      });
    });

    // Opciones de Peinado
    document.querySelectorAll('#grid-hairstyles .option-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('#grid-hairstyles .option-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        AvatarEngine.setConfig({ hairStyle: card.getAttribute('data-hairstyle') });
        renderMiniAvatars();
      });
    });

    // Swatches dinámicos para Tonos de Piel
    const skinContainer = document.getElementById('swatches-skin');
    AvatarEngine.PALETTES.skin.forEach((skin, idx) => {
      const swatch = document.createElement('div');
      swatch.className = `swatch-item ${idx === 1 ? 'active' : ''}`;
      swatch.style.backgroundColor = skin.color;
      swatch.title = skin.name;
      swatch.addEventListener('click', () => {
        skinContainer.querySelectorAll('.swatch-item').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        AvatarEngine.setConfig({ skin: skin.id });
        renderMiniAvatars();
      });
      skinContainer.appendChild(swatch);
    });

    // Swatches para Color de Cabello
    const hairContainer = document.getElementById('swatches-hair');
    AvatarEngine.PALETTES.hairColor.forEach((hair, idx) => {
      const swatch = document.createElement('div');
      swatch.className = `swatch-item ${idx === 1 ? 'active' : ''}`;
      swatch.style.backgroundColor = hair.color;
      swatch.title = hair.name;
      swatch.addEventListener('click', () => {
        hairContainer.querySelectorAll('.swatch-item').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        AvatarEngine.setConfig({ hairColor: hair.id });
        renderMiniAvatars();
      });
      hairContainer.appendChild(swatch);
    });

    // Swatches para Color del Traje
    const costumeColorContainer = document.getElementById('swatches-costume');
    AvatarEngine.PALETTES.costumeColor.forEach((col, idx) => {
      const swatch = document.createElement('div');
      swatch.className = `swatch-item ${idx === 0 ? 'active' : ''}`;
      swatch.style.backgroundColor = col.main;
      swatch.title = col.name;
      swatch.addEventListener('click', () => {
        costumeColorContainer.querySelectorAll('.swatch-item').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        AvatarEngine.setConfig({ costumeColor: col.id });
        renderMiniAvatars();
      });
      costumeColorContainer.appendChild(swatch);
    });

    // Botón Aleatorio
    document.getElementById('btn-avatar-randomize').addEventListener('click', () => {
      AvatarEngine.randomize();
      renderMiniAvatars();
      showToast('¡Nuevo vestuario aleatorio generado! 🎲');
    });

    // Guardar Avatar en Google Drive
    document.getElementById('btn-save-avatar-drive').addEventListener('click', async () => {
      if (!currentStudent) return;
      const btn = document.getElementById('btn-save-avatar-drive');
      btn.disabled = true;
      btn.querySelector('.btn-text').textContent = 'Sincronizando con Google Drive...';

      const imageBase64 = AvatarEngine.toDataURL();
      const config = AvatarEngine.getConfig();

      const result = await GASClient.saveAvatar(currentStudent.id, imageBase64, config);

      btn.disabled = false;
      btn.querySelector('.btn-text').textContent = 'Guardar en Mi Camerino Drive';

      renderMiniAvatars();
      showToast(result.message || '¡Avatar teatral guardado con éxito! ☁️🎭');
    });
  }

  // =========================================================================
  // 6. VOCABULARIO: CUOTA DE MÁXIMO 10 EXPRESIONES (Y HASTA 10 PALABRAS)
  // =========================================================================
  const MAX_EXPRESSIONS = 10;
  const MAX_WORDS_PER_EXPRESSION = 10;
  let currentExpressionsCount = 0;

  function initVocabWordCounter() {
    const inputPhrase = document.getElementById('input-phrase');
    const wordBadge = document.getElementById('word-counter-badge');
    const quotaBadge = document.getElementById('repertoire-quota-badge');
    const wordWarning = document.getElementById('word-warning');
    const quotaWarning = document.getElementById('quota-warning');
    const btnSubmit = document.getElementById('btn-save-vocab');

    function updateFormState() {
      const text = inputPhrase.value.trim();
      const words = text ? text.split(/\s+/).filter(Boolean) : [];
      const count = words.length;

      if (wordBadge) wordBadge.textContent = `${count} / ${MAX_WORDS_PER_EXPRESSION} palabras`;
      if (quotaBadge) quotaBadge.textContent = `${currentExpressionsCount} / ${MAX_EXPRESSIONS} expresiones`;

      const isQuotaFull = currentExpressionsCount >= MAX_EXPRESSIONS;
      const isWordLimitExceeded = count > MAX_WORDS_PER_EXPRESSION;

      if (isQuotaFull) {
        if (quotaWarning) quotaWarning.classList.remove('hidden');
        if (quotaBadge) {
          quotaBadge.classList.remove('valid');
          quotaBadge.classList.add('limit-exceeded');
        }
        btnSubmit.disabled = true;
        return;
      } else {
        if (quotaWarning) quotaWarning.classList.add('hidden');
        if (quotaBadge) {
          quotaBadge.classList.add('valid');
          quotaBadge.classList.remove('limit-exceeded');
        }
      }

      if (isWordLimitExceeded) {
        if (wordBadge) {
          wordBadge.classList.remove('valid');
          wordBadge.classList.add('limit-exceeded');
        }
        if (wordWarning) wordWarning.classList.remove('hidden');
        btnSubmit.disabled = true;
      } else {
        if (wordBadge) {
          wordBadge.classList.add('valid');
          wordBadge.classList.remove('limit-exceeded');
        }
        if (wordWarning) wordWarning.classList.add('hidden');
        btnSubmit.disabled = false;
      }
    }

    inputPhrase.addEventListener('input', updateFormState);

    // Guardado de frase
    const formVocab = document.getElementById('form-vocabulary');
    formVocab.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phrase = inputPhrase.value.trim();
      const trans = document.getElementById('input-translation').value.trim();

      if (!phrase) return;

      if (currentExpressionsCount >= MAX_EXPRESSIONS) {
        showToast(`Has alcanzado el límite de ${MAX_EXPRESSIONS} expresiones para hoy 🎭`, '⚠️');
        return;
      }

      const words = phrase.split(/\s+/).filter(Boolean);
      if (words.length > MAX_WORDS_PER_EXPRESSION) {
        showToast(`La expresión supera el límite de ${MAX_WORDS_PER_EXPRESSION} palabras`, '⚠️');
        return;
      }

      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Guardando en libreto...';

      const res = await GASClient.saveVocabulary(currentStudent ? currentStudent.id : 'STU-001', phrase, trans, 0);

      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<span>Guardar en Mi Guion & Ensayar</span> <span>🎙️</span>';

      if (res.success) {
        showToast('¡Expresión agregada a tu repertorio de escena! 📜');
        formVocab.reset();
        if (wordBadge) wordBadge.textContent = `0 / ${MAX_WORDS_PER_EXPRESSION} palabras`;

        // Cargar inmediatamente en el área de práctica
        setRehearsalPhrase(phrase, trans);

        // Recargar lista
        loadStudentVocabulary();
      } else {
        showToast(res.message || 'Error guardando frase', '⚠️');
      }
    });
  }

  // =========================================================================
  // 7. WEB SPEECH API: DICTADO Y RECONOCIMIENTO DE VOZ TEATRAL
  // =========================================================================
  function initSpeechRehearsal() {
    const btnListen = document.getElementById('btn-listen-phrase');
    const btnRecord = document.getElementById('btn-record-phrase');
    const btnRecordText = document.getElementById('btn-record-text');
    const feedbackPanel = document.getElementById('speech-feedback-panel');
    const transcriptEl = document.getElementById('feedback-transcript');
    const scorePill = document.getElementById('feedback-score-pill');
    const verdictEl = document.getElementById('feedback-message');

    // Botón: Escuchar Dictado Nativo (SpeechSynthesis)
    btnListen.addEventListener('click', () => {
      btnListen.classList.add('btn-primary');
      TheaterSpeech.speak(activePhrase, {
        rate: 0.85,
        onStart: () => {
          showToast(`Reproduciendo: "${activePhrase}" 🔊`);
        },
        onEnd: () => {
          btnListen.classList.remove('btn-primary');
        },
        onError: () => {
          btnListen.classList.remove('btn-primary');
          showToast('Audio completado.');
        }
      });
    });

    // Botón: Hablar y Evaluar (SpeechRecognition)
    let isCurrentlyRecording = false;

    btnRecord.addEventListener('click', () => {
      if (isCurrentlyRecording) {
        TheaterSpeech.stopListening();
        return;
      }

      if (!TheaterSpeech.isRecognitionSupported()) {
        showToast('El reconocimiento de voz no está habilitado en este navegador. Usa Chrome o Safari.', '⚠️');
        return;
      }

      feedbackPanel.classList.remove('hidden');
      transcriptEl.textContent = 'Escuchando tu proyección vocal...';
      scorePill.textContent = 'Escuchando...';
      scorePill.style.color = '#f59e0b';

      TheaterSpeech.startListening(activePhrase, {
        onStart: () => {
          isCurrentlyRecording = true;
          btnRecord.classList.add('btn-primary');
          btnRecordText.textContent = 'Detener Ensayo';
        },
        onInterim: (text) => {
          transcriptEl.textContent = `"${text}..."`;
        },
        onResult: (result) => {
          transcriptEl.textContent = `"${result.transcript}"`;
          scorePill.textContent = `${result.score}% Coincidencia`;
          scorePill.style.color = result.color;
          verdictEl.textContent = result.feedback;

          // Si superó el 75%, actualizar score de vocabulario
          if (result.score >= 70 && currentStudent) {
            GASClient.saveVocabulary(currentStudent.id, activePhrase, activeTranslation, result.score);
          }
        },
        onError: (err) => {
          isCurrentlyRecording = false;
          btnRecord.classList.remove('btn-primary');
          btnRecordText.textContent = 'Decir en Voz Alta';
          showToast(err, '🎙️');
        },
        onEnd: () => {
          isCurrentlyRecording = false;
          btnRecord.classList.remove('btn-primary');
          btnRecordText.textContent = 'Decir en Voz Alta';
        }
      });
    });
  }

  function setRehearsalPhrase(phrase, translation) {
    activePhrase = phrase;
    activeTranslation = translation || '';
    document.getElementById('current-target-phrase').textContent = phrase;
    document.getElementById('current-target-trans').textContent = activeTranslation;
  }

  // =========================================================================
  // 8. LISTADO DE VOCABULARIO
  // =========================================================================
  async function loadStudentVocabulary() {
    const studentId = currentStudent ? currentStudent.id : 'STU-001';
    const list = await GASClient.getVocabulary(studentId);
    renderVocabularyList(list);
  }

  function renderVocabularyList(list) {
    const container = document.getElementById('vocabulary-items-container');
    const badgeCount = document.getElementById('repertoire-count-badge');
    const quotaBadge = document.getElementById('repertoire-quota-badge');
    const quotaWarning = document.getElementById('quota-warning');
    const btnSubmit = document.getElementById('btn-save-vocab');
    const statVocabCount = document.getElementById('stat-vocab-count');

    currentExpressionsCount = list.length;

    if (quotaBadge) {
      quotaBadge.textContent = `${currentExpressionsCount} / ${MAX_EXPRESSIONS} expresiones`;
      if (currentExpressionsCount >= MAX_EXPRESSIONS) {
        quotaBadge.classList.remove('valid');
        quotaBadge.classList.add('limit-exceeded');
        if (quotaWarning) quotaWarning.classList.remove('hidden');
        if (btnSubmit) btnSubmit.disabled = true;
      } else {
        quotaBadge.classList.add('valid');
        quotaBadge.classList.remove('limit-exceeded');
        if (quotaWarning) quotaWarning.classList.add('hidden');
      }
    }

    if (badgeCount) badgeCount.textContent = `${list.length} / ${MAX_EXPRESSIONS} Expresiones`;
    if (statVocabCount) statVocabCount.textContent = `${list.length} / ${MAX_EXPRESSIONS}`;

    if (!container) return;
    container.innerHTML = '';

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state glass-card p-3 text-center">
          <p class="text-ash">Aún no has registrado expresiones hoy. ¡Agrega hasta 10 expresiones arriba!</p>
        </div>
      `;
      return;
    }

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'vocab-card-item glass-card';
      card.innerHTML = `
        <div class="vocab-card-left">
          <h4 class="vocab-card-phrase">${escapeHtml(item.phrase)}</h4>
          <p class="vocab-card-trans">${escapeHtml(item.translation || 'Sin nota de contexto')}</p>
          <div class="vocab-card-meta">
            <span class="word-count-chip">${item.wordCount || 3} palabras</span>
            ${item.accuracy ? `<span class="score-chip">🎯 ${item.accuracy}%</span>` : ''}
          </div>
        </div>
        <div class="vocab-card-actions">
          <button class="btn-icon-action btn-listen-item" title="Escuchar pronunciación">🔊</button>
          <button class="btn-icon-action btn-practice-item" title="Ensayar en voz alta">🎙️</button>
          <button class="btn-icon-action btn-delete-item" title="Eliminar expresión">🗑️</button>
        </div>
      `;

      // Eventos
      card.querySelector('.btn-listen-item').addEventListener('click', (e) => {
        e.stopPropagation();
        TheaterSpeech.speak(item.phrase);
      });

      card.querySelector('.btn-practice-item').addEventListener('click', (e) => {
        e.stopPropagation();
        setRehearsalPhrase(item.phrase, item.translation);
        document.getElementById('speech-practice-box').scrollIntoView({ behavior: 'smooth' });
        showToast(`Expresión cargada en el estudio: "${item.phrase}"`);
      });

      card.querySelector('.btn-delete-item').addEventListener('click', async (e) => {
        e.stopPropagation();
        const studentId = currentStudent ? currentStudent.id : 'STU-001';
        GASClient.deleteLocalVocabulary(studentId, item.entryId);
        showToast('Expresión removida del libreto 🗑️');
        loadStudentVocabulary();
      });

      card.addEventListener('click', () => {
        setRehearsalPhrase(item.phrase, item.translation);
        document.getElementById('speech-practice-box').scrollIntoView({ behavior: 'smooth' });
      });

      container.appendChild(card);
    });
  }

  // =========================================================================
  // 9. FEEDBACK: "DOS ESTRELLAS Y UN DESEO"
  // =========================================================================
  const formFeedback = document.getElementById('form-feedback');
  if (formFeedback) {
    formFeedback.addEventListener('submit', async (e) => {
      e.preventDefault();
      const star1 = document.getElementById('feedback-star-1').value.trim();
      const star2 = document.getElementById('feedback-star-2').value.trim();
      const wish = document.getElementById('feedback-wish').value.trim();
      const btnSubmit = document.getElementById('btn-submit-feedback');

      if (!star1 || !star2 || !wish) {
        showToast('Por favor completa las dos estrellas y el deseo.', '⭐');
        return;
      }

      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Enviando reflexión al libro de escena...';

      const result = await GASClient.saveFeedback(
        currentStudent ? currentStudent.id : 'STU-001',
        star1,
        star2,
        wish
      );

      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<span>Registrar en el Libro de Escena</span> <span>✨</span>';

      if (result.success) {
        showToast('¡Tus dos estrellas y tu deseo han sido guardados! 🌟✨');
        formFeedback.reset();
        // Volver al escenario
        setTimeout(() => switchTab('tab-home'), 1200);
      } else {
        showToast(result.message || 'Error guardando feedback', '⚠️');
      }
    });
  }

  // =========================================================================
  // 10. MODAL DE CONFIGURACIÓN DE GOOGLE APPS SCRIPT
  // =========================================================================
  function initGasModal() {
    const modal = document.getElementById('modal-gas-config');
    const inputUrl = document.getElementById('input-gas-url');
    const statusMsg = document.getElementById('gas-status-msg');
    const statusDot = document.getElementById('gas-status-dot');

    function openModal() {
      inputUrl.value = GASClient.getApiUrl();
      modal.classList.remove('hidden');
    }

    function closeModal() {
      modal.classList.add('hidden');
    }

    document.getElementById('btn-open-gas-settings').addEventListener('click', openModal);
    document.getElementById('btn-topbar-settings').addEventListener('click', openModal);
    document.getElementById('btn-close-gas-modal').addEventListener('click', closeModal);
    document.getElementById('modal-gas-backdrop').addEventListener('click', closeModal);

    document.getElementById('btn-save-gas-url').addEventListener('click', () => {
      const url = inputUrl.value.trim();
      GASClient.setApiUrl(url);
      showToast('URL del Webhook guardada exitosamente ⚙️');
      closeModal();
    });

    document.getElementById('btn-test-gas-connection').addEventListener('click', async () => {
      const testUrl = inputUrl.value.trim();
      if (!testUrl) {
        statusMsg.textContent = 'Ingresa una URL antes de probar.';
        statusDot.className = 'status-dot error';
        return;
      }

      statusMsg.textContent = 'Probando conexión con Google Apps Script...';
      statusDot.className = 'status-dot';

      try {
        const response = await fetch(`${testUrl}?action=ping`);
        const json = await response.json();
        if (json.status === 'ok') {
          statusMsg.textContent = '¡Conexión exitosa con Google Apps Script!';
          statusDot.className = 'status-dot online';
        } else {
          statusMsg.textContent = 'Respuesta inesperada del Webhook.';
          statusDot.className = 'status-dot error';
        }
      } catch (err) {
        statusMsg.textContent = 'No se pudo conectar. Verifica permisos en el despliegue de Apps Script.';
        statusDot.className = 'status-dot error';
      }
    });
  }

  // =========================================================================
  // UTILIDADES
  // =========================================================================
  function showToast(message, icon = '✨') {
    const toast = document.getElementById('toast-notification');
    const iconEl = document.getElementById('toast-icon');
    const msgEl = document.getElementById('toast-message');

    if (!toast) return;

    iconEl.textContent = icon;
    msgEl.textContent = message;

    toast.classList.remove('hidden');

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.add('hidden');
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
