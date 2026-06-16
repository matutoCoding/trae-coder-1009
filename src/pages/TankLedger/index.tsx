import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Fuel,
  Thermometer,
  Droplets,
  Clock,
  History,
  AlertTriangle,
} from 'lucide-react';
import { useAppStore } from '../../store';
import { TankVisual } from '../../components/ui/TankVisual';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  formatVolume,
  formatDateTime,
  getStatusText,
  getStatusColor,
  cn,
} from '../../utils';
import { Tank, FUEL_COLORS } from '../../types';

export default function TankLedger() {
  const tanks = useAppStore((state) => state.tanks);
  const deliveries = useAppStore((state) => state.deliveries);
  const [selectedTank, setSelectedTank] = useState<Tank | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  const totalVolume = tanks.reduce((sum, t) => sum + t.volume, 0);
  const totalCapacity = tanks.reduce((sum, t) => sum + t.capacity, 0);
  const overallLevel = (totalVolume / totalCapacity) * 100;

  const levelHistoryOption = useMemo(() => {
    if (!selectedTank) return {};
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const baseLevel = selectedTank.currentLevel;
    
    return {
      tooltip: {
        trigger: 'axis',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: hours,
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        name: '液位(%)',
        min: 0,
        max: 100,
      },
      series: [
        {
          name: '液位',
          type: 'line',
          smooth: true,
          data: hours.map(() => Number((baseLevel + (Math.random() - 0.5) * 10).toFixed(1))),
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: `${FUEL_COLORS[selectedTank.fuelType as keyof typeof FUEL_COLORS]}50` },
                { offset: 1, color: `${FUEL_COLORS[selectedTank.fuelType as keyof typeof FUEL_COLORS]}10` },
              ],
            },
          },
          lineStyle: {
            color: FUEL_COLORS[selectedTank.fuelType as keyof typeof FUEL_COLORS],
            width: 2,
          },
          itemStyle: {
            color: FUEL_COLORS[selectedTank.fuelType as keyof typeof FUEL_COLORS],
          },
        },
      ],
    };
  }, [selectedTank]);

  const temperatureHistoryOption = useMemo(() => {
    if (!selectedTank) return {};
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const baseTemp = selectedTank.temperature;

    return {
      tooltip: {
        trigger: 'axis',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: hours,
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        name: '温度(°C)',
      },
      series: [
        {
          name: '温度',
          type: 'line',
          smooth: true,
          data: hours.map(() => Number((baseTemp + (Math.random() - 0.5) * 5).toFixed(1))),
          lineStyle: {
            color: '#ef4444',
            width: 2,
          },
          itemStyle: {
            color: '#ef4444',
          },
        },
      ],
    };
  }, [selectedTank]);

  const historyColumns = [
    {
      key: 'time',
      label: '时间',
      render: (row: any) => formatDateTime(row.time),
    },
    {
      key: 'type',
      label: '类型',
      align: 'center' as const,
      render: (row: any) => (
        <Badge variant={row.type === 'delivery' ? 'success' : row.type === 'sale' ? 'info' : 'warning'}>
          {row.type === 'delivery' ? '进油' : row.type === 'sale' ? '销售' : '盘点'}
        </Badge>
      ),
    },
    {
      key: 'volumeBefore',
      label: '变更前(L)',
      align: 'right' as const,
      render: (row: any) => formatVolume(row.volumeBefore),
    },
    {
      key: 'change',
      label: '变更量(L)',
      align: 'right' as const,
      render: (row: any) => (
        <span className={row.change > 0 ? 'text-green-600' : 'text-red-600'}>
          {row.change > 0 ? '+' : ''}{formatVolume(row.change)}
        </span>
      ),
    },
    {
      key: 'volumeAfter',
      label: '变更后(L)',
      align: 'right' as const,
      render: (row: any) => formatVolume(row.volumeAfter),
    },
    {
      key: 'operator',
      label: '操作人',
      align: 'center' as const,
    },
  ];

  const generateHistoryData = (tank: Tank) => {
    const history: any[] = [];
    const tankDeliveries = deliveries.filter((d) => d.tankId === tank.id);
    
    tankDeliveries.forEach((d) => {
      history.push({
        id: d.id,
        time: d.startTime,
        type: 'delivery',
        volumeBefore: tank.volume - d.quantity,
        change: d.quantity,
        volumeAfter: tank.volume,
        operator: d.guardian,
      });
    });

    for (let i = 0; i < 10; i++) {
      const change = -(Math.random() * 500 + 100);
      history.push({
        id: `sale-${i}`,
        time: new Date(Date.now() - i * 3600000 * 6).toISOString(),
        type: 'sale',
        volumeBefore: tank.volume + Math.abs(change),
        change: Number(change.toFixed(2)),
        volumeAfter: tank.volume,
        operator: '系统自动',
      });
    }

    return history.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <Fuel className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">油罐总数</p>
              <p className="text-2xl font-bold text-gray-800">{tanks.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-500 flex items-center justify-center">
              <Droplets className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">总库存</p>
              <p className="text-2xl font-bold text-gray-800">{formatVolume(totalVolume)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Thermometer className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">平均温度</p>
              <p className="text-2xl font-bold text-gray-800">
                {(tanks.reduce((sum, t) => sum + t.temperature, 0) / tanks.length).toFixed(1)}°C
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">异常罐数</p>
              <p className="text-2xl font-bold text-gray-800">
                {tanks.filter((t) => t.status !== 'normal').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Fuel className="w-5 h-5 text-[#1e3a5f]" />
            总库存概览
          </h3>
        </div>
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-gray-500">总容量: {formatVolume(totalCapacity)}</span>
          <span className="text-gray-500">当前库存: {formatVolume(totalVolume)}</span>
          <span className="font-semibold text-[#1e3a5f]">整体液位: {overallLevel.toFixed(1)}%</span>
        </div>
        <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#1e3a5f] to-[#3d5a7f] transition-all duration-500"
            style={{ width: `${overallLevel}%` }}
          />
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            'px-4 py-2 font-medium text-sm border-b-2 transition-colors -mb-px',
            activeTab === 'overview'
              ? 'border-[#f59e0b] text-[#1e3a5f]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          油罐概览
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            'px-4 py-2 font-medium text-sm border-b-2 transition-colors -mb-px',
            activeTab === 'history'
              ? 'border-[#f59e0b] text-[#1e3a5f]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <span className="flex items-center gap-1">
            <History className="w-4 h-4" />
            历史记录
          </span>
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tanks.map((tank) => (
              <TankVisual
                key={tank.id}
                tank={tank}
                onClick={() => setSelectedTank(tank)}
              />
            ))}
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">油罐详细信息</h3>
            <DataTable
              columns={[
                {
                  key: 'tankNo',
                  label: '罐号',
                  render: (row: Tank) => (
                    <span className="font-semibold text-[#1e3a5f]">{row.tankNo}</span>
                  ),
                },
                {
                  key: 'fuelType',
                  label: '油品',
                  align: 'center' as const,
                  render: (row: Tank) => (
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${FUEL_COLORS[row.fuelType as keyof typeof FUEL_COLORS]}20`,
                        color: FUEL_COLORS[row.fuelType as keyof typeof FUEL_COLORS],
                      }}
                    >
                      {row.fuelType}
                    </span>
                  ),
                },
                {
                  key: 'capacity',
                  label: '总容量(L)',
                  align: 'right' as const,
                  render: (row: Tank) => row.capacity.toLocaleString(),
                },
                {
                  key: 'volume',
                  label: '当前库存(L)',
                  align: 'right' as const,
                  render: (row: Tank) => <span className="font-semibold">{row.volume.toLocaleString()}</span>,
                },
                {
                  key: 'currentLevel',
                  label: '液位(%)',
                  align: 'right' as const,
                  render: (row: Tank) => (
                    <div className="flex items-center gap-2 justify-end">
                      <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            row.status === 'alert'
                              ? 'bg-red-500'
                              : row.status === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-green-500'
                          )}
                          style={{ width: `${row.currentLevel}%` }}
                        />
                      </div>
                      <span>{row.currentLevel?.toFixed(1) || '-'}%</span>
                    </div>
                  ),
                },
                {
                  key: 'temperature',
                  label: '温度(°C)',
                  align: 'center' as const,
                  render: (row: Tank) => row.temperature?.toFixed(1) || '-',
                },
                {
                  key: 'status',
                  label: '状态',
                  align: 'center' as const,
                  render: (row: Tank) => (
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getStatusColor(row.status))}>
                      {getStatusText(row.status)}
                    </span>
                  ),
                },
                {
                  key: 'lastUpdate',
                  label: '更新时间',
                  render: (row: Tank) => formatDateTime(row.lastUpdate),
                },
              ]}
              data={tanks}
              pagination={false}
              rowKey={(row) => row.id}
              onRowClick={(row) => setSelectedTank(row)}
            />
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <h4 className="font-semibold text-gray-700">选择油罐</h4>
            {tanks.map((tank) => (
              <button
                key={tank.id}
                onClick={() => setSelectedTank(tank)}
                className={cn(
                  'w-full p-4 rounded-xl border text-left transition-all',
                  selectedTank?.id === tank.id
                    ? 'border-[#f59e0b] bg-amber-50'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{tank.tankNo}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${FUEL_COLORS[tank.fuelType as keyof typeof FUEL_COLORS]}20`,
                      color: FUEL_COLORS[tank.fuelType as keyof typeof FUEL_COLORS],
                    }}
                  >
                    {tank.fuelType}
                  </span>
                </div>
                <p className="text-sm text-gray-500">库存: {formatVolume(tank.volume)}</p>
              </button>
            ))}
          </div>
          <div className="lg:col-span-3 space-y-6">
            {selectedTank ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl p-5 border border-gray-100">
                    <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      24小时液位趋势
                    </h4>
                    <ReactECharts option={levelHistoryOption} style={{ height: '250px' }} />
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-gray-100">
                    <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-red-500" />
                      24小时温度趋势
                    </h4>
                    <ReactECharts option={temperatureHistoryOption} style={{ height: '250px' }} />
                  </div>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-100">
                  <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#1e3a5f]" />
                    库存变更记录
                  </h4>
                  <DataTable
                    columns={historyColumns}
                    data={generateHistoryData(selectedTank)}
                    rowKey={(row) => row.id}
                    pageSize={10}
                  />
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl p-12 border border-gray-100 text-center">
                <Fuel className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">请选择左侧油罐查看历史记录</p>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal
        isOpen={!!selectedTank && activeTab === 'overview'}
        onClose={() => setSelectedTank(null)}
        title={`${selectedTank?.tankNo} 详细信息`}
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setSelectedTank(null)}>
            关闭
          </Button>
        }
      >
        {selectedTank && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <TankVisual tank={selectedTank} />
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">油品类型</p>
                  <p className="text-lg font-bold">{selectedTank.fuelType}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">总容量</p>
                  <p className="text-lg font-bold">{formatVolume(selectedTank.capacity)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">可用空间</p>
                  <p className="text-lg font-bold">
                    {formatVolume(selectedTank.capacity - selectedTank.volume)}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">当前状态</p>
                  <span className={cn('px-3 py-1 rounded-full text-sm font-medium', getStatusColor(selectedTank.status))}>
                    {getStatusText(selectedTank.status)}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">液位趋势</h4>
                <ReactECharts option={levelHistoryOption} style={{ height: '200px' }} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">温度趋势</h4>
                <ReactECharts option={temperatureHistoryOption} style={{ height: '200px' }} />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
