import { contextBridge, ipcRenderer } from 'electron'

// 暴露安全的 API 给渲染进程
const api = {
  getCategories: () => ipcRenderer.invoke('db:getCategories'),
  getSubCategories: () => ipcRenderer.invoke('db:getSubCategories'),
  addExpense: (data: { amount: number; categoryId: number; date: string; note: string }) =>
    ipcRenderer.invoke('db:addExpense', data),
  getExpenses: (filters?: { startDate?: string; endDate?: string; categoryId?: number }) =>
    ipcRenderer.invoke('db:getExpenses', filters || {}),
  getExpenseStats: (filters?: { startDate?: string; endDate?: string }) =>
    ipcRenderer.invoke('db:getExpenseStats', filters || {}),
  getTotalExpense: (filters?: { startDate?: string; endDate?: string }) =>
    ipcRenderer.invoke('db:getTotalExpense', filters || {}),
  deleteExpense: (id: number) => ipcRenderer.invoke('db:deleteExpense', { id }),
  exportCsv: (filters?: { startDate?: string; endDate?: string }) =>
    ipcRenderer.invoke('db:exportCsv', filters || {}),
  backup: () => ipcRenderer.invoke('db:backup'),
  restore: () => ipcRenderer.invoke('db:restore')
}

// 使用 contextBridge 安全地暴露 API
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.api = api
}