import api from "./axios";

export const getAlerts = () =>
  api.get("alerts/list/");

export const createAlert = (data) =>
  api.post("alerts/create/", data);

export const getAlertHistory = () =>
  api.get("alerts/history/");

export const muteAlert = (id) =>
  api.post(`alerts/mute/${id}/`);

export const snoozeAlert = (id) =>
  api.post(`alerts/snooze/${id}/`);

export const getNotifications = () =>
  api.get("alerts/notifications/");

export const markNotificationRead = (id) =>
  api.post(`alerts/notifications/read/${id}/`);