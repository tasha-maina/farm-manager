import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_URL = 'http://localhost:4000/api';
const LOCAL_STORAGE_KEY = 'smart_farm_db_v2';

const FarmContext = createContext();

const initialDB = {
  records: [
    { id: '1', type: 'income', category: 'Dairy/Milk', amount: 4500, description: 'Morning Milk Sale', date: new Date().toISOString().slice(0, 10), buyerSupplier: 'KCC Co-op', notes: '75 Litres sold at 60/L' },
    { id: '2', type: 'expense', category: 'Feed', amount: 2800, description: 'Dairy Meal 50kg bag', date: new Date().toISOString().slice(0, 10), buyerSupplier: 'Ungu Feeds', notes: 'High protein dairy meal' }
  ],
  milkCustomers: [
    { id: 'c1', name: 'John Kamau', phone: '0712345678', defaultLitres: 2, pricePerLitre: 65, session: 'Morning', paymentCycle: 14, cycleStart: new Date().toISOString().slice(0, 10), location: 'Plot 4, Mariakani', notes: 'Prefers 7 AM delivery' },
    { id: 'c2', name: 'Mama Sarah', phone: '0722987654', defaultLitres: 3, pricePerLitre: 60, session: 'Morning & Evening', paymentCycle: 7, cycleStart: new Date().toISOString().slice(0, 10), location: 'Main Gate', notes: 'Pays via M-Pesa every Sunday' }
  ],
  milkDeliveries: [
    { id: 'd1', customerId: 'c1', date: new Date().toISOString().slice(0, 10), litres: 2, pricePerLitre: 65, session: 'Morning' },
    { id: 'd2', customerId: 'c2', date: new Date().toISOString().slice(0, 10), litres: 3, pricePerLitre: 60, session: 'Morning' }
  ],
  milkPayments: [],
  openingCapital: { start_date: new Date().toISOString().slice(0, 10), cash: 50000, invested: 120000, notes: 'Initial savings & farm setup capital' },
  openingAssets: [
    { id: 'oa1', name: 'Fresian Dairy Cow (Bessie)', category: 'Cattle', qty: 1, value_each: 85000, total_value: 85000, notes: '3rd Lactation cow, producing 18L/day' }
  ],
  livestock: [
    { id: 'l1', tagNumber: 'COW-001', name: 'Bessie', category: 'Cow', breed: 'Fresian Cross', sex: 'Female', dob: '2022-04-12', purchaseDate: '2023-01-15', estimatedValue: 85000, healthStatus: 'Healthy', notes: 'Lactating 18L daily' }
  ],
  loans: [],
  settings: { farm_name: 'GreenValley Farm', owner: 'David Maina', currency: 'KSh' }
};

export const FarmProvider = ({ children }) => {
  const [activePage, setActivePage] = useState('dashboard');
  const [db, setDb] = useState(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : initialDB;
    } catch (e) {
      return initialDB;
    }
  });

  const [dashboardData, setDashboardData] = useState(null);
  const [aiAdvisor, setAiAdvisor] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isBackendOnline, setIsBackendOnline] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Sync to LocalStorage whenever local db state changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [db]);

  // Load data from Backend API or fall back to local state
  const refreshData = useCallback(async () => {
    try {
      const healthRes = await fetch(`${API_URL}/health`).catch(() => null);
      if (healthRes && healthRes.ok) {
        setIsBackendOnline(true);
        const [dashRes, recRes, custRes, delivRes, payRes, openRes, liveRes, loanRes, setRes, aiRes] = await Promise.all([
          fetch(`${API_URL}/dashboard`).then(r => r.json()),
          fetch(`${API_URL}/records`).then(r => r.json()),
          fetch(`${API_URL}/milk/customers`).then(r => r.json()),
          fetch(`${API_URL}/milk/deliveries`).then(r => r.json()),
          fetch(`${API_URL}/milk/payments`).then(r => r.json()),
          fetch(`${API_URL}/assets/opening`).then(r => r.json()),
          fetch(`${API_URL}/assets/livestock`).then(r => r.json()),
          fetch(`${API_URL}/assets/loans`).then(r => r.json()),
          fetch(`${API_URL}/backup/settings`).then(r => r.json()),
          fetch(`${API_URL}/ai/advisor`).then(r => r.json())
        ]);

        setDashboardData(dashRes);
        setAiAdvisor(aiRes);
        setDb({
          records: recRes || [],
          milkCustomers: custRes || [],
          milkDeliveries: delivRes || [],
          milkPayments: payRes || [],
          openingCapital: openRes.capital || initialDB.openingCapital,
          openingAssets: openRes.assets || [],
          livestock: liveRes || [],
          loans: loanRes || [],
          settings: setRes || initialDB.settings
        });
        return;
      }
    } catch (e) {
      console.warn('Backend API connection offline, using LocalStorage state');
    }
    setIsBackendOnline(false);
    calculateLocalMetrics(db);
  }, [db]);

  const calculateLocalMetrics = (currentDb) => {
    const records = currentDb.records || [];
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyRecords = records.filter(r => r.date && r.date.startsWith(currentMonth));

    const income = monthlyRecords.filter(r => r.type === 'income').reduce((s, r) => s + Number(r.amount || 0), 0);
    const expenses = monthlyRecords.filter(r => r.type === 'expense').reduce((s, r) => s + Number(r.amount || 0), 0);
    const netProfit = income - expenses;

    // Milk Credit Owed calculation
    let milkOwed = 0;
    (currentDb.milkCustomers || []).forEach(cust => {
      const custDeliv = (currentDb.milkDeliveries || []).filter(d => d.customerId === cust.id);
      const custPay = (currentDb.milkPayments || []).filter(p => p.customerId === cust.id);
      const billed = custDeliv.reduce((s, d) => s + (Number(d.litres || 0) * Number(d.pricePerLitre || cust.pricePerLitre || 0)), 0);
      const paid = custPay.reduce((s, p) => s + Number(p.amount || 0), 0);
      milkOwed += Math.max(0, billed - paid);
    });

    const livestockVal = (currentDb.livestock || []).reduce((s, a) => s + Number(a.estimatedValue || 0), 0);
    const assetsVal = (currentDb.openingAssets || []).reduce((s, a) => s + Number(a.total_value || (Number(a.qty||0)*Number(a.value_each||0))), 0);
    const startingCash = Number(currentDb.openingCapital?.cash || 0);

    const totalIncomeAll = records.filter(r => r.type === 'income').reduce((s, r) => s + Number(r.amount || 0), 0);
    const totalExpAll = records.filter(r => r.type === 'expense').reduce((s, r) => s + Number(r.amount || 0), 0);
    const currentCash = startingCash + totalIncomeAll - totalExpAll;

    const netWorth = Math.max(0, currentCash + livestockVal + assetsVal + milkOwed);

    const activityMap = monthlyRecords.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});
    const activities = Object.entries(activityMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));

    setDashboardData({
      month: currentMonth,
      income,
      expenses,
      netProfit,
      netWorth,
      livestockCount: (currentDb.livestock || []).length,
      livestockValue: livestockVal,
      openingAssetsValue: assetsVal,
      milkOwed,
      currency: currentDb.settings?.currency || 'KSh',
      farmName: currentDb.settings?.farm_name || 'GreenValley Farm',
      activities,
      recentRecords: [...records].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
    });

    setAiAdvisor({
      health: netProfit >= 0 ? 'Healthy' : 'Risky',
      healthBadge: netProfit >= 0 ? '🟢 Healthy (Profitable)' : '🔴 High Risk (Expenses Exceed Revenue)',
      netProfit,
      monthlyIncome: income,
      monthlyExpenses: expenses,
      totalMilkOwed: milkOwed,
      adviceList: [
        netProfit >= 0 ? '✅ Positive cash flow this month. Keep tracking feed conversion efficiency.' : '⚠️ Monthly expenses exceed income. Audit feed & fertilizer spending.',
        milkOwed > 0 ? `🥛 You have ${currentDb.settings?.currency || 'KSh'} ${milkOwed.toLocaleString()} in uncollected milk credit. Follow up on payments.` : '🥛 Milk credit balance is fully cleared!'
      ],
      promptText: `Farm: ${currentDb.settings?.farm_name}\nIncome: ${income}\nExpenses: ${expenses}\nNet Profit: ${netProfit}\nUncollected Milk Owed: ${milkOwed}\nLivestock Count: ${currentDb.livestock?.length}`
    });
  };

  useEffect(() => {
    refreshData();
  }, []);

  // API Mutators with offline fallback
  const addRecord = async (recordData) => {
    const newRecord = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...recordData };
    if (isBackendOnline) {
      await fetch(`${API_URL}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordData)
      });
      await refreshData();
    } else {
      setDb(prev => ({ ...prev, records: [newRecord, ...(prev.records || [])] }));
    }
    showToast(`Saved record: ${recordData.description}`);
  };

  const deleteRecord = async (id) => {
    if (isBackendOnline) {
      await fetch(`${API_URL}/records/${id}`, { method: 'DELETE' });
      await refreshData();
    } else {
      setDb(prev => ({ ...prev, records: (prev.records || []).filter(r => r.id !== id) }));
    }
    showToast('Record deleted');
  };

  const addMilkCustomer = async (custData) => {
    const newCust = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...custData };
    if (isBackendOnline) {
      await fetch(`${API_URL}/milk/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(custData)
      });
      await refreshData();
    } else {
      setDb(prev => ({ ...prev, milkCustomers: [...(prev.milkCustomers || []), newCust] }));
    }
    showToast(`Customer ${custData.name} added`);
  };

  const deleteMilkCustomer = async (id) => {
    if (isBackendOnline) {
      await fetch(`${API_URL}/milk/customers/${id}`, { method: 'DELETE' });
      await refreshData();
    } else {
      setDb(prev => ({
        ...prev,
        milkCustomers: (prev.milkCustomers || []).filter(c => c.id !== id),
        milkDeliveries: (prev.milkDeliveries || []).filter(d => d.customerId !== id),
        milkPayments: (prev.milkPayments || []).filter(p => p.customerId !== id)
      }));
    }
    showToast('Customer deleted');
  };

  const logMilkDelivery = async (deliveryBatch) => {
    if (isBackendOnline) {
      await fetch(`${API_URL}/milk/deliveries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Array.isArray(deliveryBatch) ? { deliveries: deliveryBatch } : deliveryBatch)
      });
      await refreshData();
    } else {
      setDb(prev => {
        const deliveries = [...(prev.milkDeliveries || [])];
        const list = Array.isArray(deliveryBatch) ? deliveryBatch : [deliveryBatch];
        list.forEach(item => {
          const idx = deliveries.findIndex(d => d.customerId === item.customerId && d.date === item.date);
          const entry = { id: idx >= 0 ? deliveries[idx].id : crypto.randomUUID(), ...item };
          if (idx >= 0) deliveries[idx] = entry;
          else deliveries.push(entry);
        });
        return { ...prev, milkDeliveries: deliveries };
      });
    }
    showToast('Milk delivery recorded');
  };

  const collectMilkPayment = async (paymentData) => {
    if (isBackendOnline) {
      await fetch(`${API_URL}/milk/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
      await refreshData();
    } else {
      const newPay = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...paymentData };
      const cust = (db.milkCustomers || []).find(c => c.id === paymentData.customerId);
      const custName = cust ? cust.name : 'Customer';
      const autoIncome = {
        id: crypto.randomUUID(),
        type: 'income',
        category: 'Dairy/Milk',
        amount: Number(paymentData.amount),
        description: `Milk Credit Payment collected from ${custName}`,
        date: paymentData.date || new Date().toISOString().slice(0, 10),
        buyerSupplier: custName,
        createdAt: new Date().toISOString()
      };
      setDb(prev => ({
        ...prev,
        milkPayments: [...(prev.milkPayments || []), newPay],
        records: [autoIncome, ...(prev.records || [])]
      }));
    }
    showToast('Payment collected & ledger updated');
  };

  const addOpeningAsset = async (assetData) => {
    const qty = Number(assetData.qty || 1);
    const val = Number(assetData.value_each || 0);
    const newAsset = { id: crypto.randomUUID(), total_value: qty * val, ...assetData };
    if (isBackendOnline) {
      await fetch(`${API_URL}/assets/opening/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assetData)
      });
      await refreshData();
    } else {
      setDb(prev => ({ ...prev, openingAssets: [...(prev.openingAssets || []), newAsset] }));
    }
    showToast('Asset added to starting capital');
  };

  const deleteOpeningAsset = async (id) => {
    if (isBackendOnline) {
      await fetch(`${API_URL}/assets/opening/assets/${id}`, { method: 'DELETE' });
      await refreshData();
    } else {
      setDb(prev => ({ ...prev, openingAssets: (prev.openingAssets || []).filter(a => a.id !== id) }));
    }
    showToast('Asset removed');
  };

  const addLivestock = async (animalData) => {
    const newAnimal = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...animalData };
    if (isBackendOnline) {
      await fetch(`${API_URL}/assets/livestock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(animalData)
      });
      await refreshData();
    } else {
      setDb(prev => ({ ...prev, livestock: [...(prev.livestock || []), newAnimal] }));
    }
    showToast(`Livestock ${animalData.category} added`);
  };

  const deleteLivestock = async (id) => {
    if (isBackendOnline) {
      await fetch(`${API_URL}/assets/livestock/${id}`, { method: 'DELETE' });
      await refreshData();
    } else {
      setDb(prev => ({ ...prev, livestock: (prev.livestock || []).filter(l => l.id !== id) }));
    }
    showToast('Livestock deleted');
  };

  const addLoan = async (loanData) => {
    const newLoan = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...loanData };
    if (isBackendOnline) {
      await fetch(`${API_URL}/assets/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loanData)
      });
      await refreshData();
    } else {
      setDb(prev => ({ ...prev, loans: [...(prev.loans || []), newLoan] }));
    }
    showToast('Loan record saved');
  };

  const deleteLoan = async (id) => {
    if (isBackendOnline) {
      await fetch(`${API_URL}/assets/loans/${id}`, { method: 'DELETE' });
      await refreshData();
    } else {
      setDb(prev => ({ ...prev, loans: (prev.loans || []).filter(l => l.id !== id) }));
    }
    showToast('Loan record deleted');
  };

  const saveSettings = async (settingsData) => {
    if (isBackendOnline) {
      await fetch(`${API_URL}/backup/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData)
      });
      await refreshData();
    } else {
      setDb(prev => ({ ...prev, settings: { ...prev.settings, ...settingsData } }));
    }
    showToast('Settings saved');
  };

  const importBackup = async (importedJson) => {
    try {
      const data = typeof importedJson === 'string' ? JSON.parse(importedJson) : importedJson;
      const cleanDB = data.db || data;
      if (isBackendOnline) {
        await fetch(`${API_URL}/backup/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ db: cleanDB })
        });
        await refreshData();
      } else {
        setDb(cleanDB);
      }
      showToast('Database successfully restored!');
    } catch (e) {
      showToast('Error importing backup JSON file.');
    }
  };

  const clearAllData = async () => {
    if (isBackendOnline) {
      await fetch(`${API_URL}/backup/clear`, { method: 'POST' });
      await refreshData();
    } else {
      setDb({
        records: [],
        milkCustomers: [],
        milkDeliveries: [],
        milkPayments: [],
        openingCapital: { start_date: new Date().toISOString().slice(0, 10), cash: 0, invested: 0, notes: '' },
        openingAssets: [],
        livestock: [],
        loans: [],
        settings: { farm_name: 'Smart Farm', owner: 'Farmer', currency: 'KSh' }
      });
    }
    showToast('All farm records cleared!');
  };

  return (
    <FarmContext.Provider
      value={{
        activePage,
        setActivePage,
        db,
        dashboardData,
        aiAdvisor,
        toastMessage,
        showToast,
        refreshData,
        addRecord,
        deleteRecord,
        addMilkCustomer,
        deleteMilkCustomer,
        logMilkDelivery,
        collectMilkPayment,
        addOpeningAsset,
        deleteOpeningAsset,
        addLivestock,
        deleteLivestock,
        addLoan,
        deleteLoan,
        saveSettings,
        importBackup,
        clearAllData,
        isBackendOnline
      }}
    >
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => useContext(FarmContext);
