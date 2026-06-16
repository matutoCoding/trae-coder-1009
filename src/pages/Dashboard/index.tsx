import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import {
  DollarSign,
  Droplets,
  Users,
  ShieldAlert,
  TrendingUp,
  Fuel,
  AlertTriangle,
  Truck,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '../../store';
import { StatusCard } from '../../components/ui/StatusCard';
import { TankVisual } from '../../components/ui/TankVisual';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import {
  formatCurrency,
  formatVolume,
  formatDateTime,
  getStatusText,
  getStatusColor,
  getPaymentMethodText,
  cn,
} from '../../utils';
import { FUEL_COLORS, Sale, Delivery } from '../../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const tanks = useAppStore((state) => state.tanks);
  const sales = useAppStore((state) => state.sales);
  const members = useAppStore((state) => state.members);
  const deliveries = useAppStore((state) => state.deliveries);
  const recharges = useAppStore((state) => state.recharges);
  const safetyChecks = useAppStore((state) => state.safetyChecks);
  const fireFacilities = useAppStore((state) => state.fireFacilities);
  const lightningProtection = useAppStore((state) => state.lightningProtection);

  const today = new Date().toDateString();
  const todaySales = sales.filter(
    (s) => new Date(s.saleTime).toDateString() === today
  );
  const todayRecharges = recharges.filter(
    (r) => new Date(r.rechargeTime).toDateString() === today
  );

  const stats = useMemo(() => {
    const totalSales = todaySales.reduce((sum, s) => sum + s.amount, 0);
    const totalVolume = todaySales.reduce((sum, s) => sum + s.volume, 0);
    const totalRecharge = todayRecharges.reduce((sum, r) => sum + r.amount, 0);
    const activeMembers = members.filter((m) => m.status === 'active').length;
    
    const alerts = [
      ...tanks.filter((t) => t.status === 'alert').map((t) => ({
        type: '库存告警',
        message: `${t.tankNo} ${t.fuelType} 库存低于20%`,
        level: 'danger',
      })),
      ...tanks.filter((t) => t.status === 'warning').map((t) => ({
        type: '库存预警',
        message: `${t.tankNo} ${t.fuelType} 库存低于40%`,
        level: 'warning',
      })),
      ...fireFacilities.filter((f) => f.status !== 'normal').map((f) => ({
        type: '消防设施',
        message: `${f.name} ${f.location} ${getStatusText(f.status)}`,
        level: f.status === 'expired' ? 'danger' : 'warning',
      })),
      ...lightningProtection.filter((l) => l.status !== 'normal').map((l) => ({
        type: '防雷设施',
        message: `${l.location} ${l.type} ${getStatusText(l.status)}`,
        level: l.status === 'expired' ? 'danger' : 'warning',
      })),
      ...safetyChecks.filter((c) => c.result === 'fail').slice(0, 3).map((c) => ({
        type: '安全检查',
        message: `${c.checkDate} 检查发现隐患`,
        level: 'danger',
      })),
    ];

    return {
      totalSales,
      totalVolume,
      totalRecharge,
      activeMembers,
      alerts,
    };
  }, [tanks, sales, members, recharges, fireFacilities, lightningProtection, safetyChecks, todaySales, todayRecharges]);

  const salesChartOption = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const dailyData = last7Days.map((date) => {
      const dayStr = date.toDateString();
      const daySales = sales.filter((s) => new Date(s.saleTime).toDateString() === dayStr);
      return {
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        amount: daySales.reduce((sum, s) => sum + s.amount, 0),
        volume: daySales.reduce((sum, s) => sum + s.volume, 0),
      };
    });

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e5e7eb',
        textStyle: { color: '#374151' },
      },
      legend: {
        data: ['销售额', '销售量'],
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
        data: dailyData.map((d) => d.date),
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280' },
      },
      yAxis: [
        {
          type: 'value',
          name: '金额(元)',
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#6b7280' },
          splitLine: { lineStyle: { color: '#f3f4f6' } },
        },
        {
          type: 'value',
          name: '升数(L)',
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#6b7280' },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '销售额',
          type: 'bar',
          data: dailyData.map((d) => d.amount.toFixed(0)),
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#1e3a5f' },
                { offset: 1, color: '#3d5a7f' },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          name: '销售量',
          type: 'line',
          yAxisIndex: 1,
          data: dailyData.map((d) => d.volume.toFixed(0)),
          smooth: true,
          lineStyle: { color: '#f59e0b', width: 3 },
          itemStyle: { color: '#f59e0b' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(245,158,11,0.3)' },
                { offset: 1, color: 'rgba(245,158,11,0.05)' },
              ],
            },
          },
        },
      ],
    };
  }, [sales]);

  const fuelDistributionOption = useMemo(() => {
    const fuelStats: Record<string, number> = {};
    sales.forEach((s) => {
      fuelStats[s.fuelType] = (fuelStats[s.fuelType] || 0) + s.volume;
    });

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} L ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
      },
      series: [
        {
          type: 'pie',
          radius: ['50%', '75%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
            },
          },
          data: Object.entries(fuelStats).map(([name, value]) => ({
            name,
            value: Number(value.toFixed(0)),
            itemStyle: { color: FUEL_COLORS[name as keyof typeof FUEL_COLORS] || '#6b7280' },
          })),
        },
      ],
    };
  }, [sales]);

  const quickActions = [
    { label: '新增卸油', icon: Truck, path: '/oil-delivery', color: 'amber' },
    { label: '油品盘点', icon: Droplets, path: '/inventory', color: 'blue' },
    { label: '会员充值', icon: Users, path: '/members', color: 'green' },
    { label: '安全检查', icon: ShieldAlert, path: '/safety', color: 'red' },
  ];

  const recentSalesColumns = [
    {
      key: 'saleTime',
      label: '时间',
      render: (row: Sale) => formatDateTime(row.saleTime),
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
      render: (row: Sale) => formatVolume(row.volume),
    },
    {
      key: 'amount',
      label: '金额(元)',
      align: 'right' as const,
      render: (row: Sale) => <span className="font-semibold">{formatCurrency(row.amount)}</span>,
    },
    {
      key: 'paymentMethod',
      label: '支付方式',
      align: 'center' as const,
      render: (row: Sale) => getPaymentMethodText(row.paymentMethod),
    },
  ];

  const recentDeliveriesColumns = [
    {
      key: 'tankerNo',
      label: '油罐车',
    },
    {
      key: 'fuelType',
      label: '油品',
      align: 'center' as const,
      render: (row: Delivery) => (
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
      key: 'quantity',
      label: '数量(L)',
      align: 'right' as const,
      render: (row: Delivery) => formatVolume(row.quantity),
    },
    {
      key: 'status',
      label: '状态',
      align: 'center' as const,
      render: (row: Delivery) => (
        <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getStatusColor(row.status))}>
          {getStatusText(row.status)}
        </span>
      ),
    },
    {
      key: 'startTime',
      label: '开始时间',
      render: (row: Delivery) => formatDateTime(row.startTime),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          title="今日销售额"
          value={formatCurrency(stats.totalSales)}
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
          trend={{ value: 12.5, isUp: true }}
          subtitle={`${formatVolume(stats.totalVolume)}`}
        />
        <StatusCard
          title="今日充值"
          value={formatCurrency(stats.totalRecharge)}
          icon={<TrendingUp className="w-6 h-6" />}
          color="amber"
          trend={{ value: 8.3, isUp: true }}
        />
        <StatusCard
          title="活跃会员"
          value={stats.activeMembers}
          icon={<Users className="w-6 h-6" />}
          color="blue"
          subtitle="累计会员数"
        />
        <StatusCard
          title="安全告警"
          value={stats.alerts.length}
          icon={<AlertTriangle className="w-6 h-6" />}
          color={stats.alerts.some((a) => a.level === 'danger') ? 'red' : 'amber'}
          subtitle="待处理事项"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className="flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-200 group"
          >
            <div
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
                action.color === 'amber' && 'bg-amber-50 text-amber-500',
                action.color === 'blue' && 'bg-blue-50 text-blue-500',
                action.color === 'green' && 'bg-green-50 text-green-500',
                action.color === 'red' && 'bg-red-50 text-red-500'
              )}
            >
              <action.icon className="w-6 h-6" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-800">{action.label}</p>
              <p className="text-sm text-gray-400">点击进入</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </button>
        ))}
      </div>

      {stats.alerts.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            预警提醒
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {stats.alerts.map((alert, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg',
                  alert.level === 'danger' ? 'bg-red-50' : 'bg-amber-50'
                )}
              >
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    alert.level === 'danger' ? 'bg-red-500' : 'bg-amber-500'
                  )}
                />
                <Badge variant={alert.level === 'danger' ? 'danger' : 'warning'} size="sm">
                  {alert.type}
                </Badge>
                <span className="text-sm text-gray-700">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Fuel className="w-5 h-5 text-[#1e3a5f]" />
            油罐库存
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {tanks.map((tank) => (
              <TankVisual key={tank.id} tank={tank} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">销售趋势</h3>
          <ReactECharts option={salesChartOption} style={{ height: '300px' }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">油品销售分布</h3>
          <ReactECharts option={fuelDistributionOption} style={{ height: '250px' }} />
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">最近卸油记录</h3>
            <button
              onClick={() => navigate('/oil-delivery')}
              className="text-sm text-[#1e3a5f] hover:underline flex items-center gap-1"
            >
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <DataTable
            columns={recentDeliveriesColumns}
            data={deliveries.slice(0, 5)}
            pagination={false}
            rowKey={(row) => row.id}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">最近销售记录</h3>
          <button
            onClick={() => navigate('/fuel-sales')}
            className="text-sm text-[#1e3a5f] hover:underline flex items-center gap-1"
          >
            查看全部 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <DataTable
          columns={recentSalesColumns}
          data={sales.slice(0, 10)}
          pagination={false}
          rowKey={(row) => row.id}
        />
      </div>
    </div>
  );
}
