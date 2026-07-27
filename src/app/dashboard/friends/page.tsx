"use client";

import { useState, useEffect } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function FriendsPage() {
  const { user, isLoaded } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");

  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);

  // Fetch real friends and pending requests from Neon DB
  const fetchFriendsData = async () => {
    try {
      const res = await fetch("/api/friends/list");
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Error loading friends data:", err);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchFriendsData();
    }
  }, [isLoaded, user]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: searchQuery }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusMessage({ text: data.error || "An error occurred.", isError: true });
      } else {
        setStatusMessage({ text: "Friend request sent successfully! 🎉", isError: false });
        setSearchQuery("");
        fetchFriendsData();
      }
    } catch (err) {
      setStatusMessage({ text: "A connection error occurred.", isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (requestId: string, action: "ACCEPT" | "DECLINE") => {
    try {
      const res = await fetch("/api/friends/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });

      if (res.ok) {
        fetchFriendsData();
      }
    } catch (err) {
      console.error("Error responding to request:", err);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-slate-400 animate-pulse">Loading friends...</p>
      </div>
    );
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
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
             Dashboard
            </Link>
            <Link
              href="#"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
             My Calendars
            </Link>
            <Link
              href="/dashboard/friends"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-indigo-600/10 text-indigo-400 font-medium border border-indigo-500/20"
            >
               Friends
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
              <p className="font-medium text-white truncate">{user?.fullName || user?.firstName || "User"}</p>
              <p className="text-xs text-slate-400 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Friends & Connections 👥</h1>
          <p className="text-slate-400 text-sm mt-1">
            Connect with your friends to discover overlapping free time automatically.
          </p>
        </div>

        {/* Search / Add Friend Bar */}
        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-4">
          <h2 className="text-lg font-semibold text-white">Find People</h2>
          <form onSubmit={handleSendRequest} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter friend's real email address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? "Sending..." : "+ Send Request"}
            </button>
          </form>

          {statusMessage && (
            <p className={`text-sm font-medium ${statusMessage.isError ? "text-rose-400" : "text-emerald-400"}`}>
              {statusMessage.text}
            </p>
          )}
        </div>

        {/* Tabs: Friends vs Requests */}
        <div className="space-y-4">
          <div className="flex border-b border-slate-800 gap-6">
            <button
              onClick={() => setActiveTab("friends")}
              className={`pb-3 text-sm font-medium transition-all cursor-pointer ${
                activeTab === "friends"
                  ? "text-indigo-400 border-b-2 border-indigo-500"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              My Friends ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`pb-3 text-sm font-medium transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "requests"
                  ? "text-indigo-400 border-b-2 border-indigo-500"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Pending Requests
              {requests.length > 0 && (
                <span className="bg-indigo-600/30 text-indigo-400 text-xs px-2 py-0.5 rounded-full font-semibold border border-indigo-500/30">
                  {requests.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content: Friends List */}
          {activeTab === "friends" && (
            <div className="space-y-3">
              {friends.length === 0 ? (
                <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center space-y-2">
                  <p className="text-slate-400 text-sm">You haven't added any friends yet.</p>
                  <p className="text-slate-500 text-xs">Search for a friend by email above to send them an invitation.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600/20 text-indigo-400 font-bold flex items-center justify-center border border-indigo-500/30">
                          {friend.name?.[0] || "U"}
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{friend.name}</p>
                          <p className="text-xs text-slate-400">{friend.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Requests List */}
          {activeTab === "requests" && (
            <div className="space-y-3">
              {requests.length === 0 ? (
                <p className="text-slate-500 text-sm py-4">No pending friend requests.</p>
              ) : (
                requests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-600/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30">
                        {req.sender.name?.[0] || "U"}
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">{req.sender.name}</p>
                        <p className="text-xs text-slate-400">{req.sender.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRespond(req.id, "ACCEPT")}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespond(req.id, "DECLINE")}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}