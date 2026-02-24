import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const datasetApi = {
  list: () => api.get("/datasets").then(res => res.data),
  create: (name: string) => api.post("/datasets", { name }).then(res => res.data),
  update: (id: string, name: string) => api.put(`/datasets/${id}`, { name }).then(res => res.data),
  delete: (id: string) => api.delete(`/datasets/${id}`).then(res => res.data),
  rollover: (data: { 
    new_name: string, 
    source_dataset_id?: string | null, 
    carry_over_budget: boolean, 
    carry_over_members: boolean, 
    carry_over_settings: boolean 
  }) => api.post("/datasets/rollover", data).then(res => res.data),
};

export const budgetApi = {
  list: (datasetId: string) => api.get(`/budgets?dataset_id=${datasetId}`).then(res => res.data),
  create: (data: { dataset_id: string, name: string, total_amount: number, unit?: string, description?: string, id?: string }) => api.post("/budgets", data).then(res => res.data),
  update: (id: string, data: { name?: string, total_amount?: number, unit?: string, description?: string }) => api.put(`/budgets/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/budgets/${id}`).then(res => res.data),
  merge: (sourceId: string, targetId: string) => api.post("/budgets/merge", { source_budget_id: sourceId, target_budget_id: targetId }).then(res => res.data),
};

export const actualExpenseApi = {
  list: (budgetId: string) => api.get(`/budgets/${budgetId}/actual-expenses`).then(res => res.data),
  create: (budgetId: string, data: { item_name?: string, amount: number, unit?: string }) => api.post(`/budgets/${budgetId}/actual-expenses`, data).then(res => res.data),
  update: (id: number, data: { item_name?: string, amount: number, unit?: string }) => api.put(`/actual-expenses/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/actual-expenses/${id}`).then(res => res.data),
};

export const memberApi = {
  list: (datasetId: string) => api.get(`/members?dataset_id=${datasetId}`).then(res => res.data),
  create: (data: { dataset_id: string, name: string }) => api.post("/members", data).then(res => res.data),
  update: (id: number, data: { name?: string }) => api.put(`/members/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/members/${id}`).then(res => res.data),
};

export const purchaseApi = {
  list: (datasetId: string) => api.get(`/purchases?dataset_id=${datasetId}`).then(res => res.data),
  create: (data: { 
    dataset_id: string, 
    member_name?: string, 
    category?: string, 
    item_name: string, 
    amount: number, 
    unit?: string, 
    status?: string, 
    priority?: number, 
    note?: string,
    assignments?: { budget_id: string, amount: number }[]
  }) => api.post("/purchases", data).then(res => res.data),
  update: (id: number, data: {
    member_name?: string, 
    category?: string, 
    item_name?: string, 
    amount?: number, 
    unit?: string, 
    status?: string, 
    priority?: number, 
    note?: string,
    assignments?: { budget_id: string, amount: number }[]
  }) => api.put(`/purchases/${id}`, data).then(res => res.data),
  updateStatus: (id: number, status: string) => api.patch(`/purchases/${id}/status?status=${status}`).then(res => res.data),
  delete: (id: number) => api.delete(`/purchases/${id}`).then(res => res.data),
  getImportSetting: (datasetId: string) => api.get(`/datasets/${datasetId}/purchase-import-setting`).then(res => res.data),
  saveImportSetting: (datasetId: string, mappingJson: string) => api.post(`/datasets/${datasetId}/purchase-import-setting`, { mapping_json: mappingJson }).then(res => res.data),
  exportCsv: (datasetId: string) => window.open(`${API_BASE_URL}/purchases/export-csv?dataset_id=${datasetId}`, '_blank'),
  importCsv: (datasetId: string, file: File, overwrite: boolean) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("overwrite", String(overwrite));
    return api.post(`/purchases/import-csv?dataset_id=${datasetId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }).then(res => res.data);
  }
};

export const dashboardApi = {
  getSummary: (datasetId: string) => api.get(`/dashboard?dataset_id=${datasetId}`).then(res => res.data),
};

export default api;
