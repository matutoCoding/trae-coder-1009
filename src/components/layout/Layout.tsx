import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppStore } from '../../store';
import { Loader2 } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/': '仪表盘',
  '/dashboard': '仪表盘',
  '/tank-ledger': '油罐台账',
  '/oil-delivery': '进油卸油',
  '/fuel-sales': '加油销售',
  '/inventory': '油品盘点',
  '/members': '会员储值',
  '/safety': '安全管理',
  '/reports': '经营统计',
};

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const initialized = useAppStore((state) => state.initialized);
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);

  const title = pageTitles[location.pathname] || '加油站管理系统';

  if (!initialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#f59e0b] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">正在加载系统...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div
        className="transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? '64px' : '256px' }}
      >
        <Header title={title} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
