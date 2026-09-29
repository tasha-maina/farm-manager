import express from 'express';
import { readDB, writeDB } from '../db/storage.js';

const router = express.Router();

// GET all milk customers with calculated balances
router.get('/customers', (_req, res) => {
  const db = readDB();
  const customers = (db.milkCustomers || []).map(cust => {
    // Calculate total delivered litres, total cost, total paid, balance
    const deliveries = (db.milkDeliveries || []).filter(d => d.customerId === cust.id);
    const payments = (db.milkPayments || []).filter(p => p.customerId === cust.id);

    const totalLitres = deliveries.reduce((sum, d) => sum + Number(d.litres || 0), 0);
    const totalBilled = deliveries.reduce((sum, d) => sum + (Number(d.litres || 0) * (Number(d.pricePerLitre) || Number(cust.pricePerLitre) || 0)), 0);
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const balanceOwed = totalBilled - totalPaid;

    return {
      ...cust,
      totalLitres,
      totalBilled,
      totalPaid,
      balanceOwed
    };
  });

  res.json(customers);
});

// POST add customer
router.post('/customers', (req, res) => {
  const { name, phone, defaultLitres, pricePerLitre, session, paymentCycle, cycleStart, location, notes } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Customer name is required.' });
  }

  const customer = {
    id: crypto.randomUUID(),
    name: name.trim(),
    phone: (phone || '').trim(),
    defaultLitres: Number(defaultLitres || 1),
    pricePerLitre: Number(pricePerLitre || 60),
    session: session || 'Morning',
    paymentCycle: Number(paymentCycle || 14),
    cycleStart: cycleStart || new Date().toISOString().slice(0, 10),
    location: (location || '').trim(),
    notes: (notes || '').trim(),
    createdAt: new Date().toISOString()
  };

  const db = readDB();
  if (!db.milkCustomers) db.milkCustomers = [];
  db.milkCustomers.push(customer);
  writeDB(db);

  res.status(201).json(customer);
});

// PUT update customer
router.put('/customers/:id', (req, res) => {
  const db = readDB();
  const index = (db.milkCustomers || []).findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Customer not found.' });
  }

  db.milkCustomers[index] = {
    ...db.milkCustomers[index],
    name: req.body.name ? req.body.name.trim() : db.milkCustomers[index].name,
    phone: req.body.phone !== undefined ? req.body.phone.trim() : db.milkCustomers[index].phone,
    defaultLitres: req.body.defaultLitres !== undefined ? Number(req.body.defaultLitres) : db.milkCustomers[index].defaultLitres,
    pricePerLitre: req.body.pricePerLitre !== undefined ? Number(req.body.pricePerLitre) : db.milkCustomers[index].pricePerLitre,
    session: req.body.session || db.milkCustomers[index].session,
    paymentCycle: req.body.paymentCycle ? Number(req.body.paymentCycle) : db.milkCustomers[index].paymentCycle,
    cycleStart: req.body.cycleStart || db.milkCustomers[index].cycleStart,
    location: req.body.location !== undefined ? req.body.location.trim() : db.milkCustomers[index].location,
    notes: req.body.notes !== undefined ? req.body.notes.trim() : db.milkCustomers[index].notes,
  };

  writeDB(db);
  res.json(db.milkCustomers[index]);
});

// DELETE customer
router.delete('/customers/:id', (req, res) => {
  const db = readDB();
  const index = (db.milkCustomers || []).findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Customer not found.' });
  }

  db.milkCustomers.splice(index, 1);
  // Also clean up deliveries and payments
  db.milkDeliveries = (db.milkDeliveries || []).filter(d => d.customerId !== req.params.id);
  db.milkPayments = (db.milkPayments || []).filter(p => p.customerId !== req.params.id);

  writeDB(db);
  res.status(204).send();
});

// GET deliveries
router.get('/deliveries', (req, res) => {
  const db = readDB();
  let deliveries = db.milkDeliveries || [];
  if (req.query.customerId) {
    deliveries = deliveries.filter(d => d.customerId === req.query.customerId);
  }
  if (req.query.date) {
    deliveries = deliveries.filter(d => d.date === req.query.date);
  }
  res.json(deliveries);
});

// POST delivery (single or batch)
router.post('/deliveries', (req, res) => {
  const db = readDB();
  if (!db.milkDeliveries) db.milkDeliveries = [];

  const payload = req.body;
  if (Array.isArray(payload.deliveries)) {
    // Batch entry
    const created = [];
    payload.deliveries.forEach(item => {
      const existingIdx = db.milkDeliveries.findIndex(d => d.customerId === item.customerId && d.date === item.date);
      const delivery = {
        id: existingIdx >= 0 ? db.milkDeliveries[existingIdx].id : crypto.randomUUID(),
        customerId: item.customerId,
        date: item.date,
        litres: Number(item.litres || 0),
        pricePerLitre: Number(item.pricePerLitre || 60),
        session: item.session || 'Morning',
        updatedAt: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        db.milkDeliveries[existingIdx] = delivery;
      } else {
        db.milkDeliveries.push(delivery);
      }
      created.push(delivery);
    });
    writeDB(db);
    return res.status(201).json(created);
  } else {
    // Single entry
    const { customerId, date, litres, pricePerLitre, session } = payload;
    if (!customerId || !date) {
      return res.status(400).json({ error: 'Customer ID and Date are required.' });
    }
    const existingIdx = db.milkDeliveries.findIndex(d => d.customerId === customerId && d.date === date);
    const delivery = {
      id: existingIdx >= 0 ? db.milkDeliveries[existingIdx].id : crypto.randomUUID(),
      customerId,
      date,
      litres: Number(litres || 0),
      pricePerLitre: Number(pricePerLitre || 60),
      session: session || 'Morning',
      updatedAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      db.milkDeliveries[existingIdx] = delivery;
    } else {
      db.milkDeliveries.push(delivery);
    }
    writeDB(db);
    return res.status(201).json(delivery);
  }
});

// GET payments
router.get('/payments', (req, res) => {
  const db = readDB();
  let payments = db.milkPayments || [];
  if (req.query.customerId) {
    payments = payments.filter(p => p.customerId === req.query.customerId);
  }
  res.json(payments);
});

// POST payment
router.post('/payments', (req, res) => {
  const { customerId, amount, date, paymentMethod, notes } = req.body;
  if (!customerId || !amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Customer ID and valid positive amount are required.' });
  }

  const payment = {
    id: crypto.randomUUID(),
    customerId,
    amount: Number(amount),
    date: date || new Date().toISOString().slice(0, 10),
    paymentMethod: paymentMethod || 'M-Pesa',
    notes: (notes || '').trim(),
    createdAt: new Date().toISOString()
  };

  const db = readDB();
  if (!db.milkPayments) db.milkPayments = [];
  db.milkPayments.push(payment);

  // Also auto-add an income record in general ledger for financial tracking!
  const cust = (db.milkCustomers || []).find(c => c.id === customerId);
  const custName = cust ? cust.name : 'Milk Customer';
  db.records.push({
    id: crypto.randomUUID(),
    type: 'income',
    category: 'Dairy/Milk',
    amount: Number(amount),
    description: `Milk Credit Payment collected from ${custName}`,
    date: payment.date,
    buyerSupplier: custName,
    notes: `Method: ${payment.paymentMethod}. ${payment.notes}`,
    createdAt: new Date().toISOString()
  });

  writeDB(db);
  res.status(201).json(payment);
});

export default router;
