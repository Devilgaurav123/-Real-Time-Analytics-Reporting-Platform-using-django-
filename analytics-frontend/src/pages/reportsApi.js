import api from "./axios";

export const scheduleReport = (data) =>
  api.post("dashboards/schedule-report/", data);

export const getReportHistory = () =>
  api.get("dashboards/report-history/");

export const downloadReport = (id) =>
  api.get(`dashboards/download-report/${id}/`);