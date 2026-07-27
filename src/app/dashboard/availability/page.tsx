"use client";

import { useState, useEffect } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";

const DAYS = [
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
  { id: 6, name: "Saturday" },
  { id: 0, name: "Sunday" },
];

export default function AvailabilityPage() {
  const { user, isLoaded } = useUser();
  const [schedule, setSchedule] = useState<{ [key: number]: { enabled: boolean; startTime: string; endTime: string } }>({
    1: { enabled: true, startTime: "09:00", endTime: "17:00" },
    2: { enabled: true, startTime: "09:00", endTime: "17:00" },
    3: { enabled: true, startTime: "09:00", endTime: "17:00" },
    4: { enabled: true, startTime: "09:00", endTime: "17:00" },
    5: { enabled: true, startTime: "09:00", endTime: "17:00" },
    6: { enabled: false, startTime: "10:00", endTime: "16:00" },
    0: { enabled: false, startTime: "10:00", endTime: "16:00" },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    async function loadAvailability() {
      try {
        const res = await fetch("/api/availability");
        if (res.ok) {
          const data = await res.json();
          if (data.availabilities && data.availabilities.length > 0) {
            const newSchedule = { ...schedule };
            // Reset all to disabled first
            Object.keys(newSchedule).forEach((day) => {
              newSchedule[Number(day)].enabled = false;
            });
            // Populate active ones
            data.availabilities.forEach((item: any) => {
              newSchedule[item.dayOfWeek] = {
                enabled: true,
                startTime: item.startTime,
                endTime: item.endTime,
              };
            });
            setSchedule(newSchedule);
          }
        }
      } catch (err) {
        console.error("Error loading availability:", err);
      }
    }

    if (isLoaded && user) {
      loadAvailability();
    }
  }, [isLoaded, user]);

  const handleToggleDay = (dayId: number) => {
    setSchedule((prev) => ({
      ...prev,
      [dayId]: { ...prev[dayId], enabled: !prev[dayId].enabled },
    }));
  };

  const handleTimeChange = (dayId: number, field: "startTime" | "endTime", value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [dayId]: { ...prev[dayId], [field]: value },
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setStatusMessage(null);

    const payload = Object.entries(schedule)
      .filter(([_, value]) => value.enabled)
      .map(([dayOfWeek, value]) => ({
        dayOfWeek: Number(dayOfWeek),
        startTime: value.startTime,
        endTime: value.endTime,
      }));

    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule: payload }),
      });

      if (res.ok) {
        setStatusMessage({ text: "Availability saved successfully!", isError: false });
      } else {
        setStatusMessage({ text: "Failed to save availability.", isError: true });
      }
    } catch (err) {
      setStatusMessage({ text: "A connection error occurred.", isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-slate-400 animate-pulse">Loading availability...</p>
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
              href="/dashboard/availability"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-indigo-600/10 text-indigo-400 font-medium border border-indigo-500/20"
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

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Weekly Availability</h1>
            <p className="text-slate-400 text-sm mt-1">
              Set your weekly free hours to find common ground with friends.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all cursor-pointer w-fit"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {statusMessage && (
          <p className={`text-sm font-medium ${statusMessage.isError ? "text-rose-400" : "text-emerald-400"}`}>
            {statusMessage.text}
          </p>
        )}

        {/* Weekly Schedule Editor */}
        <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4 max-w-3xl">
          {DAYS.map((day) => {
            const dayConfig = schedule[day.id];
            return (
              <div
                key={day.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl gap-4"
              >
                <div className="flex items-center gap-3 w-36">
                  <input
                    type="checkbox"
                    checked={dayConfig.enabled}
                    onChange={() => handleToggleDay(day.id)}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                  <span className={`font-medium text-sm ${dayConfig.enabled ? "text-white" : "text-slate-500"}`}>
                    {day.name}
                  </span>
                </div>

                {dayConfig.enabled ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="time"
                      value={dayConfig.startTime}
                      onChange={(e) => handleTimeChange(day.id, "startTime", e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-slate-500 text-sm">to</span>
                    <input
                      type="time"
                      value={dayConfig.endTime}
                      onChange={(e) => handleTimeChange(day.id, "endTime", e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                ) : (
                  <span className="text-slate-500 text-sm italic">Unavailable</span>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}