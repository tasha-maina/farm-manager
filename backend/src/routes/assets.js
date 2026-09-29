import express from 'express';
import { readDB, writeDB } from '../db/storage.js';

const router = express.Router();

// GET opening capital & assets overview
router.get('/opening', (_req, res) => {
  const db = readDB();
  res.json({
    capital: db.openingCapital || { start_date: '', cash: 0, invested: 0, notes: '' },
    assets: db.openingAssets || []
  });
});

// POST/PUT update opening capital
router.post('/opening/capital', (req, res) => {
  const { start_date, cash, invested, notes } = req.body;
  const db = readDB();
  db.openingCapital = {
    start_date: start_date || new Date().toISOString().slice(0, 10),
    cash: Number(cash || 0),
    invested: Number(invested || 0),
    notes: (notes || '').trim()
  };
  writeDB(db);
  res.json(db.openingCapital);
});

// POST add opening asset
router.post('/opening/assets', (req, res) => {
  const { name, category, qty, value_each, photo, notes } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: 'Name and category are required.' });
  }

  const quantity = Number(qty || 1);
  const valueEach = Number(value_each || 0);
  const totalValue = quantity * valueEach;

  const asset = {
    id: crypto.randomUUID(),
    name: name.trim(),
    category: category.trim(),
    qty: quantity,
    value_each: valueEach,
    total_value: totalValue,
    photo: photo || null,
    notes: (notes || '').trim(),
    createdAt: new Date().toISOString()
  };

  const db = readDB();
  if (!db.openingAssets) db.openingAssets = [];
  db.openingAssets.push(asset);
  writeDB(db);

  res.status(201).json(asset);
});

// DELETE opening asset
router.delete('/opening/assets/:id', (req, res) => {
  const db = readDB();
  const index = (db.openingAssets || []).findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Asset not found.' });
  }
  db.openingAssets.splice(index, 1);
  writeDB(db);
  res.status(204).send();
});

// GET livestock
router.get('/livestock', (_req, res) => {
  const db = readDB();
  res.json(db.livestock || []);
});

// POST add livestock
router.post('/livestock', (req, res) => {
  const { tagNumber, name, category, breed, sex, dob, purchaseDate, estimatedValue, healthStatus, notes, photo } = req.body;
  if (!category) {
    return res.status(400).json({ error: 'Livestock category (e.g. Cow, Goat) is required.' });
  }

  const animal = {
    id: crypto.randomUUID(),
    tagNumber: (tagNumber || '').trim(),
    name: (name || '').trim(),
    category: category.trim(),
    breed: (breed || '').trim(),
    sex: sex || 'Female',
    dob: dob || '',
    purchaseDate: purchaseDate || new Date().toISOString().slice(0, 10),
    estimatedValue: Number(estimatedValue || 0),
    healthStatus: healthStatus || 'Healthy',
    notes: (notes || '').trim(),
    photo: photo || null,
    createdAt: new Date().toISOString()
  };

  const db = readDB();
  if (!db.livestock) db.livestock = [];
  db.livestock.push(animal);

  // If purchase value > 0, auto-log an expense record if requested
  if (req.body.logExpense && animal.estimatedValue > 0) {
    db.records.push({
      id: crypto.randomUUID(),
      type: 'expense',
      category: 'Livestock',
      amount: animal.estimatedValue,
      description: `Purchased livestock: ${animal.category} ${animal.name || animal.tagNumber}`,
      date: animal.purchaseDate,
      livestockCount: 1,
      photo: animal.photo,
      createdAt: new Date().toISOString()
    });
  }

  writeDB(db);
  res.status(201).json(animal);
});

// DELETE livestock
router.delete('/livestock/:id', (req, res) => {
  const db = readDB();
  const index = (db.livestock || []).findIndex(l => l.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Animal not found.' });
  }
  db.livestock.splice(index, 1);
  writeDB(db);
  res.status(204).send();
});

// GET loans
router.get('/loans', (_req, res) => {
  const db = readDB();
  res.json(db.loans || []);
});

// POST add loan
router.post('/loans', (req, res) => {
  const { title, type, partyName, amount, paidAmount, dueDate, status, notes } = req.body;
  if (!title || !amount) {
    return res.status(400).json({ error: 'Loan title and total amount are required.' });
  }

  const loan = {
    id: crypto.randomUUID(),
    title: title.trim(),
    type: type || 'borrowed', // borrowed (I owe) or lent (Owed to me)
    partyName: (partyName || '').trim(),
    amount: Number(amount),
    paidAmount: Number(paidAmount || 0),
    dueDate: dueDate || '',
    status: status || 'active', // active, paid, default
    notes: (notes || '').trim(),
    createdAt: new Date().toISOString()
  };

  const db = readDB();
  if (!db.loans) db.loans = [];
  db.loans.push(loan);
  writeDB(db);

  res.status(201).json(loan);
});

// PUT update loan repayment
router.put('/loans/:id', (req, res) => {
  const db = readDB();
  const index = (db.loans || []).findIndex(l => l.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Loan record not found.' });
  }

  const loan = db.loans[index];
  const newPaidAmount = req.body.paidAmount !== undefined ? Number(req.body.paidAmount) : loan.paidAmount;
  const newStatus = newPaidAmount >= loan.amount ? 'paid' : (req.body.status || loan.status);

  db.loans[index] = {
    ...loan,
    paidAmount: newPaidAmount,
    status: newStatus,
    dueDate: req.body.dueDate || loan.dueDate,
    notes: req.body.notes !== undefined ? req.body.notes.trim() : loan.notes
  };

  writeDB(db);
  res.json(db.loans[index]);
});

// DELETE loan
router.delete('/loans/:id', (req, res) => {
  const db = readDB();
  const index = (db.loans || []).findIndex(l => l.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Loan record not found.' });
  }
  db.loans.splice(index, 1);
  writeDB(db);
  res.status(204).send();
});

export default router;
