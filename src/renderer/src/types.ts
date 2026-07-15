// 分类类型
export interface Category {
  id: number
  name: string
  icon: string
  isPreset: boolean
  children?: Category[]
}

// 子分类类型（扁平结构）
export interface SubCategory {
  id: number
  name: string
  parentName: string
  parentIcon: string
  isPreset: boolean
}

// 支出记录类型
export interface Expense {
  id: number
  amount: number
  date: string
  note: string
  createdAt: string
  categoryName: string
  categoryId: number
  parentCategoryName: string
  parentCategoryIcon: string
}

// 分类统计类型
export interface ExpenseStat {
  id: number
  name: string
  icon: string
  total: number
}

// 暴露到 window 的 API 类型
export interface AppAPI {
  getCategories: () => Promise<Category[]>
  getSubCategories: () => Promise<SubCategory[]>
  addExpense: (data: { amount: number; categoryId: number; date: string; note: string }) => Promise<{ id: number }>
  getExpenses: (filters?: { startDate?: string; endDate?: string; categoryId?: number }) => Promise<Expense[]>
  getExpenseStats: (filters?: { startDate?: string; endDate?: string }) => Promise<ExpenseStat[]>
  getTotalExpense: (filters?: { startDate?: string; endDate?: string }) => Promise<number>
  deleteExpense: (id: number) => Promise<void>
  exportCsv: (filters?: { startDate?: string; endDate?: string }) => Promise<{ success: boolean }>
  backup: () => Promise<{ success: boolean }>
  restore: () => Promise<{ success: boolean }>
  addCategory: (data: { name: string; icon: string; parentId: number | null }) => Promise<{ id: number }>
  updateCategory: (data: { id: number; name: string; icon: string }) => Promise<{ success: boolean }>
  deleteCategory: (id: number) => Promise<{ success: boolean }>
}

declare global {
  interface Window {
    api: AppAPI
  }
}