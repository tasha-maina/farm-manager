import { useEffect, useMemo, useState } from 'react';

const API_URL = 'http://localhost:4000/api';

const emptyForm = {
  type: 'income',
  category: 'sales',
  amount: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  livestockCount: '0',
};

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');

  async function loadData() {
    const [dashboardRes, recordsRes] = await Promise.all([
      fetch(`${API_URL}/dashboard`),
      fetch(`${API_URL}/records`),
    ]);

    const dashboardData = await dashboardRes.json();
    const recordsData = await recordsRes.json();
    setDashboard(dashboardData);
    setRecords(recordsData);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    const response = await fetch(`${API_URL}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || 'Unable to save record');
      return;
    }

    setMessage(`Saved ${data.description}`);
    setForm(emptyForm);
    await loadData();
  }

  const summaryCards = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    return [
      { label: 'Net Worth', value: `KSh ${dashboard.netWorth.toLocaleString()}`, accent: 'accent' },
      { label: 'This Month Income', value: `KSh ${dashboard.income.toLocaleString()}`, accent: 'income' },
      { label: 'This Month Expenses', value: `KSh ${dashboard.expenses.toLocaleString()}`, accent: 'expense' },
      { label: 'Net Profit (month)', value: `KSh ${dashboard.netProfit.toLocaleString()}`, accent: 'profit' },
      { label: 'Livestock Count', value: `${dashboard.livestockCount} animals`, accent: 'livestock' },
    ];
  }, [dashboard]);

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Tuesday, 21 July 2026</p>
          <h1>🌾 Farm Manager</h1>
          <p className="hero-copy">Track every shilling, every harvest.</p>
        </div>
      </header>

      <section className="stats-grid">
        {summaryCards.map((card) => (
          <article key={card.label} className={`stat-card ${card.accent}`}>
            <p>{card.label}</p>
            <h3>{card.value}</h3>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="panel-header">
            <h2>New Record</h2>
          </div>
          <form onSubmit={handleSubmit} className="record-form">
            <label>
              Type
              <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </label>
            <label>
              Category
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                <option value="sales">Sales</option>
                <option value="feed">Feed</option>
                <option value="vet">Vet</option>
                <option value="harvest">Harvest</option>
                <option value="labor">Labor</option>
                <option value="equipment">Equipment</option>
              </select>
            </label>
            <label>
              Amount
              <input type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required />
            </label>
            <label>
              Description
              <input type="text" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
            </label>
            <label>
              Date
              <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required />
            </label>
            <label>
              Livestock Count
              <input type="number" value={form.livestockCount} onChange={(event) => setForm({ ...form, livestockCount: event.target.value })} />
            </label>
            <button type="submit">Save Record</button>
          </form>
          {message ? <p className="message">{message}</p> : null}
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Top Activities This Month</h2>
          </div>
          {dashboard?.activities?.length ? (
            <ul className="activity-list">
              {dashboard.activities.map((activity) => (
                <li key={activity.name}>
                  <span>{activity.name}</span>
                  <strong>{activity.count}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">No data yet for this month</p>
          )}

          <div className="panel-header recent-header">
            <h2>Recent Records</h2>
          </div>
          {records.length ? (
            <ul className="record-list">
              {records.slice(0, 5).map((record) => (
                <li key={record.id}>
                  <div>
                    <strong>{record.description}</strong>
                    <p>{record.category}</p>
                  </div>
                  <span className={record.type}>{record.type === 'income' ? '+' : '-'}KSh {Number(record.amount).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">Add your first record</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default App;
