import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  ClipboardList,
  Plus,
  Search,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Droplets,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useAppStore } from '../../store';
import { StatusCard } from '../../components/ui/StatusCard';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Inventory } from '../../types';
import { formatCurrency, formatVolume, formatDateTime, getStatusColor, getStatusText } from '../../utils';
import ReactECharts from 'echarts-for-react';

const InventoryPage: React.FC = () => {
  const { tanks, inventories, addInventory, sales, deliveries } = useAppStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTankId, setSelectedTankId] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<{
    tankId: string;
    bookQuantity: number;
    actualQuantity: number;
    handler: string;
    remarks: string;
  }>({
    defaultValues: {
      bookQuantity: 0,
      actualQuantity: 0,
    },
  });

  const watchBookQuantity = watch('bookQuantity');
  const watchActualQuantity = watch('actualQuantity');
  const watchTankId = watch('tankId');

  const difference = useMemo(() => {
    return (watchActualQuantity || 0) - (watchBookQuantity || 0);
  }, [watchActualQuantity, watchBookQuantity]);

  const differenceRate = useMemo(() => {
    if (!watchBookQuantity || watchBookQuantity === 0) return 0;
    return (difference / watchBookQuantity) * 100;
  }, [difference, watchBookQuantity]);

  const todayInventories = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return inventories.filter((inv) => inv.inventoryDate.startsWith(today));
  }, [inventories]);

  const filteredInventories = useMemo(() => {
    return inventories.filter((inv) => {
      if (searchKeyword) {
        const tank = tanks.find((t) => t.id === inv.tankId);
        const keyword = searchKeyword.toLowerCase();
        return (
          (tank?.tankNo.toLowerCase().includes(keyword)) ||
          inv.handler.toLowerCase().includes(keyword) ||
          inv.inventoryDate.includes(keyword)
        );
      }
      return true;
    });
  }, [inventories, searchKeyword, tanks]);

  const calculateBookQuantity = (tankId: string) => {
    const tank = tanks.find((t) => t.id === tankId);
    if (!tank) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySales = sales.filter(
      (s) => s.saleTime >= today.toISOString() && s.saleTime < tomorrow.toISOString() && s.fuelType === tank.fuelType
    );
    const salesVolume = todaySales.reduce((sum, s) => sum + s.volume, 0);

    const todayDeliveries = deliveries.filter(
      (d) => d.startTime >= today.toISOString() && d.startTime < tomorrow.toISOString() && d.tankId === tankId && d.status === 'completed'
    );
    const deliveryVolume = todayDeliveries.reduce((sum, d) => sum + d.quantity, 0);

    return tank.volume + deliveryVolume - salesVolume;
  };

  const handleTankSelect = (tankId: string) => {
    setSelectedTankId(tankId);
    const bookQty = calculateBookQuantity(tankId);
    setValue('tankId', tankId);
    setValue('bookQuantity', Number(bookQty.toFixed(2)));
  };

  const onSubmit = (data: any) => {
    const tank = tanks.find((t) => t.id === data.tankId);
    if (!tank) return;

    const diff = data.actualQuantity - data.bookQuantity;
    const diffRate = data.bookQuantity > 0 ? (diff / data.bookQuantity) * 100 : 0;

    const inventory: Inventory = {
      id: Date.now().toString(),
      inventoryDate: new Date().toISOString(),
      tankId: data.tankId,
      bookQuantity: data.bookQuantity,
      actualQuantity: data.actualQuantity,
      difference: Number(diff.toFixed(2)),
      differenceRate: Number(diffRate.toFixed(2)),
      handler: data.handler,
      remarks: data.remarks,
      status: Math.abs(diffRate) <= 0.3 ? 'normal' : 'abnormal',
    };

    addInventory(inventory);
    setIsAddModalOpen(false);
    reset();
    setSelectedTankId('');
  };

  const exportData = () => {
    const headers = ['日期', '油罐', '油品', '账面数量', '实际数量', '差异', '差异率', '盘点人', '状态'];
    const rows = filteredInventories.map((inv) => {
      const tank = tanks.find((t) => t.id === inv.tankId);
      return [
        inv.inventoryDate,
        tank?.tankNo || '',
        tank?.fuelType || '',
        inv.bookQuantity.toFixed(2),
        inv.actualQuantity.toFixed(2),
        inv.difference.toFixed(2),
        `${inv.differenceRate.toFixed(2)}%`,
        inv.handler,
        inv.status === 'normal' ? '正常' : '异常',
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `油品盘点记录_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const chartOption = useMemo(() => {
    const last10Days = [...inventories]
      .sort((a, b) => new Date(a.inventoryDate).getTime() - new Date(b.inventoryDate).getTime())
      .slice(-10);

    return {
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['账面数量', '实际数量'],
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: last10Days.map((inv) => inv.inventoryDate.split('T')[0].slice(5)),
      },
      yAxis: {
        type: 'value',
        name: '数量(L)',
      },
      series: [
        {
          name: '账面数量',
          type: 'bar',
          data: last10Days.map((inv) => inv.bookQuantity),
          itemStyle: { color: '#3b82f6' },
        },
        {
          name: '实际数量',
          type: 'bar',
          data: last10Days.map((inv) => inv.actualQuantity),
          itemStyle: { color: '#10b981' },
        },
      ],
    };
  }, [inventories]);

  const columns = [
    { key: 'inventoryDate', label: '盘点时间', render: (v: string) => formatDateTime(v) },
    {
      key: 'tankId',
      label: '油罐',
      render: (v: string) => {
        const tank = tanks.find((t) => t.id === v);
        return tank ? `${tank.tankNo} (${tank.fuelType})` : '-';
      },
    },
    { key: 'bookQuantity', label: '账面数量(L)', render: (v: number) => v?.toFixed(2) || '-' },
    { key: 'actualQuantity', label: '实际数量(L)', render: (v: number) => v?.toFixed(2) || '-' },
    {
      key: 'difference',
      label: '差异(L)',
      render: (v: number) => (
        <span className={v >= 0 ? 'text-green-600' : 'text-red-600'}>
          {v >= 0 ? '+' : ''}{v?.toFixed(2) || '-'}
        </span>
      ),
    },
    {
      key: 'differenceRate',
      label: '差异率',
      render: (v: number) => (
        <span className={Math.abs(v) <= 0.3 ? 'text-green-600' : 'text-red-600'}>
          {v >= 0 ? '+' : ''}{v?.toFixed(2) || '-'}%
        </span>
      ),
    },
    { key: 'handler', label: '盘点人' },
    {
      key: 'status',
      label: '状态',
      render: (v: string) => (
        <Badge variant={v === 'normal' ? 'success' : 'danger'}>
          {v === 'normal' ? '正常' : '异常'}
        </Badge>
      ),
    },
  ];

  const stats = useMemo(() => {
    const abnormalCount = todayInventories.filter((inv) => inv.status === 'abnormal').length;
    const totalDiff = todayInventories.reduce((sum, inv) => sum + inv.difference, 0);
    const avgDiffRate =
      todayInventories.length > 0
        ? todayInventories.reduce((sum, inv) => sum + inv.differenceRate, 0) / todayInventories.length
        : 0;

    return [
      {
        title: '今日盘点次数',
        value: todayInventories.length,
        icon: ClipboardList,
        trend: '+2',
        trendUp: true,
      },
      {
        title: '异常盘点',
        value: abnormalCount,
        icon: AlertTriangle,
        trend: abnormalCount > 0 ? '需要关注' : '全部正常',
        trendUp: abnormalCount === 0,
        color: abnormalCount > 0 ? 'text-red-600' : 'text-green-600',
      },
      {
        title: '累计差异量',
        value: `${totalDiff >= 0 ? '+' : ''}${totalDiff.toFixed(2)} L`,
        icon: totalDiff >= 0 ? TrendingUp : TrendingDown,
        trend: '较昨日',
        trendUp: totalDiff >= 0,
      },
      {
        title: '平均差异率',
        value: `${avgDiffRate.toFixed(2)}%`,
        icon: Droplets,
        trend: Math.abs(avgDiffRate) <= 0.3 ? '在允许范围内' : '超出允许范围',
        trendUp: Math.abs(avgDiffRate) <= 0.3,
      },
    ];
  }, [todayInventories]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">油品盘点</h1>
          <p className="text-gray-500 mt-1">日盘点账实核对，确保库存准确</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新增盘点
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatusCard key={index} {...stat} />
        ))}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              盘点概览
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'history' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              历史记录
            </button>
          </nav>
        </div>

        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">油罐列表</h3>
                <div className="space-y-3">
                  {tanks.map((tank) => (
                    <div
                      key={tank.id}
                      onClick={() => handleTankSelect(tank.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedTankId === tank.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">
                            {tank.tankNo} - {tank.fuelType}
                          </div>
                          <div className="text-sm text-gray-500">
                            当前库存: {formatVolume(tank.volume)} / {formatVolume(tank.capacity)}
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tank.status)}`}>
                          {getStatusText(tank.status)}
                        </div>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${tank.currentLevel}%`,
                            backgroundColor: tank.currentLevel < 20 ? '#ef4444' : tank.currentLevel < 40 ? '#f59e0b' : '#10b981',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">盘点趋势</h3>
                <div className="h-80">
                  <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">今日盘点记录</h3>
              {todayInventories.length > 0 ? (
                <DataTable
                  data={todayInventories}
                  columns={columns}
                  pagination={false}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>今日暂无盘点记录</p>
                  <p className="text-sm">点击上方"新增盘点"按钮开始盘点</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="搜索油罐编号、盘点人..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <Button variant="secondary" onClick={exportData}>
                <Download className="w-4 h-4 mr-2" />
                导出数据
              </Button>
            </div>

            <DataTable
              data={filteredInventories}
              columns={columns}
              pagination={true}
              pageSize={10}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          reset();
          setSelectedTankId('');
        }}
        title="新增油品盘点"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              选择油罐 <span className="text-red-500">*</span>
            </label>
            <select
              {...register('tankId', { required: '请选择油罐' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">请选择油罐</option>
              {tanks.map((tank) => (
                <option key={tank.id} value={tank.id}>
                  {tank.tankNo} - {tank.fuelType} (当前: {formatVolume(tank.volume)})
                </option>
              ))}
            </select>
            {errors.tankId && <p className="text-red-500 text-sm mt-1">{errors.tankId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                账面数量(L) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register('bookQuantity', {
                  required: '请输入账面数量',
                  min: { value: 0, message: '数量不能为负数' },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              {errors.bookQuantity && (
                <p className="text-red-500 text-sm mt-1">{errors.bookQuantity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                实际数量(L) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register('actualQuantity', {
                  required: '请输入实际数量',
                  min: { value: 0, message: '数量不能为负数' },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              {errors.actualQuantity && (
                <p className="text-red-500 text-sm mt-1">{errors.actualQuantity.message}</p>
              )}
            </div>
          </div>

          <div className={`p-4 rounded-lg ${Math.abs(differenceRate) <= 0.3 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {Math.abs(differenceRate) <= 0.3 ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-medium ${Math.abs(differenceRate) <= 0.3 ? 'text-green-700' : 'text-red-700'}`}>
                  {Math.abs(differenceRate) <= 0.3 ? '盘点正常' : '盘点异常'}
                </span>
              </div>
              <div className="text-right">
                <div className={`font-bold ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  差异: {difference >= 0 ? '+' : ''}{difference.toFixed(2)} L
                </div>
                <div className={`text-sm ${Math.abs(differenceRate) <= 0.3 ? 'text-green-600' : 'text-red-600'}`}>
                  差异率: {differenceRate >= 0 ? '+' : ''}{differenceRate.toFixed(2)}%
                </div>
              </div>
            </div>
            <p className="text-sm mt-2 text-gray-600">
              正常损耗允许范围: ±0.3%，{Math.abs(differenceRate) <= 0.3 ? '当前在允许范围内' : '当前超出允许范围，请查明原因'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              盘点人 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('handler', { required: '请输入盘点人' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="请输入盘点人姓名"
            />
            {errors.handler && <p className="text-red-500 text-sm mt-1">{errors.handler.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              {...register('remarks')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="请输入备注信息（如发现异常的原因说明等）"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                reset();
                setSelectedTankId('');
              }}
            >
              取消
            </Button>
            <Button type="submit">确认盘点</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryPage;
