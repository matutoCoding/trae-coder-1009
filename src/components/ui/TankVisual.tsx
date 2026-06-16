import { Tank } from '../../types';
import { cn, formatVolume, getStatusText } from '../../utils';
import { Thermometer } from 'lucide-react';

interface TankVisualProps {
  tank: Tank;
  onClick?: () => void;
}

export function TankVisual({ tank, onClick }: TankVisualProps) {
  const levelPercent = (tank.volume / tank.capacity) * 100;
  
  const getLevelColor = () => {
    if (tank.status === 'alert') return 'from-red-500 to-red-600';
    if (tank.status === 'warning') return 'from-amber-500 to-amber-600';
    return 'from-blue-500 to-blue-600';
  };

  const getGlowColor = () => {
    if (tank.status === 'alert') return 'rgba(239, 68, 68, 0.3)';
    if (tank.status === 'warning') return 'rgba(245, 158, 11, 0.3)';
    return 'rgba(59, 130, 246, 0.3)';
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg transition-all duration-300',
        onClick && 'cursor-pointer group'
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-800">{tank.tankNo}</h3>
          <p className="text-sm text-gray-500">{tank.fuelType}</p>
        </div>
        <span
          className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            tank.status === 'alert'
              ? 'bg-red-100 text-red-700'
              : tank.status === 'warning'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-green-100 text-green-700'
          )}
        >
          {getStatusText(tank.status)}
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <svg width="80" height="140" viewBox="0 0 80 140">
            <defs>
              <linearGradient id={`gradient-${tank.id}`} x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor={tank.status === 'alert' ? '#ef4444' : tank.status === 'warning' ? '#f59e0b' : '#3b82f6'} stopOpacity="1" />
                <stop offset="100%" stopColor={tank.status === 'alert' ? '#dc2626' : tank.status === 'warning' ? '#d97706' : '#2563eb'} stopOpacity="1" />
              </linearGradient>
              <filter id={`glow-${tank.id}`}>
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            <rect
              x="8"
              y="8"
              width="64"
              height="124"
              rx="8"
              fill="#f3f4f6"
              stroke="#e5e7eb"
              strokeWidth="2"
            />
            
            <clipPath id={`clip-${tank.id}`}>
              <rect x="10" y="10" width="60" height="120" rx="6" />
            </clipPath>
            
            <g clipPath={`url(#clip-${tank.id})`}>
              <rect
                x="10"
                y={130 - levelPercent * 1.2}
                width="60"
                height={levelPercent * 1.2}
                fill={`url(#gradient-${tank.id})`}
                filter={`url(#glow-${tank.id})`}
                className="transition-all duration-500"
              />
              
              {[...Array(5)].map((_, i) => (
                <line
                  key={i}
                  x1="15"
                  y1={125 - i * 24}
                  x2="25"
                  y2={125 - i * 24}
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="1"
                />
              ))}
            </g>
            
            <rect
              x="8"
              y="8"
              width="64"
              height="124"
              rx="8"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1"
            />
          </svg>
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <p className="text-lg font-bold text-white drop-shadow-lg">
              {tank.currentLevel.toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <p className="text-xs text-gray-400">当前库存</p>
            <p className="text-xl font-bold text-gray-800">{formatVolume(tank.volume)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">总容量</p>
            <p className="text-sm text-gray-600">{formatVolume(tank.capacity)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-red-500" />
            <span className="text-sm text-gray-600">{tank.temperature.toFixed(1)}°C</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between text-xs text-gray-400">
          <span>空</span>
          <span>20%</span>
          <span>40%</span>
          <span>60%</span>
          <span>80%</span>
          <span>满</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${getLevelColor()}`}
            style={{
              width: `${levelPercent}%`,
              boxShadow: `0 0 10px ${getGlowColor()}`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
