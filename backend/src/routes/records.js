import express from 'express';
import { readRecords, writeRecords } from '../db/storage.js';

const router = express.Router();

function validateRecordPayload(payload) {
  const { type, category, amount, description, date, livestockCount } = payload;

  if (!type || !category || !amount || !description || !date) {
    return 'Please provide type, category, amount, description, and date.';
  }

  if (!['income', 'expense'].includes(type)) {
    return 'Type must be income or expense.';
  }

  if (Number.isNaN(Number(amount)) || Number(amount) <= 0) {
    return 'Amount must be a positive number.';
  }

  if (Number.isNaN(Number(livestockCount || 0)) || Number(livestockCount || 0) < 0) {
    return 'Livestock count must be zero or a positive number.';
  }

  return null;
}

router.get('/', (_req, res) => {
  res.json(readRecords());
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
    amount: Number(req.body.amount),
    description: req.body.description.trim(),
    date: req.body.date,
    livestockCount: Number(req.body.livestockCount || 0),
    createdAt: new Date().toISOString(),
  };

  const records = readRecords();
  records.push(record);
  writeRecords(records);

  res.status(201).json(record);
});

router.put('/:id', (req, res) => {
  const error = validateRecordPayload(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const records = readRecords();
  const index = records.findIndex((item) => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Record not found.' });
  }

  records[index] = {
    ...records[index],
    type: req.body.type,
    category: req.body.category,
    amount: Number(req.body.amount),
    description: req.body.description.trim(),
    date: req.body.date,
    livestockCount: Number(req.body.livestockCount || 0),
  };

  writeRecords(records);
  res.json(records[index]);
});

router.delete('/:id', (req, res) => {
  const records = readRecords();
  const index = records.findIndex((item) => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Record not found.' });
  }

  records.splice(index, 1);
  writeRecords(records);
  res.status(204).send();
});

export default router;
