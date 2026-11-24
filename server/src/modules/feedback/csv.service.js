import { parse } from 'csv-parse';
import { Feedback } from './feedback.model.js';
import { FEEDBACK_SOURCE_LIST, FEEDBACK_SOURCES } from 'loop-shared';

const normalizeHeader = (key) => {
  return key.trim().toLowerCase().replace(/[\s_-]+/g, '');
};

const mapRowFields = (rawRow) => {
  const normalized = {};
  for (const [key, value] of Object.entries(rawRow)) {
    const normKey = normalizeHeader(key);
    normalized[normKey] = typeof value === 'string' ? value.trim() : value;
  }

  const customerName = normalized.customername || normalized.name || normalized.author || normalized.user || '';
  const customerEmail = normalized.customeremail || normalized.email || '';
  const message = normalized.message || normalized.feedback || normalized.comment || normalized.text || normalized.review || '';
  let source = (normalized.source || normalized.channel || '').toUpperCase().replace(/[\s-]+/g, '_');
  const receivedAtStr = normalized.receivedat || normalized.date || normalized.createdat || normalized.timestamp || '';

  if (!source || !FEEDBACK_SOURCE_LIST.includes(source)) {
    source = FEEDBACK_SOURCES.OTHER;
  }

  let receivedAt = new Date();
  if (receivedAtStr) {
    const parsedDate = new Date(receivedAtStr);
    if (!isNaN(parsedDate.getTime())) {
      receivedAt = parsedDate;
    }
  }

  return {
    customerName,
    customerEmail,
    message,
    source,
    receivedAt
  };
};

export const parseAndImportCsv = async (fileBuffer, workspaceId, userId = null) => {
  return new Promise((resolve, reject) => {
    const validDocuments = [];
    const rejected = [];
    let currentRowIndex = 1; // 1-based data row (row 1 after header)

    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true
    });

    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        currentRowIndex++;
        const rowNumber = currentRowIndex;
        const mapped = mapRowFields(record);

        // Per-row validation
        if (!mapped.customerName) {
          rejected.push({ row: rowNumber, reason: 'Customer name is missing or empty' });
          continue;
        }

        if (!mapped.message) {
          rejected.push({ row: rowNumber, reason: 'Feedback message is missing or empty' });
          continue;
        }

        if (mapped.message.length > 5000) {
          rejected.push({ row: rowNumber, reason: 'Feedback message exceeds maximum length of 5000 characters' });
          continue;
        }

        if (mapped.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mapped.customerEmail)) {
          rejected.push({ row: rowNumber, reason: `Invalid email address format: "${mapped.customerEmail}"` });
          continue;
        }

        validDocuments.push({
          workspaceId,
          createdBy: userId,
          customerName: mapped.customerName,
          customerEmail: mapped.customerEmail,
          message: mapped.message,
          source: mapped.source,
          receivedAt: mapped.receivedAt,
          status: 'NEW',
          ai: {
            sentiment: 'UNKNOWN',
            category: 'OTHER',
            summary: '',
            keyPhrases: [],
            confidence: 0,
            status: 'PENDING'
          }
        });
      }
    });

    parser.on('error', (err) => {
      reject(new Error(`CSV parsing error: ${err.message}`));
    });

    parser.on('end', async () => {
      try {
        let imported = 0;
        if (validDocuments.length > 0) {
          const inserted = await Feedback.insertMany(validDocuments);
          imported = inserted.length;
        }

        resolve({
          imported,
          rejected
        });
      } catch (dbErr) {
        reject(dbErr);
      }
    });

    parser.write(fileBuffer);
    parser.end();
  });
};
