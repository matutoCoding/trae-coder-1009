import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Dashboard from '../pages/Dashboard';
import TankLedger from '../pages/TankLedger';
import OilDelivery from '../pages/OilDelivery';
import FuelSales from '../pages/FuelSales';
import Inventory from '../pages/Inventory';
import MemberManagement from '../pages/MemberManagement';
import SafetyManagement from '../pages/SafetyManagement';
import BusinessReports from '../pages/BusinessReports';

const AppRouter: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tank-ledger" element={<TankLedger />} />
        <Route path="/oil-delivery" element={<OilDelivery />} />
        <Route path="/fuel-sales" element={<FuelSales />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/members" element={<MemberManagement />} />
        <Route path="/safety" element={<SafetyManagement />} />
        <Route path="/reports" element={<BusinessReports />} />
      </Routes>
    </Layout>
  );
};

export default AppRouter;
