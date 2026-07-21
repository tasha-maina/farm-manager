import express from 'express';
import { getCurrentMonth, matchesMonth, readRecords } from '../db/storage.js';

const router = express.Router();

router.get('/', (req, res) => {
  const records = readRecords();
  const month = req.query.month || getCurrentMonth();
  const monthlyRecords = records.filter((record) => matchesMonth(record, month));

  const income = monthlyRecords.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0);
  const expenses = monthlyRecords.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0);
  const netWorth = income - expenses;
  const netProfit = income - expenses;
  const livestockCount = monthlyRecords.reduce((sum, item) => sum + Number(item.livestockCount || 0), 0);

  const activityMap = monthlyRecords.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  const activities = Object.entries(activityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => ({ name, count }));

  res.json({
    month,
    income,
    expenses,
    netWorth,
    netProfit,
    livestockCount,
    activities,
    recentRecords: monthlyRecords.slice(0, 5),
  });
});

export default router;
