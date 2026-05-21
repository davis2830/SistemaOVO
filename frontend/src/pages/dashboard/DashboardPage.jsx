import { useState, useEffect } from 'react';
import StatCard from '../../components/common/StatCard';
import { productsAPI, clientsAPI, salesOrdersAPI, invoicesAPI } from '../../api/endpoints';

export default function DashboardPage() {
  const [stats, setStats] = useState({ products: 0, clients: 0, orders: 0, invoices: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const [prods, clients, orders, invs] = await Promise.allSettled([
          productsAPI.list(), clientsAPI.list(), salesOrdersAPI.list(), invoicesAPI.list(),
        ]);
        setStats({
          products: prods.status === 'fulfilled' ? (prods.value.data.data?.results || prods.value.data.results || []).length : 0,
          clients: clients.status === 'fulfilled' ? (clients.value.data.data?.results || clients.value.data.results || []).length : 0,
          orders: orders.status === 'fulfilled' ? (orders.value.data.data?.results || orders.value.data.results || []).length : 0,
          invoices: invs.status === 'fulfilled' ? (invs.value.data.data?.results || invs.value.data.results || []).length : 0,
        });
      } catch { /* ignore */ }
    };
    load();
  }, []);

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold text-charcoal">Resumen de Operaciones</h2>
        <p className="text-sm text-gray-400">Panel administrativo &quot;Venta de Huevos&quot;</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          title="Productos"
          value={stats.products}
          color="yolk"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />
        <StatCard
          title="Clientes Activos"
          value={stats.clients}
          color="blue"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          title="Pedidos"
          value={stats.orders}
          color="leaf"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        <StatCard
          title="Facturas"
          value={stats.invoices}
          color="red"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      </div>

      <div className="bg-white rounded-3xl shadow-premium border border-gray-50 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-xl font-display font-bold text-charcoal">Actividad Reciente</h4>
            <p className="text-sm text-gray-400">Resumen del sistema</p>
          </div>
        </div>
        <div className="text-center py-12 text-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm font-medium">Utiliza los módulos del sidebar para gestionar tu negocio</p>
        </div>
      </div>
    </>
  );
}
