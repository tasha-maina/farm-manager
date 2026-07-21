import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const dataDir = process.env.DATA_DIR ? path.resolve(process.cwd(), process.env.DATA_DIR) : path.resolve(process.cwd(), 'data');
const dataFile = path.join(dataDir, 'records.json');

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, '[]', 'utf8');
  }
}

ensureDataFile();

export function readRecords() {
  const text = fs.readFileSync(dataFile, 'utf8');
  const records = JSON.parse(text);
  return records.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function writeRecords(records) {
  fs.writeFileSync(dataFile, JSON.stringify(records, null, 2), 'utf8');
}

export function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function matchesMonth(record, month) {
  return record.date.startsWith(month);
}
