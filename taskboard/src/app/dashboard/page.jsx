'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

// ─── Config ──────────────────────────────────────────────────────────────────

const COLUMNS = [
  { key: 'todo',        label: 'Todo',        icon: '🔵', color: 'border-t-blue-500'   },
  { key: 'in-progress', label: 'In Progress', icon: '🟡', color: 'border-t-amber-500'  },
  { key: 'done',        label: 'Done',        icon: '🟢', color: 'border-t-green-500'  },
]

const STATUS_CONFIG = {
  todo:          { label: 'Todo',        color: 'bg-blue-100 text-blue-700 border-blue-200'   },
  'in-progress': { label: 'In Progress', color: 'bg-amber-100 text-amber-700 border-amber-200'},
  done:          { label: 'Done',        color: 'bg-green-100 text-green-700 border-green-200'},
}

const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: 'bg-gray-100 text-gray-600 border-gray-200'       },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  high:   { label: 'High',   color: 'bg-red-100 text-red-700 border-red-200'          },
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
  const CIRC = 2 * Math.PI * 38
  const segments = [
    { value: todo,       color: '#3b82f6' },
    { value: inProgress, color: '#f59e0b' },
    { value: done,       color: '#22c55e' },
  ]
  let offset = 0
  const arcs = segments.map((seg) => {
    const dash = (seg.value / total) * CIRC
    const gap  = CIRC - dash
    const off  = -((offset / total) * CIRC)
    offset += seg.value
    return { ...seg, dash, gap, off }
  })
  const pct = Math.round((done / total) * 100)
  return (
    <div className="flex items-center gap-6">
      <div className="relative flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#e5e7eb" strokeWidth="14" className="dark:stroke-gray-700" />
          {arcs.map((arc, i) =>
            arc.value > 0 ? (
              <circle key={i} cx="50" cy="50" r="38" fill="none" stroke={arc.color} strokeWidth="14"
                strokeDasharray={`${arc.dash} ${arc.gap}`} strokeDashoffset={arc.off} strokeLinecap="round" />
            ) : null
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-gray-800 dark:text-gray-100">{pct}%</span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">done</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {[['#3b82f6','Todo',todo],['#f59e0b','In Progress',inProgress],['#22c55e','Done',done]].map(([c,l,v]) => (
          <div key={l} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c }} />
            <span className="text-xs text-gray-500 dark:text-gray-400">{l}</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Draggable Task Card ──────────────────────────────────────────────────────

function DraggableTaskCard({ task, onEdit, onDelete, formatDate, isDragging }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id })
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    cursor: 'grab',
  }
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <TaskCardInner task={task} onEdit={onEdit} onDelete={onDelete} formatDate={formatDate} />
    </div>
  )
}

// ─── Droppable Column ─────────────────────────────────────────────────────────

function KanbanColumn({ column, tasks, onEdit, onDelete, onAddTask, formatDate, activeId }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key })
  return (
    <div className={`flex flex-col rounded-2xl border-t-4 ${column.color} bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 border-t-[4px] min-h-[500px] transition-colors ${isOver ? 'bg-indigo-50 dark:bg-indigo-950/30' : ''}`}>
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span>{column.icon}</span>
          <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{column.label}</span>
          <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-bold px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(column.key)}
          className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition text-lg leading-none"
          title={`Add task to ${column.label}`}
        >
          +
        </button>
      </div>

      {/* Cards */}
      <div ref={setNodeRef} className="flex flex-col gap-3 p-3 flex-1">
        {tasks.length === 0 && (
          <div className={`flex-1 flex items-center justify-center rounded-xl border-2 border-dashed text-sm text-gray-400 dark:text-gray-600 min-h-[100px] transition-colors ${isOver ? 'border-indigo-400 text-indigo-400' : 'border-gray-200 dark:border-gray-700'}`}>
            {isOver ? 'Drop here' : 'No tasks'}
          </div>
        )}
        {tasks.map((task) => (
          <DraggableTaskCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            formatDate={formatDate}
            isDragging={activeId === task.id}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Task Card Inner (shared between draggable + overlay) ─────────────────────

function TaskCardInner({ task, onEdit, onDelete, formatDate }) {
  const now = new Date()
  const due = task.dueDate ? new Date(task.dueDate) : null
  const isOverdue  = due && due < now && task.status !== 'done'
  const isDueSoon  = due && !isOverdue && (due - now) < 1000 * 60 * 60 * 48

  return (
    <div className={`rounded-xl p-3.5 flex flex-col border shadow-sm select-none ${
      isOverdue
        ? 'border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-800'
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
    }`}>
      {/* Badges */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${PRIORITY_CONFIG[task.priority]?.color}`}>
          {PRIORITY_CONFIG[task.priority]?.label}
        </span>
        {isOverdue && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-red-100 text-red-700 border-red-200">
            ⚠️ Overdue
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 leading-snug line-clamp-2">
        {task.title}
      </h3>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 flex-1 mb-1">
          {task.description}
        </p>
      )}

      {/* Due date */}
      {due && (
        <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${
          isOverdue ? 'text-red-600 dark:text-red-400' :
          isDueSoon ? 'text-amber-600 dark:text-amber-400' :
                      'text-gray-500 dark:text-gray-400'
        }`}>
          <span>📅</span>
          <span>Due {formatDate(task.dueDate)}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-700">
        <span className="text-[11px] text-gray-400 dark:text-gray-500">{formatDate(task.createdAt)}</span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(task) }}
            onPointerDown={(e) => e.stopPropagation()}
            title="Edit"
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition"
          >
            ✏️
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
            onPointerDown={(e) => e.stopPropagation()}
            title="Delete"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter()

  const [tasks,       setTasks]       = useState([])
  const [user,        setUser]        = useState(null)
  const [search,      setSearch]      = useState('')
  const [loading,     setLoading]     = useState(true)
  const [showModal,   setShowModal]   = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [submitting,  setSubmitting]  = useState(false)
  const [formError,   setFormError]   = useState('')
  const [darkMode,    setDarkMode]    = useState(false)
  const [activeId,    setActiveId]    = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  useEffect(() => {
    const saved = localStorage.getItem('taskboard-dark')
    if (saved === 'true') {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }
    fetchUser()
    fetchTasks()
  }, [])

  const toggleDark = () => {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('taskboard-dark', String(next))
    document.documentElement.classList.toggle('dark', next)
  }

  const fetchUser  = async () => {
    const res = await fetch('/api/auth/me')
    if (res.ok) setUser((await res.json()).user)
  }

  const fetchTasks = async () => {
    setLoading(true)
    const res = await fetch('/api/tasks')
    if (res.ok) setTasks((await res.json()).tasks)
    setLoading(false)
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    document.documentElement.classList.remove('dark')
    router.push('/login')
  }

  // ── Drag handlers ────────────────────────────────────────────────────────

  const handleDragStart = ({ active }) => setActiveId(active.id)

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null)
    if (!over || active.id === over.id) return

    const task      = tasks.find((t) => t.id === active.id)
    const newStatus = over.id  // The droppable id is the column key

    // Only valid column keys are accepted as drop targets
    if (!COLUMNS.find((c) => c.key === newStatus)) return
    if (task.status === newStatus) return

    // Optimistic update — update UI immediately
    setTasks((prev) =>
      prev.map((t) => (t.id === active.id ? { ...t, status: newStatus } : t))
    )

    // Persist to database
    await fetch(`/api/tasks/${active.id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...task, status: newStatus }),
    })
  }

  // ── Modal helpers ─────────────────────────────────────────────────────────

  const openAddModal = (defaultStatus = 'todo') => {
    setEditingTask(null)
    setForm({ ...EMPTY_FORM, status: defaultStatus })
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

  const closeModal = () => { setShowModal(false); setEditingTask(null); setFormError('') }

  const handleSubmit = async () => {
    if (!form.title.trim()) { setFormError('Task title is required.'); return }
    setSubmitting(true); setFormError('')
    try {
      const url    = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks'
      const method = editingTask ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) { await fetchTasks(); closeModal() }
      else setFormError((await res.json()).error || 'Something went wrong.')
    } catch { setFormError('Network error. Please check your connection.') }
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

  const searchedTasks = tasks.filter((t) => {
    const q = search.toLowerCase()
    return !q || t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
  })

  const tasksByColumn = (colKey) => searchedTasks.filter((t) => t.status === colKey)

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const activeTask = tasks.find((t) => t.id === activeId)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors">

      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">TaskBoard</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
              Hello, <span className="font-semibold text-gray-800 dark:text-gray-200">{user?.name ?? '...'}</span>!
            </span>
            <button onClick={toggleDark} title="Toggle dark mode"
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-lg">
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={handleLogout}
              className="text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Stats row + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Progress Overview</p>
            <div className="flex-1 flex items-center">
              <DonutChart todo={stats.todo} inProgress={stats.inProgress} done={stats.done} />
            </div>
          </div>
        </div>

        {/* Search + Add */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks by title or description..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
            )}
          </div>
          <button onClick={() => openAddModal()}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-sm whitespace-nowrap">
            <span className="text-lg leading-none">+</span>
            <span>Add Task</span>
          </button>
        </div>

        {/* Kanban Board */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">⏳</p>
            <p>Loading tasks...</p>
          </div>
        ) : (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {COLUMNS.map((col) => (
                <KanbanColumn
                  key={col.key}
                  column={col}
                  tasks={tasksByColumn(col.key)}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  onAddTask={openAddModal}
                  formatDate={formatDate}
                  activeId={activeId}
                />
              ))}
            </div>

            {/* Drag Overlay — floating card while dragging */}
            <DragOverlay>
              {activeTask && (
                <div className="rotate-2 opacity-95 shadow-2xl">
                  <TaskCardInner task={activeTask} onEdit={() => {}} onDelete={() => {}} formatDate={formatDate} />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-800">

            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none transition">×</button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {formError && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">{formError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title <span className="text-red-500">*</span></label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="What needs to be done?" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Add more details..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="todo">Todo</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Due Date <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <button onClick={closeModal}
                className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed">
                {submitting ? 'Saving...' : editingTask ? 'Save Changes' : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

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
