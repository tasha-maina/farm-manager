import express from 'express';
import { readDB, getCurrentMonth, matchesMonth } from '../db/storage.js';

const router = express.Router();

router.get('/', (req, res) => {
  const db = readDB();
  const month = req.query.month || getCurrentMonth();
  const records = db.records || [];
  const monthlyRecords = records.filter((record) => matchesMonth(record, month));

  const income = monthlyRecords.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expenses = monthlyRecords.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const netProfit = income - expenses;

  // Total All-Time Income & Expenses for Net Worth calculation
  const totalIncomeAllTime = records.filter(item => item.type === 'income').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalExpensesAllTime = records.filter(item => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const startingCash = Number(db.openingCapital?.cash || 0);
  const currentCash = startingCash + totalIncomeAllTime - totalExpensesAllTime;

  // Livestock
  const livestock = db.livestock || [];
  const livestockCount = livestock.length;
  const livestockValue = livestock.reduce((sum, item) => sum + Number(item.estimatedValue || 0), 0);

  // Opening Assets
  const openingAssets = db.openingAssets || [];
  const openingAssetsValue = openingAssets.reduce((sum, item) => sum + Number(item.total_value || (Number(item.qty || 0) * Number(item.value_each || 0))), 0);

  // Milk Credit Owed
  const customers = db.milkCustomers || [];
  const deliveries = db.milkDeliveries || [];
  const payments = db.milkPayments || [];
  let milkOwed = 0;
  customers.forEach(cust => {
    const custDeliv = deliveries.filter(d => d.customerId === cust.id);
    const custPay = payments.filter(p => p.customerId === cust.id);
    const billed = custDeliv.reduce((s, d) => s + (Number(d.litres || 0) * (Number(d.pricePerLitre) || Number(cust.pricePerLitre) || 0)), 0);
    const paid = custPay.reduce((s, p) => s + Number(p.amount || 0), 0);
    milkOwed += Math.max(0, billed - paid);
  });

  // Loans
  const loans = db.loans || [];
  const loansOwedByFarm = loans.filter(l => l.type === 'borrowed' && l.status !== 'paid').reduce((s, l) => s + (Number(l.amount || 0) - Number(l.paidAmount || 0)), 0);

  const netWorth = Math.max(0, currentCash + livestockValue + openingAssetsValue + milkOwed - loansOwedByFarm);

  const activityMap = monthlyRecords.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  const activities = Object.entries(activityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const recentRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  res.json({
    month,
    income,
    expenses,
    netProfit,
    netWorth,
    livestockCount,
    livestockValue,
    openingAssetsValue,
    milkOwed,
    loansOwedByFarm,
    currency: db.settings?.currency || 'KSh',
    farmName: db.settings?.farm_name || 'Smart Farm',
    activities,
    recentRecords,
  });
});

export default router;

