/**
 * Centralized API endpoint definitions.
 * Each module exports a set of functions that return promises.
 */
import api from './client';

// ---------- Auth ----------
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  refresh: (refresh) => api.post('/auth/refresh/', { refresh }),
  me: () => api.get('/auth/me/'),
  changePassword: (data) => api.post('/auth/change-password/', data),
};

// ---------- Generic CRUD builder ----------
function buildCrud(basePath) {
  return {
    list: (params) => api.get(basePath, { params }),
    get: (id) => api.get(`${basePath}${id}/`),
    create: (data) => api.post(basePath, data),
    update: (id, data) => api.patch(`${basePath}${id}/`, data),
    delete: (id) => api.delete(`${basePath}${id}/`),
  };
}

// ---------- Catalog ----------
export const categoriesAPI = buildCrud('/catalog/categories/');
export const productsAPI = buildCrud('/catalog/products/');
export const priceListsAPI = buildCrud('/catalog/price-lists/');

// ---------- Inventory ----------
export const warehousesAPI = buildCrud('/inventory/warehouses/');
export const batchesAPI = {
  ...buildCrud('/inventory/batches/'),
  adjust: (data) => api.post('/inventory/batches/adjust/', data),
};
export const movementsAPI = { list: (params) => api.get('/inventory/movements/', { params }) };

// ---------- Purchases ----------
export const suppliersAPI = buildCrud('/purchases/suppliers/');
export const purchaseEntriesAPI = buildCrud('/purchases/entries/');

// ---------- Clients ----------
export const clientsAPI = buildCrud('/clients/clients/');

// ---------- Credits ----------
export const creditAccountsAPI = {
  ...buildCrud('/credits/accounts/'),
  payment: (data) => api.post('/credits/accounts/payment/', data),
};
export const creditTransactionsAPI = { list: (params) => api.get('/credits/transactions/', { params }) };

// ---------- Sales ----------
export const salesOrdersAPI = {
  ...buildCrud('/sales/orders/'),
  transition: (id, data) => api.post(`/sales/orders/${id}/transition/`, data),
};

// ---------- Billing ----------
export const invoicesAPI = {
  ...buildCrud('/billing/invoices/'),
  certify: (id) => api.post(`/billing/invoices/${id}/certify/`),
  cancel: (id, data) => api.post(`/billing/invoices/${id}/cancel/`, data),
};

// ---------- Delivery Routes ----------
export const deliveryRoutesAPI = buildCrud('/delivery/routes/');
