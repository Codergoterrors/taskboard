'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ─── Config ────────────────────────────────────────────────────────────────

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

const EMPTY_FORM = { title: '', description: '', status: 'todo', priority: 'medium' }

// ─── Dashboard Page ─────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter()

  const [tasks, setTasks]           = useState([])
  const [user, setUser]             = useState(null)
  const [filter, setFilter]         = useState('all')
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError]   = useState('')

  // Fetch user info and tasks on mount
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
    router.push('/login')
  }

  // ── Modal helpers ──────────────────────────────────────────────────────────

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
    })
    setFormError('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingTask(null)
    setFormError('')
  }

  // ── CRUD operations ────────────────────────────────────────────────────────

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
        await fetchTasks() // Refresh the task list
        closeModal()
      } else {
        const data = await res.json()
        setFormError(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setFormError('Network error. Please check your connection.')
    }

    setSubmitting(false)
  }

  const handleDelete = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
    }
  }

  // ── Derived state ──────────────────────────────────────────────────────────

  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter((t) => t.status === filter)

  const stats = {
    total:      tasks.length,
    todo:       tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    done:       tasks.filter((t) => t.status === 'done').length,
  }

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day:   'numeric',
      year:  'numeric',
    })

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <h1 className="text-xl font-bold text-gray-900">TaskBoard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:block">
              Hello,{' '}
              <span className="font-semibold text-gray-800">{user?.name ?? '...'}</span>!
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon="📋" label="Total Tasks"  value={stats.total}      bg="bg-indigo-50"  text="text-indigo-700" />
          <StatCard icon="🔵" label="Todo"         value={stats.todo}       bg="bg-blue-50"    text="text-blue-700"   />
          <StatCard icon="🟡" label="In Progress"  value={stats.inProgress} bg="bg-amber-50"   text="text-amber-700"  />
          <StatCard icon="🟢" label="Done"         value={stats.done}       bg="bg-green-50"   text="text-green-700"  />
        </div>

        {/* ── Tasks Panel ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">

          {/* Panel header: filter tabs + add button */}
          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200">
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
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
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

          {/* Task grid */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-4xl mb-3">⏳</p>
                <p>Loading tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-4">📝</p>
                <p className="text-gray-600 text-lg font-medium">No tasks here</p>
                <p className="text-gray-400 text-sm mt-1">
                  {filter === 'all'
                    ? 'Click "Add Task" to create your first task.'
                    : `No tasks with status "${filter}".`}
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
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">

            {/* Modal header */}
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none transition"
              >
                ×
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="What needs to be done?"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="Add more details..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="todo">Todo</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-3 border border-gray-200 rounded-lg text-gray-600 font-medium hover:bg-gray-50 transition"
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

// ─── Sub-components ─────────────────────────────────────────────────────────

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
  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white flex flex-col">

      {/* Priority + Status badges */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
            PRIORITY_CONFIG[task.priority]?.color
          }`}
        >
          {PRIORITY_CONFIG[task.priority]?.label}
        </span>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
            STATUS_CONFIG[task.status]?.color
          }`}
        >
          {STATUS_CONFIG[task.status]?.label}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 mb-1 leading-snug line-clamp-2">
        {task.title}
      </h3>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-gray-500 line-clamp-2 flex-1">{task.description}</p>
      )}

      {/* Footer: date + action buttons */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">{formatDate(task.createdAt)}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            title="Edit task"
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            title="Delete task"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}
