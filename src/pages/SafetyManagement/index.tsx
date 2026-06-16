import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  Shield,
  Camera as CameraIcon,
  Flame,
  Zap,
  Eye,
  Plus,
  Search,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Video,
  Wifi,
  WifiOff,
  CheckSquare,
  Square,
  FileText,
} from 'lucide-react';
import { useAppStore } from '../../store';
import { StatusCard } from '../../components/ui/StatusCard';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FireFacility, LightningProtection, SafetyCheck, SafetyCheckItem } from '../../types';
import { formatCurrency, formatDateTime, getStatusText } from '../../utils';

const checkItems: Record<string, string[]> = {
  fire: [
    '灭火器压力正常',
    '消防通道畅通',
    '消防栓无损坏',
    '应急照明正常',
    '疏散指示标志完好',
  ],
  lightning: [
    '接闪器无损坏',
    '引下线连接牢固',
    '接地装置完好',
    '防雷检测记录完整',
  ],
  delivery: [
    '卸油员持证上岗',
    '静电接地连接正常',
    '灭火器摆放到位',
    '消防器材准备就绪',
    '现场无明火',
    '油气浓度检测合格',
  ],
  daily: [
    '加油设备运行正常',
    '油罐区无异常',
    '配电室安全',
    '营业室安全',
    '监控系统正常',
  ],
};

const SafetyManagementPage: React.FC = () => {
  const {
    fireFacilities,
    lightningProtection,
    safetyChecks,
    cameras,
    addSafetyCheck,
    updateFireFacility,
    updateLightningProtection,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'fire' | 'lightning' | 'monitor' | 'checks'>('fire');
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
  const [checkType, setCheckType] = useState<'fire' | 'lightning' | 'delivery' | 'daily'>('daily');
  const [selectedCamera, setSelectedCamera] = useState<any>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<{
    checker: string;
    remarks: string;
  }>();

  const [checkResults, setCheckResults] = useState<Record<string, 'pass' | 'fail' | 'na'>>({});

  const currentCheckItems = checkItems[checkType] || [];

  const stats = useMemo(() => {
    const fireExpiring = fireFacilities.filter((f) => f.status === 'expiring').length;
    const fireExpired = fireFacilities.filter((f) => f.status === 'expired').length;
    const lightningExpiring = lightningProtection.filter((l) => l.status === 'expiring').length;
    const lightningExpired = lightningProtection.filter((l) => l.status === 'expired').length;
    const onlineCameras = cameras.filter((c) => c.status === 'online').length;
    const offlineCameras = cameras.filter((c) => c.status === 'offline').length;

    const todayChecks = safetyChecks.filter((c) =>
      c.checkDate.startsWith(new Date().toISOString().split('T')[0])
    );
    const failedChecks = todayChecks.filter((c) => c.result === 'fail').length;

    return [
      {
        title: '消防设施',
        value: fireFacilities.length,
        icon: Flame,
        trend: fireExpired > 0 ? `${fireExpired}个过期` : fireExpiring > 0 ? `${fireExpiring}个即将过期` : '全部正常',
        trendUp: fireExpired === 0 && fireExpiring === 0,
        color: fireExpired > 0 ? 'text-red-600' : fireExpiring > 0 ? 'text-yellow-600' : 'text-green-600',
      },
      {
        title: '防雷设施',
        value: lightningProtection.length,
        icon: Zap,
        trend: lightningExpired > 0 ? `${lightningExpired}个过期` : lightningExpiring > 0 ? `${lightningExpiring}个即将过期` : '全部正常',
        trendUp: lightningExpired === 0 && lightningExpiring === 0,
        color: lightningExpired > 0 ? 'text-red-600' : lightningExpiring > 0 ? 'text-yellow-600' : 'text-green-600',
      },
      {
        title: '监控摄像头',
        value: `${onlineCameras}/${cameras.length}`,
        icon: Video,
        trend: offlineCameras > 0 ? `${offlineCameras}个离线` : '全部在线',
        trendUp: offlineCameras === 0,
        color: offlineCameras > 0 ? 'text-red-600' : 'text-green-600',
      },
      {
        title: '今日检查',
        value: todayChecks.length,
        icon: Shield,
        trend: failedChecks > 0 ? `${failedChecks}项不合格` : '全部合格',
        trendUp: failedChecks === 0,
        color: failedChecks > 0 ? 'text-red-600' : 'text-green-600',
      },
    ];
  }, [fireFacilities, lightningProtection, cameras, safetyChecks]);

  const fireFacilityColumns = [
    { key: 'name', label: '设施名称' },
    { key: 'model', label: '规格型号' },
    { key: 'location', label: '存放位置' },
    { key: 'quantity', label: '数量' },
    {
      key: 'lastCheckDate',
      label: '上次检查',
      render: (v: string) => v.split('T')[0],
    },
    {
      key: 'nextCheckDate',
      label: '下次检查',
      render: (v: string) => v.split('T')[0],
    },
    {
      key: 'status',
      label: '状态',
      render: (v: string) => (
        <Badge
          variant={v === 'normal' ? 'success' : v === 'expiring' ? 'warning' : 'danger'}
        >
          {v === 'normal' ? '正常' : v === 'expiring' ? '即将过期' : '已过期'}
        </Badge>
      ),
    },
  ];

  const lightningColumns = [
    { key: 'location', label: '位置' },
    { key: 'type', label: '类型' },
    { key: 'resistance', label: '接地电阻(Ω)', render: (v: number) => v?.toFixed(2) || '-' },
    {
      key: 'lastTestDate',
      label: '上次检测',
      render: (v: string) => v.split('T')[0],
    },
    {
      key: 'nextTestDate',
      label: '下次检测',
      render: (v: string) => v.split('T')[0],
    },
    {
      key: 'status',
      label: '状态',
      render: (v: string) => (
        <Badge
          variant={v === 'normal' ? 'success' : v === 'expiring' ? 'warning' : 'danger'}
        >
          {v === 'normal' ? '正常' : v === 'expiring' ? '即将过期' : '已过期'}
        </Badge>
      ),
    },
  ];

  const checkColumns = [
    {
      key: 'type',
      label: '检查类型',
      render: (v: string) => {
        const names: Record<string, string> = {
          fire: '消防检查',
          lightning: '防雷检查',
          delivery: '卸油监护',
          daily: '日常检查',
        };
        return names[v] || v;
      },
    },
    { key: 'checker', label: '检查人' },
    {
      key: 'checkDate',
      label: '检查时间',
      render: (v: string) => formatDateTime(v),
    },
    {
      key: 'result',
      label: '检查结果',
      render: (v: string) => (
        <Badge variant={v === 'pass' ? 'success' : v === 'warning' ? 'warning' : 'danger'}>
          {v === 'pass' ? '合格' : v === 'warning' ? '有隐患' : '不合格'}
        </Badge>
      ),
    },
  ];

  const toggleCheckItem = (item: string) => {
    const current = checkResults[item];
    let next: 'pass' | 'fail' | 'na';
    if (!current || current === 'na') {
      next = 'pass';
    } else if (current === 'pass') {
      next = 'fail';
    } else {
      next = 'na';
    }
    setCheckResults((prev) => ({ ...prev, [item]: next }));
  };

  const onSubmit = (data: any) => {
    const items: SafetyCheckItem[] = currentCheckItems.map((item) => ({
      name: item,
      result: checkResults[item] || 'na',
    }));

    const hasFail = items.some((i) => i.result === 'fail');
    const hasWarning = items.some((i) => i.result === 'na');

    const check: SafetyCheck = {
      id: Date.now().toString(),
      type: checkType,
      checkDate: new Date().toISOString(),
      checker: data.checker,
      result: hasFail ? 'fail' : hasWarning ? 'warning' : 'pass',
      items,
      remarks: data.remarks,
    };

    addSafetyCheck(check);
    setIsCheckModalOpen(false);
    reset();
    setCheckResults({});
  };

  const startCheck = (type: 'fire' | 'lightning' | 'delivery' | 'daily') => {
    setCheckType(type);
    setIsCheckModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">安全管理</h1>
          <p className="text-gray-500 mt-1">消防、防雷、监控、安全检查管理</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => startCheck('daily')}>
            <Plus className="w-4 h-4 mr-2" />
            日常检查
          </Button>
          <Button onClick={() => startCheck('fire')}>
            <Flame className="w-4 h-4 mr-2" />
            消防检查
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
              onClick={() => setActiveTab('fire')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'fire' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <Flame className="w-4 h-4 inline mr-1" />
              消防设施
            </button>
            <button
              onClick={() => setActiveTab('lightning')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'lightning' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <Zap className="w-4 h-4 inline mr-1" />
              防雷防静电
            </button>
            <button
              onClick={() => setActiveTab('monitor')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'monitor' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <Video className="w-4 h-4 inline mr-1" />
              视频监控
            </button>
            <button
              onClick={() => setActiveTab('checks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'checks' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <FileText className="w-4 h-4 inline mr-1" />
              检查记录
            </button>
          </nav>
        </div>

        {activeTab === 'fire' && (
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                  <option>全部状态</option>
                  <option>正常</option>
                  <option>即将过期</option>
                  <option>已过期</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => startCheck('fire')}>
                  <Plus className="w-4 h-4 mr-1" />
                  消防检查
                </Button>
              </div>
            </div>
            <DataTable
              data={fireFacilities}
              columns={fireFacilityColumns}
              pagination={true}
              pageSize={8}
            />
          </div>
        )}

        {activeTab === 'lightning' && (
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div />
              <Button variant="secondary" size="sm" onClick={() => startCheck('lightning')}>
                <Plus className="w-4 h-4 mr-1" />
                防雷检测
              </Button>
            </div>
            <DataTable
              data={lightningProtection}
              columns={lightningColumns}
              pagination={true}
              pageSize={8}
            />
          </div>
        )}

        {activeTab === 'monitor' && (
          <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cameras.map((camera) => (
              <div
                key={camera.id}
                onClick={() => setSelectedCamera(camera)}
                className="bg-gray-50 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-orange-300 transition-all"
              >
                <div className="relative bg-gray-800 h-40 flex items-center justify-center">
                  {camera.status === 'online' ? (
                    <div className="text-center">
                    <CameraIcon className="w-12 h-12 text-green-500 mx-auto" />
                      <div className="text-green-500 text-sm mt-2">实时画面</div>
                    </div>
                  ) : (
                    <div className="text-center">
                    <WifiOff className="w-12 h-12 text-red-500 mx-auto" />
                      <div className="text-red-500 text-sm mt-2">设备离线</div>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant={camera.status === 'online' ? 'success' : 'danger'}>
                      {camera.status === 'online' ? '在线' : '离线'}
                    </Badge>
                  </div>
                </div>
                <div className="p-3">
                  <div className="font-medium">{camera.name}</div>
                  <div className="text-sm text-gray-500">{camera.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {activeTab === 'checks' && (
          <div className="p-6 space-y-4">
            <div className="flex gap-2">
              <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                <option value="">全部类型</option>
                <option value="fire">消防检查</option>
                <option value="lightning">防雷检查</option>
                <option value="delivery">卸油监护</option>
                <option value="daily">日常检查</option>
              </select>
              <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                <option value="">全部结果</option>
                <option value="pass">合格</option>
                <option value="warning">有隐患</option>
                <option value="fail">不合格</option>
              </select>
            </div>
            <DataTable
              data={safetyChecks}
              columns={checkColumns}
              pagination={true}
              pageSize={10}
              onRowClick={(row: SafetyCheck) => {
                alert(
                  `检查详情:\n类型: ${row.type}\n检查人: ${row.checker}\n时间: ${formatDateTime(row.checkDate)}\n结果: ${row.result}\n备注: ${row.remarks || '无'}`
                );
              }}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={isCheckModalOpen}
        onClose={() => {
          setIsCheckModalOpen(false);
          reset();
          setCheckResults({});
        }}
        title={`${checkType === 'fire' ? '消防检查' : checkType === 'lightning' ? '防雷检查' : checkType === 'delivery' ? '卸油监护' : '日常检查'}`}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">检查类型</label>
              <select
                value={checkType}
                onChange={(e) => setCheckType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="fire">消防检查</option>
                <option value="lightning">防雷检查</option>
                <option value="delivery">卸油监护</option>
                <option value="daily">日常检查</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                检查人 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('checker', { required: '请输入检查人' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="请输入检查人姓名"
              />
              {errors.checker && (
                <p className="text-red-500 text-sm mt-1">{errors.checker.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">检查项目</label>
            <div className="space-y-2">
              {currentCheckItems.map((item) => {
                const result = checkResults[item];
                return (
                  <div
                    key={item}
                    onClick={() => toggleCheckItem(item)}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${result === 'pass' ? 'border-green-500 bg-green-50' : result === 'fail' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-3">
                      {result === 'pass' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : result === 'fail' ? (
                        <XCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                      <span className={result === 'pass' ? 'text-green-700' : result === 'fail' ? 'text-red-700' : 'text-gray-700'}>{item}</span>
                    </div>
                    <div className="flex gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded ${result === 'pass' ? 'bg-green-100 text-green-700' : result === 'fail' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>{result === 'pass' ? '合格' : result === 'fail' ? '不合格' : '未检查'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              {...register('remarks')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="请输入检查中发现的问题及处理意见..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsCheckModalOpen(false);
                reset();
                setCheckResults({});
              }}
            >
              取消
            </Button>
            <Button type="submit">保存检查</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!selectedCamera}
        onClose={() => setSelectedCamera(null)}
        title={selectedCamera?.name || '监控详情'}
        size="lg"
      >
        {selectedCamera && (
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg h-80 flex items-center justify-center">
              {selectedCamera.status === 'online' ? (
                <div className="text-center">
                  <Eye className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <div className="text-green-400 text-lg">正在播放中...</div>
                  <div className="text-gray-500 text-sm mt-2">
                    {selectedCamera.location}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                <WifiOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <div className="text-red-400 text-lg">设备离线</div>
                <div className="text-gray-500 text-sm mt-2">
                  请检查设备连接
                </div>
              </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500">摄像头名称</div>
                <div className="font-semibold">{selectedCamera.name}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500">安装位置</div>
                <div className="font-semibold">{selectedCamera.location}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500">状态</div>
                <div>
                  <Badge variant={selectedCamera.status === 'online' ? 'success' : 'danger'}>
                    {selectedCamera.status === 'online' ? '在线' : '离线'}
                  </Badge>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500">最后在线</div>
                <div className="font-semibold">{formatDateTime(selectedCamera.lastOnline)}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SafetyManagementPage;
