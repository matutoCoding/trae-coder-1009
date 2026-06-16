import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '-';
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatVolume = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '-';
  return `${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L`;
};

export const formatDateTime = (date: string | Date | undefined | null): string => {
  if (!date) return '-';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return format(d, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN });
  } catch {
    return '-';
  }
};

export const formatDate = (date: string | Date | undefined | null): string => {
  if (!date) return '-';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return format(d, 'yyyy-MM-dd', { locale: zhCN });
  } catch {
    return '-';
  }
};

export const formatTime = (date: string | Date | undefined | null): string => {
  if (!date) return '-';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return format(d, 'HH:mm:ss', { locale: zhCN });
  } catch {
    return '-';
  }
};

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    normal: 'text-green-600 bg-green-50',
    warning: 'text-amber-600 bg-amber-50',
    alert: 'text-red-600 bg-red-50',
    active: 'text-green-600 bg-green-50',
    inactive: 'text-gray-600 bg-gray-50',
    maintenance: 'text-amber-600 bg-amber-50',
    'in-progress': 'text-blue-600 bg-blue-50',
    completed: 'text-green-600 bg-green-50',
    pending: 'text-amber-600 bg-amber-50',
    expiring: 'text-amber-600 bg-amber-50',
    expired: 'text-red-600 bg-red-50',
    online: 'text-green-600 bg-green-50',
    offline: 'text-red-600 bg-red-50',
    pass: 'text-green-600 bg-green-50',
    fail: 'text-red-600 bg-red-50',
    abnormal: 'text-red-600 bg-red-50',
  };
  return colorMap[status] || 'text-gray-600 bg-gray-50';
};

export const getStatusText = (status: string): string => {
  const textMap: Record<string, string> = {
    normal: '正常',
    warning: '预警',
    alert: '告警',
    active: '运行中',
    inactive: '停用',
    maintenance: '维护中',
    'in-progress': '进行中',
    completed: '已完成',
    pending: '待处理',
    expiring: '即将到期',
    expired: '已过期',
    online: '在线',
    offline: '离线',
    pass: '合格',
    fail: '不合格',
    abnormal: '异常',
  };
  return textMap[status] || status;
};

export const getPaymentMethodText = (method: string): string => {
  const map: Record<string, string> = {
    cash: '现金',
    card: '银行卡',
    member: '会员余额',
    wechat: '微信支付',
    alipay: '支付宝',
  };
  return map[method] || method;
};

export const getCheckTypeText = (type: string): string => {
  const map: Record<string, string> = {
    fire: '消防检查',
    lightning: '防雷检测',
    delivery: '卸油监护',
    daily: '日常巡检',
  };
  return map[type] || type;
};

export const getMemberLevelText = (level: string): string => {
  const map: Record<string, string> = {
    normal: '普通会员',
    silver: '银卡会员',
    gold: '金卡会员',
    platinum: '铂金会员',
  };
  return map[level] || level;
};

export const getMemberLevelColor = (level: string): string => {
  const map: Record<string, string> = {
    normal: 'text-gray-600 bg-gray-100',
    silver: 'text-gray-500 bg-gray-200',
    gold: 'text-amber-700 bg-amber-100',
    platinum: 'text-blue-700 bg-blue-100',
  };
  return map[level] || map.normal;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const cn = (...classes: (string | undefined | false | null)[]): string => {
  return classes.filter(Boolean).join(' ');
};
