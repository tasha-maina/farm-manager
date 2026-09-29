import React from 'react';
import { useFarm } from '../context/FarmContext';
import { LayoutDashboard, PlusCircle, FileText, Milk, Sprout, BarChart3 } from 'lucide-react';

export default function BottomNav() {
  const { activePage, setActivePage } = useFarm();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'add', label: 'Add', icon: PlusCircle },
    { id: 'records', label: 'Records', icon: FileText },
    { id: 'milkbook', label: 'Milk Book', icon: Milk },
    { id: 'assets', label: 'Assets', icon: Sprout },
    { id: 'reports', label: 'Reports', icon: BarChart3 }
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map(item => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            className={`bottom-nav-btn ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            <Icon />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
