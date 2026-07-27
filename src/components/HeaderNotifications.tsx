"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function HeaderNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Verifică la fiecare 5 secunde
    return () => clearInterval(interval);
  }, []);


  const handleNotificationClick = async (id: string) => {
    try {
      await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setIsOpen(false);
    } catch (err) {
      console.error("Error dismiss notification:", err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
        aria-label="Notifications"
      >
        <span className="text-base">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-950 animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h4 className="font-bold text-white text-sm">Notifications</h4>
            <span className="text-[11px] text-slate-500">{unreadCount} new</span>
          </div>

          {notifications.length === 0 ? (
            <p className="text-slate-500 text-xs py-4 text-center">No new notifications.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link || "#"}
                  onClick={() => handleNotificationClick(n.id)}
                  className="block p-3 rounded-xl border bg-indigo-600/10 border-indigo-500/30 hover:bg-indigo-600/20 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-white text-xs">{n.title}</p>
                    <span className="text-[10px] text-slate-400 hover:text-rose-400">✕</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{n.message}</p>
                  <span className="text-[9px] text-slate-500 mt-1.5 block">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}