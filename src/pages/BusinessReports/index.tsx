import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Droplets,
  Users,
  Calendar,
  Download,
  FileText,
  Printer,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '../../store';
import { StatusCard } from '../../components/ui/StatusCard';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency, formatVolume, formatDateTime } from '../../utils';
import { FUEL_PRICES, FUEL_COLORS } from '../../types';
import ReactECharts from 'echarts-for-react';

const BusinessReportsPage: React.FC = () => {
  const { tanks, sales, deliveries, members, recharges, inventories } = useAppStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'daily' | 'trend'>('dashboard');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const stats = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const todaySales = sales.filter((s) => s.saleTime.startsWith(todayStr));
    const yesterdaySales = sales.filter((s) => s.saleTime.startsWith(yesterdayStr));

    const todayTotal = todaySales.reduce((sum, s) => sum + s.amount, 0);
    const yesterdayTotal = yesterdaySales.reduce((sum, s) => sum + s.amount, 0);
    const salesDiff = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : 0;

    const todayVolume = todaySales.reduce((sum, s) => sum + s.volume, 0);
    const yesterdayVolume = yesterdaySales.reduce((sum, s) => sum + s.volume, 0);
    const volumeDiff = yesterdayVolume > 0 ? ((todayVolume - yesterdayVolume) / yesterdayVolume) * 100 : 0;

    const todayRecharge = recharges
      .filter((r) => r.rechargeTime.startsWith(todayStr))
      .reduce((sum, r) => sum + r.amount, 0);

    const totalInventoryValue = tanks.reduce((sum, t) => {
      const price = FUEL_PRICES[t.fuelType as keyof typeof FUEL_PRICES] || 0;
      return sum + t.volume * price;
    }, 0);

    const profitMargin = 0.08;
    const todayProfit = todayTotal * profitMargin;

    return [
      {
        title: '今日销售额',
        value: formatCurrency(todayTotal),
        icon: DollarSign,
        trend: `${salesDiff >= 0 ? '+' : ''}${salesDiff.toFixed(1)}%`,
        trendUp: salesDiff >= 0,
        subtitle: `昨日 ${formatCurrency(yesterdayTotal)}`,
      },
      {
        title: '今日销售量',
        value: formatVolume(todayVolume),
        icon: Droplets,
        trend: `${volumeDiff >= 0 ? '+' : ''}${volumeDiff.toFixed(1)}%`,
        trendUp: volumeDiff >= 0,
        subtitle: `昨日 ${formatVolume(yesterdayVolume)}`,
      },
      {
        title: '今日充值',
        value: formatCurrency(todayRecharge),
        icon: Users,
        trend: '会员储值',
        trendUp: true,
      },
      {
        title: '库存总值',
        value: formatCurrency(totalInventoryValue),
        icon: BarChart3,
        trend: `利润 ¥${todayProfit.toFixed(2)}`,
        trendUp: true,
      },
    ];
  }, [sales, recharges, tanks]);

  const salesByFuelOption = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter((s) => s.saleTime.startsWith(todayStr));

    const fuelData: Record<string, { volume: number; amount: number }> = {};
    todaySales.forEach((s) => {
      if (!fuelData[s.fuelType]) {
        fuelData[s.fuelType] = { volume: 0, amount: 0 };
      }
      fuelData[s.fuelType].volume += s.volume;
      fuelData[s.fuelType].amount += s.amount;
    });

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        data: ['销售量(L)', '销售额(元)'],
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: Object.keys(fuelData),
      },
      yAxis: [
        {
          type: 'value',
          name: '销售量(L)',
        },
        {
          type: 'value',
          name: '销售额(元)',
        },
      ],
      series: [
        {
          name: '销售量(L)',
          type: 'bar',
          data: Object.values(fuelData).map((d) => d.volume.toFixed(2)),
          itemStyle: { color: '#3b82f6' },
        },
        {
          name: '销售额(元)',
          type: 'line',
          yAxisIndex: 1,
          data: Object.values(fuelData).map((d) => d.amount.toFixed(2)),
          itemStyle: { color: '#f59e0b' },
          smooth: true,
        },
      ],
    };
  }, [sales]);

  const weeklyTrendOption = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const salesData = last7Days.map((date) =>
      sales
        .filter((s) => s.saleTime.startsWith(date))
        .reduce((sum, s) => sum + s.amount, 0)
    );

    const volumeData = last7Days.map((date) =>
      sales
        .filter((s) => s.saleTime.startsWith(date))
        .reduce((sum, s) => sum + s.volume, 0)
    );

    const rechargeData = last7Days.map((date) =>
      recharges
        .filter((r) => r.rechargeTime.startsWith(date))
        .reduce((sum, r) => sum + r.amount, 0)
    );

    return {
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['销售额', '销售量', '会员充值'],
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: last7Days.map((d) => d.slice(5)),
      },
      yAxis: [
        {
          type: 'value',
          name: '金额(元)',
        },
        {
          type: 'value',
          name: '数量(L)',
        },
      ],
      series: [
        {
          name: '销售额',
          type: 'line',
          data: salesData,
          itemStyle: { color: '#f59e0b' },
          smooth: true,
          areaStyle: {
            opacity: 0.3,
          },
        },
        {
          name: '销售量',
          type: 'bar',
          yAxisIndex: 1,
          data: volumeData,
          itemStyle: { color: '#3b82f6' },
        },
        {
          name: '会员充值',
          type: 'line',
          data: rechargeData,
          itemStyle: { color: '#10b981' },
          smooth: true,
        },
      ],
    };
  }, [sales, recharges]);

  const pieOption = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter((s) => s.saleTime.startsWith(todayStr));

    const fuelData: Record<string, number> = {};
    todaySales.forEach((s) => {
      fuelData[s.fuelType] = (fuelData[s.fuelType] || 0) + s.amount;
    });

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ¥{c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
      },
      series: [
        {
          name: '油品销售占比',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
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
              fontSize: 20,
              fontWeight: 'bold',
            },
          },
          labelLine: {
            show: false,
          },
          data: Object.entries(fuelData).map(([name, value]) => ({
            value: value.toFixed(2),
            name,
            itemStyle: { color: FUEL_COLORS[name as keyof typeof FUEL_COLORS] },
          })),
        },
      ],
    };
  }, [sales]);

  const paymentOption = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter((s) => s.saleTime.startsWith(todayStr));

    const paymentData: Record<string, number> = {};
    const paymentNames: Record<string, string> = {
      cash: '现金',
      card: '银行卡',
      member: '会员余额',
      wechat: '微信支付',
      alipay: '支付宝',
    };

    todaySales.forEach((s) => {
      const name = paymentNames[s.paymentMethod] || s.paymentMethod;
      paymentData[name] = (paymentData[name] || 0) + s.amount;
    });

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ¥{c} ({d}%)',
      },
      legend: {
        bottom: 10,
        left: 'center',
      },
      series: [
        {
          name: '支付方式',
          type: 'pie',
          radius: '50%',
          data: Object.entries(paymentData).map(([name, value]) => ({
            value: value.toFixed(2),
            name,
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    };
  }, [sales]);

  const dailyReportData = useMemo(() => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const daySales = sales.filter((s) => s.saleTime.startsWith(dateStr));
    const dayDeliveries = deliveries.filter((d) => d.startTime.startsWith(dateStr) && d.status === 'completed');
    const dayRecharges = recharges.filter((r) => r.rechargeTime.startsWith(dateStr));
    const dayInventories = inventories.filter((i) => i.inventoryDate.startsWith(dateStr));

    const totalSales = daySales.reduce((sum, s) => sum + s.amount, 0);
    const totalVolume = daySales.reduce((sum, s) => sum + s.volume, 0);
    const totalRecharge = dayRecharges.reduce((sum, r) => sum + r.amount, 0);
    const memberConsumption = daySales.filter((s) => s.paymentMethod === 'member').reduce((sum, s) => sum + s.amount, 0);

    const salesByFuel: { fuelType: string; volume: number; amount: number }[] = [];
    const fuelMap: Record<string, { volume: number; amount: number }> = {};
    daySales.forEach((s) => {
      if (!fuelMap[s.fuelType]) {
        fuelMap[s.fuelType] = { volume: 0, amount: 0 };
      }
      fuelMap[s.fuelType].volume += s.volume;
      fuelMap[s.fuelType].amount += s.amount;
    });
    Object.entries(fuelMap).forEach(([fuelType, data]) => {
      salesByFuel.push({ fuelType, ...data });
    });

    const inventoryChanges = tanks.map((tank) => {
      const dayStartVolume = tank.volume;
      const salesVolume = daySales.filter((s) => s.fuelType === tank.fuelType).reduce((sum, s) => sum + s.volume, 0);
      const deliveryVolume = dayDeliveries.filter((d) => d.tankId === tank.id).reduce((sum, d) => sum + d.quantity, 0);
      return {
        tankId: tank.id,
        tankNo: tank.tankNo,
        fuelType: tank.fuelType,
        startVolume: dayStartVolume + salesVolume - deliveryVolume,
        endVolume: tank.volume,
        salesVolume,
        deliveryVolume,
      };
    });

    const profit = totalSales * 0.08;

    return {
      reportDate: dateStr,
      totalSales,
      totalVolume,
      salesByFuel,
      memberRecharge: totalRecharge,
      memberConsumption,
      inventoryChanges,
      profit,
      transactionCount: daySales.length,
      rechargeCount: dayRecharges.length,
      inventoryCount: dayInventories.length,
    };
  }, [selectedDate, sales, deliveries, recharges, inventories, tanks]);

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const exportReport = () => {
    const report = dailyReportData;
    const content = `
经营日报
日期: ${report.reportDate}

一、销售概况
总销售额: ${formatCurrency(report.totalSales)}
总销售量: ${formatVolume(report.totalVolume)}
交易笔数: ${report.transactionCount}笔
预估利润: ${formatCurrency(report.profit)}

二、油品销售明细
${report.salesByFuel.map((s) => `${s.fuelType}: ${formatVolume(s.volume)} / ${formatCurrency(s.amount)}`).join('\n')}

三、会员业务
储值金额: ${formatCurrency(report.memberRecharge)} (${report.rechargeCount}笔)
会员消费: ${formatCurrency(report.memberConsumption)}

四、库存变动
${report.inventoryChanges.map((i) => `${i.tankNo}(${i.fuelType}): 期初 ${formatVolume(i.startVolume)} → 期末 ${formatVolume(i.endVolume)} | 销售 ${formatVolume(i.salesVolume)} | 进油 ${formatVolume(i.deliveryVolume)}`).join('\n')}

生成时间: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `经营日报_${report.reportDate}.txt`;
    link.click();
  };

  const topSalesColumns = [
    {
      key: 'fuelType',
      label: '油品',
      render: (row: any) => (
        <Badge
          style={{ backgroundColor: FUEL_COLORS[row.fuelType as keyof typeof FUEL_COLORS] + '20', color: FUEL_COLORS[row.fuelType as keyof typeof FUEL_COLORS] }}
        >
          {row.fuelType}
        </Badge>
      ),
    },
    { key: 'volume', label: '销售量(L)', render: (row: any) => formatVolume(row.volume) },
    { key: 'amount', label: '销售额(元)', render: (row: any) => formatCurrency(row.amount) },
    {
      key: 'proportion',
      label: '占比',
      render: (row: any) => {
        const total = dailyReportData.totalVolume;
        return total > 0 ? `${(row.volume != null ? (row.volume / total) * 100 : null)?.toFixed(1) || '-'}%` : '0%';
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">经营统计</h1>
          <p className="text-gray-500 mt-1">经营数据统计分析、经营日报</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportReport}>
            <Download className="w-4 h-4 mr-2" />
            导出日报
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            打印
          </Button>
        </div>
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
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'dashboard' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <BarChart3 className="w-4 h-4 inline mr-1" />
              数据概览
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'daily' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <FileText className="w-4 h-4 inline mr-1" />
              经营日报
            </button>
            <button
              onClick={() => setActiveTab('trend')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'trend' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <TrendingUp className="w-4 h-4 inline mr-1" />
              趋势分析
            </button>
          </nav>
        </div>

        {activeTab === 'dashboard' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">今日油品销售</h3>
                <div className="h-72">
                  <ReactECharts option={salesByFuelOption} style={{ height: '100%', width: '100%' }} />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">销售占比</h3>
                <div className="h-72">
                  <ReactECharts option={pieOption} style={{ height: '100%', width: '100%' }} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">近7天趋势</h3>
                <div className="h-72">
                  <ReactECharts option={weeklyTrendOption} style={{ height: '100%', width: '100%' }} />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">支付方式分布</h3>
                <div className="h-72">
                  <ReactECharts option={paymentOption} style={{ height: '100%', width: '100%' }} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">今日油品销售明细</h3>
              <DataTable
                data={dailyReportData.salesByFuel}
                columns={topSalesColumns}
                pagination={false}
              />
            </div>
          </div>
        )}

        {activeTab === 'daily' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
              <Button variant="secondary" size="sm" onClick={() => changeDate(-1)}>
                <ChevronLeft className="w-4 h-4" />
                前一天
              </Button>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <span className="text-lg font-semibold">
                  {selectedDate.toISOString().split('T')[0]}
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => changeDate(1)}
                disabled={selectedDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]}
              >
                后一天
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {formatCurrency(dailyReportData.totalSales)}
                </div>
                <div className="text-sm text-gray-600 mt-1">总销售额</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {formatVolume(dailyReportData.totalVolume)}
                </div>
                <div className="text-sm text-gray-600 mt-1">总销售量</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600">
                  {dailyReportData.transactionCount}
                </div>
                <div className="text-sm text-gray-600 mt-1">交易笔数</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {formatCurrency(dailyReportData.profit)}
                </div>
                <div className="text-sm text-gray-600 mt-1">预估利润</div>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="font-semibold">一、销售概况</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">报告日期</span>
                    <span className="font-medium">{dailyReportData.reportDate}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">总销售额</span>
                    <span className="font-medium text-orange-600">{formatCurrency(dailyReportData.totalSales)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">总销售量</span>
                    <span className="font-medium">{formatVolume(dailyReportData.totalVolume)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">交易笔数</span>
                    <span className="font-medium">{dailyReportData.transactionCount} 笔</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">预估利润(毛利率8%)</span>
                    <span className="font-medium text-green-600">{formatCurrency(dailyReportData.profit)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">生成时间</span>
                    <span className="font-medium">{formatDateTime(new Date().toISOString())}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="font-semibold">二、油品销售明细</h3>
              </div>
              <div className="p-4">
                <DataTable
                  data={dailyReportData.salesByFuel}
                  columns={[
                    { key: 'fuelType', label: '油品' },
                    { key: 'volume', label: '销售量(L)', render: (row: any) => formatVolume(row.volume) },
                    { key: 'amount', label: '销售额(元)', render: (row: any) => formatCurrency(row.amount) },
                    {
                      key: 'avgPrice',
                      label: '平均单价',
                      render: (row: any) => row.volume > 0 ? formatCurrency(row.amount / row.volume) : '-',
                    },
                  ]}
                  pagination={false}
                />
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="font-semibold">三、会员业务</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">储值金额</span>
                    <span className="font-medium text-green-600">{formatCurrency(dailyReportData.memberRecharge)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">储值笔数</span>
                    <span className="font-medium">{dailyReportData.rechargeCount} 笔</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">会员消费</span>
                    <span className="font-medium text-orange-600">{formatCurrency(dailyReportData.memberConsumption)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">盘点次数</span>
                    <span className="font-medium">{dailyReportData.inventoryCount} 次</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="font-semibold">四、库存变动</h3>
              </div>
              <div className="p-4">
                <DataTable
                  data={dailyReportData.inventoryChanges}
                  columns={[
                    { key: 'tankNo', label: '油罐' },
                    { key: 'fuelType', label: '油品' },
                    { key: 'startVolume', label: '期初库存(L)', render: (row: any) => formatVolume(row.startVolume) },
                    { key: 'deliveryVolume', label: '进油量(L)', render: (row: any) => formatVolume(row.deliveryVolume) },
                    { key: 'salesVolume', label: '销售量(L)', render: (row: any) => formatVolume(row.salesVolume) },
                    { key: 'endVolume', label: '期末库存(L)', render: (row: any) => formatVolume(row.endVolume) },
                  ]}
                  pagination={false}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trend' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">销售趋势（近30天）</h3>
              <div className="h-80">
                <ReactECharts option={weeklyTrendOption} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">油品销售对比</h3>
                <div className="h-72">
                  <ReactECharts option={salesByFuelOption} style={{ height: '100%', width: '100%' }} />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">销售结构分析</h3>
                <div className="h-72">
                  <ReactECharts option={pieOption} style={{ height: '100%', width: '100%' }} />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">经营指标分析</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-gray-500">日均销售额</div>
                  <div className="text-2xl font-bold text-orange-600 mt-2">
                    {formatCurrency(sales.length > 0 ? sales.reduce((s, a) => s + a.amount, 0) / 7 : 0)}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-gray-500">日均销售量</div>
                  <div className="text-2xl font-bold text-blue-600 mt-2">
                    {formatVolume(sales.length > 0 ? sales.reduce((s, a) => s + a.volume, 0) / 7 : 0)}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-gray-500">笔均消费</div>
                  <div className="text-2xl font-bold text-green-600 mt-2">
                    {formatCurrency(sales.length > 0 ? sales.reduce((s, a) => s + a.amount, 0) / sales.length : 0)}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-gray-500">会员消费占比</div>
                  <div className="text-2xl font-bold text-purple-600 mt-2">
                    {sales.length > 0
                      ? ((sales.filter((s) => s.paymentMethod === 'member').reduce((s, a) => s + a.amount, 0) /
                          sales.reduce((s, a) => s + a.amount, 0)) *
                          100
                        ).toFixed(1)
                      : 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessReportsPage;
