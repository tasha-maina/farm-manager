import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const dataDir = process.env.DATA_DIR ? path.resolve(process.cwd(), process.env.DATA_DIR) : path.resolve(process.cwd(), 'data');
const dataFile = path.join(dataDir, 'db.json');

const defaultDB = {
  records: [],
  milkCustomers: [],
  milkDeliveries: [],
  milkPayments: [],
  openingCapital: { start_date: new Date().toISOString().slice(0, 10), cash: 0, invested: 0, notes: '' },
  openingAssets: [],
  livestock: [],
  loans: [],
  settings: { farm_name: 'Smart Farm', owner: 'Farmer', currency: 'KSh' }
};

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    // Migration check: check if old records.json exists
    const oldRecordsFile = path.join(dataDir, 'records.json');
    if (fs.existsSync(oldRecordsFile)) {
      try {
        const oldRecords = JSON.parse(fs.readFileSync(oldRecordsFile, 'utf8'));
        const db = { ...defaultDB, records: oldRecords };
        fs.writeFileSync(dataFile, JSON.stringify(db, null, 2), 'utf8');
        return;
      } catch (e) {
        console.error('Migration error:', e);
      }
    }
    fs.writeFileSync(dataFile, JSON.stringify(defaultDB, null, 2), 'utf8');
  }
}

ensureDataFile();

export function readDB() {
  ensureDataFile();
  try {
    const text = fs.readFileSync(dataFile, 'utf8');
    const db = JSON.parse(text);
    return { ...defaultDB, ...db };
  } catch (e) {
    console.error('Error reading DB file:', e);
    return { ...defaultDB };
  }
}

export function writeDB(data) {
  ensureDataFile();
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8');
}

export function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function matchesMonth(record, month) {
  return record.date && record.date.startsWith(month);
}

