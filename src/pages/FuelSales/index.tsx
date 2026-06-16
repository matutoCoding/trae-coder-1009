import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Fuel,
  DollarSign,
  Droplets,
  Users,
  Search,
  Filter,
  Download,
  Plus,
  Wrench,
  Clock,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useAppStore } from '../../store';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatusCard } from '../../components/ui/StatusCard';
import {
  formatCurrency,
  formatVolume,
  formatDateTime,
  formatDate,
  getStatusText,
  getStatusColor,
  getPaymentMethodText,
  cn,
  generateId,
} from '../../utils';
import { Sale, FuelNozzle, FUEL_COLORS, FUEL_PRICES } from '../../types';

export default function FuelSales() {
  const sales = useAppStore((state) => state.sales);
  const nozzles = useAppStore((state) => state.nozzles);
  const members = useAppStore((state) => state.members);
  const addSale = useAppStore((state) => state.addSale);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [selectedNozzle, setSelectedNozzle] = useState<FuelNozzle | null>(null);
  const [filters, setFilters] = useState({
    fuelType: '',
    paymentMethod: '',
    dateFrom: '',
    dateTo: '',
  });
  const [searchQuery, setSearchQuery] = useState('');

  const today = new Date().toDateString();
  const todaySales = sales.filter(
    (s) => new Date(s.saleTime).toDateString() === today
  );

  const stats = useMemo(() => {
    const totalSales = todaySales.reduce((sum, s) => sum + s.amount, 0);
    const totalVolume = todaySales.reduce((sum, s) => sum + s.volume, 0);
    const memberSales = todaySales.filter((s) => s.paymentMethod === 'member');
    const memberAmount = memberSales.reduce((sum, s) => sum + s.amount, 0);

    return {
      totalSales,
      totalVolume,
      transactionCount: todaySales.length,
      memberAmount,
      avgTransaction: totalSales / (todaySales.length || 1),
    };
  }, [todaySales]);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      if (filters.fuelType && sale.fuelType !== filters.fuelType) return false;
      if (filters.paymentMethod && sale.paymentMethod !== filters.paymentMethod) return false;
      if (filters.dateFrom && new Date(sale.saleTime) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(sale.saleTime) > new Date(filters.dateTo + ' 23:59:59')) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nozzle = nozzles.find((n) => n.id === sale.nozzleId);
        if (nozzle?.nozzleNo.toLowerCase().includes(query)) return true;
        if (sale.fuelType.toLowerCase().includes(query)) return true;
        return false;
      }
      return true;
    });
  }, [sales, filters, searchQuery, nozzles]);

  const hourlySalesOption = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const hourlyData = hours.map(() => ({ volume: 0, amount: 0 }));

    todaySales.forEach((sale) => {
      const hour = new Date(sale.saleTime).getHours();
      hourlyData[hour].volume += sale.volume;
      hourlyData[hour].amount += sale.amount;
    });

    return {
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['销售量(L)', '销售额(元)'],
        top: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: hours,
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280' },
      },
      yAxis: [
        {
          type: 'value',
          name: '升数(L)',
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#6b7280' },
          splitLine: { lineStyle: { color: '#f3f4f6' } },
        },
        {
          type: 'value',
          name: '金额(元)',
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#6b7280' },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '销售量(L)',
          type: 'bar',
          data: hourlyData.map((d) => d.volume.toFixed(0)),
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#3b82f6' },
                { offset: 1, color: '#60a5fa' },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          name: '销售额(元)',
          type: 'line',
          yAxisIndex: 1,
          data: hourlyData.map((d) => d.amount.toFixed(0)),
          smooth: true,
          lineStyle: { color: '#f59e0b', width: 2 },
          itemStyle: { color: '#f59e0b' },
        },
      ],
    };
  }, [todaySales]);

  const salesColumns = [
    {
      key: 'saleTime',
      label: '交易时间',
      render: (row: Sale) => formatDateTime(row.saleTime),
    },
    {
      key: 'nozzleId',
      label: '油枪',
      align: 'center' as const,
      render: (row: Sale) => nozzles.find((n) => n.id === row.nozzleId)?.nozzleNo || '-',
    },
    {
      key: 'fuelType',
      label: '油品',
      align: 'center' as const,
      render: (row: Sale) => (
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
      key: 'volume',
      label: '数量(L)',
      align: 'right' as const,
      render: (row: Sale) => row.volume?.toFixed(2) || '-',
    },
    {
      key: 'unitPrice',
      label: '单价(元)',
      align: 'right' as const,
      render: (row: Sale) => row.unitPrice?.toFixed(2) || '-',
    },
    {
      key: 'amount',
      label: '金额(元)',
      align: 'right' as const,
      render: (row: Sale) => <span className="font-semibold text-[#1e3a5f]">{formatCurrency(row.amount)}</span>,
    },
    {
      key: 'paymentMethod',
      label: '支付方式',
      align: 'center' as const,
      render: (row: Sale) => (
        <Badge variant="default">{getPaymentMethodText(row.paymentMethod)}</Badge>
      ),
    },
    {
      key: 'memberId',
      label: '会员',
      align: 'center' as const,
      render: (row: Sale) => {
        const member = members.find((m) => m.id === row.memberId);
        return member ? member.name : '-';
      },
    },
  ];

  const nozzleColumns = [
    {
      key: 'nozzleNo',
      label: '油枪编号',
      render: (row: FuelNozzle) => <span className="font-semibold text-[#1e3a5f]">{row.nozzleNo}</span>,
    },
    {
      key: 'fuelType',
      label: '油品',
      align: 'center' as const,
      render: (row: FuelNozzle) => (
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
      key: 'totalizer',
      label: '累计码数(L)',
      align: 'right' as const,
      render: (row: FuelNozzle) => row.totalizer.toLocaleString(),
    },
    {
      key: 'lastCalibrationDate',
      label: '上次校验',
      align: 'center' as const,
      render: (row: FuelNozzle) => formatDate(row.lastCalibrationDate),
    },
    {
      key: 'nextCalibrationDate',
      label: '下次校验',
      align: 'center' as const,
      render: (row: FuelNozzle) => formatDate(row.nextCalibrationDate),
    },
    {
      key: 'status',
      label: '状态',
      align: 'center' as const,
      render: (row: FuelNozzle) => (
        <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getStatusColor(row.status))}>
          {getStatusText(row.status)}
        </span>
      ),
    },
    {
      key: 'action',
      label: '操作',
      align: 'center' as const,
      render: (row: FuelNozzle) => (
        <div className="flex gap-2 justify-center">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSelectedNozzle(row);
              setShowCalibrationModal(true);
            }}
            icon={<Wrench className="w-3 h-3" />}
          >
            校验
          </Button>
        </div>
      ),
    },
  ];

  const handleQuickAddSale = () => {
    const fuelTypes = ['92#', '95#', '98#', '0#'] as const;
    const fuelType = fuelTypes[Math.floor(Math.random() * fuelTypes.length)];
    const volume = Math.random() * 40 + 10;
    const unitPrice = FUEL_PRICES[fuelType];
    const activeNozzles = nozzles.filter((n) => n.status === 'active' && n.fuelType === fuelType);
    const nozzle = activeNozzles[Math.floor(Math.random() * activeNozzles.length)];
    const paymentMethods: Sale['paymentMethod'][] = ['cash', 'card', 'member', 'wechat', 'alipay'];

    if (nozzle) {
      const newSale: Sale = {
        id: generateId(),
        nozzleId: nozzle.id,
        fuelType,
        volume: Number(volume.toFixed(2)),
        unitPrice,
        amount: Number((volume * unitPrice).toFixed(2)),
        saleTime: new Date().toISOString(),
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        status: 'completed',
      };
      addSale(newSale);
    }
  };

  const exportSales = () => {
    const data = filteredSales.map((s) => ({
      交易时间: formatDateTime(s.saleTime),
      油枪: nozzles.find((n) => n.id === s.nozzleId)?.nozzleNo,
      油品: s.fuelType,
      数量: s.volume.toFixed(2),
      单价: s.unitPrice.toFixed(2),
      金额: s.amount.toFixed(2),
      支付方式: getPaymentMethodText(s.paymentMethod),
      会员: members.find((m) => m.id === s.memberId)?.name || '-',
    }));

    const header = Object.keys(data[0] || {}).join(',');
    const rows = data.map((row) => Object.values(row).join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `销售记录_${formatDate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [activeSubTab, setActiveSubTab] = useState<'sales' | 'nozzles'>('sales');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          title="今日销售额"
          value={formatCurrency(stats.totalSales)}
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
          trend={{ value: 8.5, isUp: true }}
        />
        <StatusCard
          title="今日销售量"
          value={formatVolume(stats.totalVolume)}
          icon={<Droplets className="w-6 h-6" />}
          color="blue"
          trend={{ value: 5.2, isUp: true }}
        />
        <StatusCard
          title="交易笔数"
          value={stats.transactionCount}
          icon={<Fuel className="w-6 h-6" />}
          color="purple"
          subtitle={`平均 ${formatCurrency(stats.avgTransaction)}`}
        />
        <StatusCard
          title="会员消费"
          value={formatCurrency(stats.memberAmount)}
          icon={<Users className="w-6 h-6" />}
          color="amber"
          trend={{ value: 12.3, isUp: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">24小时销售趋势</h3>
          <ReactECharts option={hourlySalesOption} style={{ height: '300px' }} />
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">油枪状态</h3>
          <div className="grid grid-cols-2 gap-3">
            {nozzles.map((nozzle) => (
              <div
                key={nozzle.id}
                className={cn(
                  'p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md',
                  nozzle.status === 'active'
                    ? 'border-green-200 bg-green-50'
                    : nozzle.status === 'maintenance'
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-gray-200 bg-gray-50'
                )}
                onClick={() => {
                  setSelectedNozzle(nozzle);
                  setShowCalibrationModal(true);
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{nozzle.nozzleNo}</span>
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      nozzle.status === 'active'
                        ? 'bg-green-500'
                        : nozzle.status === 'maintenance'
                        ? 'bg-amber-500'
                        : 'bg-gray-400'
                    )}
                  />
                </div>
                <p
                  className="text-xs font-medium"
                  style={{ color: FUEL_COLORS[nozzle.fuelType as keyof typeof FUEL_COLORS] }}
                >
                  {nozzle.fuelType}
                </p>
                <p className="text-xs text-gray-500 mt-1">{nozzle.totalizer.toLocaleString()} L</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveSubTab('sales')}
            className={cn(
              'px-4 py-2 font-medium text-sm border-b-2 transition-colors -mb-px',
              activeSubTab === 'sales'
                ? 'border-[#f59e0b] text-[#1e3a5f]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            销售记录
          </button>
          <button
            onClick={() => setActiveSubTab('nozzles')}
            className={cn(
              'px-4 py-2 font-medium text-sm border-b-2 transition-colors -mb-px',
              activeSubTab === 'nozzles'
                ? 'border-[#f59e0b] text-[#1e3a5f]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            油枪管理
          </button>
        </div>
        <div className="flex gap-3">
          {activeSubTab === 'sales' && (
            <>
              <Button variant="secondary" onClick={handleQuickAddSale} icon={<Plus className="w-4 h-4" />}>
                模拟交易
              </Button>
              <Button variant="secondary" onClick={exportSales} icon={<Download className="w-4 h-4" />}>
                导出数据
              </Button>
            </>
          )}
        </div>
      </div>

      {activeSubTab === 'sales' && (
        <>
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索油枪号或油品..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filters.fuelType}
                  onChange={(e) => setFilters({ ...filters, fuelType: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none text-sm"
                >
                  <option value="">全部油品</option>
                  <option value="92#">92# 汽油</option>
                  <option value="95#">95# 汽油</option>
                  <option value="98#">98# 汽油</option>
                  <option value="0#">0# 柴油</option>
                </select>
              </div>
              <div>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none text-sm"
                >
                  <option value="">全部支付方式</option>
                  <option value="cash">现金</option>
                  <option value="card">银行卡</option>
                  <option value="member">会员余额</option>
                  <option value="wechat">微信支付</option>
                  <option value="alipay">支付宝</option>
                </select>
              </div>
              <div>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none text-sm"
                />
              </div>
              <div className="text-gray-400">至</div>
              <div>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none text-sm"
                />
              </div>
            </div>
          </div>

          <DataTable
            columns={salesColumns}
            data={filteredSales}
            rowKey={(row) => row.id}
            pageSize={15}
          />
        </>
      )}

      {activeSubTab === 'nozzles' && (
        <DataTable
          columns={nozzleColumns}
          data={nozzles}
          rowKey={(row) => row.id}
          pagination={false}
        />
      )}

      <Modal
        isOpen={showCalibrationModal && !!selectedNozzle}
        onClose={() => {
          setShowCalibrationModal(false);
          setSelectedNozzle(null);
        }}
        title="油枪计量校验"
        size="md"
        footer={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCalibrationModal(false);
                setSelectedNozzle(null);
              }}
            >
              取消
            </Button>
            <Button
              onClick={() => {
                alert('校验记录已保存！');
                setShowCalibrationModal(false);
                setSelectedNozzle(null);
              }}
            >
              保存校验
            </Button>
          </div>
        }
      >
        {selectedNozzle && (
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">油枪编号</p>
                  <p className="font-semibold">{selectedNozzle.nozzleNo}</p>
                </div>
                <div>
                  <p className="text-gray-500">油品类型</p>
                  <p className="font-semibold">{selectedNozzle.fuelType}</p>
                </div>
                <div>
                  <p className="text-gray-500">当前码数</p>
                  <p className="font-semibold">{selectedNozzle.totalizer.toLocaleString()} L</p>
                </div>
                <div>
                  <p className="text-gray-500">上次校验</p>
                  <p className="font-semibold">{formatDate(selectedNozzle.lastCalibrationDate)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标准量器读数(L) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none"
                  placeholder="请输入标准量器读数"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  油枪显示量(L) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none"
                  placeholder="请输入油枪显示量"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  校验人 *
                </label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none">
                  <option value="">请选择校验人</option>
                  <option value="陈站长">陈站长</option>
                  <option value="刘班长">刘班长</option>
                  <option value="周安全员">周安全员</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  校验结果 *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="result" value="pass" className="text-[#1e3a5f]" />
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      合格
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="result" value="fail" className="text-[#1e3a5f]" />
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      不合格
                    </span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  备注
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none resize-none"
                  placeholder="请输入备注信息"
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
