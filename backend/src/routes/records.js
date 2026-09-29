import express from 'express';
import { readDB, writeDB } from '../db/storage.js';

const router = express.Router();

function validateRecordPayload(payload) {
  const { type, category, amount, description, date } = payload;

  if (!type || !category || amount === undefined || amount === null || !description || !date) {
    return 'Please provide type, category, amount, description, and date.';
  }

  if (!['income', 'expense', 'production', 'operation'].includes(type)) {
    return 'Type must be income, expense, production, or operation.';
  }

  if (Number.isNaN(Number(amount)) || Number(amount) < 0) {
    return 'Amount must be a non-negative number.';
  }

  return null;
}

router.get('/', (_req, res) => {
  const db = readDB();
  const sorted = [...(db.records || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(sorted);
});

router.post('/', (req, res) => {
  const error = validateRecordPayload(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const record = {
    id: crypto.randomUUID(),
    type: req.body.type,
    category: req.body.category,
    amount: Number(req.body.amount || 0),
    quantity: req.body.quantity ? Number(req.body.quantity) : null,
    unitPrice: req.body.unitPrice ? Number(req.body.unitPrice) : null,
    unit: req.body.unit || '',
    description: req.body.description.trim(),
    date: req.body.date,
    livestockCount: Number(req.body.livestockCount || 0),
    photo: req.body.photo || null,
    notes: req.body.notes || '',
    buyerSupplier: req.body.buyerSupplier || '',
    createdAt: new Date().toISOString(),
  };

  const db = readDB();
  db.records.push(record);
  writeDB(db);

  res.status(201).json(record);
});

router.put('/:id', (req, res) => {
  const error = validateRecordPayload(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const db = readDB();
  const index = db.records.findIndex((item) => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Record not found.' });
  }

  db.records[index] = {
    ...db.records[index],
    type: req.body.type,
    category: req.body.category,
    amount: Number(req.body.amount || 0),
    quantity: req.body.quantity ? Number(req.body.quantity) : null,
    unitPrice: req.body.unitPrice ? Number(req.body.unitPrice) : null,
    unit: req.body.unit || db.records[index].unit || '',
    description: req.body.description.trim(),
    date: req.body.date,
    livestockCount: Number(req.body.livestockCount || 0),
    photo: req.body.photo !== undefined ? req.body.photo : db.records[index].photo,
    notes: req.body.notes !== undefined ? req.body.notes : db.records[index].notes,
    buyerSupplier: req.body.buyerSupplier !== undefined ? req.body.buyerSupplier : db.records[index].buyerSupplier,
    updatedAt: new Date().toISOString(),
  };

  writeDB(db);
  res.json(db.records[index]);
});

router.delete('/:id', (req, res) => {
  const db = readDB();
  const index = db.records.findIndex((item) => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Record not found.' });
  }

  db.records.splice(index, 1);
  writeDB(db);
  res.status(204).send();
});

export default router;

