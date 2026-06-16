import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Fuel,
  Truck,
  ClipboardList,
  Users,
  Shield,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../utils';
import { useAppStore } from '../../store';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: '仪表盘' },
  { path: '/tank-ledger', icon: Fuel, label: '油罐台账' },
  { path: '/oil-delivery', icon: Truck, label: '进油卸油' },
  { path: '/fuel-sales', icon: Fuel, label: '加油销售' },
  { path: '/inventory', icon: ClipboardList, label: '油品盘点' },
  { path: '/members', icon: Users, label: '会员储值' },
  { path: '/safety', icon: Shield, label: '安全管理' },
  { path: '/reports', icon: BarChart3, label: '经营统计' },
];

export function Sidebar() {
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-[#1e3a5f] text-white transition-all duration-300 z-50 flex flex-col no-print',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center">
              <Fuel className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">油气通</h1>
              <p className="text-xs text-white/60">加油站管理系统</p>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-10 h-10 mx-auto rounded-lg bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center">
            <Fuel className="w-6 h-6 text-white" />
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                    isActive
                      ? 'bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white shadow-lg shadow-[#f59e0b]/20'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {!sidebarCollapsed && (
        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-xs text-white/60 mb-1">当前用户</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center text-sm font-bold">
                站
              </div>
              <div>
                <p className="text-sm font-medium">陈站长</p>
                <p className="text-xs text-white/50">管理员</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
