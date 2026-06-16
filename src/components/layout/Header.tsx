import { Bell, Settings, RotateCcw, Search } from 'lucide-react';
import { formatDateTime } from '../../utils';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store';

export function Header({ title }: { title: string }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const resetData = useAppStore((state) => state.resetData);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleReset = () => {
    if (confirm('确定要重置所有数据吗？此操作不可撤销！')) {
      resetData();
      window.location.reload();
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40 no-print">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-gray-800">{title}</h1>
        <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span>系统运行正常</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索..."
            className="bg-transparent border-none outline-none text-sm w-48 placeholder:text-gray-400"
          />
        </div>

        <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 font-mono">
          {formatDateTime(currentTime)}
        </div>

        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Settings className="w-5 h-5 text-gray-600" />
        </button>

        <button
          onClick={handleReset}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="重置数据"
        >
          <RotateCcw className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </header>
  );
}
