import api from "./axios";

export const getDashboards = () => api.get("dashboards/list/");

export const createDashboard = (data) =>
  api.post("dashboards/create/", data);

export const updateDashboard = (id, data) =>
  api.put(`dashboards/${id}/`, data);

export const deleteDashboard = (id) =>
  api.delete(`dashboards/${id}/`);

export const getDashboardDetail = (id) =>
  api.get(`dashboards/${id}/`);

export const getDashboardAnalytics = (id, params = {}) =>
  api.get(`dashboards/analytics/${id}/`, { params });

export const createWidget = (data) =>
  api.post("dashboards/widget/create/", data);

export const updateWidget = (id, data) =>
  api.put(`dashboards/widget/${id}/`, data);

export const deleteWidget = (id) =>
  api.delete(`dashboards/widget/${id}/`);

export const getTemplates = () =>
  api.get("dashboards/templates/");