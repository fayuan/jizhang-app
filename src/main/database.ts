import initSqlJs, { Database, SqlJsStatic } from 'sql.js'
import { app } from 'electron'
import { join } from 'path'
import * as fs from 'fs'

let db: Database | null = null

// 数据库文件路径
function getDbPath(): string {
  const userDataPath = app.getPath('userData')
  return join(userDataPath, 'jizhang.db')
}

// 初始化数据库
export async function initDatabase(): Promise<void> {
  const SQL: SqlJsStatic = await initSqlJs()
  const dbPath = getDbPath()

  // 如果已有数据库文件，从文件加载
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  // 创建表结构（新数据库）
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '',
      parent_id INTEGER DEFAULT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_preset INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (parent_id) REFERENCES categories(id)
    )
  `)

  // 迁移：旧数据库可能没有 is_preset 字段，尝试添加
  try {
    db.run(`ALTER TABLE categories ADD COLUMN is_preset INTEGER NOT NULL DEFAULT 0`)
  } catch (_e) {
    // 字段已存在，忽略
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      category_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      note TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `)

  // 初始化分类数据（如果表为空）
  // sql.js: exec() 返回结果，run() 只返回布尔值
  const countResult = db.exec('SELECT COUNT(*) as count FROM categories')
  const rowCount = countResult[0]?.values[0]?.[0] as number
  if (rowCount === 0) {
    seedCategories()
  }

  // 保存数据库
  saveDatabase()
}

// 保存数据库到文件
function saveDatabase(): void {
  if (!db) return
  const dbPath = getDbPath()
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(dbPath, buffer)
}

// 初始化分类数据
function seedCategories(): void {
  if (!db) return

  const categories = [
    {
      name: '餐饮饮食', icon: '🍜',
      children: ['早餐', '午餐', '晚餐', '零食饮料', '水果', '外卖', '聚餐请客']
    },
    {
      name: '交通出行', icon: '🚗',
      children: ['公交地铁', '打车', '加油充电', '停车费', '火车票', '机票', '共享单车']
    },
    {
      name: '购物消费', icon: '🛒',
      children: ['日用百货', '数码产品', '家居用品', '宠物用品', '烟酒茶叶']
    },
    {
      name: '住房物业', icon: '🏠',
      children: ['房租', '房贷', '物业费', '水电燃气', '维修装修', '家居家具']
    },
    {
      name: '医疗健康', icon: '💊',
      children: ['门诊挂号', '药品', '体检', '住院', '牙科', '保健品']
    },
    {
      name: '教育学习', icon: '📚',
      children: ['书籍', '课程培训', '考试报名', '文具', '网课会员']
    },
    {
      name: '娱乐休闲', icon: '🎮',
      children: ['游戏充值', '电影演出', '旅游度假', '运动健身', 'KTV酒吧', '景点门票']
    },
    {
      name: '通讯网络', icon: '📱',
      children: ['手机话费', '宽带费', '视频会员', '云存储']
    },
    {
      name: '服饰美容', icon: '👗',
      children: ['衣服鞋帽', '包包配饰', '护肤彩妆', '美发美甲']
    },
    {
      name: '人情往来', icon: '🎁',
      children: ['红包礼金', '请客送礼', '孝敬父母', '慈善捐款']
    },
    {
      name: '金融保险', icon: '💰',
      children: ['保险保费', '贷款利息', '理财手续费', '信用卡年费']
    },
    {
      name: '其他杂项', icon: '📦',
      children: ['快递费', '打印复印', '证件办理', '其他']
    }
  ]

  const insertParent = db.prepare(
    'INSERT INTO categories (name, icon, parent_id, sort_order, is_preset) VALUES (?, ?, NULL, ?, 1)'
  )
  const insertChild = db.prepare(
    'INSERT INTO categories (name, icon, parent_id, sort_order, is_preset) VALUES (?, ?, ?, ?, 1)'
  )

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i]
    insertParent.run([cat.name, cat.icon, i])
    // sql.js: 用 SELECT last_insert_rowid() 获取刚插入的ID
    const parentIdResult = db.exec('SELECT last_insert_rowid()')
    const parentId = parentIdResult[0].values[0][0] as number

    for (let j = 0; j < cat.children.length; j++) {
      insertChild.run([cat.children[j], '', parentId, j])
    }
  }

  insertParent.free()
  insertChild.free()
}

// 获取所有分类（树形结构）
export function getCategories(): any[] {
  if (!db) return []

  const rows = db.exec(`
    SELECT id, name, icon, parent_id, sort_order, is_preset
    FROM categories
    ORDER BY sort_order
  `)

  if (rows.length === 0) return []

  const result = rows[0]
  const parents: any[] = []
  const childrenMap: Record<number, any[]> = {}

  for (let i = 0; i < result.values.length; i++) {
    const [id, name, icon, parentId, sortOrder, isPreset] = result.values[i]
    const item = {
      id: id as number,
      name: name as string,
      icon: icon as string,
      isPreset: (isPreset as number) === 1
    }

    if (parentId === null) {
      childrenMap[id as number] = []
      parents.push({ ...item, children: childrenMap[id as number] })
    } else {
      if (!childrenMap[parentId as number]) {
        childrenMap[parentId as number] = []
      }
      childrenMap[parentId as number].push(item)
    }
  }

  return parents
}

// 获取所有小分类（扁平列表）
export function getSubCategories(): any[] {
  if (!db) return []

  const rows = db.exec(`
    SELECT c.id, c.name, p.name as parent_name, p.icon as parent_icon, c.is_preset
    FROM categories c
    JOIN categories p ON c.parent_id = p.id
    ORDER BY p.sort_order, c.sort_order
  `)

  if (rows.length === 0) return []

  return rows[0].values.map(([id, name, parentName, parentIcon, isPreset]) => ({
    id: id as number,
    name: name as string,
    parentName: parentName as string,
    parentIcon: parentIcon as string,
    isPreset: (isPreset as number) === 1
  }))
}

// 添加分类（用户自定义）
export function addCategory(name: string, icon: string, parentId: number | null): number {
  if (!db) throw new Error('数据库未初始化')

  // 获取当前最大的 sort_order
  let maxSort = 0
  if (parentId === null) {
    const result = db.exec('SELECT COALESCE(MAX(sort_order), 0) FROM categories WHERE parent_id IS NULL')
    maxSort = (result[0]?.values[0]?.[0] as number) || 0
  } else {
    const result = db.exec('SELECT COALESCE(MAX(sort_order), 0) FROM categories WHERE parent_id = ?')
    // sql.js: exec() 不支持参数，用字符串拼接
  }

  // 获取最大 sort_order
  const sortResult = db.exec(
    parentId === null
      ? 'SELECT COALESCE(MAX(sort_order), 0) as m FROM categories WHERE parent_id IS NULL'
      : `SELECT COALESCE(MAX(sort_order), 0) as m FROM categories WHERE parent_id = ${parentId}`
  )
  const sortOrder = ((sortResult[0]?.values[0]?.[0] as number) || 0) + 1

  db.run(
    'INSERT INTO categories (name, icon, parent_id, sort_order, is_preset) VALUES (?, ?, ?, ?, 0)',
    [name, icon, parentId, sortOrder]
  )

  const result = db.exec('SELECT last_insert_rowid()')
  const id = result[0].values[0][0] as number
  saveDatabase()
  return id
}

// 修改分类名称和图标（仅限用户自定义分类）
export function updateCategory(id: number, name: string, icon: string): boolean {
  if (!db) throw new Error('数据库未初始化')

  // 检查是否为系统预置分类
  const checkResult = db.exec(`SELECT is_preset FROM categories WHERE id = ${id}`)
  if (checkResult.length === 0) return false
  if (checkResult[0].values[0][0] === 1) {
    throw new Error('不能修改系统预置分类')
  }

  db.run('UPDATE categories SET name = ?, icon = ? WHERE id = ?', [name, icon, id])
  saveDatabase()
  return true
}

// 删除分类（仅限用户自定义分类，且未被支出记录使用）
export function deleteCategory(id: number): boolean {
  if (!db) throw new Error('数据库未初始化')

  // 检查是否为系统预置分类
  const checkResult = db.exec(`SELECT is_preset FROM categories WHERE id = ${id}`)
  if (checkResult.length === 0) return false
  if (checkResult[0].values[0][0] === 1) {
    throw new Error('不能删除系统预置分类')
  }

  // 检查是否有子分类
  const childResult = db.exec(`SELECT COUNT(*) as c FROM categories WHERE parent_id = ${id}`)
  if ((childResult[0]?.values[0]?.[0] as number) > 0) {
    throw new Error('请先删除该大类下的所有小分类')
  }

  // 检查是否有支出记录使用此分类
  const expenseResult = db.exec(`SELECT COUNT(*) as c FROM expenses WHERE category_id = ${id}`)
  if ((expenseResult[0]?.values[0]?.[0] as number) > 0) {
    throw new Error('该分类下有支出记录，无法删除')
  }

  db.run('DELETE FROM categories WHERE id = ?', [id])
  saveDatabase()
  return true
}

// 添加支出记录
export function addExpense(amount: number, categoryId: number, date: string, note: string): number {
  if (!db) throw new Error('数据库未初始化')

  db.run(
    'INSERT INTO expenses (amount, category_id, date, note) VALUES (?, ?, ?, ?)',
    [amount, categoryId, date, note]
  )

  // sql.js: 用 SELECT last_insert_rowid() 获取刚插入的ID
  const result = db.exec('SELECT last_insert_rowid()')
  const id = result[0].values[0][0] as number

  saveDatabase()
  return id
}

// sql.js 安全转义字符串值
function escapeStr(val: string): string {
  return "'" + val.replace(/'/g, "''") + "'"
}

// 获取支出记录列表
export function getExpenses(startDate?: string, endDate?: string, categoryId?: number): any[] {
  if (!db) return []

  let sql = `
    SELECT e.id, e.amount, e.date, e.note, e.created_at,
           c.name as category_name, c.id as category_id,
           p.name as parent_category_name, p.icon as parent_category_icon
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    JOIN categories p ON c.parent_id = p.id
    WHERE 1=1
  `

  if (startDate) {
    sql += ` AND e.date >= ${escapeStr(startDate)}`
  }
  if (endDate) {
    sql += ` AND e.date <= ${escapeStr(endDate)}`
  }
  if (categoryId) {
    sql += ` AND (e.category_id = ${categoryId} OR c.parent_id = ${categoryId})`
  }

  sql += ' ORDER BY e.date DESC, e.created_at DESC'

  const rows = db.exec(sql)
  if (rows.length === 0) return []

  return rows[0].values.map(([id, amount, date, note, createdAt, categoryName, categoryId, parentCategoryName, parentCategoryIcon]) => ({
    id: id as number,
    amount: amount as number,
    date: date as string,
    note: note as string,
    createdAt: createdAt as string,
    categoryName: categoryName as string,
    categoryId: categoryId as number,
    parentCategoryName: parentCategoryName as string,
    parentCategoryIcon: parentCategoryIcon as string
  }))
}

// 获取按分类统计的支出
export function getExpenseStats(startDate?: string, endDate?: string): any[] {
  if (!db) return []

  let sql = `
    SELECT p.id, p.name, p.icon, SUM(e.amount) as total
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    JOIN categories p ON c.parent_id = p.id
    WHERE 1=1
  `

  if (startDate) {
    sql += ` AND e.date >= ${escapeStr(startDate)}`
  }
  if (endDate) {
    sql += ` AND e.date <= ${escapeStr(endDate)}`
  }

  sql += ' GROUP BY p.id ORDER BY total DESC'

  const rows = db.exec(sql)
  if (rows.length === 0) return []

  return rows[0].values.map(([id, name, icon, total]) => ({
    id: id as number,
    name: name as string,
    icon: icon as string,
    total: total as number
  }))
}

// 获取总支出
export function getTotalExpense(startDate?: string, endDate?: string): number {
  if (!db) return 0

  let sql = 'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE 1=1'

  if (startDate) {
    sql += ` AND date >= ${escapeStr(startDate)}`
  }
  if (endDate) {
    sql += ` AND date <= ${escapeStr(endDate)}`
  }

  const result = db.exec(sql)
  if (result.length === 0) return 0
  return result[0].values[0][0] as number
}

// 删除支出记录
export function deleteExpense(id: number): void {
  if (!db) return
  db.run('DELETE FROM expenses WHERE id = ?', [id])
  saveDatabase()
}

// 导出为 CSV
export function exportToCsv(startDate?: string, endDate?: string): string {
  if (!db) return ''

  let sql = `
    SELECT e.date, p.name || ' / ' || c.name as category, e.amount, e.note
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    JOIN categories p ON c.parent_id = p.id
    WHERE 1=1
  `

  if (startDate) {
    sql += ` AND e.date >= ${escapeStr(startDate)}`
  }
  if (endDate) {
    sql += ` AND e.date <= ${escapeStr(endDate)}`
  }

  sql += ' ORDER BY e.date DESC, e.created_at DESC'

  const rows = db.exec(sql)
  if (rows.length === 0) return '日期,分类,金额,备注\n'

  const lines = ['日期,分类,金额,备注']
  for (const [date, category, amount, note] of rows[0].values) {
    const csvNote = (note as string).replace(/"/g, '""')
    lines.push(`${date},"${category}",${amount},"${csvNote}"`)
  }

  return lines.join('\n')
}

// 关闭数据库
export function closeDatabase(): void {
  if (db) {
    saveDatabase()
    db.close()
    db = null
  }
}