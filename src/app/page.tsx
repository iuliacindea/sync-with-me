import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-indigo-400">
            <span>📅</span>
            <span>SyncWithMe</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="#features"
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Features
            </Link>
            <Link
              href="#"
              className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
            ✨ Social Planning Redefined
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Find the best time to meet. <br className="hidden md:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Plan hangouts without the chaos.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop asking on group chats <i>"Who's free this weekend?"</i>. SyncWithMe overlaps your friends calendars and instantly shows you when everyone can meet up.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="#"
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2"
            >
              Create First Event 
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition-all border border-slate-700 flex items-center justify-center"
            >
              Learn More
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="max-w-6xl mx-auto px-6 py-16 border-t border-slate-800/80">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-slate-100">
            Everything you need for successful events
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center text-2xl mb-4">
                🗓️
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Overlapping Calendar</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Automatically view the exact dates and times all your group members are available.
              </p>
            </div>

            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center text-2xl mb-4">
                📋
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">To-Do & Bring List</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Everyone can claim items to bring (games, snacks, speakers) without overlap.
              </p>
            </div>

            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <div className="w-12 h-12 bg-pink-500/10 text-pink-400 rounded-xl flex items-center justify-center text-2xl mb-4">
                💰
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Expense Splitter</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Track shared expenses and let the app automatically calculate who owes what.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 text-center text-slate-500 text-sm">
        <p>© 2026 SyncWithMe. Built for Next.js Internship Program.</p>
      </footer>
    </div>
  );
}