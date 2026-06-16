import { create } from 'zustand';
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
} from '../types';
import { loadData, saveData, resetData as resetStorageData, AppData } from '../services/storage';

interface AppState {
  tanks: Tank[];
  nozzles: FuelNozzle[];
  sales: Sale[];
  deliveries: Delivery[];
  members: Member[];
  recharges: Recharge[];
  pointExchanges: PointExchange[];
  inventories: Inventory[];
  fireFacilities: FireFacility[];
  lightningProtection: LightningProtection[];
  safetyChecks: SafetyCheck[];
  cameras: Camera[];
  initialized: boolean;
  sidebarCollapsed: boolean;

  init: () => void;
  resetData: () => void;
  toggleSidebar: () => void;

  addDelivery: (delivery: Delivery) => void;
  updateDelivery: (id: string, updates: Partial<Delivery>) => void;
  addSale: (sale: Sale) => void;
  addInventory: (inventory: Inventory) => void;
  addMember: (member: Member) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  addRecharge: (recharge: Recharge) => void;
  addPointExchange: (exchange: PointExchange) => void;
  addSafetyCheck: (check: SafetyCheck) => void;
  updateFireFacility: (id: string, updates: Partial<FireFacility>) => void;
  updateLightningProtection: (id: string, updates: Partial<LightningProtection>) => void;
  updateTankLevel: (id: string, level: number, volume: number) => void;
  updateNozzle: (id: string, updates: Partial<FuelNozzle>) => void;
}

const saveAll = (state: Partial<AppState>) => {
  const data: AppData = {
    tanks: state.tanks || [],
    nozzles: state.nozzles || [],
    sales: state.sales || [],
    deliveries: state.deliveries || [],
    members: state.members || [],
    recharges: state.recharges || [],
    pointExchanges: state.pointExchanges || [],
    inventories: state.inventories || [],
    fireFacilities: state.fireFacilities || [],
    lightningProtection: state.lightningProtection || [],
    safetyChecks: state.safetyChecks || [],
    cameras: state.cameras || [],
  };
  saveData(data);
};

export const useAppStore = create<AppState>((set, get) => ({
  tanks: [],
  nozzles: [],
  sales: [],
  deliveries: [],
  members: [],
  recharges: [],
  pointExchanges: [],
  inventories: [],
  fireFacilities: [],
  lightningProtection: [],
  safetyChecks: [],
  cameras: [],
  initialized: false,
  sidebarCollapsed: false,

  init: () => {
    const data = loadData();
    set({
      ...data,
      initialized: true,
    });
  },

  resetData: () => {
    const data = resetStorageData();
    set({
      ...data,
    });
  },

  addDelivery: (delivery) => {
    const newDeliveries = [delivery, ...get().deliveries];
    set({ deliveries: newDeliveries });
    saveAll({ ...get(), deliveries: newDeliveries });
  },

  updateDelivery: (id, updates) => {
    const newDeliveries = get().deliveries.map((d) =>
      d.id === id ? { ...d, ...updates } : d
    );
    set({ deliveries: newDeliveries });
    saveAll({ ...get(), deliveries: newDeliveries });
  },

  addSale: (sale) => {
    const newSales = [sale, ...get().sales];
    set({ sales: newSales });
    saveAll({ ...get(), sales: newSales });
  },

  addInventory: (inventory) => {
    const newInventories = [inventory, ...get().inventories];
    set({ inventories: newInventories });
    saveAll({ ...get(), inventories: newInventories });
  },

  addMember: (member) => {
    const newMembers = [member, ...get().members];
    set({ members: newMembers });
    saveAll({ ...get(), members: newMembers });
  },

  updateMember: (id, updates) => {
    const newMembers = get().members.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    );
    set({ members: newMembers });
    saveAll({ ...get(), members: newMembers });
  },

  addRecharge: (recharge) => {
    const newRecharges = [recharge, ...get().recharges];
    set({ recharges: newRecharges });
    
    const member = get().members.find((m) => m.id === recharge.memberId);
    if (member) {
      get().updateMember(member.id, {
        balance: member.balance + recharge.amount + recharge.bonus,
      });
    }
    saveAll({ ...get(), recharges: newRecharges });
  },

  addPointExchange: (exchange) => {
    const newExchanges = [exchange, ...get().pointExchanges];
    set({ pointExchanges: newExchanges });
    
    const member = get().members.find((m) => m.id === exchange.memberId);
    if (member) {
      get().updateMember(member.id, {
        points: member.points - exchange.points,
      });
    }
    saveAll({ ...get(), pointExchanges: newExchanges });
  },

  addSafetyCheck: (check) => {
    const newChecks = [check, ...get().safetyChecks];
    set({ safetyChecks: newChecks });
    saveAll({ ...get(), safetyChecks: newChecks });
  },

  updateFireFacility: (id, updates) => {
    const newFacilities = get().fireFacilities.map((f) =>
      f.id === id ? { ...f, ...updates } : f
    );
    set({ fireFacilities: newFacilities });
    saveAll({ ...get(), fireFacilities: newFacilities });
  },

  updateLightningProtection: (id, updates) => {
    const newProtection = get().lightningProtection.map((l) =>
      l.id === id ? { ...l, ...updates } : l
    );
    set({ lightningProtection: newProtection });
    saveAll({ ...get(), lightningProtection: newProtection });
  },

  updateTankLevel: (id, level, volume) => {
    const newTanks = get().tanks.map((t) =>
      t.id === id
        ? {
            ...t,
            currentLevel: level,
            volume,
            status: (level < 20 ? 'alert' : level < 40 ? 'warning' : 'normal') as 'alert' | 'warning' | 'normal',
            lastUpdate: new Date().toISOString(),
          }
        : t
    );
    set({ tanks: newTanks });
    saveAll({ ...get(), tanks: newTanks });
  },

  updateNozzle: (id, updates) => {
    const newNozzles = get().nozzles.map((n) =>
      n.id === id ? { ...n, ...updates } : n
    );
    set({ nozzles: newNozzles });
    saveAll({ ...get(), nozzles: newNozzles });
  },

  toggleSidebar: () => {
    set({ sidebarCollapsed: !get().sidebarCollapsed });
  },
}));
