import express from 'express';
import { readDB, writeDB } from '../db/storage.js';

const router = express.Router();

// GET full export JSON
router.get('/export', (_req, res) => {
  const db = readDB();
  res.json({
    version: '2.0',
    exportDate: new Date().toISOString(),
    db
  });
});

// POST import full JSON backup
router.post('/import', (req, res) => {
  const payload = req.body;
  const importedDB = payload.db || payload;

  if (!importedDB || typeof importedDB !== 'object' || (!importedDB.records && !importedDB.milkCustomers)) {
    return res.status(400).json({ error: 'Invalid backup file payload.' });
  }

  const cleanDB = {
    records: Array.isArray(importedDB.records) ? importedDB.records : [],
    milkCustomers: Array.isArray(importedDB.milkCustomers) ? importedDB.milkCustomers : [],
    milkDeliveries: Array.isArray(importedDB.milkDeliveries) ? importedDB.milkDeliveries : [],
    milkPayments: Array.isArray(importedDB.milkPayments) ? importedDB.milkPayments : [],
    openingCapital: importedDB.openingCapital || { start_date: '', cash: 0, invested: 0, notes: '' },
    openingAssets: Array.isArray(importedDB.openingAssets) ? importedDB.openingAssets : [],
    livestock: Array.isArray(importedDB.livestock) ? importedDB.livestock : [],
    loans: Array.isArray(importedDB.loans) ? importedDB.loans : [],
    settings: importedDB.settings || { farm_name: 'Smart Farm', owner: 'Farmer', currency: 'KSh' }
  };

  writeDB(cleanDB);
  res.json({ success: true, message: 'Database successfully restored.', counts: {
    records: cleanDB.records.length,
    milkCustomers: cleanDB.milkCustomers.length,
    livestock: cleanDB.livestock.length,
    openingAssets: cleanDB.openingAssets.length
  }});
});

// POST clear database
router.post('/clear', (_req, res) => {
  const resetDB = {
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

  writeDB(resetDB);
  res.json({ success: true, message: 'All farm records cleared successfully.' });
});

// GET & PUT settings
router.get('/settings', (_req, res) => {
  const db = readDB();
  res.json(db.settings || { farm_name: 'Smart Farm', owner: 'Farmer', currency: 'KSh' });
});

router.put('/settings', (req, res) => {
  const db = readDB();
  db.settings = {
    ...db.settings,
    farm_name: req.body.farm_name ? req.body.farm_name.trim() : db.settings.farm_name,
    owner: req.body.owner !== undefined ? req.body.owner.trim() : db.settings.owner,
    currency: req.body.currency ? req.body.currency.trim() : db.settings.currency,
  };
  writeDB(db);
  res.json(db.settings);
});

export default router;
