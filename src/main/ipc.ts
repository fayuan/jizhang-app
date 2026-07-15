import { ipcMain, dialog, app } from 'electron'
import { writeFileSync, copyFileSync, existsSync } from 'fs'
import { join } from 'path'
import {
  getCategories,
  getSubCategories,
  addExpense,
  getExpenses,
  getExpenseStats,
  getTotalExpense,
  deleteExpense,
  exportToCsv,
  addCategory,
  updateCategory,
  deleteCategory
} from './database'

// 注册所有 IPC 处理器
export function registerIpcHandlers(): void {
  ipcMain.handle('db:getCategories', async () => {
    return getCategories()
  })

  ipcMain.handle('db:getSubCategories', async () => {
    return getSubCategories()
  })

  ipcMain.handle('db:addExpense', async (_event, { amount, categoryId, date, note }) => {
    const id = addExpense(amount, categoryId, date, note)
    return { id }
  })

  ipcMain.handle('db:getExpenses', async (_event, { startDate, endDate, categoryId }) => {
    return getExpenses(startDate, endDate, categoryId)
  })

  ipcMain.handle('db:getExpenseStats', async (_event, { startDate, endDate }) => {
    return getExpenseStats(startDate, endDate)
  })

  ipcMain.handle('db:getTotalExpense', async (_event, { startDate, endDate }) => {
    return getTotalExpense(startDate, endDate)
  })

  ipcMain.handle('db:deleteExpense', async (_event, { id }) => {
    deleteExpense(id)
  })

  ipcMain.handle('db:exportCsv', async (_event, { startDate, endDate }) => {
    const csv = exportToCsv(startDate, endDate)
    const result = await dialog.showSaveDialog({
      title: '导出账单',
      defaultPath: `账单_${new Date().toISOString().slice(0, 10)}.csv`,
      filters: [{ name: 'CSV 文件', extensions: ['csv'] }]
    })
    if (!result.canceled && result.filePath) {
      writeFileSync(result.filePath, '﻿' + csv, 'utf-8') // BOM for Excel Chinese support
      return { success: true }
    }
    return { success: false }
  })

  // 备份数据库
  ipcMain.handle('db:backup', async () => {
    const dbPath = join(app.getPath('userData'), 'jizhang.db')
    const result = await dialog.showSaveDialog({
      title: '备份数据库',
      defaultPath: `记账备份_${new Date().toISOString().slice(0, 10)}.db`,
      filters: [{ name: '数据库文件', extensions: ['db'] }]
    })
    if (!result.canceled && result.filePath) {
      copyFileSync(dbPath, result.filePath)
      return { success: true }
    }
    return { success: false }
  })

  // 恢复数据库
  ipcMain.handle('db:restore', async () => {
    const result = await dialog.showOpenDialog({
      title: '恢复数据库',
      filters: [{ name: '数据库文件', extensions: ['db'] }],
      properties: ['openFile']
    })
    if (!result.canceled && result.filePaths.length > 0) {
      const dbPath = join(app.getPath('userData'), 'jizhang.db')
      copyFileSync(result.filePaths[0], dbPath)
      return { success: true }
    }
    return { success: false }
  })

  // 分类管理
  ipcMain.handle('db:addCategory', async (_event, { name, icon, parentId }) => {
    const id = addCategory(name, icon, parentId)
    return { id }
  })

  ipcMain.handle('db:updateCategory', async (_event, { id, name, icon }) => {
    updateCategory(id, name, icon)
    return { success: true }
  })

  ipcMain.handle('db:deleteCategory', async (_event, { id }) => {
    deleteCategory(id)
    return { success: true }
  })
}