import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const dataDir = path.resolve(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'records.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, '[]', 'utf8');
}

function readRecords() {
  const text = fs.readFileSync(dataFile, 'utf8');
  return JSON.parse(text);
}

function writeRecords(records) {
  fs.writeFileSync(dataFile, JSON.stringify(records, null, 2), 'utf8');
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'Farm manager API is running' });
});

app.get('/api/records', (_req, res) => {
  const records = readRecords().sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(records);
});

app.post('/api/records', (req, res) => {
  const { type, category, amount, description, date, livestockCount } = req.body;

  if (!type || !category || !amount || !description || !date) {
    return res.status(400).json({ error: 'Please provide type, category, amount, description, and date.' });
  }

  const record = {
    id: crypto.randomUUID(),
    type,
    category,
    amount: Number(amount),
    description,
    date,
    livestockCount: Number(livestockCount || 0),
    createdAt: new Date().toISOString(),
  };

  const records = readRecords();
  records.push(record);
  writeRecords(records);

  res.status(201).json(record);
});

app.get('/api/dashboard', (_req, res) => {
  const records = readRecords();
  const income = records.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0);
  const expenses = records.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0);
  const netWorth = income - expenses;
  const netProfit = income - expenses;
  const livestockCount = records.reduce((sum, item) => sum + Number(item.livestockCount || 0), 0);

  const activityMap = records.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  const activities = Object.entries(activityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => ({ name, count }));

  res.json({
    income,
    expenses,
    netWorth,
    netProfit,
    livestockCount,
    activities,
    recentRecords: records.slice(0, 5),
  });
});

app.listen(PORT, () => {
  console.log(`Farm manager API listening on http://localhost:${PORT}`);
});
