"use client";

import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton, SignOutButton, useAuth } from '@clerk/nextjs'

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


            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="text-sm text-slate-300 hover:text-white transition-colors cursor-pointer">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20 cursor-pointer">
                  Get Started
                </button>
              </SignUpButton>
            </Show>


            <Show when="signed-in">
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20"
                >
                  Go to Dashboard
                </Link>
                <UserButton />
              </div>
            </Show>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
             Social Planning Redefined
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Find the best time to meet. <br className="hidden md:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Make hangouts simple.
            </span>
          </h1>
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
          <div className="grid md:grid-cols-3 gap-8 justify-center items-center">
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl justify-center items-center">
              <h3 className="text-lg font-semibold mb-2 text-white justify-center items-center">Overlapping Calendar</h3>
              <p className="text-slate-400 text-sm leading-relaxed justify-center items-center">
                Automatically view the exact dates and times all your group members are available.
              </p>
            </div>

            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <h3 className="text-lg font-semibold mb-2 text-white">To-Do & Bring List</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Everyone can claim items to bring (games, snacks, speakers) without overlap.
              </p>
            </div>

            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <h3 className="text-lg font-semibold mb-2 text-white">Expense Splitter</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Track shared expenses and let the app automatically calculate who owes what.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}