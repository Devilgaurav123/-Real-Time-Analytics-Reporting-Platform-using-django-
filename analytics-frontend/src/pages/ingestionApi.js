import api from "./axios";

export const getEvents = () =>
  api.get("ingestion/events/");

export const createSingleEvent = (data) =>
  api.post("ingestion/single-event/", data);

export const createBatchEvents = (data) =>
  api.post("ingestion/batch-event/", data);

export const uploadCsv = (formData) =>
  api.post("ingestion/upload-csv/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const generateApiKey = () =>
  api.post("ingestion/generate-api-key/");

export const revokeApiKey = (id) =>
  api.post(`ingestion/revoke-api-key/${id}/`);

export const rotateApiKey = (id) =>
  api.post(`ingestion/rotate-api-key/${id}/`);

export const sendWebhookEvent = (data) =>
  api.post("ingestion/webhook-event/", data);