import { ReactNode, ComponentType } from 'react';
import { cn } from '../../utils';

interface TrendObject {
  value: string | number;
  isUp: boolean;
}

interface StatusCardProps {
  title: string;
  value: string | number;
  icon: ReactNode | ComponentType<any>;
  color?: string;
  trend?: string | TrendObject;
  trendUp?: boolean;
  subtitle?: string;
  onClick?: () => void;
}

export function StatusCard({
  title,
  value,
  icon: Icon,
  color = 'blue',
  trend,
  trendUp,
  subtitle,
  onClick,
}: StatusCardProps) {
  const getTrendValue = (): string | number => {
    if (typeof trend === 'object' && trend !== null) {
      return trend.value;
    }
    return trend as string | number;
  };

  const getTrendIsUp = () => {
    if (typeof trend === 'object' && trend !== null) {
      return trend.isUp;
    }
    return trendUp ?? true;
  };

  const getIconBgClass = () => {
    const presetClasses: Record<string, string> = {
      blue: 'bg-blue-500/10 text-blue-500',
      green: 'bg-green-500/10 text-green-500',
      amber: 'bg-amber-500/10 text-amber-500',
      red: 'bg-red-500/10 text-red-500',
      purple: 'bg-purple-500/10 text-purple-500',
    };
    return presetClasses[color] || presetClasses.blue;
  };

  const renderIcon = () => {
    if (typeof Icon === 'function') {
      return <Icon className="w-6 h-6" />;
    }
    return Icon;
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200',
        onClick && 'cursor-pointer'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'text-xs font-medium px-1.5 py-0.5 rounded',
                  getTrendIsUp() ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                )}
              >
                {getTrendIsUp() ? '↑' : '↓'} {getTrendValue()}
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            getIconBgClass()
          )}
        >
          {renderIcon()}
        </div>
      </div>
    </div>
  );
}
