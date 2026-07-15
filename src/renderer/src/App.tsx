import { useState, useEffect } from 'react'
import {
  ConfigProvider,
  Layout,
  Menu,
  Button,
  Form,
  InputNumber,
  DatePicker,
  Select,
  Input,
  Table,
  Statistic,
  Card,
  Row,
  Col,
  Radio,
  Popconfirm,
  message,
  Spin,
  Modal,
  Tag,
  Space,
  Tooltip
} from 'antd'
import {
  PlusOutlined,
  UnorderedListOutlined,
  PieChartOutlined,
  DeleteOutlined,
  DownloadOutlined,
  SettingOutlined,
  EditOutlined,
  FolderAddOutlined
} from '@ant-design/icons'
import zhCN from 'antd/locale/zh_CN'
import dayjs, { Dayjs } from 'dayjs'
import ReactECharts from 'echarts-for-react'
import type { Category, SubCategory, Expense, ExpenseStat } from './types'

const { Header, Sider, Content } = Layout
const { TextArea } = Input
const { RangePicker } = DatePicker

function App(): JSX.Element {
  const [categories, setCategories] = useState<Category[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [stats, setStats] = useState<ExpenseStat[]>([])
  const [totalExpense, setTotalExpense] = useState(0)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('1')
  const [dateFilter, setDateFilter] = useState('all')
  const [customRange, setCustomRange] = useState<[Dayjs, Dayjs] | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>(undefined)
  const [initialLoading, setInitialLoading] = useState(true)

  // 分类管理相关状态
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [categoryEditing, setCategoryEditing] = useState<{ id: number; name: string; icon: string; parentId: number | null } | null>(null)
  const [categoryForm] = Form.useForm()
  const [categorySaving, setCategorySaving] = useState(false)

  // 根据筛选条件获取日期范围
  const getDateRange = (): { startDate?: string; endDate?: string } => {
    const today = dayjs()
    switch (dateFilter) {
      case 'today':
        return { startDate: today.format('YYYY-MM-DD'), endDate: today.format('YYYY-MM-DD') }
      case 'week':
        return {
          startDate: today.startOf('week').format('YYYY-MM-DD'),
          endDate: today.endOf('week').format('YYYY-MM-DD')
        }
      case 'month':
        return {
          startDate: today.startOf('month').format('YYYY-MM-DD'),
          endDate: today.endOf('month').format('YYYY-MM-DD')
        }
      case 'custom':
        if (customRange && customRange[0] && customRange[1]) {
          return {
            startDate: customRange[0].format('YYYY-MM-DD'),
            endDate: customRange[1].format('YYYY-MM-DD')
          }
        }
        return {}
      default:
        return {}
    }
  }

  // 加载数据
  const loadData = async () => {
    try {
      const dateRange = getDateRange()
      const [cats, subCats, exps, st, total] = await Promise.all([
        window.api.getCategories(),
        window.api.getSubCategories(),
        window.api.getExpenses({ ...dateRange, categoryId: categoryFilter }),
        window.api.getExpenseStats(dateRange),
        window.api.getTotalExpense(dateRange)
      ])
      setCategories(cats)
      setSubCategories(subCats)
      setExpenses(exps)
      setStats(st)
      setTotalExpense(total)
      setInitialLoading(false)
    } catch (err) {
      console.error('加载数据失败:', err)
      setInitialLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // 记一笔账
  const handleAddExpense = async (values: any) => {
    setLoading(true)
    try {
      await window.api.addExpense({
        amount: values.amount,
        categoryId: values.categoryId,
        date: values.date.format('YYYY-MM-DD'),
        note: values.note || ''
      })
      message.success('记账成功！')
      ;(document.getElementById('expenseForm') as HTMLFormElement)?.reset()
      loadData()
      setActiveTab('2') // 切换到账单列表
    } catch (err) {
      message.error('记账失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 删除账单
  const handleDelete = async (id: number) => {
    try {
      await window.api.deleteExpense(id)
      message.success('删除成功')
      loadData()
    } catch (err) {
      message.error('删除失败')
    }
  }

  // 打开新增分类弹窗
  const handleOpenAddCategory = (parentId: number | null = null) => {
    setCategoryEditing(null)
    categoryForm.resetFields()
    categoryForm.setFieldsValue({ parentId })
    setCategoryModalOpen(true)
  }

  // 打开编辑分类弹窗
  const handleOpenEditCategory = (cat: { id: number; name: string; icon: string; parentId: number | null }) => {
    setCategoryEditing(cat)
    categoryForm.setFieldsValue({
      name: cat.name,
      icon: cat.icon,
      parentId: cat.parentId
    })
    setCategoryModalOpen(true)
  }

  // 保存分类（新增或编辑）
  const handleSaveCategory = async (values: { name: string; icon: string; parentId: number | null }) => {
    setCategorySaving(true)
    try {
      if (categoryEditing) {
        // 编辑模式
        await window.api.updateCategory({
          id: categoryEditing.id,
          name: values.name,
          icon: values.icon || ''
        })
        message.success('分类已更新')
      } else {
        // 新增模式
        await window.api.addCategory({
          name: values.name,
          icon: values.icon || '',
          parentId: values.parentId ?? null
        })
        message.success('分类已添加')
      }
      setCategoryModalOpen(false)
      loadData()
    } catch (err: any) {
      message.error(err?.message || '操作失败')
    } finally {
      setCategorySaving(false)
    }
  }

  // 删除分类
  const handleDeleteCategory = async (id: number) => {
    try {
      await window.api.deleteCategory(id)
      message.success('分类已删除')
      loadData()
    } catch (err: any) {
      message.error(err?.message || '删除失败')
    }
  }

  // 分类选择器选项
  const categoryOptions = categories.map((cat) => ({
    label: `${cat.icon} ${cat.name}`,
    value: cat.name,
    children: cat.children?.map((sub) => ({
      label: sub.name,
      value: sub.id
    }))
  }))

  // 账单表格列定义
  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 110,
      sorter: (a: Expense, b: Expense) => a.date.localeCompare(b.date)
    },
    {
      title: '分类',
      key: 'category',
      width: 180,
      render: (_: any, record: Expense) => (
        <span>
          <span style={{ marginRight: 6 }}>{record.parentCategoryIcon}</span>
          {record.parentCategoryName} / {record.categoryName}
        </span>
      )
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 500 }}>
          ¥{amount.toFixed(2)}
        </span>
      ),
      sorter: (a: Expense, b: Expense) => a.amount - b.amount
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (note: string) => note || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: Expense) => (
        <Popconfirm
          title="确定删除这条记录？"
          onConfirm={() => handleDelete(record.id)}
          okText="删除"
          cancelText="取消"
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      )
    }
  ]

  // 统计饼图颜色
  const colors = [
    '#ff4d4f', '#ff7a45', '#ffa940', '#ffec3d', '#bae637',
    '#36cfc9', '#1677ff', '#597ef7', '#9254de', '#f759ab',
    '#ff85c0', '#b37feb'
  ]

  const totalForStats = stats.reduce((sum, s) => sum + s.total, 0)

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8
        }
      }}
    >
      <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
            position: 'sticky',
            top: 0,
            zIndex: 100
          }}
        >
          <h1 style={{ margin: 0, fontSize: 20, color: '#1677ff' }}>💰 记账</h1>
          <div style={{ marginLeft: 32 }}>
            <Statistic
              title="本月支出"
              value={totalExpense}
              precision={2}
              prefix="¥"
              valueStyle={{ fontSize: 18, color: '#ff4d4f' }}
            />
          </div>
        </Header>

        <Layout style={{ background: '#f0f2f5' }}>
          <Sider
            width={160}
            style={{
              background: '#fff',
              borderRight: '1px solid #f0f0f0',
              paddingTop: 12
            }}
          >
            <Menu
              mode="inline"
              selectedKeys={[activeTab]}
              onClick={({ key }) => setActiveTab(key)}
              style={{ border: 'none' }}
              items={[
                {
                  key: '1',
                  icon: <PlusOutlined />,
                  label: '记一笔'
                },
                {
                  key: '2',
                  icon: <UnorderedListOutlined />,
                  label: '账单'
                },
                {
                  key: '3',
                  icon: <PieChartOutlined />,
                  label: '统计'
                },
                {
                  key: '4',
                  icon: <SettingOutlined />,
                  label: '设置'
                }
              ]}
            />
            <div style={{ padding: '8px 16px', borderTop: '1px solid #f0f0f0' }}>
              <Button
                type="text"
                size="small"
                block
                icon={<DownloadOutlined />}
                style={{ marginBottom: 4 }}
                onClick={async () => {
                  const result = await window.api.backup()
                  if (result.success) message.success('备份成功！')
                }}
              >
                备份数据
              </Button>
              <Button
                type="text"
                size="small"
                block
                icon={<DownloadOutlined style={{ transform: 'rotate(180deg)' }} />}
                onClick={async () => {
                  const result = await window.api.restore()
                  if (result.success) {
                    message.success('恢复成功！')
                    loadData()
                  }
                }}
              >
                恢复数据
              </Button>
            </div>
          </Sider>

          <Content style={{ padding: 24, flex: 1, overflow: 'auto' }}>
            <Spin spinning={initialLoading} tip="加载中..." size="large">
            {activeTab === '1' && (
              <Card style={{ maxWidth: 500, margin: '0 auto' }}>
                <Form
                  id="expenseForm"
                  layout="vertical"
                  onFinish={handleAddExpense}
                  initialValues={{ date: dayjs() }}
                >
                  <Form.Item
                    label="金额（元）"
                    name="amount"
                    rules={[{ required: true, message: '请输入金额' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="0.00"
                      min={0.01}
                      max={999999.99}
                      precision={2}
                      prefix="¥"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item
                    label="日期"
                    name="date"
                    rules={[{ required: true, message: '请选择日期' }]}
                  >
                    <DatePicker
                      style={{ width: '100%' }}
                      size="large"
                      allowClear={false}
                    />
                  </Form.Item>

                  <Form.Item
                    label="分类"
                    name="categoryId"
                    rules={[{ required: true, message: '请选择分类' }]}
                  >
                    <Select
                      style={{ width: '100%' }}
                      size="large"
                      placeholder="选择支出分类"
                      showSearch
                      optionFilterProp="label"
                      options={subCategories.map((sc) => ({
                        label: `${sc.parentIcon} ${sc.parentName} / ${sc.name}`,
                        value: sc.id,
                        icon: sc.parentIcon,
                        parentName: sc.parentName,
                        childName: sc.name
                      }))}
                      optionRender={(option) => (
                        <span>
                          <span style={{ marginRight: 6 }}>{option.data.icon}</span>
                          {option.data.parentName} / {option.data.childName}
                        </span>
                      )}
                    />
                  </Form.Item>

                  <Form.Item label="备注" name="note">
                    <TextArea
                      placeholder="写点什么（可选）"
                      rows={2}
                      maxLength={200}
                      showCount
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      block
                      loading={loading}
                    >
                      记一笔
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            )}

            {activeTab === '2' && (
              <Card>
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <Radio.Group
                    value={dateFilter}
                    onChange={(e) => {
                      setDateFilter(e.target.value)
                      if (e.target.value !== 'custom') {
                        setCustomRange(null)
                      }
                    }}
                    optionType="button"
                    buttonStyle="solid"
                    size="small"
                  >
                    <Radio.Button value="all">全部</Radio.Button>
                    <Radio.Button value="today">今天</Radio.Button>
                    <Radio.Button value="week">本周</Radio.Button>
                    <Radio.Button value="month">本月</Radio.Button>
                    <Radio.Button value="custom">自定义</Radio.Button>
                  </Radio.Group>
                  {dateFilter === 'custom' && (
                    <RangePicker
                      value={customRange as any}
                      onChange={(dates) => setCustomRange(dates as [Dayjs, Dayjs])}
                      size="small"
                      style={{ width: 240 }}
                      allowClear={false}
                    />
                  )}
                  <Select
                    placeholder="全部分类"
                    value={categoryFilter}
                    onChange={(val) => setCategoryFilter(val)}
                    allowClear
                    size="small"
                    style={{ width: 150 }}
                    options={categories.map((cat) => ({
                      label: `${cat.icon} ${cat.name}`,
                      value: cat.id
                    }))}
                  />
                  <Button size="small" type="primary" onClick={loadData}>
                    查询
                  </Button>
                  <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={async () => {
                      const dateRange = getDateRange()
                      const result = await window.api.exportCsv(dateRange)
                      if (result.success) {
                        message.success('导出成功！')
                      }
                    }}
                  >
                    导出CSV
                  </Button>
                </div>
                {expenses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
                    <p style={{ fontSize: 48 }}>📝</p>
                    <p>还没有记账记录</p>
                    <Button
                      type="primary"
                      onClick={() => setActiveTab('1')}
                    >
                      记第一笔
                    </Button>
                  </div>
                ) : (
                  <Table
                    dataSource={expenses}
                    columns={columns}
                    rowKey="id"
                    pagination={{ pageSize: 20, showSizeChanger: false }}
                    size="middle"
                    summary={() => (
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0}>
                          <strong>合计</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} />
                        <Table.Summary.Cell index={2}>
                          <span style={{ color: '#ff4d4f', fontWeight: 500 }}>
                            ¥{expenses
                              .reduce((sum, e) => sum + e.amount, 0)
                              .toFixed(2)}
                          </span>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3} />
                        <Table.Summary.Cell index={4} />
                      </Table.Summary.Row>
                    )}
                  />
                )}
              </Card>
            )}

            {activeTab === '3' && (
              <Card>
                {stats.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
                    <p style={{ fontSize: 48 }}>📊</p>
                    <p>还没有数据可以统计</p>
                  </div>
                ) : (
                  <>
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Card size="small">
                          <Statistic
                            title="总支出"
                            value={totalExpense}
                            precision={2}
                            prefix="¥"
                            valueStyle={{ color: '#ff4d4f' }}
                          />
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card size="small">
                          <Statistic
                            title="记录笔数"
                            value={expenses.length}
                            suffix="笔"
                          />
                        </Card>
                      </Col>
                    </Row>

                    <div style={{ marginTop: 24 }}>
                      <h3 style={{ marginBottom: 16 }}>分类支出占比</h3>
                      <ReactECharts
                        style={{ height: 350 }}
                        option={{
                          tooltip: {
                            trigger: 'item',
                            formatter: (params: any) =>
                              `${params.data.icon} ${params.name}<br/>¥${params.value.toFixed(2)} (${params.percent}%)`
                          },
                          legend: {
                            orient: 'vertical',
                            right: 10,
                            top: 'center',
                            textStyle: { fontSize: 13 }
                          },
                          series: [
                            {
                              type: 'pie',
                              radius: ['45%', '75%'],
                              center: ['40%', '50%'],
                              avoidLabelOverlap: false,
                              itemStyle: {
                                borderRadius: 6,
                                borderColor: '#fff',
                                borderWidth: 2
                              },
                              label: {
                                show: true,
                                formatter: (params: any) => `{icon|${params.data.icon}} {name|${params.name}}\n{val|¥${params.value.toFixed(2)}}`,
                                rich: {
                                  icon: { fontSize: 16, lineHeight: 20 },
                                  name: { fontSize: 12, lineHeight: 20 },
                                  val: { fontSize: 12, fontWeight: 'bold', color: '#ff4d4f', lineHeight: 20 }
                                }
                              },
                              data: stats.map((s, i) => ({
                                value: s.total,
                                name: s.name,
                                icon: s.icon,
                                itemStyle: { color: colors[i % colors.length] }
                              }))
                            }
                          ]
                        }}
                      />
                      <h3 style={{ margin: '16px 0' }}>分类支出排行</h3>
                      {stats.map((s, index) => {
                        const percent = totalForStats > 0 ? (s.total / totalForStats) * 100 : 0
                        return (
                          <div
                            key={s.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              marginBottom: 8,
                              padding: '6px 12px',
                              borderRadius: 6
                            }}
                          >
                            <span style={{ fontSize: 18, marginRight: 8 }}>{s.icon}</span>
                            <span style={{ width: 80, flexShrink: 0 }}>{s.name}</span>
                            <div
                              style={{
                                flex: 1,
                                height: 14,
                                background: '#f0f0f0',
                                borderRadius: 7,
                                margin: '0 12px',
                                overflow: 'hidden'
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: `${Math.max(percent, 2)}%`,
                                  background: colors[index % colors.length],
                                  borderRadius: 7,
                                  transition: 'width 0.5s'
                                }}
                              />
                            </div>
                            <span style={{ width: 110, textAlign: 'right', flexShrink: 0, fontSize: 13 }}>
                              <span style={{ fontWeight: 500, color: '#ff4d4f' }}>
                                ¥{s.total.toFixed(2)}
                              </span>
                              <span style={{ color: '#999', marginLeft: 4 }}>
                                ({percent.toFixed(1)}%)
                              </span>
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </Card>
            )}

            {activeTab === '4' && (
              <Card
                title="支出分类"
                extra={
                  <Button
                    type="primary"
                    icon={<FolderAddOutlined />}
                    onClick={() => handleOpenAddCategory(null)}
                  >
                    添加大类
                  </Button>
                }
              >
                {categories.map((cat) => (
                  <div key={cat.id} style={{ marginBottom: 20 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 8
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{cat.icon}</span>
                      <strong style={{ fontSize: 15 }}>{cat.name}</strong>
                      <Tag color={cat.isPreset ? 'blue' : 'green'} style={{ fontSize: 11 }}>
                        {cat.isPreset ? '预设' : '自定义'}
                      </Tag>
                      {!cat.isPreset && (
                        <Space size="small">
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() =>
                              handleOpenEditCategory({
                                id: cat.id,
                                name: cat.name,
                                icon: cat.icon,
                                parentId: null
                              })
                            }
                          />
                          <Popconfirm
                            title="确定删除这个大类和它下面的所有小分类？"
                            onConfirm={() => handleDeleteCategory(cat.id)}
                            okText="删除"
                            cancelText="取消"
                          >
                            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                          </Popconfirm>
                        </Space>
                      )}
                      <Tooltip title="添加小分类">
                        <Button
                          type="dashed"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => handleOpenAddCategory(cat.id)}
                        />
                      </Tooltip>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 26 }}>
                      {cat.children?.map((sub) => (
                        <Tag
                          key={sub.id}
                          style={{ fontSize: 13, padding: '2px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          {sub.name}
                          {!sub.isPreset && (
                            <Space size={0}>
                              <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined style={{ fontSize: 10 }} />}
                                style={{ padding: 0, width: 16, height: 16 }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenEditCategory({
                                    id: sub.id,
                                    name: sub.name,
                                    icon: '',
                                    parentId: cat.id
                                  })
                                }}
                              />
                              <Popconfirm
                                title="确定删除这个小分类？"
                                onConfirm={(e) => {
                                  e?.stopPropagation()
                                  handleDeleteCategory(sub.id)
                                }}
                                onCancel={(e) => e?.stopPropagation()}
                                okText="删除"
                                cancelText="取消"
                              >
                                <Button
                                  type="text"
                                  danger
                                  size="small"
                                  icon={<DeleteOutlined style={{ fontSize: 10 }} />}
                                  style={{ padding: 0, width: 16, height: 16 }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </Popconfirm>
                            </Space>
                          )}
                        </Tag>
                      ))}
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 24, color: '#999', fontSize: 13 }}>
                  共 {categories.length} 个大类，{categories.reduce((sum, c) => sum + (c.children?.length || 0), 0)} 个小分类
                </div>
              </Card>
            )}
            </Spin>
          </Content>
        </Layout>
      </Layout>
    {/* 分类管理弹窗 */}
        <Modal
          title={categoryEditing ? '编辑分类' : '新增分类'}
          open={categoryModalOpen}
          onCancel={() => setCategoryModalOpen(false)}
          footer={null}
          destroyOnClose
        >
          <Form
            form={categoryForm}
            layout="vertical"
            onFinish={handleSaveCategory}
            style={{ marginTop: 16 }}
          >
            <Form.Item
              label="分类名称"
              name="name"
              rules={[{ required: true, message: '请输入分类名称' }]}
            >
              <Input placeholder="例如：宠物用品" maxLength={20} />
            </Form.Item>

            <Form.Item
              label="图标（emoji表情）"
              name="icon"
            >
              <Input placeholder="例如：🍜（可选）" maxLength={4} />
            </Form.Item>

            <Form.Item
              label="所属大类"
              name="parentId"
            >
              <Select
                placeholder="选择所属大类（不选则为顶级大类）"
                allowClear
                options={categories.map((cat) => ({
                  label: `${cat.icon} ${cat.name}`,
                  value: cat.id
                }))}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={categorySaving}
              >
                {categoryEditing ? '保存修改' : '添加分类'}
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </ConfigProvider>
  )
}

export default App