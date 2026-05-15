import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoginPage from './pages/login/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import CatalogPage from './pages/catalog/CatalogPage';
import InventoryPage from './pages/inventory/InventoryPage';
import PurchasesPage from './pages/purchases/PurchasesPage';
import ClientsPage from './pages/clients/ClientsPage';
import CreditsPage from './pages/credits/CreditsPage';
import SalesPage from './pages/sales/SalesPage';
import BillingPage from './pages/billing/BillingPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/purchases" element={<PurchasesPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/credits" element={<CreditsPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/billing" element={<BillingPage />} />
      </Route>
    </Routes>
  );
}
