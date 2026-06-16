import { initializeMockData } from './mockData';

const STORAGE_KEY = 'gas_station_data';

export interface AppData {
  tanks: any[];
  nozzles: any[];
  sales: any[];
  deliveries: any[];
  members: any[];
  recharges: any[];
  pointExchanges: any[];
  inventories: any[];
  fireFacilities: any[];
  lightningProtection: any[];
  safetyChecks: any[];
  cameras: any[];
}

export const loadData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load data from localStorage:', e);
  }
  const data = initializeMockData();
  saveData(data);
  return data;
};

export const saveData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data to localStorage:', e);
  }
};

export const resetData = (): AppData => {
  const data = initializeMockData();
  saveData(data);
  return data;
};
