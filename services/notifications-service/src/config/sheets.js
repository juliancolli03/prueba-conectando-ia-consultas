import { google } from 'googleapis';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined
});

let sheetsClient = null;
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '1JikD0WKSTexwofRdtBgjaxPXlqExTPzz-JhBeZeBNVs';

// Mapeo de categorías a nombres de hojas
const CATEGORY_TO_SHEET = {
  'consulta': 'Consulta',
  'reclamo': 'Reclamo',
  'cotizacion': 'Cotización',
  'otros': 'Otros'
};

/**
 * Inicializa el cliente de Google Sheets
 */
export const initializeSheetsService = () => {
  const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || 
    process.env.GOOGLE_CREDENTIALS_PATH ||
    path.join(__dirname, '../../credentials/service-account.json');

  if (!fs.existsSync(serviceAccountPath)) {
    logger.warn(`Google Sheets Service Account file not found at: ${serviceAccountPath}`);
    logger.warn('Google Sheets integration will be disabled. Set GOOGLE_SERVICE_ACCOUNT_PATH or place credentials/service-account.json');
    return;
  }

  try {
    const credentials = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    sheetsClient = google.sheets({ version: 'v4', auth });
    logger.info('Google Sheets service initialized successfully');
    
    // Verificar y crear hojas si no existen
    verifyAndCreateSheets().catch(err => {
      logger.error({ error: err.message }, 'Error verifying sheets on initialization');
    });

    return true;
  } catch (error) {
    logger.error({ error: error.message, path: serviceAccountPath }, 'Failed to initialize Google Sheets service');
    return false;
  }
};

/**
 * Verifica que existan las 4 hojas y las crea si faltan
 */
const verifyAndCreateSheets = async () => {
  if (!sheetsClient) return;

  try {
    const response = await sheetsClient.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID
    });

    const existingSheets = response.data.sheets.map(sheet => sheet.properties.title);
    const requiredSheets = Object.values(CATEGORY_TO_SHEET);
    const missingSheets = requiredSheets.filter(sheet => !existingSheets.includes(sheet));

    if (missingSheets.length === 0) {
      logger.info('All required sheets exist');
      return;
    }

    logger.info({ missingSheets }, 'Creating missing sheets');

    // Crear hojas faltantes
    const requests = missingSheets.map(sheetName => ({
      addSheet: {
        properties: {
          title: sheetName
        }
      }
    }));

    await sheetsClient.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests }
    });

    // Agregar encabezados a las hojas nuevas
    for (const sheetName of missingSheets) {
      await addHeaders(sheetName);
    }

    logger.info('Missing sheets created successfully');
  } catch (error) {
    logger.error({ error: error.message }, 'Error verifying/creating sheets');
    throw error;
  }
};

/**
 * Agrega encabezados a una hoja si está vacía
 */
const addHeaders = async (sheetName) => {
  if (!sheetsClient) return;

  try {
    // Verificar si la hoja tiene contenido
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:H1`
    });

    // Si ya tiene contenido, no agregar encabezados
    if (response.data.values && response.data.values.length > 0) {
      return;
    }

    // Agregar encabezados
    await sheetsClient.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:H1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          'Fecha',
          'Nombre',
          'Email',
          'Teléfono',
          'Mensaje',
          'Categoría',
          'Tag',
          'Fuente'
        ]]
      }
    });

    logger.info({ sheetName }, 'Headers added to sheet');
  } catch (error) {
    logger.error({ error: error.message, sheetName }, 'Error adding headers');
  }
};

/**
 * Guarda un lead en la hoja correspondiente según su categoría
 */
export const saveLeadToSheet = async (lead) => {
  if (!sheetsClient) {
    logger.warn('Google Sheets service not initialized, skipping sheet save');
    return { success: false, error: 'Service not initialized' };
  }

  const category = lead.category || 'consulta';
  const sheetName = CATEGORY_TO_SHEET[category] || CATEGORY_TO_SHEET['consulta'];

  try {
    // Verificar que la hoja existe (y crearla si falta)
    await verifyAndCreateSheets();

    // Preparar los datos a insertar
    const row = [
      new Date(lead.createdAt || new Date()).toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        dateStyle: 'short',
        timeStyle: 'short'
      }),
      lead.name || '',
      lead.email || '',
      lead.phone || '',
      lead.message || '',
      category,
      lead.categoryTag || '',
      lead.source || 'web'
    ];

    // Agregar la fila al final de la hoja
    await sheetsClient.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:H`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [row]
      }
    });

    logger.info({ sheetName, email: lead.email, category }, 'Lead saved to Google Sheet');
    return { success: true, sheetName };
  } catch (error) {
    logger.error({ 
      error: error.message, 
      category, 
      sheetName,
      email: lead.email 
    }, 'Failed to save lead to Google Sheet');
    return { success: false, error: error.message };
  }
};
