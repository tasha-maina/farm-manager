import express from 'express';
import { readDB, getCurrentMonth, matchesMonth } from '../db/storage.js';

const router = express.Router();

// GET AI Prompt & Instant Analysis
router.get('/advisor', (req, res) => {
  const db = readDB();
  const currentMonth = req.query.month || getCurrentMonth();
  const records = db.records || [];
  const monthlyRecords = records.filter(r => matchesMonth(r, currentMonth));

  const monthlyIncome = monthlyRecords.filter(r => r.type === 'income').reduce((s, r) => s + Number(r.amount || 0), 0);
  const monthlyExpenses = monthlyRecords.filter(r => r.type === 'expense').reduce((s, r) => s + Number(r.amount || 0), 0);
  const netProfit = monthlyIncome - monthlyExpenses;

  // Livestock totals & values
  const livestock = db.livestock || [];
  const livestockValue = livestock.reduce((s, a) => s + Number(a.estimatedValue || 0), 0);
  const livestockCount = livestock.length;

  // Opening Assets
  const openingAssets = db.openingAssets || [];
  const openingAssetsValue = openingAssets.reduce((s, a) => s + Number(a.total_value || (Number(a.qty||0)*Number(a.value_each||0))), 0);

  // Milk Credit Owed
  const customers = db.milkCustomers || [];
  const deliveries = db.milkDeliveries || [];
  const payments = db.milkPayments || [];

  let totalMilkOwed = 0;
  customers.forEach(c => {
    const custDeliv = deliveries.filter(d => d.customerId === c.id);
    const custPay = payments.filter(p => p.customerId === c.id);
    const billed = custDeliv.reduce((s, d) => s + (Number(d.litres||0) * Number(d.pricePerLitre || c.pricePerLitre || 0)), 0);
    const paid = custPay.reduce((s, p) => s + Number(p.amount||0), 0);
    totalMilkOwed += Math.max(0, billed - paid);
  });

  // Top Expenses
  const expCategories = {};
  monthlyRecords.filter(r => r.type === 'expense').forEach(r => {
    expCategories[r.category] = (expCategories[r.category] || 0) + Number(r.amount || 0);
  });
  const topExpenses = Object.entries(expCategories).sort((a,b) => b[1] - a[1]).slice(0, 3);

  // Health Status
  let health = 'Healthy';
  let healthBadge = '🟢 Healthy';
  let adviceList = [];

  if (netProfit < 0) {
    health = 'Risky';
    healthBadge = '🔴 High Risk (Negative Net Margin)';
    adviceList.push('⚠️ Your farm operating expenses exceed income this month. Review your feed & labor spending.');
  } else if (netProfit === 0) {
    health = 'Average';
    healthBadge = '🟡 Break-even';
    adviceList.push('💡 Farm is breaking even. Consider expanding high-margin streams like dairy or egg sales.');
  } else {
    health = 'Healthy';
    healthBadge = '🟢 Healthy (Profitable)';
    adviceList.push('✅ Good cashflow. Maintain feed conversion efficiency and harvest schedules.');
  }

  if (totalMilkOwed > 5000) {
    adviceList.push(`🥛 You have ${db.settings?.currency || 'KSh'} ${totalMilkOwed.toLocaleString()} uncollected milk credit. Follow up on overdue customer payments.`);
  }

  if (livestockCount === 0) {
    adviceList.push('🐄 Register your animals under Assets > Livestock to track individual health & value.');
  }

  const promptText = `I run a farm named "${db.settings?.farm_name || 'My Farm'}".
Here is my current financial & operational summary for ${currentMonth}:
- Currency: ${db.settings?.currency || 'KSh'}
- Monthly Income: ${monthlyIncome.toLocaleString()}
- Monthly Expenses: ${monthlyExpenses.toLocaleString()}
- Net Profit: ${netProfit.toLocaleString()}
- Uncollected Milk Credit Owed: ${totalMilkOwed.toLocaleString()}
- Total Livestock: ${livestockCount} animals (Valued at ${livestockValue.toLocaleString()})
- Capital Assets Value: ${openingAssetsValue.toLocaleString()}
- Top Expense Categories: ${topExpenses.map(([cat, val]) => `${cat} (${val.toLocaleString()})`).join(', ') || 'None'}

Please provide me with 3 strategic, actionable advice points to improve my farm's profitability, reduce costs, and optimize herd & crop operations over the next 30 days.`;

  res.json({
    health,
    healthBadge,
    netProfit,
    monthlyIncome,
    monthlyExpenses,
    totalMilkOwed,
    topExpenses,
    adviceList,
    promptText
  });
});

export default router;
