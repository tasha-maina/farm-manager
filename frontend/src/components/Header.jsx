import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { LayoutDashboard, PlusCircle, FileText, Milk, Sprout, BarChart3, Settings, Sun, Moon } from 'lucide-react';

export default function Header({ onOpenSettings }) {
  const { activePage, setActivePage, dashboardData, db } = useFarm();
  const [theme, setTheme] = useState('light');

  const todayStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'add', label: 'Add Record', icon: PlusCircle },
    { id: 'records', label: 'Records', icon: FileText },
    { id: 'milkbook', label: 'Milk Book', icon: Milk },
    { id: 'assets', label: 'Assets', icon: Sprout },
    { id: 'reports', label: 'Reports & AI', icon: BarChart3 }
  ];

  const currency = dashboardData?.currency || db.settings?.currency || 'KSh';
  const netWorthVal = dashboardData?.netWorth !== undefined ? dashboardData.netWorth : 0;

  return (
    <header className="header-hero">
      <div className="header-top">
        <div className="header-title-area">
          <div>
            <p className="header-eyebrow">📅 {todayStr}</p>
            <h1>🌾 {db.settings?.farm_name || 'Smart Farm'}</h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={toggleTheme}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <button
            onClick={onOpenSettings}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Farm Settings"
          >
            <Settings size={18} />
          </button>

          <div className="networth-badge">
            <div className="networth-label">Net Worth</div>
            <div className="networth-val">{currency} {netWorthVal.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Links */}
      <nav className="desktop-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`desktop-nav-btn ${activePage === item.id ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
