import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  Users,
  Plus,
  Search,
  Download,
  CreditCard,
  Gift,
  TrendingUp,
  DollarSign,
  Phone,
  User,
  Edit,
  ChevronRight,
  Star,
  Award,
  Crown,
  Sparkles,
  Filter,
  X,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useAppStore } from '../../store';
import { StatusCard } from '../../components/ui/StatusCard';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Member, Recharge, PointExchange } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils';
import ReactECharts from 'echarts-for-react';

const levelIcons: Record<string, any> = {
  normal: Star,
  silver: Award,
  gold: Crown,
  platinum: Sparkles,
};

const levelColors: Record<string, string> = {
  normal: 'text-gray-500',
  silver: 'text-gray-400',
  gold: 'text-yellow-500',
  platinum: 'text-purple-500',
};

const levelNames: Record<string, string> = {
  normal: '普通会员',
  silver: '银卡会员',
  gold: '金卡会员',
  platinum: '铂金会员',
};

const rechargeBonuses: Record<number, number> = {
  100: 5,
  200: 15,
  500: 50,
  1000: 120,
  2000: 300,
  5000: 800,
};

interface ExchangeGift {
  id: string;
  name: string;
  points: number;
  value: number;
  stock: number;
}

const exchangeGifts: ExchangeGift[] = [
  { id: '1', name: '玻璃水', points: 100, value: 15, stock: 50 },
  { id: '2', name: '纸巾盒', points: 200, value: 25, stock: 30 },
  { id: '3', name: '车载香薰', points: 500, value: 68, stock: 20 },
  { id: '4', name: '洗车券', points: 300, value: 35, stock: 100 },
  { id: '5', name: '机油抵扣券', points: 1000, value: 100, stock: 15 },
  { id: '6', name: '保养套餐', points: 3000, value: 350, stock: 10 },
];

const MemberManagementPage: React.FC = () => {
  const {
    members,
    recharges,
    pointExchanges,
    addMember,
    updateMember,
    addRecharge,
    addPointExchange,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'members' | 'recharge' | 'exchange'>('members');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedGift, setSelectedGift] = useState<ExchangeGift | null>(null);

  const {
    register: registerMember,
    handleSubmit: handleSubmitMember,
    reset: resetMember,
    formState: { errors: errorsMember },
  } = useForm<{
    name: string;
    phone: string;
    licensePlate: string;
  }>();

  const {
    register: registerRecharge,
    handleSubmit: handleSubmitRecharge,
    reset: resetRecharge,
    watch: watchRecharge,
    setValue: setValueRecharge,
    formState: { errors: errorsRecharge },
  } = useForm<{
    amount: number;
    bonus: number;
    paymentMethod: string;
    operator: string;
  }>({
    defaultValues: {
      bonus: 0,
      paymentMethod: 'cash',
      operator: '系统管理员',
    },
  });

  const watchRechargeAmount = watchRecharge('amount');

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        if (
          !m.name.toLowerCase().includes(keyword) &&
          !m.phone.includes(keyword) &&
          !m.cardNo.toLowerCase().includes(keyword) &&
          (m.licensePlate || '').toLowerCase().includes(keyword)
        ) {
          return false;
        }
      }
      if (levelFilter && m.level !== levelFilter) return false;
      if (statusFilter && m.status !== statusFilter) return false;
      return true;
    });
  }, [members, searchKeyword, levelFilter, statusFilter]);

  const stats = useMemo(() => {
    const totalBalance = members.reduce((sum, m) => sum + m.balance, 0);
    const totalPoints = members.reduce((sum, m) => sum + m.points, 0);
    const todayRecharge = recharges
      .filter((r) => r.rechargeTime.startsWith(new Date().toISOString().split('T')[0]))
      .reduce((sum, r) => sum + r.amount, 0);
    const activeMembers = members.filter((m) => m.status === 'active').length;

    return [
      {
        title: '会员总数',
        value: members.length,
        icon: Users,
        trend: '+12',
        trendUp: true,
      },
      {
        title: '储值余额',
        value: formatCurrency(totalBalance),
        icon: CreditCard,
        trend: '活跃会员 ' + activeMembers,
        trendUp: true,
      },
      {
        title: '今日充值',
        value: formatCurrency(todayRecharge),
        icon: DollarSign,
        trend: '较昨日 +15%',
        trendUp: true,
      },
      {
        title: '积分总额',
        value: totalPoints.toLocaleString(),
        icon: Gift,
        trend: '已兑换 ' + pointExchanges.length + ' 笔',
        trendUp: true,
      },
    ];
  }, [members, recharges, pointExchanges]);

  const rechargeTrendOption = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const rechargeData = last7Days.map((date) =>
      recharges
        .filter((r) => r.rechargeTime.startsWith(date))
        .reduce((sum, r) => sum + r.amount, 0)
    );

    const memberCountData = last7Days.map((date) =>
      members.filter((m) => m.createTime.startsWith(date)).length
    );

    return {
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['充值金额', '新增会员'],
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
          name: '人数',
        },
      ],
      series: [
        {
          name: '充值金额',
          type: 'bar',
          data: rechargeData,
          itemStyle: { color: '#f59e0b' },
        },
        {
          name: '新增会员',
          type: 'line',
          yAxisIndex: 1,
          data: memberCountData,
          itemStyle: { color: '#3b82f6' },
          smooth: true,
        },
      ],
    };
  }, [recharges, members]);

  const onSubmitMember = (data: any) => {
    const newMember: Member = {
      id: Date.now().toString(),
      name: data.name,
      phone: data.phone,
      cardNo: 'VIP' + Date.now().toString().slice(-8),
      balance: 0,
      points: 0,
      createTime: new Date().toISOString(),
      status: 'active',
      level: 'normal',
      licensePlate: data.licensePlate || undefined,
    };

    addMember(newMember);
    setIsAddMemberModalOpen(false);
    resetMember();
  };

  const handleRechargeAmountChange = (amount: number) => {
    let bonus = 0;
    const amounts = Object.keys(rechargeBonuses)
      .map(Number)
      .sort((a, b) => b - a);
    for (const tier of amounts) {
      if (amount >= tier) {
        bonus = rechargeBonuses[tier];
        break;
      }
    }
    setValueRecharge('bonus', bonus);
  };

  const onSubmitRecharge = (data: any) => {
    if (!selectedMember) return;

    const recharge: Recharge = {
      id: Date.now().toString(),
      memberId: selectedMember.id,
      amount: data.amount,
      bonus: data.bonus,
      rechargeTime: new Date().toISOString(),
      operator: data.operator,
      paymentMethod: data.paymentMethod,
    };

    addRecharge(recharge);
    setIsRechargeModalOpen(false);
    resetRecharge();
    setSelectedMember(null);
  };

  const onSubmitExchange = () => {
    if (!selectedMember || !selectedGift) return;

    if (selectedMember.points < selectedGift.points) {
      alert('积分不足！');
      return;
    }

    const exchange: PointExchange = {
      id: Date.now().toString(),
      memberId: selectedMember.id,
      points: selectedGift.points,
      gift: selectedGift.name,
      giftValue: selectedGift.value,
      exchangeTime: new Date().toISOString(),
      operator: '系统管理员',
    };

    addPointExchange(exchange);
    setIsExchangeModalOpen(false);
    setSelectedMember(null);
    setSelectedGift(null);
  };

  const exportMembers = () => {
    const headers = ['卡号', '姓名', '手机号', '车牌号', '等级', '余额', '积分', '状态', '注册时间'];
    const rows = filteredMembers.map((m) => [
      m.cardNo,
      m.name,
      m.phone,
      m.licensePlate || '',
      levelNames[m.level],
      m.balance.toFixed(2),
      m.points,
      m.status === 'active' ? '正常' : m.status === 'inactive' ? '停用' : '冻结',
      m.createTime,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `会员列表_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const memberColumns = [
    {
      key: 'cardNo',
      label: '会员卡号',
      render: (v: string, row: Member) => (
        <div className="flex items-center gap-2">
          {React.createElement(levelIcons[row.level], {
            className: `w-4 h-4 ${levelColors[row.level]}`,
          })}
          <span className="font-medium">{v}</span>
        </div>
      ),
    },
    { key: 'name', label: '姓名' },
    { key: 'phone', label: '手机号' },
    { key: 'licensePlate', label: '车牌号', render: (v: string) => v || '-' },
    {
      key: 'level',
      label: '等级',
      render: (v: string) => <Badge variant="info">{levelNames[v]}</Badge>,
    },
    {
      key: 'balance',
      label: '余额',
      render: (v: number) => <span className="font-semibold text-orange-600">{formatCurrency(v)}</span>,
    },
    { key: 'points', label: '积分', render: (v: number) => v.toLocaleString() },
    {
      key: 'status',
      label: '状态',
      render: (v: string) => (
        <Badge variant={v === 'active' ? 'success' : v === 'inactive' ? 'warning' : 'danger'}>
          {v === 'active' ? '正常' : v === 'inactive' ? '停用' : '冻结'}
        </Badge>
      ),
    },
    {
      key: 'createTime',
      label: '注册时间',
      render: (v: string) => formatDateTime(v),
    },
  ];

  const rechargeColumns = [
    { key: 'id', label: '单号' },
    {
      key: 'memberId',
      label: '会员',
      render: (v: string) => {
        const member = members.find((m) => m.id === v);
        return member ? `${member.name} (${member.cardNo})` : '-';
      },
    },
    { key: 'amount', label: '充值金额', render: (v: number) => formatCurrency(v) },
    { key: 'bonus', label: '赠送金额', render: (v: number) => formatCurrency(v) },
    { key: 'paymentMethod', label: '支付方式' },
    { key: 'operator', label: '操作员' },
    { key: 'rechargeTime', label: '充值时间', render: (v: string) => formatDateTime(v) },
  ];

  const exchangeColumns = [
    { key: 'id', label: '兑换单号' },
    {
      key: 'memberId',
      label: '会员',
      render: (v: string) => {
        const member = members.find((m) => m.id === v);
        return member ? `${member.name} (${member.cardNo})` : '-';
      },
    },
    { key: 'gift', label: '兑换礼品' },
    { key: 'points', label: '消耗积分', render: (v: number) => v.toLocaleString() },
    { key: 'giftValue', label: '礼品价值', render: (v: number) => formatCurrency(v) },
    { key: 'operator', label: '操作员' },
    { key: 'exchangeTime', label: '兑换时间', render: (v: string) => formatDateTime(v) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">会员储值</h1>
          <p className="text-gray-500 mt-1">会员管理、储值消费、积分兑换</p>
        </div>
        <Button onClick={() => setIsAddMemberModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新增会员
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
              onClick={() => setActiveTab('members')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'members' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              会员管理
            </button>
            <button
              onClick={() => setActiveTab('recharge')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'recharge' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              充值记录
            </button>
            <button
              onClick={() => setActiveTab('exchange')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'exchange' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              积分兑换
            </button>
          </nav>
        </div>

        {activeTab === 'members' && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="搜索姓名、手机号、卡号、车牌号..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">全部等级</option>
                  <option value="normal">普通会员</option>
                  <option value="silver">银卡会员</option>
                  <option value="gold">金卡会员</option>
                  <option value="platinum">铂金会员</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">全部状态</option>
                  <option value="active">正常</option>
                  <option value="inactive">停用</option>
                  <option value="frozen">冻结</option>
                </select>
                <Button variant="secondary" onClick={exportMembers}>
                  <Download className="w-4 h-4 mr-2" />
                  导出
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <DataTable
                  data={filteredMembers}
                  columns={memberColumns}
                  pagination={true}
                  pageSize={8}
                  onRowClick={(row: Member) => setSelectedMember(row)}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">会员详情</h3>
                {selectedMember ? (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedMember.level === 'platinum' ? 'bg-purple-100' : selectedMember.level === 'gold' ? 'bg-yellow-100' : selectedMember.level === 'silver' ? 'bg-gray-200' : 'bg-blue-100'}`}>
                        {React.createElement(levelIcons[selectedMember.level], {
                          className: `w-6 h-6 ${levelColors[selectedMember.level]}`,
                        })}
                      </div>
                      <div>
                        <div className="font-semibold">{selectedMember.name}</div>
                        <div className="text-sm text-gray-500">{selectedMember.cardNo}</div>
                      </div>
                      <Badge variant="info" className="ml-auto">
                        {levelNames[selectedMember.level]}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {formatCurrency(selectedMember.balance)}
                        </div>
                        <div className="text-xs text-gray-500">账户余额</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedMember.points.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">可用积分</div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">手机号</span>
                        <span>{selectedMember.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">车牌号</span>
                        <span>{selectedMember.licensePlate || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">注册时间</span>
                        <span>{formatDateTime(selectedMember.createTime)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => {
                          setIsRechargeModalOpen(true);
                        }}
                      >
                        <DollarSign className="w-4 h-4 mr-1" />
                        充值
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => {
                          setIsExchangeModalOpen(true);
                        }}
                      >
                        <Gift className="w-4 h-4 mr-1" />
                        兑换
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                    <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>点击左侧列表选择会员</p>
                  </div>
                )}

                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">充值趋势</h3>
                  <div className="h-64">
                    <ReactECharts option={rechargeTrendOption} style={{ height: '100%', width: '100%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recharge' && (
          <div className="p-6">
            <DataTable
              data={recharges}
              columns={rechargeColumns}
              pagination={true}
              pageSize={10}
            />
          </div>
        )}

        {activeTab === 'exchange' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">可兑换礼品</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {exchangeGifts.map((gift) => (
                  <div
                    key={gift.id}
                    onClick={() => {
                      if (selectedMember) {
                        setSelectedGift(gift);
                        setIsExchangeModalOpen(true);
                      } else {
                        alert('请先在会员管理中选择会员');
                        setActiveTab('members');
                      }
                    }}
                    className="bg-gray-50 rounded-lg p-4 text-center cursor-pointer hover:bg-orange-50 hover:border-orange-300 border-2 border-transparent transition-all"
                  >
                    <Gift className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                    <div className="font-medium">{gift.name}</div>
                    <div className="text-orange-600 font-bold">{gift.points} 积分</div>
                    <div className="text-xs text-gray-500">价值 {formatCurrency(gift.value)}</div>
                    <div className="text-xs text-gray-400 mt-1">库存: {gift.stock}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">兑换记录</h3>
              <DataTable
                data={pointExchanges}
                columns={exchangeColumns}
                pagination={true}
                pageSize={10}
              />
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isAddMemberModalOpen}
        onClose={() => {
          setIsAddMemberModalOpen(false);
          resetMember();
        }}
        title="新增会员"
        size="md"
      >
        <form onSubmit={handleSubmitMember(onSubmitMember)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...registerMember('name', { required: '请输入姓名' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="请输入姓名"
            />
            {errorsMember.name && <p className="text-red-500 text-sm mt-1">{errorsMember.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              手机号 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              {...registerMember('phone', {
                required: '请输入手机号',
                pattern: { value: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="请输入手机号"
            />
            {errorsMember.phone && <p className="text-red-500 text-sm mt-1">{errorsMember.phone.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">车牌号</label>
            <input
              type="text"
              {...registerMember('licensePlate')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="请输入车牌号（选填）"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsAddMemberModalOpen(false);
                resetMember();
              }}
            >
              取消
            </Button>
            <Button type="submit">确认添加</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isRechargeModalOpen}
        onClose={() => {
          setIsRechargeModalOpen(false);
          resetRecharge();
        }}
        title="会员充值"
        size="md"
      >
        {selectedMember && (
          <div className="mb-4 p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-orange-600" />
              <div>
                <div className="font-semibold">{selectedMember.name}</div>
                <div className="text-sm text-gray-600">
                  当前余额: {formatCurrency(selectedMember.balance)} | 卡号: {selectedMember.cardNo}
                </div>
              </div>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmitRecharge(onSubmitRecharge)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">快捷充值</label>
            <div className="grid grid-cols-3 gap-2">
              {[100, 200, 500, 1000, 2000, 5000].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => {
                    setValueRecharge('amount', amount);
                    handleRechargeAmountChange(amount);
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${watchRechargeAmount === amount ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}
                >
                  <div className="font-bold text-lg">¥{amount}</div>
                  <div className="text-xs text-orange-600">赠 ¥{rechargeBonuses[amount]}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              充值金额 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              {...registerRecharge('amount', {
                required: '请输入充值金额',
                min: { value: 1, message: '充值金额不能小于1元' },
              })}
              onChange={(e) => {
                const amount = Number(e.target.value);
                handleRechargeAmountChange(amount);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="请输入充值金额"
            />
            {errorsRecharge.amount && (
              <p className="text-red-500 text-sm mt-1">{errorsRecharge.amount.message}</p>
            )}
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">赠送金额</span>
              <span className="font-bold text-green-600">+ ¥{watchRecharge('bonus') || 0}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-gray-600">到账金额</span>
              <span className="font-bold text-orange-600">
                ¥{((watchRechargeAmount || 0) + (watchRecharge('bonus') || 0)).toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">支付方式</label>
            <select
              {...registerRecharge('paymentMethod')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="cash">现金</option>
              <option value="wechat">微信支付</option>
              <option value="alipay">支付宝</option>
              <option value="card">银行卡</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">操作员</label>
            <input
              type="text"
              {...registerRecharge('operator')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsRechargeModalOpen(false);
                resetRecharge();
              }}
            >
              取消
            </Button>
            <Button type="submit">确认充值</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isExchangeModalOpen}
        onClose={() => {
          setIsExchangeModalOpen(false);
          setSelectedGift(null);
        }}
        title="积分兑换"
        size="md"
      >
        {selectedMember && selectedGift && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <User className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="font-semibold">{selectedMember.name}</div>
                  <div className="text-sm text-gray-600">
                    当前积分: <span className="font-bold text-blue-600">{selectedMember.points.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg text-center">
              <Gift className="w-12 h-12 mx-auto mb-2 text-orange-500" />
              <div className="text-xl font-bold">{selectedGift.name}</div>
              <div className="text-orange-600 font-bold text-2xl mt-2">
                {selectedGift.points} 积分
              </div>
              <div className="text-sm text-gray-500 mt-1">
                市场价值: {formatCurrency(selectedGift.value)}
              </div>
            </div>

            {selectedMember.points >= selectedGift.points ? (
              <div className="p-4 bg-green-50 rounded-lg text-center text-green-700">
                <CheckCircle className="w-6 h-6 mx-auto mb-2" />
                积分充足，可以兑换
              </div>
            ) : (
              <div className="p-4 bg-red-50 rounded-lg text-center text-red-700">
                <XCircle className="w-6 h-6 mx-auto mb-2" />
                积分不足，还差 {(selectedGift.points - selectedMember.points).toLocaleString()} 积分
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setIsExchangeModalOpen(false);
                  setSelectedGift(null);
                }}
              >
                取消
              </Button>
              <Button
                type="button"
                onClick={onSubmitExchange}
                disabled={selectedMember.points < selectedGift.points}
              >
                确认兑换
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MemberManagementPage;
