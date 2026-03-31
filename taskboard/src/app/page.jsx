import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-white">
      {/* Navbar */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✅</span>
          <span className="text-xl font-bold text-gray-900">TaskBoard</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 transition shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium mb-8">
          <span>🚀</span>
          <span>Simple & Powerful Task Management</span>
        </div>

        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Organize Your Tasks,
          <br />
          <span className="text-indigo-600">Simplify Your Life</span>
        </h1>

        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          TaskBoard helps you manage your daily work with ease. Create tasks, set priorities,
          track progress — all in one clean dashboard.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
          >
            Start for Free →
          </Link>
          <Link
            href="/login"
            className="bg-white text-gray-700 px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-gray-50 transition border border-gray-200"
          >
            Login
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 text-left">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast & Simple</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Add and update tasks in seconds. Clean interface with zero clutter.
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-3xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure by Default</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              JWT-based authentication with encrypted passwords. Your data stays private.
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Track Progress</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              See your task stats at a glance. Filter by status to stay focused.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-400 pb-8">
        Built with Next.js, Prisma &amp; Supabase
      </footer>
    </div>
  )
}
