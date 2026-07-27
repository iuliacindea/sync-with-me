"use client";

import { useState, useEffect } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import HeaderNotifications from "@/components/HeaderNotifications";

const DAYS_MAP: { [key: number]: string } = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  0: "Sunday",
};

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string>("");
  const [commonSlots, setCommonSlots] = useState<any[] | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);

  // Load friends and groups
  useEffect(() => {
    async function fetchData() {
      try {
        const [friendsRes, groupsRes] = await Promise.all([
          fetch("/api/friends/list"),
          fetch("/api/groups"),
        ]);

        if (friendsRes.ok) {
          const friendsData = await friendsRes.json();
          setFriends(friendsData.friends || []);
          if (friendsData.friends && friendsData.friends.length > 0) {
            setSelectedFriendId(friendsData.friends[0].id);
          }
        }

        if (groupsRes.ok) {
          const groupsData = await groupsRes.json();
          setGroups(groupsData.groups || []);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      }
    }

    if (isLoaded && user) {
      fetchData();
    }
  }, [isLoaded, user]);

  // Compare availability when a friend is selected
  const handleCompare = async () => {
    if (!selectedFriendId) return;
    setIsComparing(true);

    try {
      const res = await fetch(`/api/availability/compare?friendId=${selectedFriendId}`);
      if (res.ok) {
        const data = await res.json();
        setCommonSlots(data.commonSlots || []);
      }
    } catch (err) {
      console.error("Error comparing schedules:", err);
    } finally {
      setIsComparing(false);
    }
  };

  useEffect(() => {
    if (selectedFriendId) {
      handleCompare();
    }
  }, [selectedFriendId]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-slate-400 animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  // Calculate total proposed events across user's groups
  const totalEvents = groups.reduce((acc, g) => acc + (g.events?.length || 0), 0);

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
              Dashboard
            </Link>
            <Link
              href="/dashboard/availability"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              Availability
            </Link>
            <Link
              href="/dashboard/groups"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              Groups
            </Link>
            <Link
              href="/dashboard/friends"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              Friends
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
{/* Top Header */}
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  <div>
    <h1 className="text-2xl md:text-3xl font-bold text-white">
      Welcome back, {user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress}!
    </h1>
  </div>

  <div className="flex items-center gap-4">
    <HeaderNotifications />
  </div>
</div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <p className="text-xs text-slate-400 font-medium">Proposed Group Events</p>
            <p className="text-3xl font-bold text-white mt-2">{totalEvents}</p>
            <p className="text-xs text-slate-500 mt-1">Across all active groups</p>
          </div>

          <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <p className="text-xs text-slate-400 font-medium">Synced Friends</p>
            <p className="text-3xl font-bold text-indigo-400 mt-2">{friends.length}</p>
            <p className="text-xs text-slate-500 mt-1">Active connections</p>
          </div>

          <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <p className="text-xs text-slate-400 font-medium">Your Groups</p>
            <p className="text-3xl font-bold text-emerald-400 mt-2">{groups.length}</p>
            <p className="text-xs text-slate-500 mt-1">Active hangout spaces</p>
          </div>
        </div>
      </main>
    </div>
  );
}