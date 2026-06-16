export interface Tank {
  id: string;
  tankNo: string;
  fuelType: string;
  capacity: number;
  currentLevel: number;
  temperature: number;
  volume: number;
  status: 'normal' | 'warning' | 'alert';
  lastUpdate: string;
}

export interface Delivery {
  id: string;
  tankerNo: string;
  driverName: string;
  driverPhone: string;
  fuelType: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  tankId: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'in-progress' | 'completed';
  guardian: string;
  density: number;
  temperature: number;
  remarks?: string;
}

export interface FuelNozzle {
  id: string;
  nozzleNo: string;
  fuelType: string;
  totalizer: number;
  status: 'active' | 'inactive' | 'maintenance';
  lastCalibrationDate: string;
  nextCalibrationDate: string;
}

export interface Sale {
  id: string;
  nozzleId: string;
  tankId: string;
  memberId?: string;
  fuelType: string;
  volume: number;
  unitPrice: number;
  amount: number;
  saleTime: string;
  paymentMethod: 'cash' | 'card' | 'member' | 'wechat' | 'alipay';
  status: 'completed' | 'refunded';
}

export interface Inventory {
  id: string;
  inventoryDate: string;
  tankId: string;
  bookQuantity: number;
  actualQuantity: number;
  difference: number;
  differenceRate: number;
  handler: string;
  remarks?: string;
  status: 'normal' | 'abnormal';
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  cardNo: string;
  balance: number;
  points: number;
  createTime: string;
  status: 'active' | 'inactive' | 'frozen';
  level: 'normal' | 'silver' | 'gold' | 'platinum';
  licensePlate?: string;
}

export interface Recharge {
  id: string;
  memberId: string;
  amount: number;
  bonus: number;
  rechargeTime: string;
  operator: string;
  paymentMethod: string;
}

export interface PointExchange {
  id: string;
  memberId: string;
  points: number;
  gift: string;
  giftValue: number;
  exchangeTime: string;
  operator: string;
}

export interface FireFacility {
  id: string;
  name: string;
  model: string;
  location: string;
  quantity: number;
  lastCheckDate: string;
  nextCheckDate: string;
  status: 'normal' | 'expiring' | 'expired';
  remarks?: string;
}

export interface LightningProtection {
  id: string;
  location: string;
  type: string;
  lastTestDate: string;
  nextTestDate: string;
  resistance: number;
  status: 'normal' | 'expiring' | 'expired';
  remarks?: string;
}

export interface SafetyCheck {
  id: string;
  type: 'fire' | 'lightning' | 'delivery' | 'daily';
  checkDate: string;
  checker: string;
  result: 'pass' | 'warning' | 'fail';
  items: SafetyCheckItem[];
  remarks?: string;
}

export interface SafetyCheckItem {
  name: string;
  result: 'pass' | 'fail' | 'na';
  remarks?: string;
}

export interface Camera {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline';
  lastOnline: string;
}

export interface DailyReport {
  reportDate: string;
  totalSales: number;
  totalVolume: number;
  salesByFuel: { fuelType: string; volume: number; amount: number }[];
  memberRecharge: number;
  memberConsumption: number;
  inventoryChanges: { tankId: string; tankNo: string; fuelType: string; startVolume: number; endVolume: number; salesVolume: number; deliveryVolume: number }[];
  profit: number;
}

export type FuelType = '92#' | '95#' | '98#' | '0#';

export const FUEL_PRICES: Record<FuelType, number> = {
  '92#': 7.89,
  '95#': 8.45,
  '98#': 9.21,
  '0#': 7.56,
};

export const FUEL_COLORS: Record<FuelType, string> = {
  '92#': '#3b82f6',
  '95#': '#f59e0b',
  '98#': '#ef4444',
  '0#': '#10b981',
};
