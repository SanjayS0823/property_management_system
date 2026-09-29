import client from './client';

// Properties
export const getProperties = () => client.get('/properties');
export const getProperty = (id) => client.get(`/properties/${id}`);
export const createProperty = (data) => client.post('/properties', data);
export const updateProperty = (id, data) => client.put(`/properties/${id}`, data);

// Units
export const getUnits = (propertyId) => client.get(`/properties/${propertyId}/units`);
export const createUnit = (propertyId, data) => client.post(`/properties/${propertyId}/units`, data);
export const updateUnit = (id, data) => client.put(`/units/${id}`, data);
export const assignTenant = (unitId, tenantId) => client.post(`/units/${unitId}/assign-tenant`, { tenant_id: tenantId });

// Tenants
export const getTenants = () => client.get('/tenants');
export const getTenant = (id) => client.get(`/tenants/${id}`);

// Leases
export const getLeases = () => client.get('/leases');
export const getLease = (id) => client.get(`/leases/${id}`);
export const createLease = (data) => client.post('/leases', data);
export const updateLease = (id, data) => client.put(`/leases/${id}`, data);
export const renewLease = (id, data) => client.post(`/leases/${id}/renew`, data || {});

// Maintenance
export const getMaintenanceRequests = () => client.get('/maintenance');
export const getMaintenanceRequest = (id) => client.get(`/maintenance/${id}`);
export const createMaintenanceRequest = (data) => client.post('/maintenance', data);
export const updateMaintenanceStatus = (id, data) => client.patch(`/maintenance/${id}/status`, data);

// Payments
export const getPayments = () => client.get('/payments');
export const createPayment = (data) => client.post('/payments/create', data);
export const processPayment = (id, success = true) => client.post(`/payments/${id}/process`, { success });

// Notifications
export const getNotifications = () => client.get('/notifications');
export const markNotificationRead = (id) => client.patch(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => client.post('/notifications/read-all');

// Dashboard
export const getDashboard = () => client.get('/dashboard');
export const getTenantDashboard = () => client.get('/dashboard/tenant');
