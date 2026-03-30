import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ImageIcon,
  TrendingUp,
  AlertTriangle,
  Database,
  Settings,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/spenders', icon: Users, label: 'Top Spenders' },
  { to: '/generations', icon: ImageIcon, label: 'Generations' },
  { to: '/projections', icon: TrendingUp, label: 'Projections' },
  { to: '/anomalies', icon: AlertTriangle, label: 'Anomalies' },
  { to: '/data', icon: Database, label: 'Data' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#1e1e2e] text-white flex flex-col shrink-0 h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-white/10">
        <h1 className="text-lg font-bold tracking-widest text-[#3300FF] uppercase">xfigura</h1>
        <p className="text-[10px] text-gray-400 mt-0.5 tracking-wider">Generation Dashboard</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-6 py-4 border-t border-white/10 text-xs text-gray-500">
        xfigura Analytics v1.0
      </div>
    </aside>
  );
}
