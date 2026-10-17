/**
 * =========================================================================
 * INGLÉS EN ESCENA - WEB API BACKEND (Google Apps Script)
 * =========================================================================
 * 
 * Instrucciones de Configuración:
 * 1. Abre tu hoja de Google Sheets (crea las 4 pestañas: 'Usuarios', 'Vocabulario', 'Feedback', 'Configuracion').
 * 2. Ve a Extensiones > Apps Script.
 * 3. Reemplaza el código existente con este contenido completo.
 * 4. Crea una carpeta en Google Drive para los avatares y pega su ID en la pestaña 'Configuracion' (fila con clave 'DRIVE_AVATAR_FOLDER_ID').
 * 5. Haz clic en "Implementar" (Deploy) > "Nueva implementación" (New deployment).
 * 6. Selecciona tipo: "Aplicación web" (Web app).
 * 7. Configuración crítica:
 *    - Ejecutar como: "Yo" (tu cuenta de Google)
 *    - Quién tiene acceso: "Cualquier usuario" (Anyone)
 * 8. Copia la URL de la aplicación web generada (termina en /exec) y pégala en la app cliente PWA.
 */

// Nombres de las hojas en Google Spreadsheet
const SHEETS = {
  USERS: 'Usuarios',
  VOCABULARY: 'Vocabulario',
  FEEDBACK: 'Feedback',
  CONFIG: 'Configuracion'
};

/**
 * Manejador de peticiones GET
 */
function doGet(e) {
  try {
    const params = e.parameter || {};
    const action = params.action || 'ping';

    switch (action) {
      case 'ping':
        return buildJsonResponse({ status: 'ok', message: 'Inglés en Escena API en línea', timestamp: new Date() });

      case 'get_vocabulary':
        return handleGetVocabulary(params.student_id);

      case 'get_student_profile':
        return handleGetStudentProfile(params.student_id);

      default:
        return buildJsonResponse({ error: 'Acción GET no reconocida' }, 400);
    }
  } catch (error) {
    return buildJsonResponse({ error: error.toString() }, 500);
  }
}

/**
 * Manejador de peticiones POST
 */
function doPost(e) {
  try {
    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter || {};
    }

    const action = data.action;

    switch (action) {
      case 'login':
        return handleLogin(data.username, data.password);

      case 'save_avatar':
        return handleSaveAvatar(data.student_id, data.imageBase64, data.avatarConfig);

      case 'save_vocabulary':
        return handleSaveVocabulary(data.student_id, data.phrase, data.translation, data.accuracy);

      case 'save_feedback':
        return handleSaveFeedback(data.student_id, data.star1, data.star2, data.wish);

      default:
        return buildJsonResponse({ error: 'Acción POST no reconocida' }, 400);
    }
  } catch (error) {
    return buildJsonResponse({ error: error.toString() }, 500);
  }
}

// =========================================================================
// CONTROLADORES DE LÓGICA DE NEGOCIO
// =========================================================================

/**
 * 1. Autenticación de Estudiante contra la pestaña 'Usuarios'
 */
function handleLogin(username, password) {
  if (!username || !password) {
    return buildJsonResponse({ success: false, message: 'Faltan credenciales' });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.USERS);
  if (!sheet) return buildJsonResponse({ success: false, message: 'Hoja de Usuarios no encontrada' });

  const data = sheet.getDataRange().getValues();
  // Asumiendo fila 1 encabezados:
  // Col A: student_id, Col B: nombre, Col C: username, Col D: password, Col E: avatar_drive_id, Col F: avatar_drive_url, Col G: avatar_config_json, Col H: racha
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowUser = String(row[2]).trim();
    const rowPass = String(row[3]).trim();

    if (rowUser.toLowerCase() === String(username).trim().toLowerCase() && rowPass === String(password).trim()) {
      let avatarConfig = {};
      try {
        if (row[6]) avatarConfig = JSON.parse(row[6]);
      } catch (err) {}

      return buildJsonResponse({
        success: true,
        student: {
          id: row[0],
          name: row[1],
          username: row[2],
          avatarDriveUrl: row[5] || '',
          avatarConfig: avatarConfig,
          streakDays: row[7] || 0
        }
      });
    }
  }

  return buildJsonResponse({ success: false, message: 'Usuario o contraseña incorrectos' });
}

/**
 * 2. Guardar Avatar en Google Drive y actualizar Sheet
 */
function handleSaveAvatar(studentId, imageBase64, avatarConfig) {
  if (!studentId) {
    return buildJsonResponse({ success: false, message: 'student_id es requerido' });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName(SHEETS.USERS);
  const folderId = getConfigValue('DRIVE_AVATAR_FOLDER_ID');

  let fileUrl = '';
  let fileId = '';

  // Guardar imagen en Drive si se provee base64
  if (imageBase64 && folderId) {
    try {
      const folder = DriveApp.getFolderById(folderId);
      const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
      const decodedBytes = Utilities.base64Decode(cleanBase64);
      const blob = Utilities.newBlob(decodedBytes, 'image/png', 'avatar_' + studentId + '.png');
      
      // Buscar si ya existía un archivo previo para sobrescribirlo o borrarlo
      const existingFiles = folder.getFilesByName('avatar_' + studentId + '.png');
      while (existingFiles.hasNext()) {
        existingFiles.next().setTrashed(true);
      }

      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      fileId = file.getId();
      fileUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w600';
    } catch (e) {
      Logger.log('Error guardando en Drive: ' + e);
    }
  }

  // Actualizar datos en la hoja de usuarios
  const data = usersSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(studentId).trim()) {
      const rowIndex = i + 1;
      if (fileId) usersSheet.getRange(rowIndex, 5).setValue(fileId);
      if (fileUrl) usersSheet.getRange(rowIndex, 6).setValue(fileUrl);
      if (avatarConfig) usersSheet.getRange(rowIndex, 7).setValue(JSON.stringify(avatarConfig));
      break;
    }
  }

  return buildJsonResponse({
    success: true,
    message: 'Avatar guardado exitosamente',
    avatarDriveUrl: fileUrl
  });
}

/**
 * 3. Guardar Vocabulario con validación de máx. 10 expresiones y hasta 10 palabras
 */
function handleSaveVocabulary(studentId, phrase, translation, accuracy) {
  if (!studentId || !phrase) {
    return buildJsonResponse({ success: false, message: 'Faltan parámetros obligatorios' });
  }

  const cleanPhrase = String(phrase).trim();
  const words = cleanPhrase.split(/\s+/).filter(Boolean);

  if (words.length > 10) {
    return buildJsonResponse({
      success: false,
      message: 'La expresión no puede superar las 10 palabras para mantener la agilidad escénica.'
    });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.VOCABULARY);
  const data = sheet.getDataRange().getValues();

  // Contar expresiones previas de este estudiante
  let studentCount = 0;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][2]).trim() === String(studentId).trim()) {
      studentCount++;
    }
  }

  if (studentCount >= 10) {
    return buildJsonResponse({
      success: false,
      message: 'Has alcanzado el límite de 10 expresiones para este ensayo.'
    });
  }

  const entryId = 'VOC-' + Utilities.formatDate(new Date(), 'GMT-5', 'yyyyMMdd-HHmmss');
  const now = new Date();
  const todayStr = Utilities.formatDate(now, 'GMT-5', 'yyyy-MM-dd');

  sheet.appendRow([
    entryId,
    now,
    studentId,
    cleanPhrase,
    words.length,
    translation || '',
    accuracy || 0,
    todayStr
  ]);

  return buildJsonResponse({
    success: true,
    entryId: entryId,
    message: 'Expresión registrada correctamente'
  });
}

/**
 * 4. Obtener Vocabulario previo de un estudiante
 */
function handleGetVocabulary(studentId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.VOCABULARY);
  if (!sheet) return buildJsonResponse({ vocabulary: [] });

  const data = sheet.getDataRange().getValues();
  const items = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!studentId || String(row[2]).trim() === String(studentId).trim()) {
      items.push({
        entryId: row[0],
        timestamp: row[1],
        studentId: row[2],
        phrase: row[3],
        wordCount: row[4],
        translation: row[5],
        accuracy: row[6],
        sessionDate: row[7]
      });
    }
  }

  return buildJsonResponse({ success: true, vocabulary: items.reverse() });
}

/**
 * 5. Guardar Feedback ("Dos estrellas y un deseo")
 */
function handleSaveFeedback(studentId, star1, star2, wish) {
  if (!studentId || !star1 || !star2 || !wish) {
    return buildJsonResponse({
      success: false,
      message: 'Debes completar las dos estrellas y el deseo para enviar tu feedback.'
    });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.FEEDBACK);
  const feedbackId = 'FDB-' + Utilities.formatDate(new Date(), 'GMT-5', 'yyyyMMdd-HHmmss');
  const now = new Date();
  const todayStr = Utilities.formatDate(now, 'GMT-5', 'yyyy-MM-dd');

  sheet.appendRow([
    feedbackId,
    now,
    studentId,
    String(star1).trim(),
    String(star2).trim(),
    String(wish).trim(),
    todayStr
  ]);

  return buildJsonResponse({
    success: true,
    feedbackId: feedbackId,
    message: '¡Tus dos estrellas y tu deseo han sido guardados en el libro de escena!'
  });
}

/**
 * 6. Obtener Perfil del Estudiante
 */
function handleGetStudentProfile(studentId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.USERS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[0]).trim() === String(studentId).trim()) {
      let avatarConfig = {};
      try {
        if (row[6]) avatarConfig = JSON.parse(row[6]);
      } catch (e) {}

      return buildJsonResponse({
        success: true,
        student: {
          id: row[0],
          name: row[1],
          username: row[2],
          avatarDriveUrl: row[5] || '',
          avatarConfig: avatarConfig,
          streakDays: row[7] || 0
        }
      });
    }
  }

  return buildJsonResponse({ success: false, message: 'Estudiante no encontrado' }, 404);
}

// =========================================================================
// UTILIDADES
// =========================================================================

function getConfigValue(key) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.CONFIG);
  if (!sheet) return '';
  const data = sheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim() === key) {
      return String(data[i][1]).trim();
    }
  }
  return '';
}

function buildJsonResponse(obj, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
