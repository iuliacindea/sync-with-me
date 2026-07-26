import { UserButton } from "@clerk/nextjs";
import { getOrCreateDbUser } from "@/lib/user";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const dbUser = await getOrCreateDbUser();

  if (!dbUser) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900/60 border-r border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-indigo-400 flex items-center gap-2.5 mb-8 hover:opacity-90 transition-opacity"
          >
            <span className="text-2xl">📅</span>
            <span>SyncWithMe</span>
          </Link>

          <nav className="space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-indigo-600/10 text-indigo-400 font-medium border border-indigo-500/20"
            >
              <span>📊</span> Dashboard
            </Link>
            <Link
              href="#"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              <span>🗓️</span> My Calendars
            </Link>
            <Link
              href="/dashboard/friends"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              <span>👥</span> Friends
            </Link>
            <Link
              href="#"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              <span>⚙️</span> Settings
            </Link>
          </nav>
        </div>

        {/* User profile bottom */}
        <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserButton />
            <div className="text-sm overflow-hidden">
              <p className="font-medium text-white truncate">{dbUser.name || "User"}</p>
              <p className="text-xs text-slate-400 truncate">{dbUser.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Welcome back, {dbUser.name?.split(" ")[0] || "Friend"}! 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Here's an overview of your schedule and availability.
            </p>
          </div>

          <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer w-fit">
            <span>+</span> Create Event
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <p className="text-xs text-slate-400 font-medium">Upcoming Events</p>
            <p className="text-3xl font-bold text-white mt-2">0</p>
            <p className="text-xs text-slate-500 mt-1">No plans scheduled for this week</p>
          </div>

          <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <p className="text-xs text-slate-400 font-medium">Synced Calendars</p>
            <p className="text-3xl font-bold text-indigo-400 mt-2">1</p>
            <p className="text-xs text-slate-500 mt-1">Primary Google Calendar connected</p>
          </div>

          <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <p className="text-xs text-slate-400 font-medium">Friends</p>
            <p className="text-3xl font-bold text-white mt-2">1</p>
            <p className="text-xs text-slate-500 mt-1">Connect with friends to sync time</p>
          </div>
        </div>

        {/* Main Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
            <h2 className="text-lg font-semibold text-white">Upcoming Hangouts</h2>
            <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center space-y-3">
              <p className="text-slate-400 text-sm">You have no upcoming events right now.</p>
              <Link
                href="/dashboard/friends"
                className="inline-block text-sm text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
              >
                Find common free time with friends &rarr;
              </Link>
            </div>
          </div>

          <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
            <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
            <div className="space-y-2">
              <button className="w-full text-left p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 text-sm text-slate-200 transition-all flex items-center justify-between cursor-pointer">
                <span>🔗 Connect Calendar</span>
                <span className="text-slate-500">&rarr;</span>
              </button>
              <Link
                href="/dashboard/friends"
                className="w-full text-left p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 text-sm text-slate-200 transition-all flex items-center justify-between cursor-pointer"
              >
                <span>👥 Invite Friends</span>
                <span className="text-slate-500">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}