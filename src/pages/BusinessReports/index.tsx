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
  ChevronDown,
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
  const { tanks, sales, deliveries, members, recharges, inventories, nozzles } = useAppStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'daily' | 'trend'>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['sales']));

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

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
    const dateStr = selectedDate;
    const salesOnDate = sales.filter((s) => s.saleTime.startsWith(dateStr) && s.status === 'completed');
    const deliveriesOnDate = deliveries.filter((d) => d.endTime.startsWith(dateStr) && d.status === 'completed');
    const rechargesOnDate = recharges.filter((r) => r.rechargeTime.startsWith(dateStr));
    const memberSalesOnDate = salesOnDate.filter((s) => s.paymentMethod === 'member');
    const dayInventories = inventories.filter((i) => i.inventoryDate.startsWith(dateStr));

    const totalSales = salesOnDate.reduce((sum, s) => sum + s.amount, 0);
    const totalVolume = salesOnDate.reduce((sum, s) => sum + s.volume, 0);
    const totalRecharge = rechargesOnDate.reduce((sum, r) => sum + r.amount, 0);
    const totalRechargeBonus = rechargesOnDate.reduce((sum, r) => sum + r.bonus, 0);
    const memberConsumption = memberSalesOnDate.reduce((sum, s) => sum + s.amount, 0);
    const totalDeliveryVolume = deliveriesOnDate.reduce((sum, d) => sum + d.quantity, 0);
    const totalDeliveryAmount = deliveriesOnDate.reduce((sum, d) => sum + d.totalAmount, 0);

    const salesByFuel: { fuelType: string; volume: number; amount: number }[] = [];
    const fuelMap: Record<string, { volume: number; amount: number }> = {};
    salesOnDate.forEach((s) => {
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
      const endVolume = tank.volume;
      const salesVolume = salesOnDate.filter((s) => s.tankId === tank.id).reduce((sum, s) => sum + s.volume, 0);
      const deliveryVolume = deliveriesOnDate.filter((d) => d.tankId === tank.id).reduce((sum, d) => sum + d.quantity, 0);
      const startVolume = endVolume + salesVolume - deliveryVolume;
      return {
        tankId: tank.id,
        tankNo: tank.tankNo,
        fuelType: tank.fuelType,
        startVolume,
        endVolume,
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
      memberRechargeBonus: totalRechargeBonus,
      memberConsumption,
      inventoryChanges,
      profit,
      transactionCount: salesOnDate.length,
      rechargeCount: rechargesOnDate.length,
      inventoryCount: dayInventories.length,
      totalDeliveryVolume,
      totalDeliveryAmount,
      deliveryCount: deliveriesOnDate.length,
      memberSalesCount: memberSalesOnDate.length,
      salesOnDate,
      deliveriesOnDate,
      rechargesOnDate,
      memberSalesOnDate,
    };
  }, [selectedDate, sales, deliveries, recharges, inventories, tanks]);

  const changeDate = (days: number) => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
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

三、卸油入库
卸油总量: ${formatVolume(report.totalDeliveryVolume)}
卸油总金额: ${formatCurrency(report.totalDeliveryAmount)}
卸油次数: ${report.deliveryCount}次

四、会员业务
储值金额: ${formatCurrency(report.memberRecharge)} (${report.rechargeCount}笔)
赠送金额: ${formatCurrency(report.memberRechargeBonus)}
会员消费: ${formatCurrency(report.memberConsumption)} (${report.memberSalesCount}笔)

五、库存变动
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
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 flex-wrap gap-3">
              <Button variant="secondary" size="sm" onClick={() => changeDate(-1)}>
                <ChevronLeft className="w-4 h-4" />
                前一天
              </Button>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <input
                  type="date"
                  value={selectedDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <span className="text-lg font-semibold">{selectedDate}</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => changeDate(1)}
                disabled={selectedDate === new Date().toISOString().split('T')[0]}
              >
                后一天
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(dailyReportData.totalSales)}
                </div>
                <div className="text-sm text-gray-600 mt-1">总销售额</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatVolume(dailyReportData.totalVolume)}
                </div>
                <div className="text-sm text-gray-600 mt-1">总销量</div>
              </div>
              <div className="bg-pink-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-pink-600">
                  {formatCurrency(dailyReportData.memberConsumption)}
                </div>
                <div className="text-sm text-gray-600 mt-1">会员消费</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(dailyReportData.memberRecharge)}
                </div>
                <div className="text-sm text-gray-600 mt-1">会员充值</div>
              </div>
              <div className="bg-cyan-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-cyan-600">
                  {formatVolume(dailyReportData.totalDeliveryVolume)}
                </div>
                <div className="text-sm text-gray-600 mt-1">卸油总量</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(dailyReportData.profit)}
                </div>
                <div className="text-sm text-gray-600 mt-1">预估利润</div>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3 bg-orange-50 cursor-pointer hover:bg-orange-100 transition-colors"
                onClick={() => toggleSection('sales')}
              >
                <div className="flex items-center gap-2">
                  {expandedSections.has('sales') ? (
                    <ChevronDown className="w-5 h-5 text-orange-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-orange-600" />
                  )}
                  <h3 className="font-semibold text-gray-800">销售明细汇总</h3>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">笔数：<span className="font-semibold text-gray-800">{dailyReportData.transactionCount}笔</span></span>
                  <span className="text-gray-600">金额：<span className="font-semibold text-orange-600">{formatCurrency(dailyReportData.totalSales)}</span></span>
                </div>
              </div>
              {expandedSections.has('sales') && (
                <div className="p-4">
                  <DataTable
                    data={dailyReportData.salesOnDate}
                    columns={[
                      { key: 'saleTime', label: '时间', render: (row: any) => formatDateTime(row.saleTime) },
                      {
                        key: 'nozzleNo',
                        label: '油枪',
                        render: (row: any) => nozzles.find((n) => n.id === row.nozzleId)?.nozzleNo || '-',
                      },
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
                      { key: 'volume', label: '数量', render: (row: any) => formatVolume(row.volume) },
                      { key: 'amount', label: '金额', render: (row: any) => formatCurrency(row.amount) },
                      {
                        key: 'paymentMethod',
                        label: '支付方式',
                        render: (row: any) => {
                          const map: Record<string, string> = {
                            cash: '现金',
                            card: '银行卡',
                            member: '会员余额',
                            wechat: '微信支付',
                            alipay: '支付宝',
                          };
                          return map[row.paymentMethod] || row.paymentMethod;
                        },
                      },
                    ]}
                    pagination={false}
                  />
                </div>
              )}
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3 bg-cyan-50 cursor-pointer hover:bg-cyan-100 transition-colors"
                onClick={() => toggleSection('deliveries')}
              >
                <div className="flex items-center gap-2">
                  {expandedSections.has('deliveries') ? (
                    <ChevronDown className="w-5 h-5 text-cyan-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-cyan-600" />
                  )}
                  <h3 className="font-semibold text-gray-800">卸油入库明细</h3>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">笔数：<span className="font-semibold text-gray-800">{dailyReportData.deliveryCount}笔</span></span>
                  <span className="text-gray-600">数量：<span className="font-semibold text-cyan-600">{formatVolume(dailyReportData.totalDeliveryVolume)}</span></span>
                  <span className="text-gray-600">金额：<span className="font-semibold text-gray-800">{formatCurrency(dailyReportData.totalDeliveryAmount)}</span></span>
                </div>
              </div>
              {expandedSections.has('deliveries') && (
                <div className="p-4">
                  <DataTable
                    data={dailyReportData.deliveriesOnDate}
                    columns={[
                      { key: 'tankerNo', label: '油罐车' },
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
                      { key: 'quantity', label: '数量', render: (row: any) => formatVolume(row.quantity) },
                      { key: 'unitPrice', label: '单价', render: (row: any) => formatCurrency(row.unitPrice) },
                      { key: 'totalAmount', label: '金额', render: (row: any) => formatCurrency(row.totalAmount) },
                      {
                        key: 'tankId',
                        label: '油罐',
                        render: (row: any) => tanks.find((t) => t.id === row.tankId)?.tankNo || '-',
                      },
                      { key: 'endTime', label: '完成时间', render: (row: any) => formatDateTime(row.endTime) },
                    ]}
                    pagination={false}
                  />
                </div>
              )}
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3 bg-pink-50 cursor-pointer hover:bg-pink-100 transition-colors"
                onClick={() => toggleSection('memberSales')}
              >
                <div className="flex items-center gap-2">
                  {expandedSections.has('memberSales') ? (
                    <ChevronDown className="w-5 h-5 text-pink-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-pink-600" />
                  )}
                  <h3 className="font-semibold text-gray-800">会员消费明细</h3>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">笔数：<span className="font-semibold text-gray-800">{dailyReportData.memberSalesCount}笔</span></span>
                  <span className="text-gray-600">金额：<span className="font-semibold text-pink-600">{formatCurrency(dailyReportData.memberConsumption)}</span></span>
                </div>
              </div>
              {expandedSections.has('memberSales') && (
                <div className="p-4">
                  <DataTable
                    data={dailyReportData.memberSalesOnDate}
                    columns={[
                      {
                        key: 'memberName',
                        label: '会员姓名',
                        render: (row: any) => members.find((m) => m.id === row.memberId)?.name || '-',
                      },
                      {
                        key: 'cardNo',
                        label: '卡号',
                        render: (row: any) => members.find((m) => m.id === row.memberId)?.cardNo || '-',
                      },
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
                      { key: 'volume', label: '数量', render: (row: any) => formatVolume(row.volume) },
                      { key: 'amount', label: '金额', render: (row: any) => formatCurrency(row.amount) },
                      { key: 'saleTime', label: '时间', render: (row: any) => formatDateTime(row.saleTime) },
                    ]}
                    pagination={false}
                  />
                </div>
              )}
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3 bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
                onClick={() => toggleSection('recharges')}
              >
                <div className="flex items-center gap-2">
                  {expandedSections.has('recharges') ? (
                    <ChevronDown className="w-5 h-5 text-green-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-green-600" />
                  )}
                  <h3 className="font-semibold text-gray-800">会员充值明细</h3>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">笔数：<span className="font-semibold text-gray-800">{dailyReportData.rechargeCount}笔</span></span>
                  <span className="text-gray-600">充值：<span className="font-semibold text-green-600">{formatCurrency(dailyReportData.memberRecharge)}</span></span>
                  <span className="text-gray-600">赠送：<span className="font-semibold text-amber-600">{formatCurrency(dailyReportData.memberRechargeBonus)}</span></span>
                </div>
              </div>
              {expandedSections.has('recharges') && (
                <div className="p-4">
                  <DataTable
                    data={dailyReportData.rechargesOnDate}
                    columns={[
                      {
                        key: 'memberName',
                        label: '会员姓名',
                        render: (row: any) => members.find((m) => m.id === row.memberId)?.name || '-',
                      },
                      {
                        key: 'cardNo',
                        label: '卡号',
                        render: (row: any) => members.find((m) => m.id === row.memberId)?.cardNo || '-',
                      },
                      { key: 'amount', label: '充值金额', render: (row: any) => formatCurrency(row.amount) },
                      { key: 'bonus', label: '赠送金额', render: (row: any) => formatCurrency(row.bonus) },
                      { key: 'rechargeTime', label: '充值时间', render: (row: any) => formatDateTime(row.rechargeTime) },
                      { key: 'operator', label: '操作员' },
                    ]}
                    pagination={false}
                  />
                </div>
              )}
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3 bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors"
                onClick={() => toggleSection('inventory')}
              >
                <div className="flex items-center gap-2">
                  {expandedSections.has('inventory') ? (
                    <ChevronDown className="w-5 h-5 text-amber-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-amber-600" />
                  )}
                  <h3 className="font-semibold text-gray-800">库存变动明细</h3>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">油罐：<span className="font-semibold text-gray-800">{dailyReportData.inventoryChanges.length}个</span></span>
                  <span className="text-gray-600">盘点：<span className="font-semibold text-amber-600">{dailyReportData.inventoryCount}次</span></span>
                </div>
              </div>
              {expandedSections.has('inventory') && (
                <div className="p-4">
                  <DataTable
                    data={dailyReportData.inventoryChanges}
                    columns={[
                      { key: 'tankNo', label: '油罐' },
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
                      { key: 'startVolume', label: '期初库存', render: (row: any) => formatVolume(row.startVolume) },
                      { key: 'deliveryVolume', label: '当日卸油', render: (row: any) => formatVolume(row.deliveryVolume) },
                      { key: 'salesVolume', label: '当日销售', render: (row: any) => formatVolume(row.salesVolume) },
                      { key: 'endVolume', label: '期末库存', render: (row: any) => formatVolume(row.endVolume) },
                    ]}
                    pagination={false}
                  />
                </div>
              )}
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
