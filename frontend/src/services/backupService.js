import api from '../api';

const BASE = '/backup';

// ── Stats ──────────────────────────────────────────────────────────────────
export const getBackupStats = () =>
  api.get(`${BASE}/stats/`).then(r => r.data);

export const getRegisteredSchools = () =>
  api.get(`${BASE}/schools/`).then(r => r.data);

// ── Records ────────────────────────────────────────────────────────────────
export const getBackupRecords = (params = {}) => {
  const q = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ''))
  ).toString();
  return api.get(`${BASE}/records/${q ? '?' + q : ''}`).then(r => r.data);
};

export const getBackupRecord = (id) =>
  api.get(`${BASE}/records/${id}/`).then(r => r.data);

export const deleteBackupRecord = (id) =>
  api.delete(`${BASE}/records/${id}/`).then(r => r.data);

export const getDownloadUrl = (id) => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  return `${base}/backup/records/${id}/download/`;
};

// ── Initiate ───────────────────────────────────────────────────────────────
export const initiateBackup = (data) =>
  api.post(`${BASE}/initiate/`, data).then(r => r.data);

// ── Schedules ──────────────────────────────────────────────────────────────
export const getBackupSchedules = () =>
  api.get(`${BASE}/schedules/`).then(r => r.data);

export const createBackupSchedule = (data) =>
  api.post(`${BASE}/schedules/`, data).then(r => r.data);

export const updateBackupSchedule = (id, data) =>
  api.patch(`${BASE}/schedules/${id}/`, data).then(r => r.data);

export const deleteBackupSchedule = (id) =>
  api.delete(`${BASE}/schedules/${id}/`).then(r => r.data);

export const triggerScheduledBackups = () =>
  api.post(`${BASE}/run-scheduled/`, {}).then(r => r.data);

export default {
  getBackupStats,
  getRegisteredSchools,
  getBackupRecords,
  getBackupRecord,
  deleteBackupRecord,
  getDownloadUrl,
  initiateBackup,
  getBackupSchedules,
  createBackupSchedule,
  updateBackupSchedule,
  deleteBackupSchedule,
  triggerScheduledBackups,
};