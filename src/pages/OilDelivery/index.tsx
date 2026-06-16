import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  Truck,
  Plus,
  Clock,
  User,
  Phone,
  Droplets,
  Thermometer,
  Scale,
  ShieldCheck,
  ChevronRight,
  Play,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { useAppStore } from '../../store';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  formatVolume,
  formatCurrency,
  formatDateTime,
  getStatusText,
  getStatusColor,
  cn,
  generateId,
} from '../../utils';
import { Delivery, Tank, FUEL_COLORS, FUEL_PRICES } from '../../types';

interface DeliveryForm {
  tankerNo: string;
  driverName: string;
  driverPhone: string;
  fuelType: string;
  tankId: string;
  quantity: number;
  unitPrice: number;
  density: number;
  temperature: number;
  guardian: string;
  remarks?: string;
}

export default function OilDelivery() {
  const deliveries = useAppStore((state) => state.deliveries);
  const tanks = useAppStore((state) => state.tanks);
  const addDelivery = useAppStore((state) => state.addDelivery);
  const updateDelivery = useAppStore((state) => state.updateDelivery);
  const completeDeliveryAction = useAppStore((state) => state.completeDelivery);

  const [showModal, setShowModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'monitor'>('list');
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<DeliveryForm>();

  const watchedFuelType = useWatch({ control, name: 'fuelType' });
  const watchedQuantity = useWatch({ control, name: 'quantity' });
  const watchedUnitPrice = useWatch({ control, name: 'unitPrice' });

  const calculatedTotalAmount = (watchedQuantity || 0) * (watchedUnitPrice || 0);

  const wholesalePrice = watchedFuelType
    ? Number(((FUEL_PRICES[watchedFuelType as keyof typeof FUEL_PRICES] || 0) * 0.85).toFixed(2))
    : 0;

  useEffect(() => {
    if (watchedFuelType && (!watchedUnitPrice || watchedUnitPrice === 0)) {
      setValue('unitPrice', wholesalePrice);
    }
  }, [watchedFuelType, wholesalePrice, watchedUnitPrice, setValue]);

  const onSubmit = (data: DeliveryForm) => {
    const now = new Date();
    const unitPrice = data.unitPrice || wholesalePrice;
    const totalAmount = Number((data.quantity * unitPrice).toFixed(2));
    const newDelivery: Delivery = {
      id: generateId(),
      ...data,
      unitPrice,
      totalAmount,
      startTime: now.toISOString(),
      endTime: now.toISOString(),
      status: 'pending',
    };
    addDelivery(newDelivery);
    setShowModal(false);
    reset();
    setStep(1);
  };

  const startDelivery = (delivery: Delivery) => {
    updateDelivery(delivery.id, {
      status: 'in-progress',
      startTime: new Date().toISOString(),
    });
    setSelectedDelivery(null);
  };

  const completeDelivery = (delivery: Delivery) => {
    completeDeliveryAction(delivery.id);
    setSelectedDelivery(null);
  };

  const inProgressDelivery = deliveries.find((d) => d.status === 'in-progress');

  const columns = [
    {
      key: 'tankerNo',
      label: '油罐车',
      render: (row: Delivery) => (
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{row.tankerNo}</span>
        </div>
      ),
    },
    {
      key: 'driverName',
      label: '司机',
      render: (row: Delivery) => (
        <div>
          <p className="font-medium">{row.driverName}</p>
          <p className="text-xs text-gray-400">{row.driverPhone}</p>
        </div>
      ),
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
      key: 'unitPrice',
      label: '进货单价(元/L)',
      align: 'right' as const,
      render: (row: Delivery) => formatCurrency(row.unitPrice) + '/L',
    },
    {
      key: 'totalAmount',
      label: '卸油金额(元)',
      align: 'right' as const,
      render: (row: Delivery) => formatCurrency(row.totalAmount),
    },
    {
      key: 'quantity',
      label: '数量(L)',
      align: 'right' as const,
      render: (row: Delivery) => <span className="font-semibold">{formatVolume(row.quantity)}</span>,
    },
    {
      key: 'tankId',
      label: '接收罐',
      align: 'center' as const,
      render: (row: Delivery) => tanks.find((t) => t.id === row.tankId)?.tankNo || '-',
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
    {
      key: 'action',
      label: '操作',
      align: 'center' as const,
      render: (row: Delivery) => (
        <div className="flex gap-2 justify-center">
          {row.status === 'pending' && (
            <Button size="sm" variant="primary" onClick={() => startDelivery(row)} icon={<Play className="w-3 h-3" />}>
              开始
            </Button>
          )}
          {row.status === 'in-progress' && (
            <Button size="sm" variant="success" onClick={() => completeDelivery(row)} icon={<CheckCircle className="w-3 h-3" />}>
              完成
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setSelectedDelivery(row)}>
            详情
          </Button>
        </div>
      ),
    },
  ];

  const steps = [
    { num: 1, title: '车辆登记', icon: Truck },
    { num: 2, title: '油品验收', icon: Scale },
    { num: 3, title: '开始卸油', icon: Play },
    { num: 4, title: '作业监护', icon: ShieldCheck },
    { num: 5, title: '完成确认', icon: CheckCircle },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">今日卸油</p>
              <p className="text-2xl font-bold text-gray-800">
                {deliveries.filter((d) => new Date(d.startTime).toDateString() === new Date().toDateString()).length} 次
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-500 flex items-center justify-center">
              <Droplets className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">今日进油量</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatVolume(
                  deliveries
                    .filter((d) => new Date(d.startTime).toDateString() === new Date().toDateString())
                    .reduce((sum, d) => sum + d.quantity, 0)
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">进行中</p>
              <p className="text-2xl font-bold text-gray-800">
                {deliveries.filter((d) => d.status === 'in-progress').length} 次
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">已完成</p>
              <p className="text-2xl font-bold text-gray-800">
                {deliveries.filter((d) => d.status === 'completed').length} 次
              </p>
            </div>
          </div>
        </div>
      </div>

      {inProgressDelivery && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                <Truck className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-800">
                    {inProgressDelivery.tankerNo} 正在卸油
                  </h3>
                  <Badge variant="warning">进行中</Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {inProgressDelivery.fuelType} · {formatVolume(inProgressDelivery.quantity)} · 监护人: {inProgressDelivery.guardian}
                </p>
              </div>
            </div>
            <Button onClick={() => completeDelivery(inProgressDelivery)} icon={<CheckCircle className="w-4 h-4" />}>
              完成卸油
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('list')}
            className={cn(
              'px-4 py-2 font-medium text-sm border-b-2 transition-colors -mb-px',
              activeTab === 'list'
                ? 'border-[#f59e0b] text-[#1e3a5f]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            卸油记录
          </button>
          <button
            onClick={() => setActiveTab('monitor')}
            className={cn(
              'px-4 py-2 font-medium text-sm border-b-2 transition-colors -mb-px',
              activeTab === 'monitor'
                ? 'border-[#f59e0b] text-[#1e3a5f]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            作业监护
          </button>
        </div>
        <Button onClick={() => setShowModal(true)} icon={<Plus className="w-4 h-4" />}>
          新增卸油登记
        </Button>
      </div>

      {activeTab === 'list' && (
        <DataTable
          columns={columns}
          data={deliveries}
          rowKey={(row) => row.id}
          onRowClick={(row) => setSelectedDelivery(row)}
        />
      )}

      {activeTab === 'monitor' && (
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-6">卸油作业监护检查清单</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: '卸油车辆熄火接地', done: true },
              { name: '灭火器放置到位', done: true },
              { name: '警示标志设置', done: true },
              { name: '监护人员在岗', done: true },
              { name: '油气回收正常', done: false },
              { name: '量油孔密封良好', done: true },
              { name: '防静电服穿戴', done: true },
              { name: '通讯设备畅通', done: true },
              { name: '应急方案就绪', done: false },
            ].map((item, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-lg border',
                  item.done ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'
                )}
              >
                {item.done ? (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                )}
                <span className={item.done ? 'text-gray-700' : 'text-amber-700'}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setStep(1);
          reset();
        }}
        title="新增卸油登记"
        size="xl"
        footer={
          <div className="flex justify-between w-full">
            <div>
              {step > 1 && (
                <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
                  上一步
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowModal(false);
                  setStep(1);
                  reset();
                }}
              >
                取消
              </Button>
              {step < 5 ? (
                <Button onClick={() => setStep((s) => s + 1)}>下一步</Button>
              ) : (
                <Button onClick={handleSubmit(onSubmit)}>提交登记</Button>
              )}
            </div>
          </div>
        }
      >
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((s, idx) => (
              <div key={s.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                      step >= s.num
                        ? 'bg-[#1e3a5f] text-white'
                        : 'bg-gray-100 text-gray-400'
                    )}
                  >
                    <s.icon className="w-5 h-5" />
                  </div>
                  <span
                    className={cn(
                      'text-xs mt-2 font-medium',
                      step >= s.num ? 'text-[#1e3a5f]' : 'text-gray-400'
                    )}
                  >
                    {s.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-16 h-1 mx-2 rounded',
                      step > s.num ? 'bg-[#1e3a5f]' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <form className="space-y-6">
          {step === 1 && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Truck className="w-4 h-4 inline mr-1" />
                  车牌号 *
                </label>
                <input
                  {...register('tankerNo', { required: '请输入车牌号' })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none transition-all"
                  placeholder="请输入车牌号"
                />
                {errors.tankerNo && (
                  <p className="text-red-500 text-xs mt-1">{errors.tankerNo.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  司机姓名 *
                </label>
                <input
                  {...register('driverName', { required: '请输入司机姓名' })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none transition-all"
                  placeholder="请输入司机姓名"
                />
                {errors.driverName && (
                  <p className="text-red-500 text-xs mt-1">{errors.driverName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  联系电话 *
                </label>
                <input
                  {...register('driverPhone', { required: '请输入联系电话' })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none transition-all"
                  placeholder="请输入联系电话"
                />
                {errors.driverPhone && (
                  <p className="text-red-500 text-xs mt-1">{errors.driverPhone.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  监护人 *
                </label>
                <select
                  {...register('guardian', { required: '请选择监护人' })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none transition-all"
                >
                  <option value="">请选择监护人</option>
                  <option value="陈站长">陈站长</option>
                  <option value="刘班长">刘班长</option>
                  <option value="周安全员">周安全员</option>
                </select>
                {errors.guardian && (
                  <p className="text-red-500 text-xs mt-1">{errors.guardian.message}</p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Droplets className="w-4 h-4 inline mr-1" />
                  油品类型 *
                </label>
                <select
                  {...register('fuelType', { required: '请选择油品类型' })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none transition-all"
                >
                  <option value="">请选择油品类型</option>
                  <option value="92#">92# 汽油</option>
                  <option value="95#">95# 汽油</option>
                  <option value="98#">98# 汽油</option>
                  <option value="0#">0# 柴油</option>
                </select>
                {errors.fuelType && (
                  <p className="text-red-500 text-xs mt-1">{errors.fuelType.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Truck className="w-4 h-4 inline mr-1" />
                  接收油罐 *
                </label>
                <select
                  {...register('tankId', { required: '请选择接收油罐' })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none transition-all"
                >
                  <option value="">请选择接收油罐</option>
                  {tanks.map((tank: Tank) => (
                    <option key={tank.id} value={tank.id}>
                      {tank.tankNo} - {tank.fuelType} (可用: {formatVolume(tank.capacity - tank.volume)})
                    </option>
                  ))}
                </select>
                {errors.tankId && (
                  <p className="text-red-500 text-xs mt-1">{errors.tankId.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Droplets className="w-4 h-4 inline mr-1" />
                  卸油数量(L) *
                </label>
                <input
                  type="number"
                  {...register('quantity', { required: '请输入卸油数量', valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none transition-all"
                  placeholder="请输入卸油数量"
                />
                {errors.quantity && (
                  <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Droplets className="w-4 h-4 inline mr-1" />
                  进货单价(元/L) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('unitPrice', { required: '请输入进货单价', valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none transition-all"
                  placeholder="请输入进货单价"
                  defaultValue={wholesalePrice || undefined}
                />
                {wholesalePrice > 0 && (
                  <p className="text-xs text-gray-400 mt-1">建议批发价: {formatCurrency(wholesalePrice)}/L (零售价的85%)</p>
                )}
                {errors.unitPrice && (
                  <p className="text-red-500 text-xs mt-1">{errors.unitPrice.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Scale className="w-4 h-4 inline mr-1" />
                  卸油金额(元)
                </label>
                <div className="w-full px-4 py-2 border border-gray-100 bg-gray-50 rounded-lg text-lg font-bold text-[#1e3a5f]">
                  {formatCurrency(calculatedTotalAmount)}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  自动计算: {formatVolume(watchedQuantity || 0)} × {formatCurrency(watchedUnitPrice || 0)}/L
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Scale className="w-4 h-4 inline mr-1" />
                  密度(g/cm³)
                </label>
                <input
                  type="number"
                  step="0.001"
                  {...register('density', { valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none transition-all"
                  placeholder="0.750"
                  defaultValue="0.750"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Thermometer className="w-4 h-4 inline mr-1" />
                  温度(°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register('temperature', { valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none transition-all"
                  placeholder="25.0"
                  defaultValue="25.0"
                />
              </div>
            </div>
          )}

          {step >= 3 && step <= 4 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                {step === 3 ? <Play className="w-10 h-10" /> : <ShieldCheck className="w-10 h-10" />}
              </div>
              <h4 className="text-lg font-bold text-gray-800 mb-2">
                {step === 3 ? '准备开始卸油' : '卸油作业监护中'}
              </h4>
              <p className="text-gray-500">
                {step === 3
                  ? '请确认所有安全检查已完成，然后点击下一步开始卸油作业'
                  : '请确保监护人员在岗，定期检查卸油状态'}
              </p>
              {step === 4 && (
                <div className="mt-6 max-w-md mx-auto">
                  <div className="space-y-3">
                    {[
                      '检查卸油软管连接是否牢固',
                      '观察油罐液位变化',
                      '检查现场有无渗漏',
                      '确认静电接地良好',
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-50 text-green-500 flex items-center justify-center">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-bold text-gray-800 mb-2">确认卸油完成</h4>
              <p className="text-gray-500 mb-6">请确认以下信息无误后提交</p>
              <div className="max-w-md mx-auto bg-gray-50 rounded-lg p-4 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">车牌号:</span>
                    <span className="font-medium" id="preview-tankerNo"></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">油品:</span>
                    <span className="font-medium" id="preview-fuelType"></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">数量:</span>
                    <span className="font-medium" id="preview-quantity"></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">进货单价:</span>
                    <span className="font-medium">{watchedUnitPrice ? formatCurrency(watchedUnitPrice) + '/L' : '-'}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                    <span className="text-gray-700 font-semibold">卸油总金额:</span>
                    <span className="font-bold text-[#1e3a5f] text-base">{formatCurrency(calculatedTotalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">接收罐:</span>
                    <span className="font-medium" id="preview-tank"></span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </Modal>

      <Modal
        isOpen={!!selectedDelivery && !showModal}
        onClose={() => setSelectedDelivery(null)}
        title="卸油记录详情"
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setSelectedDelivery(null)}>
            关闭
          </Button>
        }
      >
        {selectedDelivery && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">车牌号</p>
                <p className="text-lg font-bold">{selectedDelivery.tankerNo}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">司机</p>
                <p className="text-lg font-bold">{selectedDelivery.driverName}</p>
                <p className="text-sm text-gray-400">{selectedDelivery.driverPhone}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">油品类型</p>
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `${FUEL_COLORS[selectedDelivery.fuelType as keyof typeof FUEL_COLORS]}20`,
                    color: FUEL_COLORS[selectedDelivery.fuelType as keyof typeof FUEL_COLORS],
                  }}
                >
                  {selectedDelivery.fuelType}
                </span>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">卸油数量</p>
                <p className="text-lg font-bold">{formatVolume(selectedDelivery.quantity)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">进货单价</p>
                <p className="text-lg font-bold">{formatCurrency(selectedDelivery.unitPrice)}/L</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">卸油总金额</p>
                <p className="text-lg font-bold text-[#1e3a5f]">{formatCurrency(selectedDelivery.totalAmount)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">密度</p>
                <p className="text-lg font-bold">{selectedDelivery.density.toFixed(3)} g/cm³</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">温度</p>
                <p className="text-lg font-bold">{selectedDelivery.temperature.toFixed(1)}°C</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">开始时间</p>
                <p className="text-sm font-medium">{formatDateTime(selectedDelivery.startTime)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">结束时间</p>
                <p className="text-sm font-medium">{formatDateTime(selectedDelivery.endTime)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">监护人</p>
                <p className="text-lg font-bold">{selectedDelivery.guardian}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">状态</p>
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium',
                    getStatusColor(selectedDelivery.status)
                  )}
                >
                  {getStatusText(selectedDelivery.status)}
                </span>
              </div>
            </div>
            {selectedDelivery.remarks && (
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">备注</p>
                <p className="text-gray-700">{selectedDelivery.remarks}</p>
              </div>
            )}

            {selectedDelivery.status === 'pending' && (
              <div className="flex justify-end gap-3">
                <Button onClick={() => startDelivery(selectedDelivery)} icon={<Play className="w-4 h-4" />}>
                  开始卸油
                </Button>
              </div>
            )}
            {selectedDelivery.status === 'in-progress' && (
              <div className="flex justify-end gap-3">
                <Button onClick={() => completeDelivery(selectedDelivery)} icon={<CheckCircle className="w-4 h-4" />}>
                  完成卸油
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
