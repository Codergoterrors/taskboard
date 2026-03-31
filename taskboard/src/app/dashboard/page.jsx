'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ─── Config ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  todo:          { label: 'Todo',        color: 'bg-blue-100 text-blue-700 border-blue-200' },
  'in-progress': { label: 'In Progress', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  done:          { label: 'Done',        color: 'bg-green-100 text-green-700 border-green-200' },
}

const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: 'bg-gray-100 text-gray-600 border-gray-200' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  high:   { label: 'High',   color: 'bg-red-100 text-red-700 border-red-200' },
}

const EMPTY_FORM = { title: '', description: '', status: 'todo', priority: 'medium', dueDate: '' }

// ─── Donut Chart ─────────────────────────────────────────────────────────────

function DonutChart({ todo, inProgress, done }) {
  const total = todo + inProgress + done
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <svg viewBox="0 0 100 100" className="w-28 h-28">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#e5e7eb" strokeWidth="14" />
        </svg>
        <p className="text-xs text-gray-400 dark:text-gray-500">No tasks yet</p>
      </div>
    )
  }

  const SIZE   = 100
  const RADIUS = 38
  const CIRC   = 2 * Math.PI * RADIUS
  const CENTER = SIZE / 2

  const segments = [
    { value: todo,       color: '#3b82f6', label: 'Todo'        },
    { value: inProgress, color: '#f59e0b', label: 'In Progress' },
    { value: done,       color: '#22c55e', label: 'Done'        },
  ]

  let offset = 0
  const arcs = segments.map((seg) => {
    const dash   = (seg.value / total) * CIRC
    const gap    = CIRC - dash
    const rotate = (offset / total) * 360 - 90
    offset += seg.value
    return { ...seg, dash, gap, rotate }
  })

  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="flex items-center gap-6">
      {/* SVG Donut */}
      <div className="relative flex-shrink-0">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-28 h-28 -rotate-90">
          <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="#e5e7eb" strokeWidth="14" className="dark:stroke-gray-700" />
          {arcs.map((arc, i) =>
            arc.value > 0 ? (
              <circle
                key={i}
                cx={CENTER} cy={CENTER} r={RADIUS}
                fill="none"
                stroke={arc.color}
                strokeWidth="14"
                strokeDasharray={`${arc.dash} ${arc.gap}`}
                strokeDashoffset={-((arcs.slice(0, i).reduce((a, b) => a + b.value, 0) / total) * CIRC)}
                strokeLinecap="round"
              />
            ) : null
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-gray-800 dark:text-gray-100">{pct}%</span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">done</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
            <span className="text-xs text-gray-500 dark:text-gray-400">{seg.label}</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Dashboard Page ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter()

  const [tasks,       setTasks]       = useState([])
  const [user,        setUser]        = useState(null)
  const [filter,      setFilter]      = useState('all')
  const [search,      setSearch]      = useState('')
  const [loading,     setLoading]     = useState(true)
  const [showModal,   setShowModal]   = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [submitting,  setSubmitting]  = useState(false)
  const [formError,   setFormError]   = useState('')
  const [darkMode,    setDarkMode]    = useState(false)

  // Load dark mode preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('taskboard-dark')
    if (saved === 'true') {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDark = () => {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('taskboard-dark', String(next))
    document.documentElement.classList.toggle('dark', next)
  }

  useEffect(() => {
    fetchUser()
    fetchTasks()
  }, [])

  const fetchUser = async () => {
    const res = await fetch('/api/auth/me')
    if (res.ok) {
      const data = await res.json()
      setUser(data.user)
    }
  }

  const fetchTasks = async () => {
    setLoading(true)
    const res = await fetch('/api/tasks')
    if (res.ok) {
      const data = await res.json()
      setTasks(data.tasks)
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    document.documentElement.classList.remove('dark')
    router.push('/login')
  }

  // ── Modal helpers ─────────────────────────────────────────────────────────

  const openAddModal = () => {
    setEditingTask(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setShowModal(true)
  }

  const openEditModal = (task) => {
    setEditingTask(task)
    setForm({
      title:       task.title,
      description: task.description || '',
      status:      task.status,
      priority:    task.priority,
      dueDate:     task.dueDate ? task.dueDate.split('T')[0] : '',
    })
    setFormError('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingTask(null)
    setFormError('')
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setFormError('Task title is required.')
      return
    }
    setSubmitting(true)
    setFormError('')
    try {
      const url    = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks'
      const method = editingTask ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        await fetchTasks()
        closeModal()
      } else {
        const data = await res.json()
        setFormError(data.error || 'Something went wrong.')
      }
    } catch {
      setFormError('Network error. Please check your connection.')
    }
    setSubmitting(false)
  }

  const handleDelete = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    if (res.ok) setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  // ── Derived state ─────────────────────────────────────────────────────────

  const stats = {
    total:      tasks.length,
    todo:       tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    done:       tasks.filter((t) => t.status === 'done').length,
    overdue:    tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length,
  }

  const filteredTasks = tasks
    .filter((t) => filter === 'all' || t.status === filter)
    .filter((t) => {
      const q = search.toLowerCase()
      return !q || t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
    })

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">

      {/* ── Navbar ── */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">TaskBoard</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
              Hello, <span className="font-semibold text-gray-800 dark:text-gray-200">{user?.name ?? '...'}</span>!
            </span>
            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              title="Toggle dark mode"
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-lg"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Top Row: Stats + Chart ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">

          {/* Stat cards (2/3 width) */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon="📋" label="Total"       value={stats.total}      bg="bg-indigo-50 dark:bg-indigo-950"  text="text-indigo-700 dark:text-indigo-300" />
            <StatCard icon="🔵" label="Todo"        value={stats.todo}       bg="bg-blue-50 dark:bg-blue-950"      text="text-blue-700 dark:text-blue-300"     />
            <StatCard icon="🟡" label="In Progress" value={stats.inProgress} bg="bg-amber-50 dark:bg-amber-950"    text="text-amber-700 dark:text-amber-300"   />
            <StatCard icon="🟢" label="Done"        value={stats.done}       bg="bg-green-50 dark:bg-green-950"    text="text-green-700 dark:text-green-300"   />
            {stats.overdue > 0 && (
              <div className="col-span-2 sm:col-span-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <span className="text-sm font-medium text-red-700 dark:text-red-400">
                  {stats.overdue} task{stats.overdue > 1 ? 's are' : ' is'} overdue!
                </span>
              </div>
            )}
          </div>

          {/* Donut chart (1/3 width) */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Progress Overview</p>
            <div className="flex-1 flex items-center">
              <DonutChart todo={stats.todo} inProgress={stats.inProgress} done={stats.done} />
            </div>
          </div>
        </div>

        {/* ── Tasks Panel ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">

          {/* Panel header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex flex-col gap-4">
            {/* Top row: filter tabs + add button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 'all',         label: `All (${stats.total})` },
                  { key: 'todo',        label: `Todo (${stats.todo})` },
                  { key: 'in-progress', label: `In Progress (${stats.inProgress})` },
                  { key: 'done',        label: `Done (${stats.done})` },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      filter === key
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={openAddModal}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-sm"
              >
                <span className="text-lg leading-none">+</span>
                <span>Add Task</span>
              </button>
            </div>

            {/* Search bar */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks by title or description..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Task grid */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-4xl mb-3">⏳</p>
                <p>Loading tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-4">{search ? '🔍' : '📝'}</p>
                <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                  {search ? `No tasks match "${search}"` : 'No tasks here'}
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                  {!search && (filter === 'all'
                    ? 'Click "Add Task" to create your first task.'
                    : `No tasks with status "${filter}".`)}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={() => openEditModal(task)}
                    onDelete={() => handleDelete(task.id)}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-800">

            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none transition">
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {formError && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="What needs to be done?"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="Add more details..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="todo">Todo</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              {/* Due Date field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Due Date <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : editingTask ? 'Save Changes' : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ icon, label, value, bg, text }) {
  return (
    <div className={`${bg} ${text} rounded-xl p-5`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium opacity-80">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-4xl font-bold">{value}</div>
    </div>
  )
}

function TaskCard({ task, onEdit, onDelete, formatDate }) {
  const now     = new Date()
  const due     = task.dueDate ? new Date(task.dueDate) : null
  const isOverdue = due && due < now && task.status !== 'done'
  const isDueSoon = due && !isOverdue && (due - now) < 1000 * 60 * 60 * 48 // within 48h

  return (
    <div className={`rounded-xl p-4 hover:shadow-md transition-shadow flex flex-col border ${
      isOverdue
        ? 'border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-800'
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
    }`}>

      {/* Priority + Status badges */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${PRIORITY_CONFIG[task.priority]?.color}`}>
          {PRIORITY_CONFIG[task.priority]?.label}
        </span>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_CONFIG[task.status]?.color}`}>
          {STATUS_CONFIG[task.status]?.label}
        </span>
        {isOverdue && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-red-100 text-red-700 border-red-200">
            ⚠️ Overdue
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 leading-snug line-clamp-2">
        {task.title}
      </h3>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 flex-1">{task.description}</p>
      )}

      {/* Due date */}
      {due && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
          isOverdue  ? 'text-red-600 dark:text-red-400' :
          isDueSoon  ? 'text-amber-600 dark:text-amber-400' :
                       'text-gray-500 dark:text-gray-400'
        }`}>
          <span>📅</span>
          <span>Due {formatDate(task.dueDate)}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
        <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(task.createdAt)}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            title="Edit task"
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            title="Delete task"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}
