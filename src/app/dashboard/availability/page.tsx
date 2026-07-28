"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";

import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export default function AvailabilityPage() {
  const { user, isLoaded } = useUser();
  const [events, setEvents] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Stări pentru Navigarea în Calendar
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<View>(Views.WEEK);

  // Referință & control pentru Swipe / Touchpad Scroll
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const isNavigatingRef = useRef(false);

  // Stări pentru Modal (Adăugare & Editare)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [isAllDay, setIsAllDay] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);


  // Navigare prin gesturi touchpad (stânga / dreapta)
  // Navigare prin glisare stânga / dreapta (Touch & Touchpad Drag/Swipe)
  // Navigare prin gestul de swipe stânga/dreapta cu două degete pe touchpad
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const handleWheel = (e: WheelEvent) => {
      const container = calendarContainerRef.current;
      if (!container) return;

      // Verificăm dacă cursorul se află deasupra zonei calendarului
      const rect = container.getBoundingClientRect();
      const isOverCalendar =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (!isOverCalendar) return;

      // Detectăm scroll-ul orizontal pe touchpad (deltaX) sau Shift + scroll vertical
      const isHorizontalScroll = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;
      if (!isHorizontalScroll) return;

      const delta = e.shiftKey ? e.deltaY : e.deltaX;

      // Prag de declanșare
      if (Math.abs(delta) > 15 && !isNavigatingRef.current) {
        isNavigatingRef.current = true;

        if (delta > 0) {
          // Swipe spre stânga pe touchpad -> Mergem înainte (Next)
          setDate((prevDate) => {
            const nextDate = new Date(prevDate);
            if (view === Views.MONTH) nextDate.setMonth(nextDate.getMonth() + 1);
            else if (view === Views.WEEK) nextDate.setDate(nextDate.getDate() + 7);
            else nextDate.setDate(nextDate.getDate() + 1);
            return nextDate;
          });
        } else {
          // Swipe spre dreapta pe touchpad -> Mergem înapoi (Back)
          setDate((prevDate) => {
            const prevDateObj = new Date(prevDate);
            if (view === Views.MONTH) prevDateObj.setMonth(prevDateObj.getMonth() - 1);
            else if (view === Views.WEEK) prevDateObj.setDate(prevDateObj.getDate() - 7);
            else prevDateObj.setDate(prevDateObj.getDate() - 1);
            return prevDateObj;
          });
        }

        // Blocăm trecerile repetate accidentale timp de 400ms
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          isNavigatingRef.current = false;
        }, 400);
      }
    };

    // Ascultăm evenimentul pe 'window' cu capture: true pentru a nu fi oprit de calendar
    window.addEventListener("wheel", handleWheel, { capture: true, passive: true });

    return () => {
      window.removeEventListener("wheel", handleWheel, { capture: true });
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [view]);

  const fetchCalendarEvents = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/calendar/sync");
      const data = await res.json();

      if (res.ok && data.busySlots) {
        const formattedEvents = data.busySlots.map((slot: any) => ({
          id: slot.id,
          title: slot.title || "Ocupat",
          start: new Date(slot.start),
          end: new Date(slot.end),
          allDay: slot.allDay,
        }));
        setEvents(formattedEvents);
      }
    } catch (err) {
      console.error("Error loading events", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchCalendarEvents();
    }
  }, [isLoaded, user]);

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    if (view === Views.MONTH) {
      setDate(start);
      setView(Views.WEEK);
    } else {
      setSelectedEventId(null);
      setSelectedDate(start);
      setStartTime(format(start, "HH:mm"));
      setEndTime(format(end, "HH:mm"));
      setIsAllDay(false);
      setEventTitle("");
      setIsModalOpen(true);
    }
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEventId(event.id || null);
    setSelectedDate(event.start);
    setStartTime(format(event.start, "HH:mm"));
    setEndTime(format(event.end, "HH:mm"));
    setIsAllDay(Boolean(event.allDay));
    setEventTitle(event.title);
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    const dateFormatted = `${year}-${month}-${day}`;

    const startDateTimeStr = `${dateFormatted}T${startTime}:00`;
    const endDateTimeStr = `${dateFormatted}T${endTime}:00`;

    const startDateTime = new Date(startDateTimeStr);
    const endDateTime = new Date(endDateTimeStr);

    if (!isAllDay && endDateTime <= startDateTime) {
      alert("Ora de sfârșit trebuie să fie după ora de început!");
      return;
    }

    setIsSaving(true);
    try {
      const isEdit = Boolean(selectedEventId);
      const url = isEdit ? "/api/calendar/update" : "/api/calendar/add";
      const method = isEdit ? "PUT" : "POST";
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEventId,
          title: eventTitle,
          start: startDateTimeStr,
          end: endDateTimeStr,
          isAllDay,
          timeZone: userTimeZone,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchCalendarEvents();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || "Failed to save event"}`);
      }
    } catch (err) {
      console.error("Error saving event:", err);
      alert("Error saving event to Google Calendar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEventId || !confirm("Ești sigur că vrei să ștergi acest eveniment din Google Calendar?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch("/api/calendar/update", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedEventId }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchCalendarEvents();
      } else {
        alert("Failed to delete event.");
      }
    } catch (err) {
      console.error("Error deleting event:", err);
      alert("Error deleting event.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-slate-400 animate-pulse">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Stiluri CSS locale pentru calendar */}
      <style jsx global>{`
        .rbc-toolbar button {
          color: #1e293b !important;
          border: 1px solid #cbd5e1 !important;
          border-radius: 8px !important;
          padding: 6px 12px !important;
          font-weight: 500 !important;
          font-size: 13px !important;
          margin: 2px !important;
          background-color: #f8fafc !important;
          cursor: pointer !important;
        }
        .rbc-toolbar button:hover {
          background-color: #e2e8f0 !important;
        }
        .rbc-toolbar button.rbc-active {
          background-color: #4f46e5 !important;
          color: #ffffff !important;
          border-color: #4f46e5 !important;
          box-shadow: none !important;
        }
        .rbc-toolbar-label {
          font-weight: 700 !important;
          color: #0f172a !important;
          font-size: 16px !important;
        }
      `}</style>

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
              My Calendar
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
      <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-xl">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">My Calendar</h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage your personal schedule, sync with Google Calendar, or click any slot to edit/add events.
            </p>
          </div>
          <button
            onClick={fetchCalendarEvents}
            disabled={isSyncing}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSyncing ? "Syncing..." : "🔄 Refresh Calendar"}
          </button>
        </div>

        {/* Calendar Card Wrapper (cu suport touchpad swipe) */}
        <div
          ref={calendarContainerRef}
          className="bg-white text-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-200 h-[720px] touch-pan-x"
        >
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            allDayAccessor="allDay"
            date={date}
            onNavigate={(newDate) => setDate(newDate)}
            view={view}
            onView={(newView) => setView(newView)}
            views={["month", "week", "day"]}
            style={{ height: "100%" }}
            selectable={true}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            formats={{
              timeGutterFormat: (d) => format(d, "HH:mm"),
              eventTimeRangeFormat: ({ start, end }) =>
                `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`,
              agendaTimeRangeFormat: ({ start, end }) =>
                `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`,
            }}
            eventPropGetter={(event) => {
  // Verificăm dacă titlul conține sărbători cunoscute sau provine din calendarul public de sărbători
  const isHoliday =
    event.id?.includes("holiday") ||
    event.title?.toLowerCase().includes("ziua") ||
    event.title?.toLowerCase().includes("crăciun") ||
    event.title?.toLowerCase().includes("paște") ||
    event.title?.toLowerCase().includes("anul nou");

  let backgroundColor = "#4f46e5"; // Indigo implicit pentru întâlniri orare

  if (isHoliday) {
    backgroundColor = "#10b981"; // Verde Smarald pentru Sărbători Naționale
  } else if (event.allDay) {
    backgroundColor = "#8b5cf6"; // Violet/Purple pentru Evenimente All-Day personale
  }

  return {
    style: {
      backgroundColor,
      borderRadius: "6px",
      border: "none",
      color: "white",
      fontWeight: "600",
      fontSize: "12px",
      cursor: "pointer",
    },
  };
}}
          />
        </div>
      </main>

      {/* Modal Unificat */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">
              {selectedEventId ? " Edit Event" : " Add Event"}
            </h3>
            <p className="text-xs text-indigo-400 font-medium">
              📅 {format(selectedDate, "EEEE, dd MMMM yyyy")}
            </p>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Doctor Appointment / Meeting"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Bifa All-day */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="allDayCheck"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="allDayCheck" className="text-xs text-slate-300 font-medium cursor-pointer">
                  All-day event
                </label>
              </div>

              {!isAllDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Start Time</label>
                    <input
                      type="time"
                      required={!isAllDay}
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">End Time</label>
                    <input
                      type="time"
                      required={!isAllDay}
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                {selectedEventId ? (
                  <button
                    type="button"
                    onClick={handleDeleteEvent}
                    disabled={isDeleting}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors cursor-pointer"
                  >
                    {isDeleting ? "Deleting..." : "🗑️ Delete"}
                  </button>
                ) : <div />}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-5 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? "Saving..." : selectedEventId ? "Update Event" : "+ Save Event"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}