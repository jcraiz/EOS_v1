/**
 * =========================================================================
 * GOOGLE APPS SCRIPT CLIENT - COMUNICACIÓN CON WEBHOOK / REST API
 * =========================================================================
 * Administra la sincronización con Google Sheets y Google Drive,
 * incluyendo persistencia offline en localStorage y modo demostración.
 */

const GASClient = (function () {
  const STORAGE_KEY_URL = 'iee_gas_api_url';
  const STORAGE_KEY_STUDENT = 'iee_current_student';
  const STORAGE_KEY_VOCAB = 'iee_local_vocabulary';
  const STORAGE_KEY_FEEDBACK = 'iee_local_feedback';

  // Obtener URL configurada por el usuario o profesor
  function getApiUrl() {
    return localStorage.getItem(STORAGE_KEY_URL) || '';
  }

  function setApiUrl(url) {
    if (url) {
      localStorage.setItem(STORAGE_KEY_URL, url.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_URL);
    }
  }

  // =========================================================================
  // GESTIÓN DE SESIÓN LOCAL
  // =========================================================================
  function getSession() {
    const raw = localStorage.getItem(STORAGE_KEY_STUDENT);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveSession(studentData) {
    localStorage.setItem(STORAGE_KEY_STUDENT, JSON.stringify(studentData));
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY_STUDENT);
  }

  // =========================================================================
  // LLAMADAS HTTP CON MANEJO DE CORS Y FALLBACK
  // =========================================================================
  async function postRequest(payload) {
    const apiUrl = getApiUrl();
    if (!apiUrl) {
      // Si no hay URL configurada, operar en modo simulación local
      return simulateOfflinePost(payload);
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8' // Compatible con CORS de Google Apps Script
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const json = await response.json();
      return json;
    } catch (err) {
      console.warn('Fallo en conexión remota con Google Apps Script. Operando en modo local:', err);
      return simulateOfflinePost(payload, true);
    }
  }

  async function getRequest(params = {}) {
    const apiUrl = getApiUrl();
    if (!apiUrl) {
      return simulateOfflineGet(params);
    }

    try {
      const query = new URLSearchParams(params).toString();
      const response = await fetch(`${apiUrl}?${query}`, {
        method: 'GET'
      });
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.warn('Fallo GET con Google Apps Script. Usando caché local:', err);
      return simulateOfflineGet(params);
    }
  }

  // =========================================================================
  // MÉTODOS PÚBLICOS
  // =========================================================================

  /**
   * 1. Iniciar Sesión de Alumno
   */
  async function login(username, password) {
    const res = await postRequest({
      action: 'login',
      username: username,
      password: password
    });

    if (res.success && res.student) {
      saveSession(res.student);
    }
    return res;
  }

  /**
   * 2. Guardar Avatar en Drive y actualizar Sheet
   */
  async function saveAvatar(studentId, imageBase64, avatarConfig) {
    const current = getSession();
    if (current) {
      current.avatarConfig = avatarConfig;
      saveSession(current);
    }

    const res = await postRequest({
      action: 'save_avatar',
      student_id: studentId,
      imageBase64: imageBase64,
      avatarConfig: avatarConfig
    });

    if (res.success && res.avatarDriveUrl && current) {
      current.avatarDriveUrl = res.avatarDriveUrl;
      saveSession(current);
    }
    return res;
  }

  /**
   * 3. Guardar frase en Google Sheets (con validación de máx 10 expresiones y 10 palabras)
   */
  async function saveVocabulary(studentId, phrase, translation, accuracy) {
    const words = (phrase || '').trim().split(/\s+/).filter(Boolean);
    if (words.length > 10) {
      return {
        success: false,
        message: 'La expresión no puede superar 10 palabras para mantener agilidad escénica.'
      };
    }

    const currentList = getLocalVocabulary(studentId);
    // Si la frase ya existe (por ejemplo al actualizar puntaje de pronunciación), actualizarla en vez de duplicar
    const existingIndex = currentList.findIndex(item => item.phrase.toLowerCase() === phrase.trim().toLowerCase());

    if (existingIndex === -1 && currentList.length >= 10) {
      return {
        success: false,
        message: 'Has alcanzado el límite máximo de 10 expresiones registradas.'
      };
    }

    // Guardar en caché local inmediatamente
    saveLocalVocabulary({
      entryId: 'VOC-' + Date.now(),
      studentId: studentId,
      phrase: phrase.trim(),
      wordCount: words.length,
      translation: translation ? translation.trim() : '',
      accuracy: accuracy || 0,
      timestamp: new Date().toISOString()
    });

    return await postRequest({
      action: 'save_vocabulary',
      student_id: studentId,
      phrase: phrase.trim(),
      translation: translation,
      accuracy: accuracy
    });
  }

  /**
   * 4. Obtener frases registradas del alumno
   */
  async function getVocabulary(studentId) {
    const res = await getRequest({
      action: 'get_vocabulary',
      student_id: studentId
    });

    if (res.success && Array.isArray(res.vocabulary) && res.vocabulary.length > 0) {
      // Sincronizar con el almacenamiento local
      localStorage.setItem(STORAGE_KEY_VOCAB + '_' + studentId, JSON.stringify(res.vocabulary));
      return res.vocabulary;
    }

    // Si falló o está offline, devolver del almacenamiento local
    return getLocalVocabulary(studentId);
  }

  /**
   * 5. Guardar Feedback "Dos estrellas y un deseo"
   */
  async function saveFeedback(studentId, star1, star2, wish) {
    // Guardar en local
    const feedbackList = JSON.parse(localStorage.getItem(STORAGE_KEY_FEEDBACK) || '[]');
    feedbackList.push({
      studentId,
      star1,
      star2,
      wish,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEY_FEEDBACK, JSON.stringify(feedbackList));

    return await postRequest({
      action: 'save_feedback',
      student_id: studentId,
      star1: star1,
      star2: star2,
      wish: wish
    });
  }

  // =========================================================================
  // SIMULACIÓN OFFLINE / DEMO COMPLETA
  // =========================================================================
  function simulateOfflinePost(payload, isFallback = false) {
    const action = payload.action;

    if (action === 'login') {
      // Cuenta demo siempre habilitada para pruebas rápidas
      const u = (payload.username || '').toLowerCase().trim();
      const p = (payload.password || '').trim();

      if ((u === 'demo' && p === 'demo123') || (u === 'mateo' && p === 'teatro123') || (u && p.length >= 3)) {
        const student = {
          id: 'STU-001',
          name: u === 'mateo' ? 'Mateo Rodríguez' : 'Estudiante Escénico',
          username: u,
          avatarDriveUrl: '',
          avatarConfig: { costume: 'bard', prop: 'mask', hairStyle: 'curls', hairColor: 'brown', skin: 'fair' },
          streakDays: 7
        };
        return { success: true, student, offline: isFallback };
      }
      return { success: false, message: 'Usuario o contraseña no válidos.' };
    }

    if (action === 'save_avatar') {
      return {
        success: true,
        message: 'Avatar guardado en memoria local' + (isFallback ? ' (sincronizará al haber red)' : ''),
        avatarDriveUrl: payload.imageBase64 || ''
      };
    }

    if (action === 'save_vocabulary') {
      return {
        success: true,
        message: 'Frase registrada exitosamente',
        entryId: 'VOC-LOCAL-' + Date.now()
      };
    }

    if (action === 'save_feedback') {
      return {
        success: true,
        message: '¡Tus dos estrellas y un deseo han sido registrados!'
      };
    }

    return { success: true, offline: true };
  }

  function simulateOfflineGet(params) {
    const action = params.action;
    if (action === 'get_vocabulary') {
      const studentId = params.student_id;
      return { success: true, vocabulary: getLocalVocabulary(studentId) };
    }
    return { success: true };
  }

  function getLocalVocabulary(studentId) {
    const raw = localStorage.getItem(STORAGE_KEY_VOCAB + '_' + studentId);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {}
    }

    // Frases teatrales de ejemplo por defecto para enriquecer la experiencia inicial
    return [
      {
        entryId: 'VOC-INIT-01',
        phrase: 'Break a leg',
        translation: '¡Mucho éxito en escena!',
        wordCount: 3,
        accuracy: 96,
        sessionDate: '2026-10-16'
      },
      {
        entryId: 'VOC-INIT-02',
        phrase: 'Take a bow',
        translation: 'Agradece con una reverencia',
        wordCount: 3,
        accuracy: 92,
        sessionDate: '2026-10-16'
      },
      {
        entryId: 'VOC-INIT-03',
        phrase: 'Steal the show',
        translation: 'Brillar en el escenario',
        wordCount: 3,
        accuracy: 88,
        sessionDate: '2026-10-15'
      }
    ];
  }

  function saveLocalVocabulary(entry) {
    const studentId = entry.studentId;
    const currentList = getLocalVocabulary(studentId);
    // Evitar duplicados por nombre de frase
    const filtered = currentList.filter(item => item.phrase.toLowerCase() !== entry.phrase.toLowerCase());
    filtered.unshift(entry);
    // Limitar estrictamente a las 10 expresiones más recientes
    const trimmed = filtered.slice(0, 10);
    localStorage.setItem(STORAGE_KEY_VOCAB + '_' + studentId, JSON.stringify(trimmed));
  }

  function deleteLocalVocabulary(studentId, entryId) {
    const currentList = getLocalVocabulary(studentId);
    const updated = currentList.filter(item => item.entryId !== entryId);
    localStorage.setItem(STORAGE_KEY_VOCAB + '_' + studentId, JSON.stringify(updated));
    return updated;
  }

  return {
    getApiUrl,
    setApiUrl,
    getSession,
    saveSession,
    clearSession,
    login,
    saveAvatar,
    saveVocabulary,
    getVocabulary,
    deleteLocalVocabulary,
    saveFeedback
  };
})();
