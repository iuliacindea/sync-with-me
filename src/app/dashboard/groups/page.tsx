"use client";

import { useState, useEffect } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import HeaderNotifications from "@/components/HeaderNotifications";

const DAYS = [
  { id: 1, name: "Mon" },
  { id: 2, name: "Tue" },
  { id: 3, name: "Wed" },
  { id: 4, name: "Thu" },
  { id: 5, name: "Fri" },
  { id: 6, name: "Sat" },
  { id: 0, name: "Sun" },
];

export default function GroupsPage() {
  const { user, isLoaded } = useUser();
  const [groups, setGroups] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);

  // Group creation
  const [groupName, setGroupName] = useState("");
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Active Group Details
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [commonSlots, setCommonSlots] = useState<any[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Event Proposal Modal State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "",
    location: "",
    cost: "",
    items: "",
    dayOfWeek: 1,
    startTime: "14:00",
    endTime: "16:00",
  });
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      loadGroups();
      loadFriends();
    }
  }, [isLoaded, user]);

  const loadGroups = async (selectGroupId?: string) => {
    try {
      const res = await fetch("/api/groups");
      if (res.ok) {
        const data = await res.json();
        const fetchedGroups = data.groups || [];
        setGroups(fetchedGroups);

        if (fetchedGroups.length > 0) {
          const targetId = selectGroupId || activeGroupId || fetchedGroups[0].id;
          const targetGroup = fetchedGroups.find((g: any) => g.id === targetId) || fetchedGroups[0];
          setActiveGroupId(targetGroup.id);
          fetchGroupSchedule(targetGroup.id);
        } else {
          setActiveGroupId(null);
        }
      }
    } catch (err) {
      console.error("Error loading groups:", err);
    }
  };

  const loadFriends = async () => {
    try {
      const res = await fetch("/api/friends/list");
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
      }
    } catch (err) {
      console.error("Error loading friends:", err);
    }
  };

  const fetchGroupSchedule = async (groupId: string) => {
    setIsLoadingSlots(true);
    try {
      const res = await fetch(`/api/groups/compare?groupId=${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setCommonSlots(data.commonSlots || []);
      }
    } catch (err) {
      console.error("Error loading group schedule:", err);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleSelectGroup = (group: any) => {
    setActiveGroupId(group.id);
    fetchGroupSchedule(group.id);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setIsCreatingGroup(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName, friendIds: selectedFriendIds }),
      });

      if (res.ok) {
        const data = await res.json();
        setGroupName("");
        setSelectedFriendIds([]);
        // Re-load groups and automatically select the newly created group
        loadGroups(data.group?.id);
      }
    } catch (err) {
      console.error("Error creating group:", err);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroupId || !eventForm.title.trim()) return;

    setIsSubmittingEvent(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: activeGroupId,
          ...eventForm,
        }),
      });

      if (res.ok) {
        setIsEventModalOpen(false);
        setEventForm({
          title: "",
          location: "",
          cost: "",
          items: "",
          dayOfWeek: 1,
          startTime: "14:00",
          endTime: "16:00",
        });

        loadGroups(activeGroupId);
      }
    } catch (err) {
      console.error("Error creating event:", err);
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      if (res.ok) {
        loadGroups(activeGroupId || undefined);
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to delete event.");
      }
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  };

  const handleRsvp = async (eventId: string, status: "ACCEPTED" | "DECLINED") => {
    try {
      const res = await fetch("/api/events/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, status }),
      });

      if (res.ok) {
        loadGroups(activeGroupId || undefined);
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to update RSVP.");
      }
    } catch (err) {
      console.error("Error responding to event:", err);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const activeGroup = groups.find((g) => g.id === activeGroupId);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-slate-400 animate-pulse">Loading group calendar...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
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
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50">
              Dashboard
            </Link>
            <Link href="/dashboard/availability" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50">
              Availability
            </Link>
            <Link href="/dashboard/groups" className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-indigo-600/10 text-indigo-400 font-medium border border-indigo-500/20">
              Groups
            </Link>
            <Link href="/dashboard/friends" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50">
              Friends
            </Link>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserButton />
            <div className="text-sm overflow-hidden">
              <p className="font-medium text-white truncate">{user?.fullName || "User"}</p>
              <p className="text-xs text-slate-400 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-x-hidden">
        {/* Top Header with Notifications */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Group Calendar & Events</h1>
            <p className="text-slate-400 text-sm mt-1">
              Visual overlapping availability & event scheduling for your groups.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {activeGroup && (
              <button
                onClick={() => setIsEventModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all cursor-pointer w-fit"
              >
                + Propose Event
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Groups List */}
          <div className="space-y-6">
            <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-4">
              <h2 className="text-base font-semibold text-white">Your Groups ({groups.length})</h2>
              {groups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => handleSelectGroup(group)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    activeGroupId === group.id
                      ? "bg-indigo-600/10 border-indigo-500"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <p className="font-bold text-white text-sm">{group.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{group.members.length} members</p>
                </div>
              ))}
            </div>

            {/* Quick Create Group */}
            <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
              <h3 className="text-sm font-semibold text-white">Create New Group</h3>
              <form onSubmit={handleCreateGroup} className="space-y-3">
                <input
                  type="text"
                  placeholder="Group name..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
                />
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {friends.map((f) => (
                    <label key={f.id} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFriendIds.includes(f.id)}
                        onChange={() => toggleFriendSelection(f.id)}
                        className="accent-indigo-600 rounded"
                      />
                      <span className="truncate">{f.name}</span>
                    </label>
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={isCreatingGroup || !groupName.trim()}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-xs font-medium cursor-pointer"
                >
                  {isCreatingGroup ? "Creating..." : "+ Add Group"}
                </button>
              </form>
            </div>
          </div>

          {/* Group Grid View & Proposed Events */}
          <div className="lg:col-span-3 space-y-6">
            {activeGroup ? (
              <>
                {/* Visual Calendar */}
                <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">{activeGroup.name} Calendar</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Green slots represent overlapping free time for ALL members.
                    </p>
                  </div>

                  {isLoadingSlots ? (
                    <p className="text-slate-400 text-sm animate-pulse py-10 text-center">Loading schedule...</p>
                  ) : (
                    <div className="grid grid-cols-7 gap-2">
                      {DAYS.map((day) => {
                        const slot = commonSlots.find((s) => s.dayOfWeek === day.id);
                        return (
                          <div key={day.id} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center min-h-[160px]">
                            <span className="text-xs font-bold text-indigo-400 uppercase mb-3">{day.name}</span>
                            {slot ? (
                              <div className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg p-2 text-center text-xs font-bold">
                                <p className="text-[10px] text-emerald-500 uppercase">Free</p>
                                {slot.startTime} - {slot.endTime}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-600 italic my-auto">No overlap</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Proposed Events Cards with Delete & RSVP */}
                <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
                  <h3 className="text-lg font-semibold text-white">Proposed Group Events ({activeGroup.events?.length || 0})</h3>

                  {activeGroup.events && activeGroup.events.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeGroup.events.map((evt: any) => {
                        const isCreator = evt.createdById === user?.id;

                        // Find current user's RSVP status
                        const myRsvp = evt.rsvps?.find((r: any) => r.userId === user?.id)?.status;
                        const acceptedCount = evt.rsvps?.filter((r: any) => r.status === "ACCEPTED").length || 0;
                        const declinedCount = evt.rsvps?.filter((r: any) => r.status === "DECLINED").length || 0;

                        return (
                          <div key={evt.id} className="p-5 bg-slate-950/80 border border-indigo-500/30 rounded-xl space-y-3 relative">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-white text-base">{evt.title}</h4>
                                <span className="bg-indigo-600/20 text-indigo-400 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-indigo-500/30 inline-block mt-1">
                                  {DAYS.find((d) => d.id === evt.dayOfWeek)?.name} ({evt.startTime} - {evt.endTime})
                                </span>
                              </div>

                              {/* Delete button (Creator only) */}
                              {isCreator && (
                                <button
                                  onClick={() => handleDeleteEvent(evt.id)}
                                  className="text-slate-500 hover:text-rose-400 text-xs font-medium cursor-pointer transition-colors"
                                  title="Delete Event"
                                >
                                  🗑️ Delete
                                </button>
                              )}
                            </div>

                            <div className="space-y-1 text-xs text-slate-300">
                              {evt.location && <p>📍 <strong>Location:</strong> {evt.location}</p>}
                              {evt.cost && <p>💰 <strong>Cost:</strong> {evt.cost}</p>}
                              {evt.items && <p>🎒 <strong>Bring:</strong> {evt.items}</p>}
                            </div>

                            {/* RSVP Badges & Actions */}
                            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
                              <div className="flex justify-between items-center text-[11px] text-slate-400">
                                <span>
                                  Going: <strong className="text-emerald-400">{acceptedCount}</strong> | Declined: <strong className="text-rose-400">{declinedCount}</strong>
                                </span>
                                {myRsvp && (
                                  <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${myRsvp === "ACCEPTED" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                                    You: {myRsvp}
                                  </span>
                                )}
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleRsvp(evt.id, "ACCEPTED")}
                                  className={`flex-1 text-xs py-1.5 rounded-lg font-medium cursor-pointer transition-all border ${
                                    myRsvp === "ACCEPTED"
                                      ? "bg-emerald-600 text-white border-emerald-500"
                                      : "bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border-emerald-500/30"
                                  }`}
                                >
                                  ✓ Accept
                                </button>
                                <button
                                  onClick={() => handleRsvp(evt.id, "DECLINED")}
                                  className={`flex-1 text-xs py-1.5 rounded-lg font-medium cursor-pointer transition-all border ${
                                    myRsvp === "DECLINED"
                                      ? "bg-rose-600 text-white border-rose-500"
                                      : "bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border-rose-500/30"
                                  }`}
                                >
                                  ✕ Decline
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs py-4 text-center">No proposed events yet. Click "+ Propose Event" above!</p>
                  )}
                </div>
              </>
            ) : (
              <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center">
                <p className="text-slate-400 text-sm">Select or create a group to view its calendar.</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal: Propose Event */}
        {isEventModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-5">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Propose Event for {activeGroup?.name}</h3>
                <button onClick={() => setIsEventModalOpen(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Event Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Board Games Night"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Day</label>
                    <select
                      value={eventForm.dayOfWeek}
                      onChange={(e) => setEventForm({ ...eventForm, dayOfWeek: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-slate-100"
                    >
                      {DAYS.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={eventForm.startTime}
                      onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">End Time</label>
                    <input
                      type="time"
                      value={eventForm.endTime}
                      onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g., Central Park"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Estimated Cost</label>
                  <input
                    type="text"
                    placeholder="e.g., 30 RON"
                    value={eventForm.cost}
                    onChange={(e) => setEventForm({ ...eventForm, cost: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Items Needed</label>
                  <input
                    type="text"
                    placeholder="e.g., Board games, Snacks"
                    value={eventForm.items}
                    onChange={(e) => setEventForm({ ...eventForm, items: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsEventModalOpen(false)} className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl font-medium">Cancel</button>
                  <button type="submit" disabled={isSubmittingEvent} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-medium">
                    {isSubmittingEvent ? "Saving..." : "Propose Event"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}