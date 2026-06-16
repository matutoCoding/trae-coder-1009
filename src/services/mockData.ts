import {
  Tank,
  Delivery,
  FuelNozzle,
  Sale,
  Inventory,
  Member,
  Recharge,
  PointExchange,
  FireFacility,
  LightningProtection,
  SafetyCheck,
  Camera,
  FUEL_PRICES,
} from '../types';
import { format, subDays, subHours, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const generateId = () => Math.random().toString(36).substring(2, 11);

export const generateMockTanks = (): Tank[] => [
  {
    id: 'tank-001',
    tankNo: '1#罐',
    fuelType: '92#',
    capacity: 30000,
    currentLevel: 65,
    temperature: 24.5,
    volume: 19500,
    status: 'normal',
    lastUpdate: new Date().toISOString(),
  },
  {
    id: 'tank-002',
    tankNo: '2#罐',
    fuelType: '95#',
    capacity: 30000,
    currentLevel: 42,
    temperature: 23.8,
    volume: 12600,
    status: 'warning',
    lastUpdate: new Date().toISOString(),
  },
  {
    id: 'tank-003',
    tankNo: '3#罐',
    fuelType: '98#',
    capacity: 20000,
    currentLevel: 78,
    temperature: 25.1,
    volume: 15600,
    status: 'normal',
    lastUpdate: new Date().toISOString(),
  },
  {
    id: 'tank-004',
    tankNo: '4#罐',
    fuelType: '0#',
    capacity: 40000,
    currentLevel: 18,
    temperature: 22.3,
    volume: 7200,
    status: 'alert',
    lastUpdate: new Date().toISOString(),
  },
];

export const generateMockNozzles = (): FuelNozzle[] => {
  const nozzles: FuelNozzle[] = [];
  const fuelTypes = ['92#', '92#', '95#', '95#', '98#', '98#', '0#', '0#'];
  
  for (let i = 0; i < 8; i++) {
    nozzles.push({
      id: `nozzle-${String(i + 1).padStart(3, '0')}`,
      nozzleNo: `${i + 1}#枪`,
      fuelType: fuelTypes[i],
      totalizer: Math.floor(Math.random() * 500000) + 100000,
      status: i === 5 ? 'maintenance' : 'active',
      lastCalibrationDate: format(subDays(new Date(), Math.floor(Math.random() * 30)), 'yyyy-MM-dd'),
      nextCalibrationDate: format(addDays(new Date(), Math.floor(Math.random() * 90) + 30), 'yyyy-MM-dd'),
    });
  }
  return nozzles;
};

export const generateMockSales = (): Sale[] => {
  const sales: Sale[] = [];
  const fuelTypes = ['92#', '95#', '98#', '0#'];
  const paymentMethods: Sale['paymentMethod'][] = ['cash', 'card', 'member', 'wechat', 'alipay'];
  
  for (let i = 0; i < 50; i++) {
    const fuelType = fuelTypes[Math.floor(Math.random() * fuelTypes.length)] as typeof fuelTypes[number];
    const volume = Math.random() * 40 + 10;
    const unitPrice = FUEL_PRICES[fuelType as keyof typeof FUEL_PRICES];
    const tankIdx = fuelTypes.indexOf(fuelType);
    const tankId = `tank-${String(tankIdx + 1).padStart(3, '0')}`;
    const nozzleNum = tankIdx * 2 + Math.floor(Math.random() * 2) + 1;
    
    sales.push({
      id: generateId(),
      nozzleId: `nozzle-${String(nozzleNum).padStart(3, '0')}`,
      tankId,
      memberId: Math.random() > 0.5 ? `member-${String(Math.floor(Math.random() * 50) + 1).padStart(3, '0')}` : undefined,
      fuelType,
      volume: Number(volume.toFixed(2)),
      unitPrice,
      amount: Number((volume * unitPrice).toFixed(2)),
      saleTime: subHours(new Date(), Math.random() * 72).toISOString(),
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      status: i === 15 || i === 30 ? 'refunded' : 'completed',
    });
  }
  return sales.sort((a, b) => new Date(b.saleTime).getTime() - new Date(a.saleTime).getTime());
};

export const generateMockDeliveries = (): Delivery[] => {
  const deliveries: Delivery[] = [];
  const tankers = ['沪A·12345', '苏B·67890', '浙C·11111', '皖D·22222'];
  const drivers = ['张三', '李四', '王五', '赵六'];
  const guardians = ['陈站长', '刘班长', '周安全员'];
  const fuelTypes = ['92#', '95#', '98#', '0#'];
  
  for (let i = 0; i < 10; i++) {
    const fuelType = fuelTypes[Math.floor(Math.random() * fuelTypes.length)];
    const tankId = `tank-${String(fuelTypes.indexOf(fuelType) + 1).padStart(3, '0')}`;
    const startTime = subDays(new Date(), i * 3);
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
    const unitPrice = Number((FUEL_PRICES[fuelType as keyof typeof FUEL_PRICES] * 0.85).toFixed(2));
    const quantity = Math.floor(Math.random() * 10000) + 5000;
    
    deliveries.push({
      id: generateId(),
      tankerNo: tankers[Math.floor(Math.random() * tankers.length)],
      driverName: drivers[Math.floor(Math.random() * drivers.length)],
      driverPhone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      fuelType,
      quantity,
      unitPrice,
      totalAmount: Number((quantity * unitPrice).toFixed(2)),
      tankId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      status: i === 0 ? 'in-progress' : 'completed',
      guardian: guardians[Math.floor(Math.random() * guardians.length)],
      density: 0.72 + Math.random() * 0.1,
      temperature: 20 + Math.random() * 10,
      remarks: i === 0 ? '正在卸油中...' : '',
    });
  }
  return deliveries;
};

export const generateMockMembers = (): Member[] => {
  const members: Member[] = [];
  const firstNames = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴'];
  const lastNames = ['伟', '芳', '娜', '敏', '静', '强', '磊', '军', '洋', '勇'];
  const levels: Member['level'][] = ['normal', 'silver', 'gold', 'platinum'];
  const plates = ['沪A', '苏B', '浙C', '皖D', '鲁E'];
  
  for (let i = 0; i < 50; i++) {
    members.push({
      id: `member-${String(i + 1).padStart(3, '0')}`,
      name: `${firstNames[Math.floor(Math.random() * firstNames.length)]}${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      phone: `13${String(Math.floor(Math.random() * 9) + 5)}${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      cardNo: `GS${String(20240000 + i)}`,
      balance: Number((Math.random() * 5000).toFixed(2)),
      points: Math.floor(Math.random() * 5000),
      createTime: subDays(new Date(), Math.floor(Math.random() * 365)).toISOString(),
      status: Math.random() > 0.1 ? 'active' : 'inactive',
      level: levels[Math.floor(Math.random() * levels.length)],
      licensePlate: `${plates[Math.floor(Math.random() * plates.length)]}${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`,
    });
  }
  return members;
};

export const generateMockRecharges = (): Recharge[] => {
  const recharges: Recharge[] = [];
  const operators = ['陈站长', '刘班长', '张出纳'];
  const paymentMethods = ['现金', '银行卡', '微信', '支付宝'];
  
  for (let i = 0; i < 30; i++) {
    const amount = [100, 200, 500, 1000, 2000, 5000][Math.floor(Math.random() * 6)];
    const bonus = amount >= 1000 ? amount * 0.05 : amount >= 500 ? amount * 0.03 : 0;
    
    recharges.push({
      id: generateId(),
      memberId: `member-${String(Math.floor(Math.random() * 50) + 1).padStart(3, '0')}`,
      amount,
      bonus: Number(bonus.toFixed(2)),
      rechargeTime: subDays(new Date(), Math.floor(Math.random() * 90)).toISOString(),
      operator: operators[Math.floor(Math.random() * operators.length)],
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
    });
  }
  return recharges.sort((a, b) => new Date(b.rechargeTime).getTime() - new Date(a.rechargeTime).getTime());
};

export const generateMockPointExchanges = (): PointExchange[] => {
  const gifts = [
    { name: '矿泉水一箱', value: 30, points: 300 },
    { name: '纸巾一提', value: 20, points: 200 },
    { name: '玻璃水一瓶', value: 15, points: 150 },
    { name: '50元加油券', value: 50, points: 500 },
    { name: '100元加油券', value: 100, points: 1000 },
    { name: '车载香水', value: 80, points: 800 },
  ];
  const exchanges: PointExchange[] = [];
  const operators = ['陈站长', '刘班长', '张出纳'];
  
  for (let i = 0; i < 20; i++) {
    const gift = gifts[Math.floor(Math.random() * gifts.length)];
    exchanges.push({
      id: generateId(),
      memberId: `member-${String(Math.floor(Math.random() * 50) + 1).padStart(3, '0')}`,
      points: gift.points,
      gift: gift.name,
      giftValue: gift.value,
      exchangeTime: subDays(new Date(), Math.floor(Math.random() * 60)).toISOString(),
      operator: operators[Math.floor(Math.random() * operators.length)],
    });
  }
  return exchanges.sort((a, b) => new Date(b.exchangeTime).getTime() - new Date(a.exchangeTime).getTime());
};

export const generateMockInventories = (): Inventory[] => {
  const inventories: Inventory[] = [];
  const tanks = generateMockTanks();
  const handlers = ['陈站长', '刘班长'];
  
  for (let i = 0; i < 7; i++) {
    tanks.forEach((tank, idx) => {
      const bookQuantity = tank.volume - Math.random() * 5000;
      const actualQuantity = bookQuantity + (Math.random() - 0.5) * 200;
      const difference = actualQuantity - bookQuantity;
      const differenceRate = (difference / bookQuantity) * 100;
      
      inventories.push({
        id: generateId(),
        inventoryDate: format(subDays(new Date(), i), 'yyyy-MM-dd'),
        tankId: tank.id,
        bookQuantity: Number(bookQuantity.toFixed(2)),
        actualQuantity: Number(actualQuantity.toFixed(2)),
        difference: Number(difference.toFixed(2)),
        differenceRate: Number(differenceRate.toFixed(4)),
        handler: handlers[Math.floor(Math.random() * handlers.length)],
        status: Math.abs(differenceRate) > 0.3 ? 'abnormal' : 'normal',
        remarks: Math.abs(differenceRate) > 0.3 ? '差异超限，需核查' : '',
      });
    });
  }
  return inventories.sort((a, b) => new Date(b.inventoryDate).getTime() - new Date(a.inventoryDate).getTime());
};

export const generateMockFireFacilities = (): FireFacility[] => [
  {
    id: 'fire-001',
    name: '干粉灭火器',
    model: 'MFZ/ABC4',
    location: '加油岛1',
    quantity: 4,
    lastCheckDate: format(subDays(new Date(), 15), 'yyyy-MM-dd'),
    nextCheckDate: format(addDays(new Date(), 75), 'yyyy-MM-dd'),
    status: 'normal',
  },
  {
    id: 'fire-002',
    name: '干粉灭火器',
    model: 'MFZ/ABC4',
    location: '加油岛2',
    quantity: 4,
    lastCheckDate: format(subDays(new Date(), 15), 'yyyy-MM-dd'),
    nextCheckDate: format(addDays(new Date(), 75), 'yyyy-MM-dd'),
    status: 'normal',
  },
  {
    id: 'fire-003',
    name: '二氧化碳灭火器',
    model: 'MT/3',
    location: '配电室',
    quantity: 2,
    lastCheckDate: format(subDays(new Date(), 85), 'yyyy-MM-dd'),
    nextCheckDate: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
    status: 'expiring',
  },
  {
    id: 'fire-004',
    name: '灭火毯',
    model: '1.2m×1.2m',
    location: '厨房',
    quantity: 2,
    lastCheckDate: format(subDays(new Date(), 100), 'yyyy-MM-dd'),
    nextCheckDate: format(subDays(new Date(), 10), 'yyyy-MM-dd'),
    status: 'expired',
  },
  {
    id: 'fire-005',
    name: '消防沙箱',
    model: '2m³',
    location: '油罐区',
    quantity: 1,
    lastCheckDate: format(subDays(new Date(), 20), 'yyyy-MM-dd'),
    nextCheckDate: format(addDays(new Date(), 70), 'yyyy-MM-dd'),
    status: 'normal',
  },
  {
    id: 'fire-006',
    name: '消防锹',
    model: '标准型',
    location: '油罐区',
    quantity: 4,
    lastCheckDate: format(subDays(new Date(), 20), 'yyyy-MM-dd'),
    nextCheckDate: format(addDays(new Date(), 70), 'yyyy-MM-dd'),
    status: 'normal',
  },
];

export const generateMockLightningProtection = (): LightningProtection[] => [
  {
    id: 'lp-001',
    location: '加油棚',
    type: '接闪带',
    lastTestDate: format(subDays(new Date(), 180), 'yyyy-MM-dd'),
    nextTestDate: format(addDays(new Date(), 185), 'yyyy-MM-dd'),
    resistance: 1.2,
    status: 'normal',
  },
  {
    id: 'lp-002',
    location: '油罐区',
    type: '接地极',
    lastTestDate: format(subDays(new Date(), 180), 'yyyy-MM-dd'),
    nextTestDate: format(addDays(new Date(), 185), 'yyyy-MM-dd'),
    resistance: 0.8,
    status: 'normal',
  },
  {
    id: 'lp-003',
    location: '配电室',
    type: '防雷器',
    lastTestDate: format(subDays(new Date(), 350), 'yyyy-MM-dd'),
    nextTestDate: format(addDays(new Date(), 15), 'yyyy-MM-dd'),
    resistance: 2.5,
    status: 'expiring',
  },
  {
    id: 'lp-004',
    location: '站房',
    type: '接闪杆',
    lastTestDate: format(subDays(new Date(), 400), 'yyyy-MM-dd'),
    nextTestDate: format(subDays(new Date(), 35), 'yyyy-MM-dd'),
    resistance: 5.2,
    status: 'expired',
  },
];

export const generateMockSafetyChecks = (): SafetyCheck[] => {
  const checks: SafetyCheck[] = [];
  const checkers = ['周安全员', '陈站长', '刘班长'];
  const types: SafetyCheck['type'][] = ['fire', 'lightning', 'delivery', 'daily'];
  
  for (let i = 0; i < 15; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const items = generateSafetyCheckItems(type);
    const hasFail = items.some(item => item.result === 'fail');
    const hasWarning = items.some(item => item.result === 'na');
    
    checks.push({
      id: generateId(),
      type,
      checkDate: format(subDays(new Date(), i), 'yyyy-MM-dd'),
      checker: checkers[Math.floor(Math.random() * checkers.length)],
      result: hasFail ? 'fail' : hasWarning ? 'warning' : 'pass',
      items,
      remarks: hasFail ? '发现安全隐患，需立即整改' : '',
    });
  }
  return checks.sort((a, b) => new Date(b.checkDate).getTime() - new Date(a.checkDate).getTime());
};

const generateSafetyCheckItems = (type: string): SafetyCheck['items'] => {
  const itemMap: Record<string, string[]> = {
    fire: [
      '灭火器压力正常',
      '灭火器在有效期内',
      '消防通道畅通',
      '消防沙充足',
      '应急照明正常',
    ],
    lightning: [
      '接地电阻测试合格',
      '接闪器无损坏',
      '引下线连接牢固',
      '等电位连接正常',
    ],
    delivery: [
      '卸油车辆熄火接地',
      '灭火器放置到位',
      '警示标志设置',
      '监护人员在岗',
      '油气回收正常',
      '量油孔密封良好',
    ],
    daily: [
      '加油机无渗漏',
      '电气设备正常',
      '应急器材完好',
      '监控系统正常',
      '现场无杂物',
    ],
  };
  
  return (itemMap[type] || itemMap.daily).map(name => ({
    name,
    result: Math.random() > 0.9 ? 'fail' : Math.random() > 0.95 ? 'na' : 'pass',
    remarks: Math.random() > 0.9 ? '需检查' : '',
  }));
};

export const generateMockCameras = (): Camera[] => [
  { id: 'cam-001', name: 'CAM-01', location: '加油岛1', status: 'online', lastOnline: new Date().toISOString() },
  { id: 'cam-002', name: 'CAM-02', location: '加油岛2', status: 'online', lastOnline: new Date().toISOString() },
  { id: 'cam-003', name: 'CAM-03', location: '油罐区', status: 'online', lastOnline: new Date().toISOString() },
  { id: 'cam-004', name: 'CAM-04', location: '出入口', status: 'online', lastOnline: new Date().toISOString() },
  { id: 'cam-005', name: 'CAM-05', location: '营业厅', status: 'online', lastOnline: new Date().toISOString() },
  { id: 'cam-006', name: 'CAM-06', location: '配电室', status: 'offline', lastOnline: subHours(new Date(), 2).toISOString() },
  { id: 'cam-007', name: 'CAM-07', location: '仓库', status: 'online', lastOnline: new Date().toISOString() },
  { id: 'cam-008', name: 'CAM-08', location: '站房外围', status: 'online', lastOnline: new Date().toISOString() },
];

export const initializeMockData = () => {
  return {
    tanks: generateMockTanks(),
    nozzles: generateMockNozzles(),
    sales: generateMockSales(),
    deliveries: generateMockDeliveries(),
    members: generateMockMembers(),
    recharges: generateMockRecharges(),
    pointExchanges: generateMockPointExchanges(),
    inventories: generateMockInventories(),
    fireFacilities: generateMockFireFacilities(),
    lightningProtection: generateMockLightningProtection(),
    safetyChecks: generateMockSafetyChecks(),
    cameras: generateMockCameras(),
  };
};
