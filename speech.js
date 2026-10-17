/**
 * =========================================================================
 * WEB SPEECH API MODULE - DICTADO Y RECONOCIMIENTO DE VOZ TEATRAL
 * =========================================================================
 * 100% Nativo, gratuito, sin dependencias externas ni API keys de pago.
 */

const TheaterSpeech = (function () {
  const synth = window.speechSynthesis;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  let activeRecognition = null;
  let isListening = false;
  let selectedVoice = null;

  // Cargar voces disponibles en el navegador
  function loadVoices(callback) {
    if (!synth) {
      if (callback) callback([]);
      return;
    }

    let voices = synth.getVoices();
    if (voices.length > 0) {
      pickBestEnglishVoice(voices);
      if (callback) callback(voices);
    } else {
      synth.onvoiceschanged = () => {
        voices = synth.getVoices();
        pickBestEnglishVoice(voices);
        if (callback) callback(voices);
      };
    }
  }

  function pickBestEnglishVoice(voices) {
    // Buscar preferiblemente voces teatrales/naturales en inglés
    const preferred = voices.find(v => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('George')) && v.lang.startsWith('en'))
      || voices.find(v => v.lang.startsWith('en-GB') || v.lang.startsWith('en-US'))
      || voices[0];
    selectedVoice = preferred;
  }

  // =========================================================================
  // 1. DICTADO / REPRODUCCIÓN DE AUDIO (SpeechSynthesis)
  // =========================================================================
  function speak(text, options = {}) {
    if (!synth) {
      console.warn('SpeechSynthesis no es soportado en este navegador.');
      if (options.onError) options.onError('No soportado');
      return;
    }

    // Cancelar cualquier audio en reproducción previa
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang || 'en-US';
    utterance.rate = options.rate || 0.9; // Velocidad ligeramente pausada para entrenamiento
    utterance.pitch = options.pitch || 1.0;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      if (options.onStart) options.onStart();
    };

    utterance.onend = () => {
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = (e) => {
      if (options.onError) options.onError(e);
    };

    synth.speak(utterance);
  }

  function stopSpeaking() {
    if (synth) synth.cancel();
  }

  // =========================================================================
  // 2. RECONOCIMIENTO DE VOZ Y EVALUACIÓN FONÉTICA (SpeechRecognition)
  // =========================================================================
  function isRecognitionSupported() {
    return Boolean(SpeechRecognition);
  }

  function startListening(targetPhrase, callbacks = {}) {
    if (!isRecognitionSupported()) {
      if (callbacks.onError) {
        callbacks.onError('El reconocimiento de voz no está soportado en este navegador. Utiliza Google Chrome o Safari en tu móvil.');
      }
      return;
    }

    if (isListening) {
      stopListening();
    }

    try {
      activeRecognition = new SpeechRecognition();
      activeRecognition.lang = 'en-US';
      activeRecognition.interimResults = true;
      activeRecognition.maxAlternatives = 1;
      activeRecognition.continuous = false;

      activeRecognition.onstart = () => {
        isListening = true;
        if (callbacks.onStart) callbacks.onStart();
      };

      activeRecognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentText = (finalTranscript || interimTranscript).trim();
        if (callbacks.onInterim) {
          callbacks.onInterim(currentText);
        }

        if (finalTranscript) {
          const scoreData = evaluateAccuracy(targetPhrase, finalTranscript);
          if (callbacks.onResult) {
            callbacks.onResult({
              transcript: finalTranscript,
              target: targetPhrase,
              score: scoreData.score,
              feedback: scoreData.feedback,
              color: scoreData.color
            });
          }
        }
      };

      activeRecognition.onerror = (event) => {
        isListening = false;
        let msg = 'Error al capturar voz.';
        if (event.error === 'not-allowed') {
          msg = 'Permiso de micrófono denegado. Permite el acceso al micrófono en los ajustes de tu navegador.';
        } else if (event.error === 'no-speech') {
          msg = 'No se detectó sonido vocal. ¡Habla claro hacia el micrófono!';
        }
        if (callbacks.onError) callbacks.onError(msg);
      };

      activeRecognition.onend = () => {
        isListening = false;
        if (callbacks.onEnd) callbacks.onEnd();
      };

      activeRecognition.start();
    } catch (err) {
      isListening = false;
      if (callbacks.onError) callbacks.onError(err.message || 'Error iniciando reconocimiento.');
    }
  }

  function stopListening() {
    if (activeRecognition && isListening) {
      activeRecognition.stop();
      isListening = false;
    }
  }

  // =========================================================================
  // 3. ALGORITMO DE SIMILITUD Y RETROALIMENTACIÓN TEATRAL
  // =========================================================================
  function clean(str) {
    return (str || '')
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"¡¿!]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function levenshtein(a, b) {
    const an = a ? a.length : 0;
    const bn = b ? b.length : 0;
    if (an === 0) return bn;
    if (bn === 0) return an;
    const matrix = [];
    for (let i = 0; i <= bn; ++i) matrix[i] = [i];
    for (let i = 0; i <= an; ++i) matrix[0][i] = i;
    for (let i = 1; i <= bn; ++i) {
      for (let j = 1; j <= an; ++j) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // sustitución
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
          );
        }
      }
    }
    return matrix[bn][an];
  }

  function evaluateAccuracy(target, spoken) {
    const targetClean = clean(target);
    const spokenClean = clean(spoken);

    if (!targetClean || !spokenClean) {
      return { score: 0, feedback: 'Sin datos para evaluar', color: '#ffb4ab' };
    }

    if (targetClean === spokenClean) {
      return {
        score: 100,
        feedback: '¡Bravo! ¡Pronunciación y dicción de actor principal!',
        color: '#4ade80'
      };
    }

    // Coincidencia por palabras
    const targetWords = targetClean.split(' ');
    const spokenWords = spokenClean.split(' ');

    let exactWordMatches = 0;
    targetWords.forEach(tw => {
      if (spokenWords.includes(tw)) exactWordMatches++;
    });
    const wordScore = (exactWordMatches / targetWords.length) * 100;

    // Distancia de Levenshtein
    const maxLen = Math.max(targetClean.length, spokenClean.length);
    const dist = levenshtein(targetClean, spokenClean);
    const charScore = Math.max(0, Math.round(((maxLen - dist) / maxLen) * 100));

    // Ponderación (60% palabras, 40% caracteres)
    const finalScore = Math.round((wordScore * 0.6) + (charScore * 0.4));

    let feedback = '';
    let color = '';

    if (finalScore >= 90) {
      feedback = '¡Excelente dicción teatral! Proyección impecable.';
      color = '#4ade80';
    } else if (finalScore >= 75) {
      feedback = '¡Muy buena articulación escénica! Sigue así.';
      color = '#fde68a';
    } else if (finalScore >= 50) {
      feedback = '¡Buen intento! Escucha la pronunciación y repite con más volumen.';
      color = '#fbbf24';
    } else {
      feedback = 'Ensayemos de nuevo: vocaliza pausadamente cada consonante.';
      color = '#f87171';
    }

    return {
      score: finalScore,
      feedback: feedback,
      color: color
    };
  }

  // Inicializar voces
  loadVoices();

  return {
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    isRecognitionSupported,
    evaluateAccuracy,
    loadVoices
  };
})();
